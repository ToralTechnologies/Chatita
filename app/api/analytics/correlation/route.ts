import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch glucose entries with related meals
    const glucoseEntries = await prisma.glucoseEntry.findMany({
      where: {
        userId: session.user.id,
        measuredAt: { gte: startDate },
      },
      include: {
        relatedMeal: {
          include: {
            foodEntries: true,
          },
        },
      },
      orderBy: { measuredAt: 'desc' },
    });

    // Fetch all meals in the period for correlation
    const meals = await prisma.meal.findMany({
      where: {
        userId: session.user.id,
        eatenAt: { gte: startDate },
      },
      include: {
        foodEntries: true,
        relatedGlucoseReadings: true,
      },
      orderBy: { eatenAt: 'desc' },
    });

    // Calculate statistics
    const stats = calculateStats(glucoseEntries, meals);

    // Identify patterns
    const patterns = identifyPatterns(glucoseEntries, meals);

    // Calculate A1C estimate
    const a1cEstimate = estimateA1C(glucoseEntries);

    // Calculate chart data
    const chartData = calculateChartData(glucoseEntries, meals);

    return NextResponse.json({
      stats,
      patterns,
      a1cEstimate,
      chartData,
      glucoseEntries: glucoseEntries.length,
      mealsTracked: meals.length,
      periodDays: days,
    });
  } catch (error) {
    console.error('Analytics correlation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateStats(glucoseEntries: any[], meals: any[]) {
  if (glucoseEntries.length === 0) {
    return {
      averageGlucose: 0,
      minGlucose: 0,
      maxGlucose: 0,
      inRangePercent: 0,
      averageCarbs: 0,
      timeInRange: { low: 0, normal: 0, high: 0 },
    };
  }

  const values = glucoseEntries.map((e) => e.value);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;

  // Time in range (70-180 mg/dL standard)
  const low = values.filter((v) => v < 70).length;
  const normal = values.filter((v) => v >= 70 && v <= 180).length;
  const high = values.filter((v) => v > 180).length;

  // Average carbs from meals
  const mealsWithCarbs = meals.filter((m) => m.carbs);
  const avgCarbs = mealsWithCarbs.length > 0
    ? mealsWithCarbs.reduce((sum, m) => sum + (m.carbs || 0), 0) / mealsWithCarbs.length
    : 0;

  return {
    averageGlucose: Math.round(avg),
    minGlucose: Math.min(...values),
    maxGlucose: Math.max(...values),
    inRangePercent: Math.round((normal / values.length) * 100),
    averageCarbs: Math.round(avgCarbs),
    timeInRange: {
      low: Math.round((low / values.length) * 100),
      normal: Math.round((normal / values.length) * 100),
      high: Math.round((high / values.length) * 100),
    },
  };
}

function identifyPatterns(glucoseEntries: any[], meals: any[]) {
  const patterns: any[] = [];

  // Pattern 1: Post-meal spikes
  const postMealReadings = glucoseEntries.filter((e) => e.context === 'post-meal' && e.relatedMeal);

  if (postMealReadings.length >= 3) {
    const highSpikes = postMealReadings.filter((e) => e.value > 180);

    if (highSpikes.length > 0) {
      // Find common foods in spike meals
      const spikeFoods: Record<string, number> = {};

      highSpikes.forEach((spike) => {
        if (spike.relatedMeal?.foodEntries) {
          spike.relatedMeal.foodEntries.forEach((food: any) => {
            spikeFoods[food.foodName] = (spikeFoods[food.foodName] || 0) + 1;
          });
        }
      });

      const topSpikeFoods = Object.entries(spikeFoods)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([food]) => food);

      if (topSpikeFoods.length > 0) {
        patterns.push({
          type: 'spike',
          title: 'Post-Meal Spikes Detected',
          description: `Your blood sugar tends to spike after meals containing: ${topSpikeFoods.join(', ')}`,
          severity: 'warning',
          count: highSpikes.length,
          foods: topSpikeFoods,
        });
      }
    }
  }

  // Pattern 2: Fasting glucose trends
  const fastingReadings = glucoseEntries.filter((e) => e.context === 'fasting');

  if (fastingReadings.length >= 5) {
    const recentFasting = fastingReadings.slice(0, 3).map((e) => e.value);
    const avgRecent = recentFasting.reduce((a, b) => a + b, 0) / recentFasting.length;

    if (avgRecent > 130) {
      patterns.push({
        type: 'fasting-high',
        title: 'Elevated Fasting Glucose',
        description: `Your recent fasting glucose averages ${Math.round(avgRecent)} mg/dL. Consider discussing with your doctor.`,
        severity: 'warning',
        avgValue: Math.round(avgRecent),
      });
    } else if (avgRecent >= 70 && avgRecent <= 100) {
      patterns.push({
        type: 'fasting-good',
        title: 'Excellent Fasting Control',
        description: `Your fasting glucose is well-controlled at ${Math.round(avgRecent)} mg/dL. Keep it up!`,
        severity: 'success',
        avgValue: Math.round(avgRecent),
      });
    }
  }

  // Pattern 3: Low-carb meals correlation
  const lowCarbMeals = meals.filter((m) => m.carbs && m.carbs < 30 && m.relatedGlucoseReadings.length > 0);

  if (lowCarbMeals.length >= 3) {
    const postMealValues = lowCarbMeals
      .flatMap((m) => m.relatedGlucoseReadings.filter((g: any) => g.context === 'post-meal'))
      .map((g: any) => g.value);

    if (postMealValues.length >= 3) {
      const avgPostLowCarb = postMealValues.reduce((a, b) => a + b, 0) / postMealValues.length;
      const inRange = postMealValues.filter((v) => v >= 70 && v <= 180).length;

      if (inRange / postMealValues.length > 0.7) {
        patterns.push({
          type: 'lowcarb-success',
          title: 'Low-Carb Strategy Working',
          description: `Meals under 30g carbs keep your blood sugar in range ${Math.round((inRange / postMealValues.length) * 100)}% of the time.`,
          severity: 'success',
          avgValue: Math.round(avgPostLowCarb),
        });
      }
    }
  }

  // Pattern 4: Time-of-day patterns
  const byTimeOfDay: Record<string, number[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  glucoseEntries.forEach((e) => {
    const hour = new Date(e.measuredAt).getHours();
    if (hour >= 6 && hour < 12) byTimeOfDay.morning.push(e.value);
    else if (hour >= 12 && hour < 18) byTimeOfDay.afternoon.push(e.value);
    else byTimeOfDay.evening.push(e.value);
  });

  Object.entries(byTimeOfDay).forEach(([timeOfDay, values]) => {
    if (values.length >= 3) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const high = values.filter((v) => v > 180).length;

      if (high / values.length > 0.5) {
        patterns.push({
          type: 'timeofday-high',
          title: `Higher ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Readings`,
          description: `Your blood sugar tends to be higher in the ${timeOfDay} (avg ${Math.round(avg)} mg/dL).`,
          severity: 'info',
          timeOfDay,
          avgValue: Math.round(avg),
        });
      }
    }
  });

  return patterns;
}

function estimateA1C(glucoseEntries: any[]) {
  if (glucoseEntries.length < 10) {
    return {
      estimated: null,
      confidence: 'low',
      message: 'Need more glucose readings for accurate A1C estimation (at least 10)',
    };
  }

  // A1C estimation formula: (average glucose + 46.7) / 28.7
  const values = glucoseEntries.map((e) => e.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const estimatedA1C = (avg + 46.7) / 28.7;

  let category = 'normal';
  let message = '';

  if (estimatedA1C < 5.7) {
    category = 'normal';
    message = 'Your estimated A1C is in the normal range. Great job!';
  } else if (estimatedA1C >= 5.7 && estimatedA1C < 6.5) {
    category = 'prediabetes';
    message = 'Your estimated A1C suggests prediabetes range. Discuss with your doctor.';
  } else {
    category = 'diabetes';
    message = 'Your estimated A1C is in diabetes range. Please consult your healthcare provider.';
  }

  return {
    estimated: parseFloat(estimatedA1C.toFixed(1)),
    confidence: glucoseEntries.length >= 30 ? 'high' : 'medium',
    category,
    message,
    readingsUsed: glucoseEntries.length,
  };
}

function calculateChartData(glucoseEntries: any[], meals: any[]) {
  // 1. Trend data - glucose readings over time
  const trendData = glucoseEntries.map((entry) => ({
    measuredAt: entry.measuredAt,
    value: entry.value,
    context: entry.context,
  }));

  // 2. Meal type comparison - average glucose by meal type
  const mealTypeMap: Record<string, { total: number; count: number }> = {};

  meals.forEach((meal) => {
    if (!meal.mealType) return;
    const mealType = meal.mealType.toLowerCase();

    // Find related glucose readings (within 2 hours after meal)
    const mealTime = new Date(meal.eatenAt).getTime();
    const relatedReadings = glucoseEntries.filter((entry) => {
      const readingTime = new Date(entry.measuredAt).getTime();
      const diff = readingTime - mealTime;
      return diff > 0 && diff <= 2 * 60 * 60 * 1000; // 2 hours
    });

    if (relatedReadings.length > 0) {
      if (!mealTypeMap[mealType]) {
        mealTypeMap[mealType] = { total: 0, count: 0 };
      }
      relatedReadings.forEach((reading) => {
        mealTypeMap[mealType].total += reading.value;
        mealTypeMap[mealType].count += 1;
      });
    }
  });

  const mealComparison = Object.entries(mealTypeMap).map(([mealType, data]) => ({
    mealType,
    averageGlucose: data.total / data.count,
    count: data.count,
  }));

  // 3. Daily pattern - average glucose by hour of day
  const hourlyMap: Record<number, { total: number; count: number }> = {};

  glucoseEntries.forEach((entry) => {
    const hour = new Date(entry.measuredAt).getHours();
    if (!hourlyMap[hour]) {
      hourlyMap[hour] = { total: 0, count: 0 };
    }
    hourlyMap[hour].total += entry.value;
    hourlyMap[hour].count += 1;
  });

  const dailyPattern = Object.entries(hourlyMap).map(([hour, data]) => ({
    hour: parseInt(hour),
    average: data.total / data.count,
    count: data.count,
  }));

  return {
    trendData,
    mealComparison,
    dailyPattern,
  };
}
