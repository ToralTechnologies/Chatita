import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncLibreReadings } from '@/lib/libre-sync';

/**
 * POST /api/libre/sync
 * Sync glucose data from LibreLinkUp for the signed-in user.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await syncLibreReadings(session.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json({
      success: true,
      imported: result.imported,
      total: result.total,
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
