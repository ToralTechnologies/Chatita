// User types
export type DiabetesType = 'Type1' | 'Type2' | 'Gestational' | 'PreDiabetes' | 'Other';
export type Language = 'en' | 'es';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Mood = 'sad' | 'neutral' | 'happy';
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
