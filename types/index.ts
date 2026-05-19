// User types
export type DiabetesType = 'Type1' | 'Type2' | 'Gestational' | 'PreDiabetes' | 'Other';
export type Language = 'en' | 'es';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Mood = 'happy' | 'grateful' | 'calm' | 'neutral' | 'tired' | 'anxious' | 'sad';
export type ChatRole = 'user' | 'assistant';

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
}

// Meal analysis result
export interface MealAnalysis {
  detectedFoods: string[];
  nutrition: NutritionData;
  confidence: number;
  mode: '$0' | 'ai';
}

// Menu recommendation
export interface MenuRecommendation {
  name: string;
  score: 'great' | 'moderate' | 'caution';
  reason: string;
  tips: string[];
  estimatedCarbs?: number;
  estimatedCalories?: number;
}

// Context flags for mood and chat
export interface UserContext {
  mood?: Mood;
  onPeriod?: boolean;
  feelingOverwhelmed?: boolean;
  notFeelingWell?: boolean;
  havingCravings?: boolean;
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
  }>;

  // User diabetes profile (from DB)
  diabetesType?: string;
  targetGlucoseMin?: number;
  targetGlucoseMax?: number;
}
