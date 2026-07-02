// User types
export type DiabetesType = 'Type1' | 'Type2' | 'Gestational' | 'PreDiabetes' | 'Other';
export type Language = 'en' | 'es';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealSource = 'home' | 'restaurant' | 'packaged' | 'food_pantry' | 'leftovers' | 'other';
export type EstimateConfidence = 'exact' | 'estimated' | 'not_sure';
export type Mood = 'happy' | 'grateful' | 'calm' | 'neutral' | 'tired' | 'anxious' | 'sad';
export type ChatRole = 'user' | 'assistant';
// New preferred values. Old values (sedentary/light/moderate/active) are still accepted for backward compat.
export type ActivityLevel =
  | 'mostly_sitting'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'not_sure'
  | 'prefer_not_to_say'
  // legacy — kept for backward compatibility with existing stored data
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active';

export type SleepQuality = 'great' | 'good' | 'fair' | 'poor' | 'not_sure';
export type CyclePhase = 'period' | 'follicular' | 'ovulation' | 'luteal' | 'not_sure';
export type FlowLevel = 'light' | 'medium' | 'heavy' | 'not_sure';
export type CycleSymptom = 'cramps' | 'headache' | 'bloating' | 'fatigue' | 'breast_tenderness' | 'mood_changes' | 'cravings' | 'nausea' | 'acne' | 'other';

export type MovementType =
  | 'walking'
  | 'chores'
  | 'dancing'
  | 'gym'
  | 'strength_training'
  | 'sports'
  | 'physical_work'
  | 'chair_exercises'
  | 'stretching_yoga'
  | 'biking'
  | 'swimming'
  | 'not_active_right_now'
  | 'other';
export type WeightGoal = 'lose' | 'gain' | 'maintain';
export type OtherCondition = 'heart_disease' | 'kidney_disease' | 'hypertension';
export type SnackReason = 'hungry' | 'craving' | 'low_glucose' | 'before_exercise' | 'after_exercise' | 'nausea' | 'need_more_protein' | 'routine' | 'other';
export type DrinkType = 'water' | 'coffee' | 'tea' | 'juice' | 'soda' | 'agua_fresca' | 'electrolyte' | 'broth' | 'other';
export type CgmTrend = 'rising' | 'stable' | 'falling';
export type GuidanceType = 'low_protein' | 'low_fiber' | 'low_water' | 'high_added_sugar' | 'high_sodium' | 'carb_heavy_day' | 'glp1_low_intake' | 'low_glucose_safety' | 'high_glucose_safety' | 'meal_idea' | 'snack_idea' | 'mood_food_pattern';

// Nutrition data
export interface NutritionData {
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  portionSize?: string;
  // Extended
  addedSugar?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  potassium?: number;
}

// Hydration entry
export interface HydrationEntry {
  drinkType: DrinkType;
  amountOz: number;
  sweetened?: boolean;
  drinkCarbsG?: number;
  caffeine?: boolean;
  addToDailyWaterTotal?: boolean;
}

// Full mood check-in data
export interface MoodCheckInData {
  mood: Mood;
  stressLevel: number;
  moodIntensity?: number;
  energyLevel?: number;
  hungerLevel?: number;
  fullnessLevel?: number;
  cravings?: string[];
  symptoms?: string[];
  contextTags?: string[];
  notFeelingWell?: boolean;
  onPeriod?: boolean;
  feelingOverwhelmed?: boolean;
  havingCravings?: boolean;
  userWords?: string;
  foodMoodConnection?: string;
  supportWanted?: string;
  notes?: string;
  mealId?: string;
}

// Daily guidance insight
export interface GuidanceInsightData {
  type: GuidanceType;
  message: string;
  reason: string;
  suggestedActions?: string[];
}

// Meal analysis result
export interface MealAnalysis {
  detectedFoods: string[];
  nutrition: NutritionData;
  confidence: number;
  mode: '$0' | 'ai';
}

// Menu recommendation — scored on balance, not just carbs
export interface MenuRecommendation {
  name: string;
  score: 'great' | 'moderate' | 'caution';
  reason: string;           // Explains WHY (protein, fiber, balance, fits goals)
  tips: string[];
  estimatedCarbs?: number;
  estimatedCalories?: number;
  estimatedProtein?: number;
  estimatedFiber?: number;
  culturalNote?: string;    // How to keep/adapt cultural foods
  portionGuidance?: string; // "How much" not "whether to eat"
}

// Context flags for mood and chat
export interface UserContext {
  mood?: Mood;
  onPeriod?: boolean;
  feelingOverwhelmed?: boolean;
  notFeelingWell?: boolean;
  havingCravings?: boolean;
}

// Sleep log entry
export interface SleepLogEntry {
  id: string;
  userId: string;
  date: string;
  sleepStart?: string;
  wakeTime?: string;
  totalSleepMinutes?: number;
  sleepQuality?: SleepQuality;
  wakeEnergy?: number;
  nighttimeWakeups?: number;
  stressBeforeBed?: number;
  caffeineLaterInDay?: boolean;
  notes?: string;
  createdAt: string;
}

// Cycle log entry
export interface CycleLogEntry {
  id: string;
  userId: string;
  date: string;
  periodStartDate?: string;
  periodEndDate?: string;
  cycleDay?: number;
  cyclePhase?: CyclePhase;
  flow?: FlowLevel;
  symptoms?: CycleSymptom[];
  cravings?: string;
  appetiteChange?: string;
  mood?: string;
  energy?: number;
  glucoseChangesNoticed?: string;
  notes?: string;
  createdAt: string;
}

// Extended user health profile for personalized guidance
export interface UserHealthProfile {
  age?: number;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  weightGoal?: WeightGoal;
  otherConditions?: OtherCondition[];
  currentMedications?: string[];
  dailyCalorieTarget?: number;
  dailyCarbTarget?: number;
  mealsPerDay?: number;
  // Sleep profile
  tracksSleep?: boolean;
  sleepGoalHours?: number;
  typicalBedtime?: string;
  typicalWakeTime?: string;
  sleepTrackingNotes?: string;
  // Cycle profile (opt-in)
  tracksMenstrualCycle?: boolean;
  typicalCycleLength?: number;
  typicalPeriodLength?: number;
  cycleTrackingNotes?: string;
  // Movement profile
  preferredMovementTypes?: MovementType[];
  exerciseFrequency?: string;
  averageDailySteps?: number;
  hasPhysicalJob?: boolean;
  mobilityLimitations?: string;
  movementGoal?: string;
  movementNotes?: string;
}

// Activity log entry
export interface ActivityLogEntry {
  id: string;
  userId: string;
  date: string;
  activityType?: string;
  activityMinutes?: number;
  activityIntensity?: string;
  steps?: number;
  relatedToMeal: boolean;
  mealId?: string;
  mealTiming?: string;
  glucoseBeforeActivity?: number;
  glucoseAfterActivity?: number;
  energyBefore?: number;
  energyAfter?: number;
  moodAfter?: string;
  symptoms?: string[];
  notes?: string;
  createdAt: string;
}

// Cultural food context for globally adaptive guidance
export interface CulturalFoodProfile {
  countryOrRegion?: string;
  culturalFoodBackground?: string;
  stapleCarbs?: string[];
  commonProteins?: string[];
  commonVegetables?: string[];
  commonDrinks?: string[];
  dietaryRestrictions?: string[];
  religiousFoodNeeds?: string;
  foodBudgetLevel?: string;
  foodAccessContext?: string;
  cookingFrequency?: string;
  foodPantryUse?: boolean;
  comfortFoods?: string[];
  foodsToKeep?: string[];
}

// Insight pattern
export interface InsightPattern {
  type: string;
  title: string;
  description: string;
  icon: string;
  relatedMealIds?: string[];
}

// Weekly insights
export interface WeeklyInsights {
  dateRange: {
    start: Date;
    end: Date;
  };
  stats: {
    timeInRange: number;
    avgGlucose: number;
    mealsLogged: number;
  };
  patterns: InsightPattern[];
}

// Chat message with context
export interface ChatMessageWithContext {
  role: ChatRole;
  content: string;
  context?: UserContext;
  timestamp: Date;
}

// Today's cumulative nutrition (to judge meals in daily context)
export interface TodayNutrition {
  caloriesConsumed: number;
  carbsConsumed: number;
  proteinConsumed: number;
  fiberConsumed: number;
  sodiumConsumed: number;
  addedSugarConsumed: number;
  waterOzLogged: number;
  mealsLogged: number;
}

// Full health context assembled server-side for the AI chat
export interface ChatHealthContext {
  // Mood/status flags (from client)
  mood?: Mood;
  onPeriod?: boolean;
  feelingOverwhelmed?: boolean;
  notFeelingWell?: boolean;
  havingCravings?: boolean;

  // Recent glucose reading (from DB, last 4 hours)
  recentGlucose?: {
    value: number;        // mg/dL
    minutesAgo: number;
    readingContext?: string; // 'fasting' | 'pre-meal' | 'post-meal' | etc.
  };

  // Recent meals (from DB, last 6 hours)
  recentMeals?: Array<{
    summary: string;
    mealType?: string;
    minutesAgo: number;
    carbs?: number;
    fiber?: number;
    protein?: number;
    calories?: number;
  }>;

  // User diabetes profile (from DB)
  diabetesType?: string;
  targetGlucoseMin?: number;
  targetGlucoseMax?: number;

  // Extended health profile for personalized guidance
  userProfile?: UserHealthProfile;

  // Cultural food profile for globally adaptive guidance
  culturalProfile?: CulturalFoodProfile;

  // Today's cumulative nutrition (to judge meals in daily context)
  todayNutrition?: TodayNutrition;

  // Recent sleep (from DB, last 24 hours)
  recentSleep?: {
    totalSleepMinutes?: number | null;
    sleepQuality?: string | null;
    wakeEnergy?: number | null;
    stressBeforeBed?: number | null;
    nighttimeWakeups?: number | null;
  };

  // Connected health data (from HealthDailySummary — today's imported data)
  connectedHealthToday?: {
    provider: string;            // 'google_health' | 'apple_health_export'
    steps?: number | null;
    activeMinutes?: number | null;
    exerciseMinutes?: number | null;
    sleepMinutes?: number | null;
    restingHeartRate?: number | null;
    averageHeartRate?: number | null;
    activeCalories?: number | null;
  } | null;

  // Nearby restaurants the user explicitly agreed to share for THIS message
  // (names/distances only — never coordinates; never persisted).
  nearbyPlaces?: Array<{
    name: string;
    cuisine?: string;
    distance?: string;
    rating?: number;
  }>;
  // User's UI language for this message ('en' | 'es') so replies match.
  language?: string;
}

// Health provider types for connected data
export type HealthProvider =
  | 'google_health'
  | 'apple_health_export'
  | 'apple_healthkit_companion_future'
  | 'manual'
  | 'legacy_fitbit_deprecated';

export type HealthConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export interface HealthConnectionInfo {
  id: string;
  provider: HealthProvider;
  status: HealthConnectionStatus;
  lastSyncedAt?: string | null;
  errorMessage?: string | null;
  consentedAt?: string | null;
}

export interface HealthDailySummaryEntry {
  id: string;
  userId: string;
  date: string;
  provider: HealthProvider;
  steps?: number | null;
  activeMinutes?: number | null;
  exerciseMinutes?: number | null;
  distanceMeters?: number | null;
  activeCalories?: number | null;
  totalCalories?: number | null;
  sleepMinutes?: number | null;
  sleepQuality?: string | null;
  restingHeartRate?: number | null;
  averageHeartRate?: number | null;
  workoutCount?: number | null;
  importedAt: string;
}

export interface HealthImportEntry {
  id: string;
  provider: HealthProvider;
  importType: string;
  filename?: string | null;
  status: string;
  recordsProcessed?: number | null;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
}
