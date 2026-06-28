import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const SUMMARY_SELECT = {
  provider: true,
  date: true,
  steps: true,
  activeMinutes: true,
  exerciseMinutes: true,
  distanceMeters: true,
  sleepMinutes: true,
  restingHeartRate: true,
  averageHeartRate: true,
  activeCalories: true,
  importedAt: true,
} as const;

/**
 * GET /api/health/today?date=YYYY-MM-DD
 *
 * Returns HealthDailySummary records for the given date (defaults to today).
 * If that date has no data (common right after importing a historical Apple
 * Health export), it falls back to the most recent day that does — so the
 * dashboard always has something to show — and includes an `overview` aggregate
 * across all imported days.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    const date = dateParam ? new Date(dateParam) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    let summaries = await prisma.healthDailySummary.findMany({
      where: { userId, date: { gte: date, lt: nextDay } },
      orderBy: { importedAt: 'desc' },
      select: SUMMARY_SELECT,
    });

    // Fall back to the most recent day with data (e.g. a historical import that
    // doesn't include today).
    let isToday = true;
    let resolvedDate: Date | null = summaries.length > 0 ? date : null;
    if (summaries.length === 0) {
      const latest = await prisma.healthDailySummary.findFirst({
        where: { userId, date: { lte: nextDay } },
        orderBy: { date: 'desc' },
        select: { date: true },
      });
      if (latest) {
        const d = new Date(latest.date);
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        summaries = await prisma.healthDailySummary.findMany({
          where: { userId, date: { gte: d, lt: next } },
          orderBy: { importedAt: 'desc' },
          select: SUMMARY_SELECT,
        });
        isToday = false;
        resolvedDate = d;
      }
    }

    // Aggregate overview across all imported days (any provider).
    const [agg, daysWithSleep, range] = await Promise.all([
      prisma.healthDailySummary.aggregate({
        where: { userId, steps: { not: null } },
        _avg: { steps: true },
        _count: { _all: true },
      }),
      prisma.healthDailySummary.aggregate({
        where: { userId, sleepMinutes: { not: null } },
        _avg: { sleepMinutes: true },
      }),
      prisma.healthDailySummary.aggregate({
        where: { userId },
        _min: { date: true },
        _max: { date: true },
        _count: { _all: true },
      }),
    ]);

    const overview = (range._count._all ?? 0) > 0
      ? {
          totalDays: range._count._all,
          daysWithSteps: agg._count._all,
          avgSteps: agg._avg.steps != null ? Math.round(agg._avg.steps) : null,
          avgSleepMinutes: daysWithSleep._avg.sleepMinutes != null ? Math.round(daysWithSleep._avg.sleepMinutes) : null,
          firstDate: range._min.date,
          lastDate: range._max.date,
        }
      : null;

    return NextResponse.json({
      summaries,
      isToday,
      date: resolvedDate,
      overview,
    });
  } catch (error) {
    console.error('[health/today] GET error:', error);
    return NextResponse.json({ error: "Failed to load health data" }, { status: 500 });
  }
}
