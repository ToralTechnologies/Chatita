import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/health/google/disconnect
 *
 * Disconnects Google Health / Fitbit integration.
 * Clears encrypted tokens, marks connection as disconnected.
 * Does NOT delete imported HealthDailySummary or HealthMetricSample records —
 * those remain for the user to reference (user can request full deletion separately).
 *
 * Also revokes the OAuth token on Google's side when possible.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const connection = await prisma.healthConnection.findUnique({
      where: { userId_provider: { userId, provider: 'google_health' } },
      select: { accessTokenEnc: true, refreshTokenEnc: true },
    });

    if (!connection) {
      return NextResponse.json({ error: 'No Google Health connection found' }, { status: 404 });
    }

    // Attempt to revoke token on Google's side (non-fatal if it fails)
    if (connection.accessTokenEnc) {
      try {
        const { decryptToken } = await import('@/lib/health/token-encrypt');
        const accessToken = decryptToken(connection.accessTokenEnc);
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, {
          method: 'POST',
        });
      } catch {
        // Non-fatal — continue with local disconnect
      }
    }

    await prisma.healthConnection.update({
      where: { userId_provider: { userId, provider: 'google_health' } },
      data: {
        status: 'disconnected',
        accessTokenEnc: null,
        refreshTokenEnc: null,
        tokenExpiresAt: null,
        disconnectedAt: new Date(),
        errorMessage: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[health/google/disconnect] error:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
