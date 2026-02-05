import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const ENABLE_AI = process.env.ENABLE_AI_CHAT === 'true';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Fetch data for analysis
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [glucoseEntries, meals, userData] = await Promise.all([
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
    ]);

    if (!ENABLE_AI || !process.env.ANTHROPIC_API_KEY) {
      // $0 Fallback insights
      return NextResponse.json({
        mode: '$0',
        insights: getFallbackInsights(glucoseEntries, meals),
      });
    }

    // Generate AI insights
    const aiInsights = await generateAIInsights(glucoseEntries, meals, userData);

    return NextResponse.json({
      mode: 'ai',
      insights: aiInsights,
    });
  } catch (error) {
    console.error('Analytics insights error:', error);
    return NextResponse.json({
      mode: '$0',
      insights: getFallbackInsights([], []),
      error: 'Failed to generate insights',
    });
  }
}

function getFallbackInsights(glucoseEntries: any[], meals: any[]) {
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

  return insights;
}

async function generateAIInsights(glucoseEntries: any[], meals: any[], userData: any) {
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

  const prompt = `You are Chatita, a warm and caring diabetes management assistant (like an abuela). Analyze this user's data and provide 3-5 actionable insights.

User Data (last ${dataSummary.glucoseReadings} days):
- ${dataSummary.glucoseReadings} glucose readings, average ${dataSummary.averageGlucose} mg/dL
- ${dataSummary.mealsTracked} meals tracked
- ${dataSummary.postMealReadings} post-meal readings
- Diabetes type: ${dataSummary.diabetesType}
- Target range: ${dataSummary.targetRange} mg/dL

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
      "message": "Warm, encouraging message from Chatita (1-2 sentences, use 'mi amor' occasionally)",
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
    model: 'claude-sonnet-4-20250514',
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
