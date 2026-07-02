/**
 * Link CGM/manual glucose readings to EVERY meal's post-meal window (0…+3h),
 * regardless of meal age. Idempotent — only touches readings that aren't
 * linked to any meal yet, and never overwrites an existing link or a
 * manually-set context.
 *
 * Why: analytics/insights pair meals ↔ readings via relatedMealId +
 * context 'post-meal'. The automatic linker only covers meals eaten in the
 * last 4h, so meals logged after the fact (photo of a past meal) — and all
 * meals predating this fix — were invisible to insights even when their
 * blood-sugar impact showed in meal history.
 *
 * Usage:
 *   npx tsx scripts/link-meal-readings.ts            # DRY RUN (default)
 *   npx tsx scripts/link-meal-readings.ts --execute  # apply
 */
import { prisma } from '../lib/prisma';
import { linkReadingsToMeal } from '../lib/cgm-meal-link';

const EXECUTE = process.argv.includes('--execute');
const H = 60 * 60 * 1000;

async function main() {
  const meals = await prisma.meal.findMany({
    orderBy: { eatenAt: 'asc' },
    select: { id: true, userId: true, eatenAt: true, mealName: true, aiSummary: true },
  });

  let totalLinkable = 0;
  console.log(`=== ${meals.length} meals — unlinked readings in each 0…+3h window ===`);
  for (const m of meals) {
    const count = await prisma.glucoseEntry.count({
      where: {
        userId: m.userId,
        relatedMealId: null,
        measuredAt: { gte: m.eatenAt, lte: new Date(m.eatenAt.getTime() + 3 * H) },
      },
    });
    const already = await prisma.glucoseEntry.count({ where: { relatedMealId: m.id } });
    totalLinkable += count;
    console.log(
      m.eatenAt.toISOString(),
      `linkable:${String(count).padStart(4)}`,
      `alreadyLinked:${String(already).padStart(4)}`,
      (m.mealName || m.aiSummary || '(unnamed)').slice(0, 40)
    );
  }
  console.log(`\nTotal readings that would be linked: ${totalLinkable}`);

  if (!EXECUTE) {
    console.log('DRY RUN — no changes made. Re-run with --execute to apply.');
    return;
  }

  let linked = 0;
  for (const m of meals) {
    linked += await linkReadingsToMeal(m.userId, m.id, m.eatenAt);
  }
  console.log(`Done: linked ${linked} readings across ${meals.length} meals.`);
}

main().finally(() => process.exit(0));
