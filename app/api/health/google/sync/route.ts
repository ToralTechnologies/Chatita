import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncGoogleHealth, GoogleSyncError } from '@/lib/health/google-sync';

/**
 * POST /api/health/google/sync
 * Manually sync recent Google Health data for the authenticated user.
 * The sync logic lives in lib/health/google-sync so it can be reused by the
 * post-connect initial sync and the daily cron.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recordsSynced, warning } = await syncGoogleHealth(session.user.id);
    return NextResponse.json({ success: true, recordsSynced, warning });
  } catch (error) {
    if (error instanceof GoogleSyncError) {
      const status = error.code === 'reauth_required' ? 401 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error('[health/google/sync] unexpected error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
