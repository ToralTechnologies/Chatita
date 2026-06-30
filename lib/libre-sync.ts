import { prisma } from '@/lib/prisma';
import { LibreLinkUpClient, decryptPassword, parseLibreUtcTimestamp } from '@/lib/libre-api';
import { linkReadingsToRecentMeals } from '@/lib/cgm-meal-link';

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

  // Import the FULL available graph window (~12h) and gap-fill, rather than only
  // readings past a watermark. LibreLinkUp only serves ~12h, so importing
  // everything each sync (deduped) keeps history continuous and lets a
  // just-uploaded older photo's window be backfilled on demand.
  //
  // FactoryTimestamp is UTC; Timestamp is the patient's local time with no
  // offset and must NOT be used (see parseLibreUtcTimestamp).
  const candidates = glucoseData
    .map((r) => ({ measuredAt: parseLibreUtcTimestamp(r.FactoryTimestamp), value: r.ValueInMgPerDl, trend: r.TrendArrow }))
    .filter((r): r is { measuredAt: Date; value: number; trend: number } => !!r.measuredAt && !!r.value);

  let imported = 0;
  if (candidates.length > 0) {
    const earliest = candidates.reduce((min, r) => (r.measuredAt < min ? r.measuredAt : min), candidates[0].measuredAt);
    // One read of existing readings in the window → in-memory dedupe → one bulk insert.
    const existing = await prisma.glucoseEntry.findMany({
      where: { userId, measuredAt: { gte: earliest } },
      select: { measuredAt: true, value: true },
    });
    const seen = new Set(existing.map((e) => `${e.measuredAt.getTime()}|${e.value}`));
    const toCreate: { userId: string; value: number; measuredAt: Date; notes: string; context: string }[] = [];
    for (const r of candidates) {
      const key = `${r.measuredAt.getTime()}|${r.value}`;
      if (seen.has(key)) continue;
      seen.add(key); // guard against duplicates within this batch too
      toCreate.push({ userId, value: r.value, measuredAt: r.measuredAt, notes: `FreeStyle Libre (Trend: ${LibreLinkUpClient.getTrendSymbol(r.trend)})`, context: 'random' });
    }
    if (toCreate.length > 0) {
      await prisma.glucoseEntry.createMany({ data: toCreate });
      imported = toCreate.length;
    }
  }

  // Link new (and any still-unlinked) readings to recent meals so each meal's
  // blood-sugar impact picks them up as post-meal context.
  if (imported > 0) {
    await linkReadingsToRecentMeals(userId).catch((e) =>
      console.error('[libre-sync] auto-link error:', e)
    );
  }

  await prisma.libreIntegration.update({
    where: { userId },
    data: { lastSyncAt: new Date(), lastError: null },
  });

  return { ok: true, imported, total: glucoseData.length };
}
