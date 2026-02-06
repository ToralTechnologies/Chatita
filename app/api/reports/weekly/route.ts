import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendWeeklyReport } from '@/lib/email';

// POST - Send weekly report manually (for testing or on-demand)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.weeklyReportEnabled) {
      return NextResponse.json({ error: 'Weekly reports are disabled' }, { status: 400 });
    }

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Fetch meals and glucose from last week
    const [meals, glucoseReadings] = await Promise.all([
      prisma.meal.findMany({
        where: {
          userId: session.user.id,
          eatenAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { eatenAt: 'desc' },
      }),
      prisma.glucoseEntry.findMany({
        where: {
          userId: session.user.id,
          measuredAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    if (meals.length === 0 && glucoseReadings.length === 0) {
      return NextResponse.json(
        { error: 'No data available for this period' },
        { status: 400 }
      );
    }

    // Calculate glucose stats
    const avgGlucose =
      glucoseReadings.length > 0
        ? glucoseReadings.reduce((sum, g) => sum + g.value, 0) / glucoseReadings.length
        : 0;

    const inRangeCount = glucoseReadings.filter(
      (g) => g.value >= user.targetGlucoseMin && g.value <= user.targetGlucoseMax
    ).length;

    const timeInRange =
      glucoseReadings.length > 0
        ? Math.round((inRangeCount / glucoseReadings.length) * 100)
        : 0;

    // Get top meals
    const mealCounts: Record<string, number> = {};
    meals.forEach((meal) => {
      const name = meal.aiSummary || 'Unknown meal';
      mealCounts[name] = (mealCounts[name] || 0) + 1;
    });

    const topMeals = Object.entries(mealCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Generate insights
    const improvements: string[] = [];
    const concerns: string[] = [];

    if (glucoseReadings.length > 0) {
      if (timeInRange >= 70) {
        improvements.push(`Excellent glucose control! ${timeInRange}% of readings in target range.`);
      } else if (timeInRange >= 50) {
        improvements.push(`Good progress with ${timeInRange}% time in range.`);
      } else {
        concerns.push(`Only ${timeInRange}% time in range. Consider reviewing meal choices.`);
      }

      if (avgGlucose < user.targetGlucoseMax) {
        improvements.push('Average glucose levels are well-controlled.');
      }
    }

    if (meals.length < 14) {
      concerns.push(`Only ${meals.length} meals logged this week. More frequent logging helps track patterns.`);
    } else {
      improvements.push('Great job staying consistent with meal logging!');
    }

    // Send email
    const result = await sendWeeklyReport(user.email, {
      userName: user.name || 'there',
      weekStart: startDate.toLocaleDateString(),
      weekEnd: endDate.toLocaleDateString(),
      totalMeals: meals.length,
      avgGlucoseBefore: Math.round(avgGlucose),
      avgGlucoseAfter: Math.round(avgGlucose),
      timeInRange,
      topMeals,
      improvements,
      concerns,
    });

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // Update last report sent timestamp
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastReportSent: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Weekly report sent successfully',
    });
  } catch (error) {
    console.error('Send weekly report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Check if report can be sent
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        weeklyReportEnabled: true,
        lastReportSent: true,
      },
    });

    return NextResponse.json({
      enabled: user?.weeklyReportEnabled || false,
      lastSent: user?.lastReportSent || null,
    });
  } catch (error) {
    console.error('Check report status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
