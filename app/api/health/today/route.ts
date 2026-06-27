import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/health/today?date=YYYY-MM-DD
 *
 * Returns HealthDailySummary records for the given date (defaults to today).
 * Returns summaries from all connected providers so the client can pick the most relevant.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    const date = dateParam ? new Date(dateParam) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const summaries = await prisma.healthDailySummary.findMany({
      where: {
        userId: session.user.id,
        date: { gte: date, lt: nextDay },
      },
      orderBy: { importedAt: 'desc' },
      select: {
        provider: true,
        steps: true,
        activeMinutes: true,
        exerciseMinutes: true,
        distanceMeters: true,
        sleepMinutes: true,
        restingHeartRate: true,
        averageHeartRate: true,
        activeCalories: true,
        importedAt: true,
      },
    });

    return NextResponse.json({ summaries });
  } catch (error) {
    console.error('[health/today] GET error:', error);
    return NextResponse.json({ error: 'Failed to load today\'s health data' }, { status: 500 });
  }
}
