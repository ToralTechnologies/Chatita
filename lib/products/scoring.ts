/**
 * ProductFitScoring — deterministic, supportive guidance for a product.
 *
 * Hard rules:
 *  - No medical claims. No "good/bad food" labels.
 *  - Only supportive fit labels.
 *  - Honest about missing data ("check the label").
 *  - Never claims a product is safe for all people with diabetes.
 */

import type { ProductCandidate, FitLabel } from './types';

export interface ScoreContext {
  targetCarb?: number | null;      // user's per-meal carb comfort, optional
  glp1?: boolean;                  // prefers smaller portions
  lowEffort?: boolean;             // ADHD / low-energy preference
}

export interface ScoreResult {
  fitLabel: FitLabel;
  diabetesNote: string;
  adhdNote: string;
  quickUseIdeas: string[];
  tags: string[];
}

const READY_TO_EAT = /(yogurt|cheese|nuts|jerky|hummus|tuna|shake|bar|fruit|berries|egg|salad kit|rotisserie|deli|guacamole|cottage)/i;
const MULTI_MEAL = /(chicken|rice|beans|tortilla|eggs|salmon|ground|frozen|broth|greens|oats|lentil)/i;

function hasNutrition(p: ProductCandidate): boolean {
  return p.totalCarbs != null || p.protein != null || p.fiber != null || p.calories != null;
}

export function scoreProductForChatita(p: ProductCandidate, ctx: ScoreContext = {}): ScoreResult {
  const carbs = p.totalCarbs ?? null;
  const fiber = p.fiber ?? null;
  const added = p.addedSugar ?? null;
  const protein = p.protein ?? null;
  const sodium = p.sodium ?? null;
  const satFat = p.saturatedFat ?? null;

  const tags: string[] = [];
  const text = `${p.name} ${p.category ?? ''}`;
  const readyToEat = READY_TO_EAT.test(text);
  const multiMeal = MULTI_MEAL.test(text);
  if (readyToEat) tags.push('ready_to_eat', 'low_effort');
  if (multiMeal) tags.push('multi_meal');
  if (protein != null && protein >= 10) tags.push('protein_rich');
  if (fiber != null && fiber >= 3) tags.push('fiber');

  // ── Fit label (deterministic) ──
  let fitLabel: FitLabel;
  if (!hasNutrition(p)) {
    fitLabel = 'check_label';
  } else if ((added != null && added >= 15) || (carbs != null && carbs >= 45 && (fiber == null || fiber < 3))) {
    fitLabel = 'use_with_caution';
  } else if (protein != null && protein >= 10 && (carbs == null || carbs <= 20) && (added == null || added <= 5)) {
    fitLabel = 'great_fit';
  } else {
    fitLabel = 'good_with_portion';
  }

  // ── Diabetes note (supportive, never a medical claim) ──
  let diabetesNote: string;
  if (fitLabel === 'check_label') {
    diabetesNote = "I couldn't read the full nutrition. Check the package for serving size, total carbs, added sugar, fiber, protein, and sodium.";
  } else if (fitLabel === 'use_with_caution') {
    const why = added != null && added >= 15 ? 'higher added sugar' : 'higher carbs with little fiber';
    diabetesNote = `This has ${why}, so a smaller portion or pairing it with protein and fiber can help. Check the serving size.`;
  } else if (fitLabel === 'great_fit') {
    diabetesNote = 'Protein-forward with moderate carbs — a steady option. Still worth a glance at the serving size.';
  } else {
    diabetesNote = 'This could work with portion guidance. Check the serving size and total carbs, especially if you are pairing it with another carb.';
  }
  if (sodium != null && sodium >= 600) diabetesNote += ' Sodium runs a bit high here.';
  if (ctx.glp1 && (carbs != null && carbs > 25)) diabetesNote += ' A smaller portion may sit easier.';

  // ── ADHD / low-effort note ──
  let adhdNote: string;
  if (readyToEat) {
    adhdNote = 'No cooking needed — grab-and-go, an easy snack or quick small meal.';
  } else if (multiMeal) {
    adhdNote = 'Flexible base ingredient — works across several easy meals during the week.';
  } else {
    adhdNote = 'Keep it simple: have a no-cook or microwave plan in mind for the days you have less energy.';
  }

  // ── Quick use ideas ──
  const quickUseIdeas: string[] = [];
  const lower = p.name.toLowerCase();
  if (/yogurt/.test(lower)) quickUseIdeas.push('Berry + nut bowl (protein + fiber, no cooking)');
  if (/egg/.test(lower)) quickUseIdeas.push('Microwave scramble or hard-boiled snack');
  if (/tortilla/.test(lower)) quickUseIdeas.push('Quick wrap with protein + veggies');
  if (/(tuna|chicken)/.test(lower)) quickUseIdeas.push('No-cook protein for a salad or wrap');
  if (/(frozen|broccoli|vegetable|greens)/.test(lower)) quickUseIdeas.push('Microwave side in minutes');
  if (quickUseIdeas.length === 0 && readyToEat) quickUseIdeas.push('Ready to eat — keep on hand for low-energy days');

  return { fitLabel, diabetesNote, adhdNote, quickUseIdeas, tags };
}
