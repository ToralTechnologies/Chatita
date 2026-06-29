import { prisma } from '@/lib/prisma';

export interface GlucoseImpactResult {
  available: boolean;
  preMealGlucose: number | null;
  peakPostMeal: number | null;
  glucoseRise: number | null;
  timeToSpike: number | null;
  impact: 'minimal' | 'moderate' | 'significant' | 'high' | 'unknown';
  readings: Array<{
    value: number;
    measuredAt: Date;
    minutesFromMeal: number;
  }>;
  windowComplete: boolean;
  minutesUntilComplete: number | null;
}

export async function calculateMealGlucoseImpact(
  mealId: string,
  userId: string
): Promise<GlucoseImpactResult> {
  const meal = await prisma.meal.findFirst({
    where: { id: mealId, userId },
    select: { eatenAt: true },
  });

  if (!meal) {
    return emptyResult();
  }

  const mealTime = meal.eatenAt.getTime();
  const windowStart = new Date(mealTime - 30 * 60 * 1000); // 30min before
  const windowEnd = new Date(mealTime + 3 * 60 * 60 * 1000); // 3hr after

  const readings = await prisma.glucoseEntry.findMany({
    where: {
      userId,
      measuredAt: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
    orderBy: { measuredAt: 'asc' },
  });

  if (readings.length === 0) {
    return emptyResult();
  }

  const readingsWithMinutes = readings.map((r) => ({
    value: r.value,
    measuredAt: r.measuredAt,
    minutesFromMeal: Math.round((r.measuredAt.getTime() - mealTime) / 60000),
  }));

  // Pre-meal: closest reading in -30 to 0 minute window
  const preReadings = readingsWithMinutes.filter(
    (r) => r.minutesFromMeal >= -30 && r.minutesFromMeal <= 0
  );
  const preMealGlucose =
    preReadings.length > 0
      ? preReadings[preReadings.length - 1].value
      : null;

  // Post-meal peak: max reading in 30min-2hr window
  const postReadings = readingsWithMinutes.filter(
    (r) => r.minutesFromMeal >= 30 && r.minutesFromMeal <= 120
  );
  const peakReading =
    postReadings.length > 0
      ? postReadings.reduce((max, r) => (r.value > max.value ? r : max), postReadings[0])
      : null;

  const peakPostMeal = peakReading?.value ?? null;
  const timeToSpike = peakReading?.minutesFromMeal ?? null;
  const glucoseRise =
    preMealGlucose !== null && peakPostMeal !== null
      ? peakPostMeal - preMealGlucose
      : null;

  // Classify impact
  let impact: GlucoseImpactResult['impact'] = 'unknown';
  if (glucoseRise !== null) {
    if (glucoseRise < 30) impact = 'minimal';
    else if (glucoseRise < 60) impact = 'moderate';
    else if (glucoseRise < 100) impact = 'significant';
    else impact = 'high';
  }

  const windowComplete = Date.now() > windowEnd.getTime();
  const minutesUntilComplete = windowComplete
    ? null
    : Math.round((windowEnd.getTime() - Date.now()) / 60000);

  return {
    available: true,
    preMealGlucose,
    peakPostMeal,
    glucoseRise,
    timeToSpike,
    impact,
    readings: readingsWithMinutes,
    windowComplete,
    minutesUntilComplete,
  };
}

export interface CompactGlucoseImpact {
  available: boolean;
  preMealGlucose: number | null;
  peakPostMeal: number | null;
  glucoseRise: number | null;
  timeToSpike: number | null;
  impact: GlucoseImpactResult['impact'];
}

/**
 * Compute a compact glucose impact for one meal from an already-fetched,
 * time-ascending list of readings. Used to attach impact to many meals in the
 * meal-history list with a single batched glucose query (no per-meal queries).
 */
export function computeCompactImpact(
  mealTimeMs: number,
  readings: { value: number; measuredAt: Date }[]
): CompactGlucoseImpact {
  const withMin = readings
    .map((r) => ({
      value: r.value,
      minutesFromMeal: Math.round((r.measuredAt.getTime() - mealTimeMs) / 60000),
    }))
    .filter((r) => r.minutesFromMeal >= -30 && r.minutesFromMeal <= 180);

  if (withMin.length === 0) {
    return { available: false, preMealGlucose: null, peakPostMeal: null, glucoseRise: null, timeToSpike: null, impact: 'unknown' };
  }

  const pre = withMin.filter((r) => r.minutesFromMeal >= -30 && r.minutesFromMeal <= 0);
  const preMealGlucose = pre.length > 0 ? pre[pre.length - 1].value : null;

  const post = withMin.filter((r) => r.minutesFromMeal >= 30 && r.minutesFromMeal <= 120);
  const peak = post.length > 0 ? post.reduce((m, r) => (r.value > m.value ? r : m), post[0]) : null;

  const peakPostMeal = peak?.value ?? null;
  const timeToSpike = peak?.minutesFromMeal ?? null;
  const glucoseRise = preMealGlucose !== null && peakPostMeal !== null ? peakPostMeal - preMealGlucose : null;

  let impact: GlucoseImpactResult['impact'] = 'unknown';
  if (glucoseRise !== null) {
    impact = glucoseRise < 30 ? 'minimal' : glucoseRise < 60 ? 'moderate' : glucoseRise < 100 ? 'significant' : 'high';
  }

  return { available: peakPostMeal !== null, preMealGlucose, peakPostMeal, glucoseRise, timeToSpike, impact };
}

function emptyResult(): GlucoseImpactResult {
  return {
    available: false,
    preMealGlucose: null,
    peakPostMeal: null,
    glucoseRise: null,
    timeToSpike: null,
    impact: 'unknown',
    readings: [],
    windowComplete: false,
    minutesUntilComplete: null,
  };
}
