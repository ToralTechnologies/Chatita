import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LibreLinkUpClient, decryptPassword } from '@/lib/libre-api';

/**
 * POST /api/cron/libre-sync
 * Automatic sync for all users with Libre integration
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active Libre integrations
    const integrations = await prisma.libreIntegration.findMany({
      where: {
        isActive: true,
        autoSync: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    console.log(`[Libre Cron] Found ${integrations.length} active integrations to sync`);

    const results = {
      total: integrations.length,
      synced: 0,
      failed: 0,
      skipped: 0,
      errors: [] as any[],
    };

    for (const integration of integrations) {
      try {
        // Check if it's time to sync
        const now = Date.now();
        const lastSync = integration.lastSyncAt?.getTime() || 0;
        const syncInterval = integration.syncFrequency * 60 * 1000;

        if (now - lastSync < syncInterval) {
          results.skipped++;
          continue;
        }

        const client = new LibreLinkUpClient(
          integration.region as 'US' | 'EU' | 'AP'
        );

        // Set account ID from stored user ID (required for API v4.16.0+)
        if (integration.libreUserId) {
          await client.setAccountIdFromUserId(integration.libreUserId);
        }

        // Re-authenticate if needed
        let authToken = integration.authToken;
        let patientId = integration.librePatientId;

        if (
          !authToken ||
          !integration.tokenExpiresAt ||
          new Date() >= integration.tokenExpiresAt
        ) {
          const decryptedPassword = decryptPassword(integration.librePassword);
          const authResult = await client.login(
            integration.libreEmail,
            decryptedPassword
          );

          authToken = authResult.token;
          patientId = authResult.patientId || patientId;

          await prisma.libreIntegration.update({
            where: { id: integration.id },
            data: {
              authToken: authResult.token,
              tokenExpiresAt: authResult.expires,
              libreUserId: authResult.userId,
              librePatientId: patientId,
            },
          });

          // Update client with new account ID
          await client.setAccountIdFromUserId(authResult.userId);
        }

        if (!patientId) {
          throw new Error('No patient ID available');
        }

        // Fetch glucose data
        const glucoseData = await client.getGlucoseData(patientId, authToken!);

        // Import new readings
        let imported = 0;
        const startDate = integration.lastSyncAt || new Date(Date.now() - 24 * 60 * 60 * 1000);

        for (const reading of glucoseData) {
          if (!reading.ValueInMgPerDl) continue;

          const measuredAt = new Date(reading.Timestamp);

          if (measuredAt <= startDate) continue;

          const existing = await prisma.glucoseEntry.findFirst({
            where: {
              userId: integration.userId,
              measuredAt,
              value: reading.ValueInMgPerDl,
            },
          });

          if (!existing) {
            const trendSymbol = LibreLinkUpClient.getTrendSymbol(reading.TrendArrow);

            await prisma.glucoseEntry.create({
              data: {
                userId: integration.userId,
                value: reading.ValueInMgPerDl,
                measuredAt,
                notes: `FreeStyle Libre (Trend: ${trendSymbol})`,
                context: 'random',
              },
            });
            imported++;
          }
        }

        // Update integration
        await prisma.libreIntegration.update({
          where: { id: integration.id },
          data: {
            lastSyncAt: new Date(),
            lastError: null,
          },
        });

        results.synced++;
        console.log(
          `[Libre Cron] Synced ${imported}/${glucoseData.length} readings for user ${integration.user.email}`
        );
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          userId: integration.userId,
          email: integration.user.email,
          error: error.message,
        });

        await prisma.libreIntegration.update({
          where: { id: integration.id },
          data: {
            lastError: error.message,
          },
        });

        console.error(
          `[Libre Cron] Failed to sync for user ${integration.user.email}:`,
          error
        );
      }
    }

    console.log(`[Libre Cron] Completed:`, results);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[Libre Cron] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to trigger Libre sync',
    endpoint: '/api/cron/libre-sync',
  });
}
