import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/cron/dexcom-sync
 * Automatic sync for all users with Dexcom integration
 * Called by Vercel Cron every 15 minutes
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active Dexcom integrations
    const integrations = await prisma.dexcomIntegration.findMany({
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

    console.log(`[Dexcom Cron] Found ${integrations.length} active integrations to sync`);

    const results = {
      total: integrations.length,
      synced: 0,
      failed: 0,
      skipped: 0,
      errors: [] as any[],
    };

    for (const integration of integrations) {
      try {
        // Check if it's time to sync based on frequency
        const now = Date.now();
        const lastSync = integration.lastSyncAt?.getTime() || 0;
        const syncInterval = integration.syncFrequency * 60 * 1000; // Convert minutes to ms

        if (now - lastSync < syncInterval) {
          results.skipped++;
          continue;
        }

        // Check if token needs refresh
        let accessToken = integration.accessToken;
        if (new Date() >= integration.tokenExpiresAt) {
          accessToken = await refreshDexcomToken(integration);
        }

        // Fetch glucose data
        const baseUrl =
          integration.environment === 'production'
            ? 'https://api.dexcom.com'
            : 'https://sandbox-api.dexcom.com';

        const startDate = integration.lastSyncAt
          ? new Date(integration.lastSyncAt)
          : new Date(Date.now() - 24 * 60 * 60 * 1000);

        const endDate = new Date();

        const egvsUrl = new URL(`${baseUrl}/v3/users/self/egvs`);
        egvsUrl.searchParams.append('startDate', startDate.toISOString());
        egvsUrl.searchParams.append('endDate', endDate.toISOString());

        const response = await fetch(egvsUrl.toString(), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        const records = data.records || [];

        // Import new readings
        let imported = 0;
        for (const egv of records) {
          if (!egv.value || egv.value < 40 || egv.value > 400) continue;

          const measuredAt = new Date(egv.systemTime);

          // Check for duplicates
          const existing = await prisma.glucoseEntry.findFirst({
            where: {
              userId: integration.userId,
              measuredAt,
              value: egv.value,
            },
          });

          if (!existing) {
            await prisma.glucoseEntry.create({
              data: {
                userId: integration.userId,
                value: egv.value,
                measuredAt,
                notes: `Dexcom CGM (Trend: ${egv.trend})`,
                context: 'random',
              },
            });
            imported++;
          }
        }

        // Update integration
        await prisma.dexcomIntegration.update({
          where: { id: integration.id },
          data: {
            lastSyncAt: new Date(),
            lastError: null,
          },
        });

        results.synced++;
        console.log(
          `[Dexcom Cron] Synced ${imported}/${records.length} readings for user ${integration.user.email}`
        );
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          userId: integration.userId,
          email: integration.user.email,
          error: error.message,
        });

        // Update error in database
        await prisma.dexcomIntegration.update({
          where: { id: integration.id },
          data: {
            lastError: error.message,
          },
        });

        console.error(
          `[Dexcom Cron] Failed to sync for user ${integration.user.email}:`,
          error
        );
      }
    }

    console.log(`[Dexcom Cron] Completed:`, results);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[Dexcom Cron] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function refreshDexcomToken(integration: {
  id: string;
  refreshToken: string;
  environment: string;
}): Promise<string> {
  const clientId = process.env.DEXCOM_CLIENT_ID!;
  const clientSecret = process.env.DEXCOM_CLIENT_SECRET!;

  const baseUrl =
    integration.environment === 'production'
      ? 'https://api.dexcom.com'
      : 'https://sandbox-api.dexcom.com';

  const response = await fetch(`${baseUrl}/v3/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: integration.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const tokenData = await response.json();
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  await prisma.dexcomIntegration.update({
    where: { id: integration.id },
    data: {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: expiresAt,
    },
  });

  return tokenData.access_token;
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to trigger Dexcom sync',
    endpoint: '/api/cron/dexcom-sync',
  });
}
