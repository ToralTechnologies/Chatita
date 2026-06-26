import { GuidanceInsightData, GuidanceType } from '@/types';
import { GLUCOSE, NUTRITION_GUIDANCE, GLP1_GUIDANCE, PROTEIN_SOURCES } from '@/lib/health/global-diabetes-rules';

export interface DailySnapshot {
  caloriesConsumed: number;
  carbsConsumed: number;
  proteinConsumed: number;
  fiberConsumed: number;
  addedSugarConsumed: number;
  sodiumConsumed: number;
  waterOzLogged: number;
  mealsLogged: number;
  lastGlucose?: number;
  weightKg?: number;
  dailyCalorieTarget?: number;
  dailyProteinTarget?: number;
  isGlp1User?: boolean;
  moodStressLevel?: number;
  havingCravings?: boolean;
  hour: number; // current hour of day (0-23)
}

export function generateDailyGuidance(snapshot: DailySnapshot): GuidanceInsightData[] {
  const insights: GuidanceInsightData[] = [];

  const proteinTarget = snapshot.dailyProteinTarget
    ?? (snapshot.weightKg ? snapshot.weightKg * NUTRITION_GUIDANCE.proteinGoalGPerKg : 50);

  // Low glucose safety — always first
  if (snapshot.lastGlucose !== undefined && snapshot.lastGlucose < GLUCOSE.LOW) {
    insights.push({
      type: 'low_glucose_safety',
      message: 'Your last glucose reading was low.',
      reason: `Reading of ${snapshot.lastGlucose} mg/dL is below 70 mg/dL. IDF/ADA guidance: take 15g fast-acting carbs, wait 15 minutes, recheck.`,
      suggestedActions: [
        '4 glucose tablets or glucose gel',
        '4 oz fruit juice or regular soda',
        '1 tablespoon of honey or sugar',
        'Contact your care team if symptoms are severe',
      ],
    });
  }

  // High glucose caution
  if (snapshot.lastGlucose !== undefined && snapshot.lastGlucose >= GLUCOSE.HIGH_CAUTION) {
    insights.push({
      type: 'high_glucose_safety',
      message: 'Your last glucose reading is higher than usual.',
      reason: `A reading at or above ${GLUCOSE.HIGH_CAUTION} mg/dL: IDF/ADA guidance recommends checking for ketones before exercise and avoiding vigorous activity if ketones are present.`,
      suggestedActions: ['Follow your care plan', 'Check ketones before exercise', 'Contact your care team if readings stay high'],
    });
  }

  // GLP-1 low intake
  if (snapshot.isGlp1User && snapshot.mealsLogged >= 1 && snapshot.proteinConsumed < proteinTarget * 0.4 && snapshot.hour >= 14) {
    insights.push({
      type: 'glp1_low_intake',
      message: GLP1_GUIDANCE.lowIntakeNote,
      reason: 'Protein and fluid intake can be low when appetite is reduced on a GLP-1/GIP medication. Try to prioritize protein and water even in small amounts.',
      suggestedActions: ['Small serving of eggs, tofu, or Greek yogurt', 'Sip water or broth', 'Try a protein shake if full meals feel like too much'],
    });
  }

  // Low water
  if (snapshot.waterOzLogged < NUTRITION_GUIDANCE.waterLowThresholdOz && snapshot.hour >= 12) {
    insights.push({
      type: 'low_water',
      message: `You've logged ${Math.round(snapshot.waterOzLogged)} oz of water today. Staying hydrated supports glucose stability and energy.`,
      reason: 'Hydration is especially important when managing diabetes and for anyone using GLP-1/GIP medications.',
      suggestedActions: ['Add 8 oz right now', 'Try herbal tea, sparkling water, or broth if plain water feels hard', 'Set a reminder for water after meals'],
    });
  }

  // Low protein
  if (snapshot.proteinConsumed < proteinTarget * 0.5 && snapshot.mealsLogged >= 2 && snapshot.hour >= 14) {
    const options = pickProteinOptions(3);
    insights.push({
      type: 'low_protein',
      message: `Protein looks a little low today (${Math.round(snapshot.proteinConsumed)}g logged so far).`,
      reason: 'Adequate protein supports muscle, satiety, and blood sugar stability — especially important when managing diabetes.',
      suggestedActions: options,
    });
  }

  // Low fiber
  if (snapshot.fiberConsumed < NUTRITION_GUIDANCE.fiberDailyGoalG * 0.4 && snapshot.mealsLogged >= 2 && snapshot.hour >= 12) {
    insights.push({
      type: 'low_fiber',
      message: `Fiber looks a little low today (${Math.round(snapshot.fiberConsumed)}g logged).`,
      reason: 'Fiber slows glucose absorption, supports digestion, and helps with fullness.',
      suggestedActions: [
        'Beans, lentils, or dal with your next meal',
        'Non-starchy vegetables — broccoli, spinach, peppers, nopales',
        'Berries, apple with skin, or pear',
        'Oats, chia seeds, or avocado',
      ],
    });
  }

  // High added sugar
  if (snapshot.addedSugarConsumed > 25 && snapshot.mealsLogged >= 1) {
    insights.push({
      type: 'high_added_sugar',
      message: 'Added sugar looks higher than usual today.',
      reason: 'WHO recommends keeping free sugars below 10% of daily energy intake (ideally closer to 5%) for overall health.',
      suggestedActions: [
        'Choose water, unsweetened tea, or sparkling water for your next drink',
        'Look for unsweetened versions of sauces, yogurt, or snacks',
      ],
    });
  }

  // High sodium
  if (snapshot.sodiumConsumed > NUTRITION_GUIDANCE.sodiumDailyLimitMg && snapshot.mealsLogged >= 2) {
    insights.push({
      type: 'high_sodium',
      message: 'Sodium is a little higher than the WHO daily reference today.',
      reason: `WHO recommends less than ${NUTRITION_GUIDANCE.sodiumDailyLimitMg}mg sodium per day for most adults to support heart and kidney health.`,
      suggestedActions: [
        'Choose lower-sodium options for your next meal',
        'Season with herbs, lime, or spices instead of added salt',
        'Drink extra water to support kidney function',
      ],
    });
  }

  // Mood + food pattern (stress + cravings)
  if (snapshot.moodStressLevel !== undefined && snapshot.moodStressLevel >= 7 && snapshot.havingCravings) {
    insights.push({
      type: 'mood_food_pattern',
      message: 'High stress and cravings often go together. That doesn\'t mean anything went wrong.',
      reason: 'Cortisol from stress can increase appetite and cravings — especially for high-carb or sweet foods. This is a body response, not a willpower issue.',
      suggestedActions: [
        'Greek yogurt + berries or fruit',
        'Apple or banana + nut butter',
        'Hummus + vegetables or crackers',
        'Cheese + whole-grain crackers',
        'Handful of nuts + water',
      ],
    });
  }

  return insights;
}

function pickProteinOptions(count: number): string[] {
  const shuffled = [...PROTEIN_SOURCES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(p => `${p.charAt(0).toUpperCase()}${p.slice(1)}`);
}
