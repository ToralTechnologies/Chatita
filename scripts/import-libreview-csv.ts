/**
 * Import historical glucose readings from an official LibreView CSV export.
 *
 * Why: LibreLinkUp (the live API) only serves ~12h of history, so any sync gap
 * longer than that is unrecoverable through the app — but LibreView keeps the
 * FULL sensor history. This importer backfills those holes so older meals can
 * show their blood-sugar impact and feed analytics.
 *
 * How to get the CSV:
 *   1. Log in at https://www.libreview.com with your Libre account
 *   2. Click the "Download glucose data" button (top right of the dashboard)
 *   3. Save the .csv and run this script against it
 *
 * Usage:
 *   npx tsx scripts/import-libreview-csv.ts <file.csv> --email you@example.com [--tz America/New_York] [--execute]
 *
 * Notes:
 *   - DRY RUN by default; add --execute to write.
 *   - 'Device Timestamp' in the CSV is the reader's LOCAL time with no zone;
 *     --tz (IANA name, default America/New_York) converts it to true UTC,
 *     DST-aware.
 *   - Imports Record Type 0 (historic, 15-min) and 1 (scans); dedupes against
 *     existing readings by (minute, value) and skips anything within ±7 min of
 *     an existing reading so 15-min historic points don't double up against
 *     already-synced 5-min LibreLinkUp points.
 *   - After importing, run: npx tsx scripts/link-meal-readings.ts --execute
 *     so meals in the recovered windows pick the readings up for insights.
 */
import { readFileSync } from 'fs';
import { prisma } from '../lib/prisma';

const args = process.argv.slice(2);
const EXECUTE = args.includes('--execute');
const file = args.find(a => !a.startsWith('--'));
const emailIdx = args.indexOf('--email');
const email = emailIdx >= 0 ? args[emailIdx + 1] : undefined;
const tzIdx = args.indexOf('--tz');
const tz = tzIdx >= 0 ? args[tzIdx + 1] : 'America/New_York';

if (!file || !email) {
  console.error('Usage: npx tsx scripts/import-libreview-csv.ts <file.csv> --email you@example.com [--tz America/New_York] [--execute]');
  process.exit(1);
}

/** Convert a naive local wall-clock time in `zone` to a UTC Date (DST-aware). */
function localToUtc(y: number, mo: number, d: number, h: number, mi: number, zone: string): Date {
  // Two-pass: guess UTC, measure how the guess renders in the zone, correct.
  let guess = Date.UTC(y, mo - 1, d, h, mi);
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', hour12: false,
    }).formatToParts(new Date(guess));
    const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value ?? '0', 10);
    const rendered = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'));
    guess += Date.UTC(y, mo - 1, d, h, mi) - rendered;
  }
  return new Date(guess);
}

/** Parse LibreView 'Device Timestamp' — 'MM-DD-YYYY hh:mm AM/PM' or 'DD-MM-YYYY HH:MM'. */
function parseTimestamp(raw: string, dayFirst: boolean): { y: number; mo: number; d: number; h: number; mi: number } | null {
  const m = raw.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})[ T](\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!m) return null;
  const [, a, b, y, hh, mi, ap] = m;
  let h = parseInt(hh, 10);
  if (ap?.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (ap?.toUpperCase() === 'AM' && h === 12) h = 0;
  const mo = dayFirst ? parseInt(b, 10) : parseInt(a, 10);
  const d = dayFirst ? parseInt(a, 10) : parseInt(b, 10);
  return { y: parseInt(y, 10), mo, d, h, mi: parseInt(mi, 10) };
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: email! }, select: { id: true } });
  if (!user) throw new Error(`No user with email ${email}`);

  const text = readFileSync(file!, 'utf8');
  const lines = text.split(/\r?\n/);
  const headerIdx = lines.findIndex(l => l.includes('Device Timestamp'));
  if (headerIdx < 0) throw new Error("Couldn't find the 'Device Timestamp' header — is this a LibreView glucose export?");
  const headers = lines[headerIdx].split(',').map(h => h.trim());
  const col = (name: string) => headers.findIndex(h => h === name);
  const iTs = col('Device Timestamp');
  const iType = col('Record Type');
  const iHist = headers.findIndex(h => h.startsWith('Historic Glucose'));
  const iScan = headers.findIndex(h => h.startsWith('Scan Glucose'));
  if (iTs < 0 || iType < 0 || (iHist < 0 && iScan < 0)) throw new Error('Unexpected CSV columns: ' + headers.join(' | '));

  // Auto-detect day-first dates: if any first component exceeds 12 it's a day.
  const sample = lines.slice(headerIdx + 1).map(l => l.split(',')[iTs]).filter(Boolean).slice(0, 500);
  const dayFirst = sample.some(s => parseInt(s, 10) > 12);

  const candidates: { measuredAt: Date; value: number }[] = [];
  let skippedRows = 0;
  for (const line of lines.slice(headerIdx + 1)) {
    if (!line.trim()) continue;
    const cells = line.split(',');
    const type = cells[iType]?.trim();
    let value = NaN;
    if (type === '0' && iHist >= 0) value = parseFloat(cells[iHist]);
    else if (type === '1' && iScan >= 0) value = parseFloat(cells[iScan]);
    else continue; // notes, insulin, food rows etc.
    if (!Number.isFinite(value) || value < 20 || value > 600) { skippedRows++; continue; }
    const p = parseTimestamp(cells[iTs] ?? '', dayFirst);
    if (!p) { skippedRows++; continue; }
    candidates.push({ measuredAt: localToUtc(p.y, p.mo, p.d, p.h, p.mi, tz), value: Math.round(value) });
  }
  if (candidates.length === 0) throw new Error('No glucose rows parsed.');
  candidates.sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime());

  console.log(`Parsed ${candidates.length} readings (${skippedRows} rows skipped), dayFirst=${dayFirst}, tz=${tz}`);
  console.log('range:', candidates[0].measuredAt.toISOString(), '→', candidates[candidates.length - 1].measuredAt.toISOString());

  // Dedupe: skip anything within ±7 min of an existing reading (LibreLinkUp
  // 5-min points vs LibreView 15-min historic points describe the same trace).
  const existing = await prisma.glucoseEntry.findMany({
    where: {
      userId: user.id,
      measuredAt: {
        gte: new Date(candidates[0].measuredAt.getTime() - 10 * 60000),
        lte: new Date(candidates[candidates.length - 1].measuredAt.getTime() + 10 * 60000),
      },
    },
    select: { measuredAt: true },
    orderBy: { measuredAt: 'asc' },
  });
  const existingTimes = existing.map(e => e.measuredAt.getTime());
  const nearExisting = (t: number) => {
    // binary search nearest
    let lo = 0, hi = existingTimes.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (existingTimes[mid] < t) lo = mid + 1; else hi = mid - 1;
    }
    for (const idx of [lo - 1, lo]) {
      if (idx >= 0 && idx < existingTimes.length && Math.abs(existingTimes[idx] - t) <= 7 * 60000) return true;
    }
    return false;
  };

  const toCreate = candidates.filter(c => !nearExisting(c.measuredAt.getTime()));
  console.log(`New readings to import (not within ±7 min of an existing one): ${toCreate.length}`);

  // Show which known gaps this fills
  for (const [label, from, to] of [
    ['Jun 29 hole', '2026-06-29T05:37:00Z', '2026-06-30T01:17:00Z'],
    ['Jul 1 gap', '2026-06-30T23:27:00Z', '2026-07-01T16:16:00Z'],
  ] as const) {
    const n = toCreate.filter(c => c.measuredAt >= new Date(from) && c.measuredAt <= new Date(to)).length;
    console.log(`  fills ${label}: ${n} readings`);
  }

  if (!EXECUTE) {
    console.log('\nDRY RUN — nothing written. Re-run with --execute to import.');
    return;
  }

  const BATCH = 1000;
  let created = 0;
  for (let i = 0; i < toCreate.length; i += BATCH) {
    const batch = toCreate.slice(i, i + BATCH).map(c => ({
      userId: user.id,
      value: c.value,
      measuredAt: c.measuredAt,
      notes: 'FreeStyle Libre (LibreView import)',
      context: 'random',
    }));
    await prisma.glucoseEntry.createMany({ data: batch });
    created += batch.length;
  }
  console.log(`Imported ${created} readings.`);
  console.log('Next: npx tsx scripts/link-meal-readings.ts --execute   (links them to meals for insights)');
}

main().finally(() => process.exit(0));
