import { prisma } from '@/lib/prisma';
import { encryptToken, decryptToken } from '@/lib/health/token-encrypt';

/**
 * Google Health / Fitbit sync.
 *
 * Targets the Google Fitness REST API (production-ready, same OAuth tokens as
 * the forthcoming Google Health API). Shared by the manual "Sync now" route,
 * the post-connect initial sync, and the daily cron.
 *
 * TODO: Migrate to Google Health API endpoints when they become generally
 * available (developers.google.com/health).
 */

const PROVIDER = 'google_health';

export interface GoogleSyncResult {
  recordsSynced: number;
  warning?: string;
}

export class GoogleSyncError extends Error {
  constructor(message: string, readonly code: 'not_connected' | 'reauth_required' | 'no_token') {
    super(message);
    this.name = 'GoogleSyncError';
  }
}

async function refreshGoogleToken(refreshTokenEnc: string, userId: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_HEALTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';

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
      console.error('[google-sync] token refresh failed:', await res.text());
      return null;
    }

    const data = await res.json();
    const newAccessToken: string = data.access_token;
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await prisma.healthConnection.update({
      where: { userId_provider: { userId, provider: PROVIDER } },
      data: { accessTokenEnc: encryptToken(newAccessToken), tokenExpiresAt: expiresAt, errorMessage: null },
    });

    return newAccessToken;
  } catch (err) {
    console.error('[google-sync] refresh error:', err);
    return null;
  }
}

/**
 * Sync recent Google Health data for one user into HealthDailySummary.
 * Throws GoogleSyncError for connection/auth problems; data-fetch errors are
 * surfaced via the `warning` field so a partial sync still succeeds.
 */
export async function syncGoogleHealth(userId: string): Promise<GoogleSyncResult> {
  const connection = await prisma.healthConnection.findUnique({
    where: { userId_provider: { userId, provider: PROVIDER } },
  });

  if (!connection || connection.status !== 'connected') {
    throw new GoogleSyncError('Google Health not connected', 'not_connected');
  }

  const syncLog = await prisma.healthSyncLog.create({
    data: { userId, provider: PROVIDER, status: 'started' },
  });

  // Resolve a valid access token (refresh if expiring within 60s).
  let accessToken: string;
  const isExpired = connection.tokenExpiresAt && connection.tokenExpiresAt < new Date(Date.now() + 60_000);

  if (isExpired && connection.refreshTokenEnc) {
    const refreshed = await refreshGoogleToken(connection.refreshTokenEnc, userId);
    if (!refreshed) {
      await prisma.healthConnection.update({
        where: { userId_provider: { userId, provider: PROVIDER } },
        data: { status: 'error', errorMessage: 'Token refresh failed. Please reconnect.' },
      });
      await prisma.healthSyncLog.update({
        where: { id: syncLog.id },
        data: { status: 'failed', completedAt: new Date(), errorMessage: 'Token refresh failed' },
      });
      throw new GoogleSyncError('Token refresh failed. Please reconnect Google Health.', 'reauth_required');
    }
    accessToken = refreshed;
  } else if (connection.accessTokenEnc) {
    accessToken = decryptToken(connection.accessTokenEnc);
  } else {
    await prisma.healthSyncLog.update({
      where: { id: syncLog.id },
      data: { status: 'failed', completedAt: new Date(), errorMessage: 'No access token' },
    });
    throw new GoogleSyncError('No access token available', 'no_token');
  }

  // Sync window: from last sync (with a 1-day overlap to catch late-arriving
  // samples), else the last 30 days for a fresh connection.
  const endMs = Date.now();
  const startMs = connection.lastSyncedAt
    ? connection.lastSyncedAt.getTime() - 24 * 60 * 60 * 1000
    : endMs - 30 * 24 * 60 * 60 * 1000;

  let recordsSynced = 0;
  let errorMessage: string | undefined;

  try {
    const stepsRes = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aggregateBy: [
          { dataTypeName: 'com.google.step_count.delta' },
          { dataTypeName: 'com.google.active_minutes' },
          { dataTypeName: 'com.google.calories.expended' },
          { dataTypeName: 'com.google.distance.delta' },
        ],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: startMs,
        endTimeMillis: endMs,
      }),
    });

    if (stepsRes.ok) {
      const stepsData = await stepsRes.json();
      const buckets: Array<{
        startTimeMillis: string;
        dataset: Array<{ dataSourceId: string; point: Array<{ value: Array<{ intVal?: number; fpVal?: number }> }> }>;
      }> = stepsData.bucket || [];

      for (const bucket of buckets) {
        const date = new Date(parseInt(bucket.startTimeMillis));
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
            where: { userId_date_provider: { userId, date, provider: PROVIDER } },
            update: { steps, activeMinutes, activeCalories, distanceMeters, importedAt: new Date() },
            create: { userId, date, provider: PROVIDER, steps, activeMinutes, activeCalories, distanceMeters },
          });
          recordsSynced++;
        }
      }
    } else {
      console.warn('[google-sync] Fitness API steps error:', await stepsRes.text());
      errorMessage = `Fitness API error: ${stepsRes.status}`;
    }

    // Sleep sessions (activityType 72).
    const sleepRes = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${new Date(startMs).toISOString()}&endTime=${new Date(endMs).toISOString()}&activityType=72`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (sleepRes.ok) {
      const sleepData = await sleepRes.json();
      const sessions: Array<{ startTimeMillis: string; endTimeMillis: string; activityType: number }> =
        sleepData.session || [];

      for (const s of sessions) {
        if (s.activityType !== 72) continue;
        const date = new Date(parseInt(s.startTimeMillis));
        date.setUTCHours(0, 0, 0, 0);
        const sleepMinutes = Math.round((parseInt(s.endTimeMillis) - parseInt(s.startTimeMillis)) / 60000);

        await prisma.healthDailySummary.upsert({
          where: { userId_date_provider: { userId, date, provider: PROVIDER } },
          update: { sleepMinutes, importedAt: new Date() },
          create: { userId, date, provider: PROVIDER, sleepMinutes },
        });
        recordsSynced++;
      }
    }
  } catch (syncErr) {
    console.error('[google-sync] data fetch error:', syncErr);
    errorMessage = 'Failed to fetch health data';
  }

  await prisma.healthSyncLog.update({
    where: { id: syncLog.id },
    data: { status: errorMessage ? 'partial' : 'completed', completedAt: new Date(), recordsSynced, errorMessage },
  });

  await prisma.healthConnection.update({
    where: { userId_provider: { userId, provider: PROVIDER } },
    data: { lastSyncedAt: new Date(), errorMessage: errorMessage ?? null },
  });

  return { recordsSynced, warning: errorMessage };
}
