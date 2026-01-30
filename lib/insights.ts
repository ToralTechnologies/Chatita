import { WeeklyInsights, InsightPattern } from '@/types';

export function calculateWeeklyInsights(
  glucoseEntries: any[],
  meals: any[],
  targetMin: number,
  targetMax: number
): WeeklyInsights {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Filter last 7 days
  const recentGlucose = glucoseEntries.filter(
    (entry) => new Date(entry.measuredAt) >= weekAgo
  );
  const recentMeals = meals.filter(
    (meal) => new Date(meal.eatenAt) >= weekAgo
  );

  // Calculate time in range
  const inRangeCount = recentGlucose.filter(
    (entry) => entry.value >= targetMin && entry.value <= targetMax
  ).length;
  const timeInRange = recentGlucose.length > 0
    ? Math.round((inRangeCount / recentGlucose.length) * 100)
    : 0;

  // Calculate average glucose
  const avgGlucose = recentGlucose.length > 0
    ? Math.round(
        recentGlucose.reduce((sum, entry) => sum + entry.value, 0) /
          recentGlucose.length
      )
    : 0;

  // Detect patterns
  const patterns: InsightPattern[] = [];

  // Pattern 1: Great lunch choices
  const lunchMeals = recentMeals.filter((meal) => meal.mealType === 'lunch');
  if (lunchMeals.length >= 3 && timeInRange >= 70) {
    patterns.push({
      type: 'positive',
      title: 'Great lunch choices! 🌟',
      description: `Your lunch choices helped you stay in range ${timeInRange}% of the time this week.`,
      icon: '🥗',
      relatedMealIds: lunchMeals.map((m) => m.id),
    });
  }

  // Pattern 2: Consistent tracking
  if (recentMeals.length >= 14) {
    patterns.push({
      type: 'positive',
      title: 'Consistent tracking! 👏',
      description: `You logged ${recentMeals.length} meals this week. This helps you understand your patterns better.`,
      icon: '📝',
    });
  }

  // Pattern 3: Evening glucose trends
  const eveningGlucose = recentGlucose.filter((entry) => {
    const hour = new Date(entry.measuredAt).getHours();
    return hour >= 18 && hour <= 22;
  });
  const eveningAvg = eveningGlucose.length > 0
    ? eveningGlucose.reduce((sum, e) => sum + e.value, 0) / eveningGlucose.length
    : 0;

  if (eveningAvg > targetMax + 20 && eveningGlucose.length >= 3) {
    patterns.push({
      type: 'tip',
      title: 'Evening glucose trends 📈',
      description: `Your glucose tends to be higher in the evenings (avg ${Math.round(eveningAvg)} mg/dL). Consider lighter dinners or an evening walk.`,
      icon: '🌙',
    });
  }

  // Pattern 4: High carb meals
  const highCarbMeals = recentMeals.filter((meal) => meal.carbs && meal.carbs > 60);
  if (highCarbMeals.length >= 2) {
    patterns.push({
      type: 'tip',
      title: 'Carb awareness 🍞',
      description: `You had ${highCarbMeals.length} high-carb meals this week. Try pairing carbs with protein and fiber to help stabilize blood sugar.`,
      icon: '💡',
    });
  }

  // Pattern 5: Few glucose readings
  if (recentGlucose.length < 7 && recentGlucose.length > 0) {
    patterns.push({
      type: 'tip',
      title: 'Track more often 📊',
      description: 'You only have a few glucose readings this week. More frequent tracking helps identify patterns better.',
      icon: '⏰',
    });
  }

  // Pattern 6: Excellent control
  if (timeInRange >= 85 && recentGlucose.length >= 10) {
    patterns.push({
      type: 'positive',
      title: 'Excellent glucose control! ⭐',
      description: `You stayed in range ${timeInRange}% of the time. This is outstanding, mi amor! Keep up the great work.`,
      icon: '🎉',
    });
  }

  return {
    dateRange: {
      start: weekAgo,
      end: now,
    },
    stats: {
      timeInRange,
      avgGlucose,
      mealsLogged: recentMeals.length,
    },
    patterns,
  };
}
