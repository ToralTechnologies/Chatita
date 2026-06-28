import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncGoogleHealth } from '@/lib/health/google-sync';

/**
 * Daily automatic sync for all connected Google Health users.
 *
 * Vercel Cron invokes this with a GET request carrying the
 * `Authorization: Bearer $CRON_SECRET` header, so the worker is exposed on both
 * GET and POST (POST allows manual/admin triggering with the same secret).
 */
async function runGoogleSyncCron(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connections = await prisma.healthConnection.findMany({
    where: { provider: 'google_health', status: 'connected' },
    select: { userId: true },
  });

  const results = { total: connections.length, synced: 0, failed: 0, recordsSynced: 0 };

  for (const { userId } of connections) {
    try {
      const { recordsSynced } = await syncGoogleHealth(userId);
      results.synced++;
      results.recordsSynced += recordsSynced;
    } catch (err) {
      results.failed++;
      console.error(`[google-sync cron] failed for user ${userId}:`, err);
    }
  }

  console.log('[google-sync cron] completed:', results);
  return NextResponse.json({ success: true, ...results });
}

export async function GET(request: Request) {
  return runGoogleSyncCron(request);
}

export async function POST(request: Request) {
  return runGoogleSyncCron(request);
}
