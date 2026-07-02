/**
 * One-time data repair (applied 2026-07-02): fixes Libre readings imported before the Jun 29 2026
 * timestamp fix (commit 9d72f4c). The old parser did `new Date(reading.Timestamp)`
 * — the patient's LOCAL (ET) wall-clock string parsed as UTC on the server — so
 * every reading imported pre-fix is stored exactly 4h too early (EDT = UTC-4).
 *
 * Detection: for each sync batch (same createdAt), the newest reading should be
 * only ~5-20 min old (Libre serves a live 12h graph). Pre-fix batches show a
 * minimum (createdAt - measuredAt) of ~4.3h — the EDT offset + Libre lag.
 *
 * Repair: measuredAt += 4h for affected readings. If a correctly-imported
 * duplicate already sits at the corrected time (same value), delete the shifted
 * copy instead. Meal links (relatedMealId/context) are recomputed for affected
 * readings from meal windows.
 *
 * Usage:
 *   npx tsx scripts/migrations/2026-07-02-repair-libre-timestamps.ts            # DRY RUN (read-only, default)
 *   npx tsx scripts/migrations/2026-07-02-repair-libre-timestamps.ts --execute  # apply the repair
 */
import { prisma } from '../lib/prisma';
import { computeCompactImpact } from '../lib/glucose-impact';

const H = 60 * 60 * 1000;
const SHIFT_MS = 4 * H; // EDT offset
const EXECUTE = process.argv.includes('--execute');

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'torall@umich.edu' }, select: { id: true } });
  if (!user) throw new Error('no user');
  const userId = user.id;

  // --- 1. Identify shifted SYNC RUNS. Pre-fix syncs inserted per-row (distinct
  //        createdAt per row), so cluster rows into runs by createdAt gap
  //        (>120s starts a new run). A run's newest reading should be only
  //        ~5-40 min old (Libre serves a live 12h graph); pre-fix (shifted)
  //        runs show newest-lag ≈ 4.3h (EDT offset + Libre lag).
  const rows = await prisma.glucoseEntry.findMany({
    where: { userId, notes: { startsWith: 'FreeStyle Libre' } },
    select: { id: true, value: true, measuredAt: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  const runs: { rows: typeof rows }[] = [];
  for (const r of rows) {
    const cur = runs[runs.length - 1];
    if (cur && r.createdAt.getTime() - cur.rows[cur.rows.length - 1].createdAt.getTime() <= 120_000) {
      cur.rows.push(r);
    } else {
      runs.push({ rows: [r] });
    }
  }

  console.log('=== Libre sync runs (start, rows, newest-reading lag h) ===');
  const affected: { id: string; value: number; measuredAt: Date }[] = [];
  for (const run of runs) {
    const start = run.rows[0].createdAt;
    const newestLagH = Math.min(
      ...run.rows.map((r) => (r.createdAt.getTime() - r.measuredAt.getTime()) / H)
    );
    const shifted = newestLagH >= 3.5 && newestLagH <= 5.5;
    if (shifted) affected.push(...run.rows);
    console.log(
      start.toISOString(), `rows=${String(run.rows.length).padStart(3)}`,
      `newestLag=${newestLagH.toFixed(2)}h`, shifted ? '→ SHIFTED (-4h)' : 'ok'
    );
    if (newestLagH > 5.5) console.log('   ^ WARNING: unexpected lag — inspect before repairing');
  }
  affected.sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime());
  console.log(`\nAffected readings: ${affected.length} across ${runs.length} runs`);
  if (affected.length) {
    console.log('range:', affected[0].measuredAt.toISOString(), '→', affected[affected.length - 1].measuredAt.toISOString());
  }

  // --- 2. Collision check: does a reading already exist at measuredAt+4h with
  //        the same value (correct post-fix import of the same physical reading)?
  const all = await prisma.glucoseEntry.findMany({
    where: { userId },
    select: { id: true, value: true, measuredAt: true },
  });
  const affectedIds = new Set(affected.map((a) => a.id));
  const byKey = new Set(
    all.filter((r) => !affectedIds.has(r.id)).map((r) => `${r.measuredAt.getTime()}|${r.value}`)
  );
  const collisions = affected.filter((r) => byKey.has(`${r.measuredAt.getTime() + SHIFT_MS}|${r.value}`));
  const toShift = affected.filter((r) => !byKey.has(`${r.measuredAt.getTime() + SHIFT_MS}|${r.value}`));
  console.log(`collisions (delete shifted copy): ${collisions.length}`);
  console.log(`to shift +4h:                     ${toShift.length}`);

  // --- 3. Before/after impact simulation for verification meals.
  const meals = await prisma.meal.findMany({
    where: { userId },
    orderBy: { eatenAt: 'asc' },
    select: { id: true, eatenAt: true, mealName: true, aiSummary: true },
  });
  const collisionIds = new Set(collisions.map((c) => c.id));
  const shiftIds = new Set(toShift.map((r) => r.id));
  const repaired = all
    .filter((r) => !collisionIds.has(r.id))
    .map((r) =>
      shiftIds.has(r.id)
        ? { value: r.value, measuredAt: new Date(r.measuredAt.getTime() + SHIFT_MS) }
        : { value: r.value, measuredAt: r.measuredAt }
    );
  repaired.sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime());
  const current = [...all].sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime());

  console.log('\n=== Meal impact: BEFORE → AFTER repair ===');
  for (const m of meals) {
    const before = computeCompactImpact(m.eatenAt.getTime(), current);
    const after = computeCompactImpact(m.eatenAt.getTime(), repaired);
    const name = (m.mealName || m.aiSummary || '(unnamed)').slice(0, 34);
    console.log(
      m.eatenAt.toISOString(), '|', name.padEnd(34),
      `| before: ${before.available ? `${before.impact} rise=${before.glucoseRise}` : 'NO DATA'}`.padEnd(32),
      `| after: ${after.available ? `${after.impact} rise=${after.glucoseRise}` : 'NO DATA'}`
    );
  }

  if (!EXECUTE) {
    console.log('\nDRY RUN — no changes made. Re-run with --execute to apply.');
    return;
  }

  // --- 4. Apply.
  console.log('\nApplying repair…');
  await prisma.$transaction(async (tx) => {
    if (collisions.length) {
      await tx.glucoseEntry.deleteMany({ where: { id: { in: collisions.map((c) => c.id) } } });
    }
    // Postgres: single UPDATE shifting all remaining affected rows.
    const ids = toShift.map((r) => r.id);
    if (ids.length) {
      await tx.$executeRaw`
        UPDATE "GlucoseEntry"
        SET "measuredAt" = "measuredAt" + interval '4 hours'
        WHERE id = ANY(${ids})`;
    }
    // Recompute meal links for the shifted readings: clear, then relink by window.
    if (ids.length) {
      await tx.$executeRaw`
        UPDATE "GlucoseEntry" SET "relatedMealId" = NULL, context = 'random'
        WHERE id = ANY(${ids})`;
    }
    for (const m of meals) {
      await tx.$executeRaw`
        UPDATE "GlucoseEntry"
        SET "relatedMealId" = ${m.id}, context = 'post-meal'
        WHERE "userId" = ${userId} AND id = ANY(${ids}) AND "relatedMealId" IS NULL
          AND "measuredAt" >= ${m.eatenAt} AND "measuredAt" <= ${new Date(m.eatenAt.getTime() + 3 * H)}`;
    }
  });
  console.log(`Done: deleted ${collisions.length} duplicate shifted copies, shifted ${toShift.length} readings +4h, relinked meal windows.`);
}

main().finally(() => process.exit(0));
