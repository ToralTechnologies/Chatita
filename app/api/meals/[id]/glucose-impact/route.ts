import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateMealGlucoseImpact } from '@/lib/glucose-impact';
import { syncLibreReadings } from '@/lib/libre-sync';
import { syncDexcomReadings } from '@/lib/dexcom-sync';
import { linkReadingsToMeal } from '@/lib/cgm-meal-link';

// LibreLinkUp only serves the last ~12h, so its on-demand refresh can only fill
// a meal whose window is still inside that graph. Dexcom retains history, so we
// can backfill an older meal's exact window directly.
const LIBRE_GRAPH_MS = 12.5 * 60 * 60 * 1000;
const MEAL_PRE_MS = 30 * 60 * 1000;       // window starts 30m before the meal
const MEAL_POST_MS = 3 * 60 * 60 * 1000;  // …and runs 3h after

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = await params;

    // Refresh CGM data so this meal's window is filled before we compute — works
    // for older meals too, not just just-eaten ones. Best-effort + self-throttled
    // so polling stays cheap. The disconnected provider is a no-op.
    const meal = await prisma.meal.findFirst({
      where: { id, userId },
      select: { eatenAt: true },
    });
    if (meal) {
      const mealMs = meal.eatenAt.getTime();
      const windowEndMs = mealMs + MEAL_POST_MS;
      const refreshes: Promise<unknown>[] = [];

      // Libre: only the last ~12h is fetchable; refresh if the meal's window is
      // still (partly) inside that graph. A full-window import gap-fills it.
      if (Date.now() - mealMs <= LIBRE_GRAPH_MS && windowEndMs >= Date.now() - LIBRE_GRAPH_MS) {
        refreshes.push(syncLibreReadings(userId, { minIntervalMs: 3 * 60 * 1000 }).catch(() => {}));
      }

      // Dexcom: retains history → backfill this meal's exact window for any age.
      refreshes.push(
        syncDexcomReadings(userId, {
          since: new Date(mealMs - MEAL_PRE_MS),
          until: new Date(Math.min(windowEndMs, Date.now())),
        }).catch(() => {})
      );

      if (refreshes.length) await Promise.all(refreshes);

      // Link this meal's window regardless of meal age — the sync-triggered
      // auto-linker only covers meals from the last 4h, so backdated/older
      // meals would otherwise stay invisible to analytics/insights (which
      // pair meals ↔ readings via relatedMealId + context 'post-meal').
      await linkReadingsToMeal(userId, id, meal.eatenAt).catch(() => {});
    }

    const impact = await calculateMealGlucoseImpact(id, userId);
    return NextResponse.json({ impact });
  } catch (error) {
    console.error('Glucose impact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
