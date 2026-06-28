import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const ENABLE_AI = process.env.ENABLE_AI_CHAT === 'true';

// In-memory cache of generated AI insights. Generating insights requires a
// Claude call (~1-3s), and the insights page previously blocked on it for every
// load/refresh. AI insights only change as new data is logged, so a short TTL
// makes repeat loads instant without a schema/DB change. (Per-instance; a
// shared store like Redis/DB is the production follow-up.)
const INSIGHTS_TTL_MS = 30 * 60 * 1000;
const insightsCache = new Map<string, { expires: number; payload: any }>();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const refresh = searchParams.get('refresh') === '1';

    const cacheKey = `${session.user.id}:${days}`;
    if (!refresh) {
      const cached = insightsCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return NextResponse.json({ ...cached.payload, cached: true });
      }
    }

    // Fetch data for analysis
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [glucoseEntries, meals, userData, healthSummaries] = await Promise.all([
      prisma.glucoseEntry.findMany({
        where: {
          userId: session.user.id,
          measuredAt: { gte: startDate },
        },
        include: {
          relatedMeal: {
            include: { foodEntries: true },
          },
        },
        orderBy: { measuredAt: 'desc' },
        take: 100,
      }),
      prisma.meal.findMany({
        where: {
          userId: session.user.id,
          eatenAt: { gte: startDate },
        },
        include: {
          foodEntries: true,
          relatedGlucoseReadings: true,
        },
        orderBy: { eatenAt: 'desc' },
        take: 50,
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          diabetesType: true,
          targetGlucoseMin: true,
          targetGlucoseMax: true,
        },
      }),
      prisma.healthDailySummary.findMany({
        where: { userId: session.user.id, date: { gte: startDate } },
        orderBy: { date: 'desc' },
        select: {
          date: true,
          steps: true,
          activeMinutes: true,
          exerciseMinutes: true,
          sleepMinutes: true,
          restingHeartRate: true,
          provider: true,
        },
        take: 60,
      }),
    ]);

    if (!ENABLE_AI || !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        mode: '$0',
        insights: getFallbackInsights(glucoseEntries, meals, healthSummaries),
      });
    }

    const aiInsights = await generateAIInsights(glucoseEntries, meals, userData, healthSummaries);

    const payload = { mode: 'ai', insights: aiInsights };
    insightsCache.set(cacheKey, { expires: Date.now() + INSIGHTS_TTL_MS, payload });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Analytics insights error:', error);
    return NextResponse.json({
      mode: '$0',
      insights: getFallbackInsights([], []),
      error: 'Failed to generate insights',
    });
  }
}

function getFallbackInsights(glucoseEntries: any[], meals: any[], healthSummaries?: any[]) {
  const insights = [];

  if (glucoseEntries.length < 5) {
    insights.push({
      type: 'info',
      title: 'Track More Data',
      message: 'Keep logging your meals and glucose readings to unlock personalized insights!',
      action: 'Log more readings',
    });
  }

  if (meals.length >= 5) {
    const withFoodEntries = meals.filter((m) => m.foodEntries && m.foodEntries.length > 0);
    if (withFoodEntries.length >= 3) {
      insights.push({
        type: 'success',
        title: 'Great Food Tracking!',
        message: `You've logged detailed nutrition for ${withFoodEntries.length} meals. This helps identify patterns.`,
      });
    }
  }

  const postMealReadings = glucoseEntries.filter(
    (e) => e.context === 'post-meal' && e.relatedMeal
  );

  if (postMealReadings.length >= 3) {
    insights.push({
      type: 'success',
      title: 'Meal-Glucose Tracking',
      message: `You've linked ${postMealReadings.length} glucose readings to meals. Keep it up to see which foods work best for you!`,
    });
  }

  insights.push({
    type: 'tip',
    title: 'Diabetes Management Tip',
    message: 'Pairing carbs with protein and healthy fats can help slow glucose absorption and reduce spikes.',
  });

  // Connected health data fallback insights
  if (healthSummaries && healthSummaries.length > 0) {
    const daysWithSteps = healthSummaries.filter((s: any) => s.steps != null && s.steps > 0);
    if (daysWithSteps.length >= 3) {
      const avgSteps = Math.round(
        daysWithSteps.reduce((sum: number, s: any) => sum + (s.steps ?? 0), 0) / daysWithSteps.length
      );
      insights.push({
        type: 'info',
        title: 'Connected Activity Data',
        message: `Your wearable shows an average of ${avgSteps.toLocaleString()} steps per day. Movement is one of many factors that may support glucose patterns — all movement counts.`,
      });
    }

    const daysWithSleep = healthSummaries.filter((s: any) => s.sleepMinutes != null && s.sleepMinutes > 0);
    if (daysWithSleep.length >= 3) {
      const avgSleepMin = Math.round(
        daysWithSleep.reduce((sum: number, s: any) => sum + (s.sleepMinutes ?? 0), 0) / daysWithSleep.length
      );
      const h = Math.floor(avgSleepMin / 60);
      const m = avgSleepMin % 60;
      insights.push({
        type: avgSleepMin < 360 ? 'tip' : 'success',
        title: avgSleepMin < 360 ? 'Sleep looks lower than usual' : `Averaging ${h}h ${m}m of sleep`,
        message: avgSleepMin < 360
          ? `Connected data suggests about ${h}h ${m}m of sleep on average. Sleep may affect appetite, cravings, and glucose patterns — something worth discussing with your care team.`
          : `Consistent sleep is a pattern worth keeping. Sleep quality and duration can be related to glucose stability, appetite, and energy levels.`,
      });
    }
  }

  return insights;
}

async function generateAIInsights(glucoseEntries: any[], meals: any[], userData: any, healthSummaries?: any[]) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Prepare data summary for AI
  const dataSummary = {
    glucoseReadings: glucoseEntries.length,
    averageGlucose:
      glucoseEntries.length > 0
        ? Math.round(
            glucoseEntries.reduce((sum, e) => sum + e.value, 0) / glucoseEntries.length
          )
        : 0,
    mealsTracked: meals.length,
    postMealReadings: glucoseEntries.filter((e) => e.context === 'post-meal').length,
    diabetesType: userData?.diabetesType || 'unknown',
    targetRange: `${userData?.targetGlucoseMin || 70}-${userData?.targetGlucoseMax || 180}`,
  };

  // Identify patterns
  const patterns = [];

  // Food-glucose correlations
  const postMealWithFood = glucoseEntries.filter(
    (e) => e.context === 'post-meal' && e.relatedMeal?.foodEntries?.length > 0
  );

  if (postMealWithFood.length >= 3) {
    const spikes = postMealWithFood.filter((e) => e.value > (userData?.targetGlucoseMax || 180));
    if (spikes.length > 0) {
      const spikeFoods: Record<string, number> = {};
      spikes.forEach((spike) => {
        spike.relatedMeal.foodEntries.forEach((food: any) => {
          spikeFoods[food.foodName] = (spikeFoods[food.foodName] || 0) + 1;
        });
      });
      const topSpikeFoods = Object.entries(spikeFoods)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      patterns.push(`Foods associated with spikes: ${topSpikeFoods.map(([food, count]) => `${food} (${count}x)`).join(', ')}`);
    }
  }

  // Recent meals summary
  const recentMeals = meals.slice(0, 5).map((m) => ({
    type: m.mealType,
    carbs: m.carbs || 'unknown',
    foods: m.foodEntries?.map((f: any) => f.foodName).join(', ') || m.detectedFoods || 'not specified',
  }));

  // Build connected health summary for AI
  let healthSummaryText = 'No connected wearable data available.';
  if (healthSummaries && healthSummaries.length > 0) {
    const daysWithSteps = healthSummaries.filter((s: any) => s.steps != null && s.steps > 0);
    const daysWithSleep = healthSummaries.filter((s: any) => s.sleepMinutes != null && s.sleepMinutes > 0);
    const provider = healthSummaries[0]?.provider === 'google_health' ? 'Google Health / Fitbit' : 'Apple Health';
    const lines: string[] = [`Source: ${provider} (${healthSummaries.length} days of data)`];
    if (daysWithSteps.length > 0) {
      const avg = Math.round(daysWithSteps.reduce((s: number, d: any) => s + (d.steps ?? 0), 0) / daysWithSteps.length);
      lines.push(`Average steps: ${avg.toLocaleString()}/day (${daysWithSteps.length} days with data)`);
    }
    if (daysWithSleep.length > 0) {
      const avgMin = Math.round(daysWithSleep.reduce((s: number, d: any) => s + (d.sleepMinutes ?? 0), 0) / daysWithSleep.length);
      lines.push(`Average sleep: ${Math.floor(avgMin / 60)}h ${avgMin % 60}m/night (${daysWithSleep.length} days with data)`);
    }
    const activeMinDays = healthSummaries.filter((s: any) => s.activeMinutes != null && s.activeMinutes > 0);
    if (activeMinDays.length > 0) {
      const avgActive = Math.round(activeMinDays.reduce((s: number, d: any) => s + (d.activeMinutes ?? 0), 0) / activeMinDays.length);
      lines.push(`Average active minutes: ${avgActive}/day`);
    }
    healthSummaryText = lines.join('\n');
  }

  const prompt = `You are Chatita, a warm and caring diabetes management assistant (like an abuela). Analyze this user's data and provide 3-5 actionable insights. Use inclusive, gender-neutral language — do not use mijo, mija, mi amor, querido, querida, sweetheart, or any gendered terms of endearment.

IMPORTANT: When discussing connected health data (steps, sleep, activity), use cautious language — "may affect," "could be related," "a pattern worth tracking." Do NOT say wearable data proves anything or that steps/sleep caused glucose changes. Wearable data may be incomplete.

User Data (last ${dataSummary.glucoseReadings} days):
- ${dataSummary.glucoseReadings} glucose readings, average ${dataSummary.averageGlucose} mg/dL
- ${dataSummary.mealsTracked} meals tracked
- ${dataSummary.postMealReadings} post-meal readings
- Diabetes type: ${dataSummary.diabetesType}
- Target range: ${dataSummary.targetRange} mg/dL

Connected Wearable/Health Data:
${healthSummaryText}

Identified Patterns:
${patterns.length > 0 ? patterns.join('\n') : 'No significant patterns yet'}

Recent Meals:
${recentMeals.map((m, i) => `${i + 1}. ${m.type}: ${m.foods} (${m.carbs}g carbs)`).join('\n')}

Provide insights in JSON format:
{
  "insights": [
    {
      "type": "warning|success|tip|info",
      "title": "Short title (max 40 chars)",
      "message": "Warm, encouraging message from Chatita (1-2 sentences, supportive grandmotherly tone)",
      "action": "Optional action button text"
    }
  ]
}

Focus on:
1. Foods causing spikes (if any)
2. Meal timing patterns
3. Carb intake trends
4. Positive reinforcement for good behaviors
5. Gentle suggestions for improvement

Be warm, supportive, and specific. Use the data to give personalized advice.`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response format');
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse AI response');
  }

  const aiResponse = JSON.parse(jsonMatch[0]);
  return aiResponse.insights || [];
}
