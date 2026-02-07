import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface DexcomEGV {
  recordId: string;
  systemTime: string;
  displayTime: string;
  value: number;
  status: string | null;
  trend: string;
  trendRate: number | null;
}

interface DexcomEGVsResponse {
  recordType: string;
  recordVersion: string;
  userId: string;
  records: DexcomEGV[];
}

/**
 * POST /api/dexcom/sync
 * Syncs glucose data from Dexcom API
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get Dexcom integration
    const integration = await prisma.dexcomIntegration.findUnique({
      where: { userId },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Dexcom not connected. Please connect your Dexcom account first.' },
        { status: 400 }
      );
    }

    if (!integration.isActive) {
      return NextResponse.json(
        { error: 'Dexcom integration is disabled' },
        { status: 400 }
      );
    }

    // Check if token needs refresh
    let accessToken = integration.accessToken;
    if (new Date() >= integration.tokenExpiresAt) {
      accessToken = await refreshDexcomToken(integration);
    }

    // Determine time range for sync
    const endDate = new Date();
    const startDate = integration.lastSyncAt
      ? new Date(integration.lastSyncAt)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours if first sync

    // Fetch EGVs (Estimated Glucose Values) from Dexcom
    const baseUrl =
      integration.environment === 'production'
        ? 'https://api.dexcom.com'
        : 'https://sandbox-api.dexcom.com';

    const egvsUrl = new URL(`${baseUrl}/v3/users/self/egvs`);
    egvsUrl.searchParams.append('startDate', startDate.toISOString());
    egvsUrl.searchParams.append('endDate', endDate.toISOString());

    const egvsResponse = await fetch(egvsUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!egvsResponse.ok) {
      const errorText = await egvsResponse.text();
      console.error('Dexcom EGVs fetch failed:', errorText);

      await prisma.dexcomIntegration.update({
        where: { userId },
        data: {
          lastError: `Failed to fetch data: ${egvsResponse.status}`,
        },
      });

      return NextResponse.json(
        { error: 'Failed to fetch glucose data from Dexcom' },
        { status: 500 }
      );
    }

    const egvsData: DexcomEGVsResponse = await egvsResponse.json();

    // Import glucose readings into our database
    let importedCount = 0;
    for (const egv of egvsData.records || []) {
      // Skip invalid readings
      if (!egv.value || egv.value < 40 || egv.value > 400) continue;

      const measuredAt = new Date(egv.systemTime);

      // Check if reading already exists (avoid duplicates)
      const existing = await prisma.glucoseEntry.findFirst({
        where: {
          userId,
          measuredAt,
          value: egv.value,
        },
      });

      if (!existing) {
        await prisma.glucoseEntry.create({
          data: {
            userId,
            value: egv.value,
            measuredAt,
            notes: `Dexcom CGM (Trend: ${egv.trend})`,
            context: 'random', // CGM readings are continuous
          },
        });
        importedCount++;
      }
    }

    // Update last sync time
    await prisma.dexcomIntegration.update({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
        lastError: null,
      },
    });

    return NextResponse.json({
      success: true,
      imported: importedCount,
      total: egvsData.records?.length || 0,
      lastSync: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dexcom sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync glucose data' },
      { status: 500 }
    );
  }
}

/**
 * Refreshes Dexcom access token using refresh token
 */
async function refreshDexcomToken(
  integration: {
    id: string;
    userId: string;
    refreshToken: string;
    environment: string;
  }
): Promise<string> {
  const clientId = process.env.DEXCOM_CLIENT_ID!;
  const clientSecret = process.env.DEXCOM_CLIENT_SECRET!;

  const baseUrl =
    integration.environment === 'production'
      ? 'https://api.dexcom.com'
      : 'https://sandbox-api.dexcom.com';

  const tokenResponse = await fetch(`${baseUrl}/v3/oauth2/token`, {
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

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh Dexcom token');
  }

  const tokenData = await tokenResponse.json();
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  // Update tokens in database
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

/**
 * GET /api/dexcom/sync
 * Get sync status
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integration = await prisma.dexcomIntegration.findUnique({
      where: { userId: session.user.id },
      select: {
        isActive: true,
        lastSyncAt: true,
        lastError: true,
        autoSync: true,
        syncFrequency: true,
        environment: true,
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
    console.error('Get Dexcom status error:', error);
    return NextResponse.json(
      { error: 'Failed to get Dexcom status' },
      { status: 500 }
    );
  }
}
