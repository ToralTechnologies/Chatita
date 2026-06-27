import { WeeklyInsights, InsightPattern } from '@/types';

export function calculateWeeklyInsights(
  glucoseEntries: any[],
  meals: any[],
  targetMin: number,
  targetMax: number,
  healthSummaries?: Array<{
    date: Date;
    steps?: number | null;
    activeMinutes?: number | null;
    sleepMinutes?: number | null;
    provider?: string;
  }>
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
      description: `You stayed in range ${timeInRange}% of the time. This is outstanding! Keep up the great work.`,
      icon: '🎉',
    });
  }

  // ── Connected health data patterns ────────────────────────────────────────
  if (healthSummaries && healthSummaries.length > 0) {
    const daysWithSteps = healthSummaries.filter(s => s.steps != null && s.steps > 0);
    const daysWithSleep = healthSummaries.filter(s => s.sleepMinutes != null && s.sleepMinutes > 0);

    if (daysWithSteps.length >= 3) {
      const avgSteps = Math.round(
        daysWithSteps.reduce((sum, s) => sum + (s.steps ?? 0), 0) / daysWithSteps.length
      );

      // Steps + glucose correlation (cautious language)
      if (recentGlucose.length >= 5) {
        const glucoseByDate: Record<string, number[]> = {};
        recentGlucose.forEach((e) => {
          const d = new Date(e.measuredAt).toDateString();
          glucoseByDate[d] = [...(glucoseByDate[d] || []), e.value];
        });

        const activeDays = daysWithSteps.filter(s => (s.steps ?? 0) >= 5000);
        const activeDayKeys = new Set(activeDays.map(s => new Date(s.date).toDateString()));
        const activeGlucose: number[] = [];
        const lessActiveDayGlucose: number[] = [];

        Object.entries(glucoseByDate).forEach(([d, vals]) => {
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          if (activeDayKeys.has(d)) activeGlucose.push(avg);
          else lessActiveDayGlucose.push(avg);
        });

        if (activeGlucose.length >= 2 && lessActiveDayGlucose.length >= 2) {
          const activeAvg = Math.round(activeGlucose.reduce((a, b) => a + b, 0) / activeGlucose.length);
          const lessActiveAvg = Math.round(lessActiveDayGlucose.reduce((a, b) => a + b, 0) / lessActiveDayGlucose.length);
          const diff = lessActiveAvg - activeAvg;

          if (diff >= 10) {
            patterns.push({
              type: 'tip',
              title: 'Movement & glucose — a pattern worth noting',
              description: `On days with 5,000+ steps your average glucose was around ${activeAvg} mg/dL, compared to ${lessActiveAvg} mg/dL on less active days. This could be a pattern worth tracking — movement may help, but many factors affect glucose.`,
              icon: '🚶',
            });
          }
        }

        patterns.push({
          type: 'positive',
          title: `Avg ${avgSteps.toLocaleString()} steps/day this week`,
          description: `Connected data shows you averaged ${avgSteps.toLocaleString()} steps on the days your device was worn. Movement is just one piece of the picture — keep doing what feels right for your body.`,
          icon: '👟',
        });
      } else {
        patterns.push({
          type: 'positive',
          title: `Avg ${avgSteps.toLocaleString()} steps/day`,
          description: `Your wearable logged an average of ${avgSteps.toLocaleString()} steps per day this week. All movement counts — walks, chores, dancing, everything.`,
          icon: '👟',
        });
      }
    }

    if (daysWithSleep.length >= 3) {
      const avgSleepMin = Math.round(
        daysWithSleep.reduce((sum, s) => sum + (s.sleepMinutes ?? 0), 0) / daysWithSleep.length
      );
      const avgSleepH = Math.floor(avgSleepMin / 60);
      const avgSleepM = avgSleepMin % 60;

      if (avgSleepMin < 360) {
        patterns.push({
          type: 'tip',
          title: 'Sleep looks a bit low this week',
          description: `Connected data suggests an average of ${avgSleepH}h ${avgSleepM}m of sleep. Sleep can affect appetite, cravings, and glucose patterns — but many things affect sleep too. This may be worth discussing with your care team.`,
          icon: '😴',
        });
      } else {
        patterns.push({
          type: 'positive',
          title: `Averaging ${avgSleepH}h ${avgSleepM}m of sleep`,
          description: `Your sleep data looks consistent this week. Good sleep supports glucose stability, energy, and mood — so this is a positive pattern worth keeping.`,
          icon: '🌙',
        });
      }
    }
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
