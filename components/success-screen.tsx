'use client';

import { CheckCircle, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/context';

interface SuccessScreenProps {
  meal: {
    aiSummary?: string;
    detectedFoods?: string[];
    nutrition?: {
      carbs?: number;
      calories?: number;
    };
    mealType?: string;
  };
}

export default function SuccessScreen({ meal }: SuccessScreenProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const displayName = meal.aiSummary || meal.detectedFoods?.join(', ') || 'Your meal';
  const carbs = meal.nutrition?.carbs;
  const calories = meal.nutrition?.calories;

  return (
    <div className="min-h-screen bg-gray-background flex flex-col items-center justify-center px-6 pb-24">
      <div className="text-center max-w-md space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="bg-success/10 rounded-full p-6">
            <CheckCircle className="w-16 h-16 text-success" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">
            {t.addMeal.mealSaved || 'Meal Saved!'}
          </h2>
          <p className="text-lg text-gray-600">
            {displayName}
          </p>
          {(carbs || calories) && (
            <p className="text-sm text-gray-500">
              {carbs && `${Math.round(carbs)}g carbs`}
              {carbs && calories && ' • '}
              {calories && `${Math.round(calories)} cal`}
            </p>
          )}
        </div>

        {/* Meal Type Badge */}
        {meal.mealType && (
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium capitalize">
            {meal.mealType}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={() => router.push('/add-meal')}
            className="w-full bg-primary text-white py-4 rounded-button font-semibold text-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t.addMeal.addAnother || 'Add Another Meal'}
          </button>

          <button
            onClick={() => router.push('/meal-history')}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-button font-medium hover:border-primary hover:text-primary transition-colors"
          >
            {t.addMeal.viewHistory || 'View Meal History'}
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full text-gray-600 py-2 font-medium hover:text-primary transition-colors"
          >
            {t.common.backToHome || 'Back to Home'}
          </button>
        </div>

        {/* Encouragement Message */}
        <div className="pt-4">
          <p className="text-sm text-gray-500 italic">
            {t.addMeal.keepTracking || 'Great job tracking your meals! Keep it up! 💪'}
          </p>
        </div>
      </div>
    </div>
  );
}
