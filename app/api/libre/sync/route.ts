import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LibreLinkUpClient, decryptPassword } from '@/lib/libre-api';

/**
 * POST /api/libre/sync
 * Sync glucose data from LibreLinkUp
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get Libre integration
    const integration = await prisma.libreIntegration.findUnique({
      where: { userId },
    });

    if (!integration) {
      return NextResponse.json(
        {
          error:
            'LibreLinkUp not connected. Please connect your account first.',
        },
        { status: 400 }
      );
    }

    if (!integration.isActive) {
      return NextResponse.json(
        { error: 'LibreLinkUp integration is disabled' },
        { status: 400 }
      );
    }

    // Initialize client
    const client = new LibreLinkUpClient(
      integration.region as 'US' | 'EU' | 'AP'
    );

    // Check if we need to re-authenticate
    let authToken = integration.authToken;
    let patientId = integration.librePatientId;

    if (
      !authToken ||
      !integration.tokenExpiresAt ||
      new Date() >= integration.tokenExpiresAt
    ) {
      // Re-authenticate
      try {
        const decryptedPassword = decryptPassword(integration.librePassword);
        const authResult = await client.login(
          integration.libreEmail,
          decryptedPassword
        );

        authToken = authResult.token;
        patientId = authResult.patientId || patientId;

        // Update token in database
        await prisma.libreIntegration.update({
          where: { userId },
          data: {
            authToken: authResult.token,
            tokenExpiresAt: authResult.expires,
            librePatientId: patientId,
          },
        });
      } catch (error: any) {
        await prisma.libreIntegration.update({
          where: { userId },
          data: {
            lastError: 'Re-authentication failed. Please reconnect.',
          },
        });

        return NextResponse.json(
          { error: 'Authentication expired. Please reconnect your account.' },
          { status: 401 }
        );
      }
    }

    // If no patient ID, try to get it now
    if (!patientId) {
      try {
        const connections = await client.getConnections(authToken!);
        if (connections.length > 0) {
          patientId = connections[0].patientId;

          // Update patient ID in database
          await prisma.libreIntegration.update({
            where: { userId },
            data: { librePatientId: patientId },
          });
        } else {
          return NextResponse.json(
            { error: 'No patient connections found. Make sure you have someone added in LibreLinkUp app.' },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to get patient connections. Please make sure you have LibreLinkUp properly configured with at least one connection.' },
          { status: 400 }
        );
      }
    }

    // Fetch glucose data
    let glucoseData;
    try {
      glucoseData = await client.getGlucoseData(patientId, authToken!);
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') {
        // Token expired, try re-auth one more time
        const decryptedPassword = decryptPassword(integration.librePassword);
        const authResult = await client.login(
          integration.libreEmail,
          decryptedPassword
        );

        await prisma.libreIntegration.update({
          where: { userId },
          data: {
            authToken: authResult.token,
            tokenExpiresAt: authResult.expires,
          },
        });

        // Retry glucose fetch
        glucoseData = await client.getGlucoseData(
          patientId,
          authResult.token
        );
      } else {
        throw error;
      }
    }

    // Import readings
    let importedCount = 0;
    const startDate = integration.lastSyncAt || new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const reading of glucoseData) {
      if (!reading.ValueInMgPerDl) continue;

      const measuredAt = new Date(reading.Timestamp);

      // Only import readings after last sync
      if (measuredAt <= startDate) continue;

      // Check for duplicates
      const existing = await prisma.glucoseEntry.findFirst({
        where: {
          userId,
          measuredAt,
          value: reading.ValueInMgPerDl,
        },
      });

      if (!existing) {
        const trendSymbol = LibreLinkUpClient.getTrendSymbol(
          reading.TrendArrow
        );

        await prisma.glucoseEntry.create({
          data: {
            userId,
            value: reading.ValueInMgPerDl,
            measuredAt,
            notes: `FreeStyle Libre (Trend: ${trendSymbol})`,
            context: 'random',
          },
        });

        importedCount++;
      }
    }

    // Update last sync
    await prisma.libreIntegration.update({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
        lastError: null,
      },
    });

    return NextResponse.json({
      success: true,
      imported: importedCount,
      total: glucoseData.length,
      lastSync: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Libre sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync glucose data' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/libre/sync
 * Get sync status
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integration = await prisma.libreIntegration.findUnique({
      where: { userId: session.user.id },
      select: {
        isActive: true,
        lastSyncAt: true,
        lastError: true,
        autoSync: true,
        syncFrequency: true,
        region: true,
        libreEmail: true,
      },
    });

    if (!integration) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      ...integration,
    });
  } catch (error) {
    console.error('Get Libre status error:', error);
    return NextResponse.json(
      { error: 'Failed to get LibreLinkUp status' },
      { status: 500 }
    );
  }
}
