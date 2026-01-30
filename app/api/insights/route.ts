import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateWeeklyInsights } from '@/lib/insights';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's target range
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { targetGlucoseMin: true, targetGlucoseMax: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get last 7 days of data
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [glucoseEntries, meals] = await Promise.all([
      prisma.glucoseEntry.findMany({
        where: {
          userId: session.user.id,
          measuredAt: { gte: weekAgo },
        },
        orderBy: { measuredAt: 'desc' },
      }),
      prisma.meal.findMany({
        where: {
          userId: session.user.id,
          eatenAt: { gte: weekAgo },
        },
        orderBy: { eatenAt: 'desc' },
      }),
    ]);

    const insights = calculateWeeklyInsights(
      glucoseEntries,
      meals,
      user.targetGlucoseMin,
      user.targetGlucoseMax
    );

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Insights error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
