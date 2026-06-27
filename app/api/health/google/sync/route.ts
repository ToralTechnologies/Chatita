import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptToken, decryptToken } from '@/lib/health/token-encrypt';

/**
 * POST /api/health/google/sync
 *
 * Syncs recent health data for the authenticated user from the Google Health API.
 *
 * NOTE — Google Health API status (June 2026):
 * The Google Health API (developers.google.com/health) is in limited developer access.
 * The Fitness REST API (developers.google.com/fit/rest) is the production-ready API that
 * covers step data, sleep, heart rate, and activity. The Google Health API will supersede
 * this once GA. This implementation targets the Google Fitness REST API for now, which
 * uses the same OAuth tokens.
 *
 * TODO: Migrate to Google Health API endpoints when they become generally available.
 * TODO: Confirm final data source and scope names at developers.google.com/health
 */

async function refreshGoogleToken(
  refreshTokenEnc: string,
  userId: string
): Promise<string | null> {
  const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_HEALTH_CLIENT_SECRET!;

  try {
    const refreshToken = decryptToken(refreshTokenEnc);
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[google/sync] token refresh failed:', err);
      return null;
    }

    const data = await res.json();
    const newAccessToken: string = data.access_token;
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await prisma.healthConnection.update({
      where: { userId_provider: { userId, provider: 'google_health' } },
      data: {
        accessTokenEnc: encryptToken(newAccessToken),
        tokenExpiresAt: expiresAt,
        errorMessage: null,
      },
    });

    return newAccessToken;
  } catch (err) {
    console.error('[google/sync] refresh error:', err);
    return null;
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const connection = await prisma.healthConnection.findUnique({
      where: { userId_provider: { userId, provider: 'google_health' } },
    });

    if (!connection || connection.status !== 'connected') {
      return NextResponse.json({ error: 'Google Health not connected' }, { status: 400 });
    }

    const syncLog = await prisma.healthSyncLog.create({
      data: { userId, provider: 'google_health', status: 'started' },
    });

    // Get a valid access token (refresh if expired)
    let accessToken: string;
    const isExpired = connection.tokenExpiresAt && connection.tokenExpiresAt < new Date(Date.now() + 60_000);

    if (isExpired && connection.refreshTokenEnc) {
      const refreshed = await refreshGoogleToken(connection.refreshTokenEnc, userId);
      if (!refreshed) {
        await prisma.healthConnection.update({
          where: { userId_provider: { userId, provider: 'google_health' } },
          data: { status: 'error', errorMessage: 'Token refresh failed. Please reconnect.' },
        });
        await prisma.healthSyncLog.update({
          where: { id: syncLog.id },
          data: { status: 'failed', completedAt: new Date(), errorMessage: 'Token refresh failed' },
        });
        return NextResponse.json({ error: 'Token refresh failed. Please reconnect Google Health.' }, { status: 401 });
      }
      accessToken = refreshed;
    } else if (connection.accessTokenEnc) {
      accessToken = decryptToken(connection.accessTokenEnc);
    } else {
      return NextResponse.json({ error: 'No access token available' }, { status: 400 });
    }

    // Determine sync range: last 7 days, or from last sync
    const endMs = Date.now();
    const startMs = connection.lastSyncedAt
      ? connection.lastSyncedAt.getTime()
      : endMs - 7 * 24 * 60 * 60 * 1000;

    let recordsSynced = 0;
    let errorMessage: string | undefined;

    try {
      // ── Google Fitness REST API — steps ────────────────────────────────────
      // TODO: Replace with Google Health API endpoints when GA.
      // Reference: https://developers.google.com/fit/rest/v1/reference/users/dataset/aggregate
      const stepsRes = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aggregateBy: [
              { dataTypeName: 'com.google.step_count.delta' },
              { dataTypeName: 'com.google.active_minutes' },
              { dataTypeName: 'com.google.calories.expended' },
              { dataTypeName: 'com.google.distance.delta' },
            ],
            bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
            startTimeMillis: startMs,
            endTimeMillis: endMs,
          }),
        }
      );

      if (stepsRes.ok) {
        const stepsData = await stepsRes.json();
        const buckets: Array<{
          startTimeMillis: string;
          dataset: Array<{ dataSourceId: string; point: Array<{ value: Array<{ intVal?: number; fpVal?: number }> }> }>;
        }> = stepsData.bucket || [];

        for (const bucket of buckets) {
          const date = new Date(parseInt(bucket.startTimeMillis));
          // Set to midnight UTC for consistent daily keys
          date.setUTCHours(0, 0, 0, 0);

          let steps: number | undefined;
          let activeMinutes: number | undefined;
          let activeCalories: number | undefined;
          let distanceMeters: number | undefined;

          for (const dataset of bucket.dataset) {
            const src = dataset.dataSourceId || '';
            for (const point of dataset.point || []) {
              const val = point.value?.[0];
              if (!val) continue;
              if (src.includes('step_count')) steps = (steps ?? 0) + (val.intVal ?? 0);
              else if (src.includes('active_minutes')) activeMinutes = (activeMinutes ?? 0) + (val.intVal ?? 0);
              else if (src.includes('calories')) activeCalories = (activeCalories ?? 0) + (val.fpVal ?? 0);
              else if (src.includes('distance')) distanceMeters = (distanceMeters ?? 0) + (val.fpVal ?? 0);
            }
          }

          if (steps != null || activeMinutes != null) {
            await prisma.healthDailySummary.upsert({
              where: { userId_date_provider: { userId, date, provider: 'google_health' } },
              update: { steps, activeMinutes, activeCalories, distanceMeters, importedAt: new Date() },
              create: { userId, date, provider: 'google_health', steps, activeMinutes, activeCalories, distanceMeters },
            });
            recordsSynced++;
          }
        }
      } else {
        const err = await stepsRes.text();
        console.warn('[google/sync] Fitness API steps error:', err);
        errorMessage = `Fitness API error: ${stepsRes.status}`;
      }

      // ── Sleep data ────────────────────────────────────────────────────────
      const sleepRes = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${new Date(startMs).toISOString()}&endTime=${new Date(endMs).toISOString()}&activityType=72`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (sleepRes.ok) {
        const sleepData = await sleepRes.json();
        const sessions: Array<{
          startTimeMillis: string;
          endTimeMillis: string;
          activityType: number;
        }> = sleepData.session || [];

        for (const s of sessions) {
          if (s.activityType !== 72) continue; // 72 = sleep
          const date = new Date(parseInt(s.startTimeMillis));
          date.setUTCHours(0, 0, 0, 0);
          const sleepMinutes = Math.round(
            (parseInt(s.endTimeMillis) - parseInt(s.startTimeMillis)) / 60000
          );

          await prisma.healthDailySummary.upsert({
            where: { userId_date_provider: { userId, date, provider: 'google_health' } },
            update: { sleepMinutes, importedAt: new Date() },
            create: { userId, date, provider: 'google_health', sleepMinutes },
          });
          recordsSynced++;
        }
      }
    } catch (syncErr) {
      console.error('[google/sync] data fetch error:', syncErr);
      errorMessage = 'Failed to fetch health data';
    }

    // Update sync log and connection
    await prisma.healthSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: errorMessage ? 'partial' : 'completed',
        completedAt: new Date(),
        recordsSynced,
        errorMessage,
      },
    });

    await prisma.healthConnection.update({
      where: { userId_provider: { userId, provider: 'google_health' } },
      data: {
        lastSyncedAt: new Date(),
        errorMessage: errorMessage ?? null,
      },
    });

    return NextResponse.json({ success: true, recordsSynced, warning: errorMessage });
  } catch (error) {
    console.error('[health/google/sync] unexpected error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
