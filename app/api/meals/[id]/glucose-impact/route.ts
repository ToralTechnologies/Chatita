import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateMealGlucoseImpact } from '@/lib/glucose-impact';
import { syncLibreReadings } from '@/lib/libre-sync';
import { syncDexcomReadings } from '@/lib/dexcom-sync';

// Impact window is 3h after the meal; keep pulling fresh CGM data until a bit
// past that so a just-eaten meal's post-meal readings actually show up. The
// daily cron alone can't catch a meal logged minutes ago.
const IMPACT_WINDOW_MS = (3 * 60 + 15) * 60 * 1000;

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

    // For a recent meal, refresh LibreLinkUp first so the post-meal readings are
    // in the DB before we compute. Best-effort + self-throttled (won't re-hit
    // upstream more than once every few minutes) so polling stays cheap.
    const meal = await prisma.meal.findFirst({
      where: { id, userId },
      select: { eatenAt: true },
    });
    if (meal) {
      const ageMs = Date.now() - meal.eatenAt.getTime();
      if (ageMs >= 0 && ageMs <= IMPACT_WINDOW_MS) {
        // Whichever CGM is connected refreshes; the other is a cheap no-op.
        // Both self-throttle so polling won't hammer upstream.
        await Promise.all([
          syncLibreReadings(userId, { minIntervalMs: 3 * 60 * 1000 }).catch(() => {}),
          syncDexcomReadings(userId, { minIntervalMs: 3 * 60 * 1000 }).catch(() => {}),
        ]);
      }
    }

    const impact = await calculateMealGlucoseImpact(id, userId);
    return NextResponse.json({ impact });
  } catch (error) {
    console.error('Glucose impact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
