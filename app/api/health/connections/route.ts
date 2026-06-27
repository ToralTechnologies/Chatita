import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/health/connections
 * Returns connection status for all health providers for the current user.
 * Never returns encrypted tokens — only status, scopes, and sync metadata.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connections = await prisma.healthConnection.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        provider: true,
        status: true,
        providerUserId: true,
        scopes: true,
        tokenExpiresAt: true,
        lastSyncedAt: true,
        errorMessage: true,
        consentVersion: true,
        consentedAt: true,
        disconnectedAt: true,
        createdAt: true,
        // Never expose accessTokenEnc or refreshTokenEnc
      },
    });

    const syncLogs = await prisma.healthSyncLog.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: 'desc' },
      take: 5,
      select: { provider: true, status: true, startedAt: true, recordsSynced: true, errorMessage: true },
    });

    const recentImports = await prisma.healthImport.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, provider: true, importType: true, filename: true, status: true, recordsProcessed: true, createdAt: true, completedAt: true },
    });

    return NextResponse.json({ connections, syncLogs, recentImports });
  } catch (error) {
    console.error('[health/connections] GET error:', error);
    return NextResponse.json({ error: 'Failed to load connections' }, { status: 500 });
  }
}
