import { prisma } from '@/lib/prisma';
import { linkReadingsToRecentMeals } from '@/lib/cgm-meal-link';

export interface DexcomSyncResult {
  ok: boolean;
  imported: number;
  total: number;
  skipped?: boolean;       // throttled by minIntervalMs
  notConnected?: boolean;  // no integration
  status?: number;         // suggested HTTP status for API callers
  error?: string;
}

// Normal sync looks back a little before lastSyncAt so a reading that lands in
// Dexcom's reporting lag isn't skipped; the dedupe handles re-fetches.
const SYNC_BUFFER_MS = 30 * 60 * 1000;

function dexcomBaseUrl(environment: string): string {
  return environment === 'production'
    ? 'https://api.dexcom.com'
    : 'https://sandbox-api.dexcom.com';
}

/** Dexcom systemTime is UTC but lacks a timezone suffix; mark it so JS doesn't
 * read it as local time and shift every reading. */
function parseDexcomUtc(systemTime: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(systemTime) ? systemTime : `${systemTime}Z`);
}

async function refreshDexcomToken(integration: {
  id: string;
  refreshToken: string;
  environment: string;
}): Promise<string> {
  const tokenResponse = await fetch(`${dexcomBaseUrl(integration.environment)}/v3/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DEXCOM_CLIENT_ID!,
      client_secret: process.env.DEXCOM_CLIENT_SECRET!,
      refresh_token: integration.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh Dexcom token');
  }

  const tokenData = await tokenResponse.json();
  await prisma.dexcomIntegration.update({
    where: { id: integration.id },
    data: {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
    },
  });

  return tokenData.access_token;
}

/**
 * Pull the latest EGVs from Dexcom for one user, import the new ones, and link
 * them to recent meals (post-meal context). Shared by the manual sync route, the
 * daily cron, and the meal glucose-impact route so timezone/lag handling and
 * meal-linking live in exactly one place. Mirrors syncLibreReadings.
 *
 * @param opts.minIntervalMs  Skip (no upstream call) if we synced more recently
 *   than this. Lets the impact route poll without hammering Dexcom.
 * @param opts.since / opts.until  Targeted historical backfill of an exact
 *   window (e.g. an older meal's window). Dexcom retains history, so we can fetch
 *   any past range. A backfill never throttles and never moves lastSyncAt — it
 *   just fills in the requested gap.
 */
export async function syncDexcomReadings(
  userId: string,
  opts: { minIntervalMs?: number; since?: Date; until?: Date } = {}
): Promise<DexcomSyncResult> {
  const integration = await prisma.dexcomIntegration.findUnique({ where: { userId } });

  if (!integration) {
    return { ok: false, imported: 0, total: 0, notConnected: true, status: 400, error: 'Dexcom not connected. Please connect your Dexcom account first.' };
  }
  if (!integration.isActive) {
    return { ok: false, imported: 0, total: 0, status: 400, error: 'Dexcom integration is disabled' };
  }

  const backfill = !!opts.since;

  if (
    !backfill &&
    opts.minIntervalMs &&
    integration.lastSyncAt &&
    Date.now() - integration.lastSyncAt.getTime() < opts.minIntervalMs
  ) {
    return { ok: true, imported: 0, total: 0, skipped: true };
  }

  try {
    let accessToken = integration.accessToken;
    if (new Date() >= integration.tokenExpiresAt) {
      accessToken = await refreshDexcomToken(integration);
    }

    const startDate = backfill
      ? opts.since!
      : integration.lastSyncAt
      ? new Date(integration.lastSyncAt.getTime() - SYNC_BUFFER_MS)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = backfill && opts.until ? opts.until : new Date();

    const egvsUrl = new URL(`${dexcomBaseUrl(integration.environment)}/v3/users/self/egvs`);
    egvsUrl.searchParams.append('startDate', startDate.toISOString());
    egvsUrl.searchParams.append('endDate', endDate.toISOString());

    const res = await fetch(egvsUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      if (!backfill) await prisma.dexcomIntegration.update({ where: { userId }, data: { lastError: `Failed to fetch data: ${res.status}` } });
      return { ok: false, imported: 0, total: 0, status: 500, error: 'Failed to fetch glucose data from Dexcom' };
    }

    const data = await res.json();
    const records: any[] = data.records || [];

    // Build candidates → one read of existing readings → in-memory dedupe → bulk insert.
    const candidates = records
      .filter((egv) => egv.value && egv.value >= 40 && egv.value <= 400)
      .map((egv) => ({ measuredAt: parseDexcomUtc(egv.systemTime), value: egv.value as number, trend: egv.trend }));

    let imported = 0;
    if (candidates.length > 0) {
      const earliest = candidates.reduce((min, r) => (r.measuredAt < min ? r.measuredAt : min), candidates[0].measuredAt);
      const existing = await prisma.glucoseEntry.findMany({
        where: { userId, measuredAt: { gte: earliest } },
        select: { measuredAt: true, value: true },
      });
      const seen = new Set(existing.map((e) => `${e.measuredAt.getTime()}|${e.value}`));
      const toCreate: { userId: string; value: number; measuredAt: Date; notes: string; context: string }[] = [];
      for (const r of candidates) {
        const key = `${r.measuredAt.getTime()}|${r.value}`;
        if (seen.has(key)) continue;
        seen.add(key);
        toCreate.push({ userId, value: r.value, measuredAt: r.measuredAt, notes: `Dexcom CGM (Trend: ${r.trend})`, context: 'random' });
      }
      if (toCreate.length > 0) {
        await prisma.glucoseEntry.createMany({ data: toCreate });
        imported = toCreate.length;
      }
    }

    if (imported > 0) {
      await linkReadingsToRecentMeals(userId).catch((e) =>
        console.error('[dexcom-sync] auto-link error:', e)
      );
    }

    // A targeted backfill must not move the forward-sync watermark.
    if (!backfill) {
      await prisma.dexcomIntegration.update({
        where: { userId },
        data: { lastSyncAt: new Date(), lastError: null },
      });
    }

    return { ok: true, imported, total: records.length };
  } catch (error: any) {
    if (!backfill) {
      await prisma.dexcomIntegration
        .update({ where: { userId }, data: { lastError: String(error?.message ?? 'Sync failed').slice(0, 200) } })
        .catch(() => {});
    }
    return { ok: false, imported: 0, total: 0, status: 500, error: 'Failed to sync glucose data' };
  }
}
