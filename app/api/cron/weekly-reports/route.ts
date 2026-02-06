import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWeeklyReport } from '@/lib/email';

// This endpoint should be called by a cron service (e.g., Vercel Cron)
// Add authentication via CRON_SECRET environment variable for security
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users who have weekly reports enabled
    // and haven't received a report in the last 6 days
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

    const users = await prisma.user.findMany({
      where: {
        weeklyReportEnabled: true,
        OR: [
          { lastReportSent: null },
          { lastReportSent: { lt: sixDaysAgo } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        targetGlucoseMin: true,
        targetGlucoseMax: true,
      },
    });

    const results = {
      total: users.length,
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    // Process each user
    for (const user of users) {
      try {
        // Calculate date range (last 7 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        // Fetch meals and glucose from last week
        const [meals, glucoseReadings] = await Promise.all([
          prisma.meal.findMany({
            where: {
              userId: user.id,
              eatenAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          }),
          prisma.glucoseEntry.findMany({
            where: {
              userId: user.id,
              measuredAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          }),
        ]);

        // Skip if no data
        if (meals.length === 0 && glucoseReadings.length === 0) {
          results.skipped++;
          continue;
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
            improvements.push(
              `Excellent glucose control! ${timeInRange}% of readings in target range.`
            );
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
          concerns.push(
            `Only ${meals.length} meals logged this week. More frequent logging helps track patterns.`
          );
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

        if (result.success) {
          // Update last report sent timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { lastReportSent: new Date() },
          });
          results.sent++;
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error(`Failed to send report to user ${user.id}:`, error);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
