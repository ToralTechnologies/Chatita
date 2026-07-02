import { prisma } from '@/lib/prisma';

/**
 * Link any still-unlinked glucose readings to recent meals so each meal's
 * blood-sugar impact picks them up as post-meal context. Shared by the Libre and
 * Dexcom syncs. Best-effort: callers should swallow errors (a failed link must
 * not fail the whole sync).
 */
export async function linkReadingsToRecentMeals(userId: string): Promise<void> {
  const recentMeals = await prisma.meal.findMany({
    where: { userId, eatenAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) } },
    select: { id: true, eatenAt: true },
  });

  for (const meal of recentMeals) {
    await linkReadingsToMeal(userId, meal.id, meal.eatenAt);
  }
}

/**
 * Link still-unlinked glucose readings inside ONE meal's post-meal window
 * (0…+3h), regardless of the meal's age. Used for backdated meals — e.g. a
 * photo of a past meal uploaded later — so analytics/insights (which pair
 * meals and readings via relatedMealId + context 'post-meal') learn from them,
 * not just meals logged right after eating. Returns how many readings linked.
 */
export async function linkReadingsToMeal(
  userId: string,
  mealId: string,
  eatenAt: Date
): Promise<number> {
  const res = await prisma.glucoseEntry.updateMany({
    where: {
      userId,
      relatedMealId: null,
      measuredAt: { gte: eatenAt, lte: new Date(eatenAt.getTime() + 3 * 60 * 60 * 1000) },
    },
    data: { relatedMealId: mealId, context: 'post-meal' },
  });
  return res.count;
}
