import { prisma } from '@/lib/prisma';
import { LibreLinkUpClient, decryptPassword, parseLibreUtcTimestamp } from '@/lib/libre-api';

export interface LibreSyncResult {
  ok: boolean;
  imported: number;
  total: number;
  skipped?: boolean;       // throttled by minIntervalMs
  notConnected?: boolean;  // no integration
  reauthFailed?: boolean;  // credentials need re-entry
  status?: number;         // suggested HTTP status for API callers
  error?: string;
}

// LibreLinkUp graph data lags real time by ~15-20 min, but lastSyncAt is
// wall-clock "now", so a naive `measuredAt > lastSyncAt` filter starves once the
// lag exceeds the sync interval. Look back this buffer and rely on the dedupe.
const SYNC_BUFFER_MS = 30 * 60 * 1000;

/**
 * Pull the latest glucose readings from LibreLinkUp for one user, import the new
 * ones, and link them to recent meals (post-meal context). Shared by the manual
 * sync route, the daily cron, and the meal glucose-impact route so the
 * timezone/lag handling and meal-linking live in exactly one place.
 *
 * Best-effort and side-effecting: it updates the integration's lastSyncAt and
 * lastError. Callers should treat a non-ok result as "couldn't refresh" rather
 * than fatal — the UI can still show whatever readings already exist.
 *
 * @param opts.minIntervalMs  Skip (no upstream call) if we synced more recently
 *   than this. Lets the impact route poll without hammering LibreLinkUp.
 */
export async function syncLibreReadings(
  userId: string,
  opts: { minIntervalMs?: number } = {}
): Promise<LibreSyncResult> {
  const integration = await prisma.libreIntegration.findUnique({ where: { userId } });

  if (!integration) {
    return { ok: false, imported: 0, total: 0, notConnected: true, status: 400, error: 'LibreLinkUp not connected. Please connect your account first.' };
  }
  if (!integration.isActive) {
    return { ok: false, imported: 0, total: 0, status: 400, error: 'LibreLinkUp integration is disabled' };
  }
  if (!integration.libreUserId) {
    return { ok: false, imported: 0, total: 0, status: 400, error: 'LibreLinkUp user ID not found. Please disconnect and reconnect your account in Settings to complete the setup.' };
  }

  // Throttle: if we synced very recently, don't call upstream again.
  if (
    opts.minIntervalMs &&
    integration.lastSyncAt &&
    Date.now() - integration.lastSyncAt.getTime() < opts.minIntervalMs
  ) {
    return { ok: true, imported: 0, total: 0, skipped: true };
  }

  const client = new LibreLinkUpClient(integration.region as 'US' | 'EU' | 'AP');
  await client.setAccountIdFromUserId(integration.libreUserId);

  let authToken = integration.authToken;
  let patientId = integration.librePatientId;

  // Re-authenticate if the token is missing or expired.
  if (!authToken || !integration.tokenExpiresAt || new Date() >= integration.tokenExpiresAt) {
    try {
      const password = decryptPassword(integration.librePassword);
      const auth = await client.login(integration.libreEmail, password);
      authToken = auth.token;
      patientId = auth.patientId || patientId;
      await prisma.libreIntegration.update({
        where: { userId },
        data: { authToken: auth.token, tokenExpiresAt: auth.expires, libreUserId: auth.userId, librePatientId: patientId },
      });
      await client.setAccountIdFromUserId(auth.userId);
    } catch {
      await prisma.libreIntegration.update({ where: { userId }, data: { lastError: 'Re-authentication failed. Please reconnect.' } });
      return { ok: false, imported: 0, total: 0, reauthFailed: true, status: 401, error: 'Authentication expired. Please reconnect your account.' };
    }
  }

  // Resolve patient connection if we don't have one yet.
  if (!patientId) {
    try {
      const connections = await client.getConnections(authToken!);
      if (connections.length > 0) {
        patientId = connections[0].patientId;
        await prisma.libreIntegration.update({ where: { userId }, data: { librePatientId: patientId } });
      } else {
        return { ok: false, imported: 0, total: 0, status: 400, error: 'No patient connections found. Make sure you have someone added in LibreLinkUp app.' };
      }
    } catch {
      return { ok: false, imported: 0, total: 0, status: 400, error: 'Failed to get patient connections. Please make sure you have LibreLinkUp properly configured with at least one connection.' };
    }
  }

  // Fetch glucose data (retry once on auth expiry mid-request).
  let glucoseData;
  try {
    glucoseData = await client.getGlucoseData(patientId, authToken!);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') {
      const password = decryptPassword(integration.librePassword);
      const auth = await client.login(integration.libreEmail, password);
      await prisma.libreIntegration.update({
        where: { userId },
        data: { authToken: auth.token, tokenExpiresAt: auth.expires, libreUserId: auth.userId },
      });
      await client.setAccountIdFromUserId(auth.userId);
      glucoseData = await client.getGlucoseData(patientId, auth.token);
    } else {
      await prisma.libreIntegration.update({ where: { userId }, data: { lastError: String(error?.message ?? 'Sync failed').slice(0, 200) } });
      return { ok: false, imported: 0, total: 0, status: 500, error: 'Failed to sync glucose data' };
    }
  }

  // Import new readings.
  const startDate = integration.lastSyncAt
    ? new Date(integration.lastSyncAt.getTime() - SYNC_BUFFER_MS)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);

  let imported = 0;
  for (const reading of glucoseData) {
    if (!reading.ValueInMgPerDl) continue;

    // FactoryTimestamp is UTC; Timestamp is the patient's local time with no
    // offset and must NOT be used (see parseLibreUtcTimestamp).
    const measuredAt = parseLibreUtcTimestamp(reading.FactoryTimestamp);
    if (!measuredAt) continue;
    if (measuredAt <= startDate) continue;

    const existing = await prisma.glucoseEntry.findFirst({
      where: { userId, measuredAt, value: reading.ValueInMgPerDl },
    });
    if (!existing) {
      const trendSymbol = LibreLinkUpClient.getTrendSymbol(reading.TrendArrow);
      await prisma.glucoseEntry.create({
        data: { userId, value: reading.ValueInMgPerDl, measuredAt, notes: `FreeStyle Libre (Trend: ${trendSymbol})`, context: 'random' },
      });
      imported++;
    }
  }

  // Link new (and any still-unlinked) readings to recent meals so each meal's
  // blood-sugar impact picks them up as post-meal context.
  if (imported > 0) {
    try {
      const recentMeals = await prisma.meal.findMany({
        where: { userId, eatenAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) } },
        select: { id: true, eatenAt: true },
      });
      for (const meal of recentMeals) {
        const mealTime = meal.eatenAt.getTime();
        await prisma.glucoseEntry.updateMany({
          where: {
            userId,
            relatedMealId: null,
            measuredAt: { gte: meal.eatenAt, lte: new Date(mealTime + 3 * 60 * 60 * 1000) },
          },
          data: { relatedMealId: meal.id, context: 'post-meal' },
        });
      }
    } catch (linkError) {
      console.error('[libre-sync] auto-link error:', linkError);
    }
  }

  await prisma.libreIntegration.update({
    where: { userId },
    data: { lastSyncAt: new Date(), lastError: null },
  });

  return { ok: true, imported, total: glucoseData.length };
}
