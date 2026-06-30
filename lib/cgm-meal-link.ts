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
}
