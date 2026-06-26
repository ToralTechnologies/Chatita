/**
 * Global diabetes health guidance rules.
 *
 * Sources: International Diabetes Federation (IDF) 2025 Clinical Practice
 * Recommendations, World Health Organization (WHO) HEARTS-D module, and
 * ADA Standards of Care (used as a U.S. regional reference only).
 *
 * Chatita uses IDF + WHO as its global foundation. ADA targets are shown as
 * one regional reference. Users are always directed to individualize goals
 * with their care team.
 */

// ── Glucose thresholds ─────────────────────────────────────────────────────────

export const GLUCOSE = {
  /** Below this value (mg/dL) = low glucose (hypoglycemia). IDF/ADA consensus. */
  LOW: 70,
  /** Clinical alert low — severe hypoglycemia risk. */
  VERY_LOW: 54,
  /** IDF general fasting target for many nonpregnant adults (lower bound). */
  TARGET_FASTING_MIN: 80,
  /** IDF general fasting target for many nonpregnant adults (upper bound). */
  TARGET_FASTING_MAX: 130,
  /** IDF general 1–2 h post-meal target for many nonpregnant adults. */
  TARGET_POST_MEAL: 180,
  /** High glucose caution. At or above this, ADA says check ketones before exercise. */
  HIGH_CAUTION: 240,
  /** Emergency threshold — very high glucose. */
  VERY_HIGH: 400,
} as const;

// ── Hypoglycemia (15-15 rule) ──────────────────────────────────────────────────

export const LOW_GLUCOSE_RULE = {
  carbsGrams: 15,
  waitMinutes: 15,
  /** Chatita message for low glucose — always redirect to care team for severe cases. */
  message:
    'This reading is low. General guidance (IDF/ADA): take 15g of fast-acting carbohydrates, wait 15 minutes, then recheck. If symptoms are severe, you feel unsafe, or you cannot eat or drink, seek emergency help immediately.',
  disclaimer:
    'Your care team may have given you personalized instructions for low glucose. Follow those first.',
  fastCarbExamples: [
    '4 glucose tablets',
    '4 oz (half cup) fruit juice',
    '4 oz regular (not diet) soda',
    '1 tablespoon honey or sugar',
    'Glucose gel per package instructions',
  ],
} as const;

// ── High glucose guidance ──────────────────────────────────────────────────────

export const HIGH_GLUCOSE_RULE = {
  message:
    'This reading is higher than your usual range. Follow your care plan. If your glucose is at or above 240 mg/dL, IDF and ADA guidance recommends checking for ketones before exercise and avoiding vigorous exercise if ketones are present.',
  disclaimer:
    'This is a general reference. Your care team sets your personal targets.',
} as const;

// ── General glucose disclaimer ─────────────────────────────────────────────────

export const GLUCOSE_DISCLAIMER =
  'These are general IDF reference targets. Your care team may set different goals based on your health history, medications, age, and situation.';

// ── Daily nutrition targets (general, not prescriptive) ────────────────────────

export const NUTRITION_GUIDANCE = {
  /** WHO recommends free sugars < 10% of daily energy (ideally < 5%). */
  addedSugarWarningPct: 0.1,
  /** High sodium flag — WHO recommends < 2000 mg/day for adults. */
  sodiumDailyLimitMg: 2000,
  /** Protein adequacy check — rough daily reference. */
  proteinGoalGPerKg: 1.0,
  /** General fiber target. */
  fiberDailyGoalG: 25,
  /** Water intake reference (varies widely — this is a low-intake flag). */
  waterLowThresholdOz: 32,
} as const;

// ── Culturally adaptive food framing ──────────────────────────────────────────

/**
 * These food categories should NEVER be told to eliminate.
 * Chatita adjusts portions/prep methods, never substitutes with non-cultural foods.
 */
export const CULTURAL_STAPLES = {
  latinAmerican: ['tortillas', 'beans', 'rice', 'tamales', 'nopales', 'plátanos', 'aguas frescas', 'pozole'],
  caribbean: ['rice and peas', 'yuca', 'plantains', 'stews'],
  southAsian: ['roti', 'dal', 'rice', 'curry', 'idli', 'dosa', 'naan'],
  middleEastern: ['pita', 'lentils', 'hummus', 'couscous', 'tagine'],
  eastAsian: ['rice', 'noodles', 'dumplings', 'congee', 'tofu'],
  african: ['injera', 'fufu', 'jollof rice', 'egusi', 'beans', 'ugali'],
  european: ['pasta', 'bread', 'potatoes', 'soups', 'stews'],
} as const;

export const CULTURAL_FOOD_PRINCIPLE =
  'Cultural food is non-negotiable. Chatita adjusts portions, preparation, and pairings — never suggests replacing culturally important foods with generic alternatives.';

// ── Protein guidance sources ───────────────────────────────────────────────────

export const PROTEIN_SOURCES = [
  'salmon', 'tuna', 'sardines', 'chicken', 'turkey', 'eggs',
  'Greek yogurt', 'tofu', 'tempeh', 'beans', 'lentils', 'edamame',
  'hummus', 'low-fat cheese', 'cottage cheese',
  // Global additions
  'dal', 'paneer', 'fish', 'legumes', 'natto',
] as const;

// ── GLP-1/GIP medication context ──────────────────────────────────────────────

export const GLP1_GUIDANCE = {
  dehydrationWarning:
    'GLP-1/GIP medications can cause nausea, vomiting, and diarrhea, which may lead to dehydration. Try small sips of water if you can. If vomiting, severe diarrhea, or stomach pain do not go away, contact your care team.',
  lowIntakeNote:
    'When appetite is very low on a GLP-1/GIP medication, prioritize protein and fluids first.',
  noDosingAdvice: true,
} as const;

// ── Plate method (IDF/ADA aligned) ────────────────────────────────────────────

export const PLATE_METHOD = {
  nonStarchyVeg: '½ plate — non-starchy vegetables',
  leanProtein: '¼ plate — lean protein',
  qualityCarb: '¼ plate — quality carbohydrates',
  note: 'The plate method is a flexible starting point. Adapt portions to your cultural foods, glucose goals, and what feels right for your body.',
} as const;

// ── Source attribution ─────────────────────────────────────────────────────────

export const SOURCES = {
  primary: 'International Diabetes Federation (IDF) 2025 Clinical Practice Recommendations',
  secondary: 'World Health Organization (WHO) HEARTS-D: Diagnosis and Management of Type 2 Diabetes',
  regional_us: 'American Diabetes Association (ADA) Standards of Care (U.S. regional reference)',
  nutrition: 'WHO Global Healthy Diet Guidelines',
  disclaimer:
    'Chatita uses IDF and WHO as its global clinical foundation. All guidance is general — always follow your care team\'s personalized recommendations.',
} as const;
