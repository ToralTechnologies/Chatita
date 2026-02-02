'use client';

import { Check, Edit3 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface MealConfirmationProps {
  photo: string;
  analysis: {
    aiSummary?: string;
    detectedFoods: string[];
    nutrition?: {
      carbs?: number;
      calories?: number;
    };
    nutritionSummary?: string;
    confidence?: number;
    mealType?: string;
  };
  onSave: () => void;
  onEdit: () => void;
  loading?: boolean;
}

export default function MealConfirmation({
  photo,
  analysis,
  onSave,
  onEdit,
  loading = false,
}: MealConfirmationProps) {
  const { t } = useTranslation();

  const displaySummary = analysis.aiSummary || analysis.detectedFoods.join(', ') || 'Your meal';
  const nutrition = analysis.nutritionSummary || '';

  return (
    <div className="bg-white rounded-card shadow-card p-6 space-y-6">
      {/* Photo Preview */}
      <div className="relative">
        <img
          src={photo}
          alt="Meal preview"
          className="w-full rounded-lg object-cover max-h-64"
        />
      </div>

      {/* AI Summary */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Looks like {displaySummary}!
        </h2>

        {nutrition && (
          <p className="text-lg text-primary font-semibold">
            {nutrition}
          </p>
        )}

        {analysis.confidence && (
          <p className="text-sm text-gray-500">
            {analysis.confidence}% confidence
          </p>
        )}
      </div>

      {/* Detected Foods */}
      {analysis.detectedFoods.length > 0 && (
        <div className="bg-blue-50 border border-primary/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <span>🤖</span>
            AI detected:
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.detectedFoods.map((food, i) => (
              <span
                key={i}
                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
              >
                {food}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Primary CTA - Save */}
        <button
          onClick={onSave}
          disabled={loading}
          className="w-full bg-primary text-white py-4 rounded-button font-semibold text-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Save Meal
            </>
          )}
        </button>

        {/* Secondary CTA - Edit */}
        <button
          onClick={onEdit}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-button font-medium hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          Edit Details
        </button>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 text-center">
        AI estimates may vary. You can edit details before saving.
      </div>
    </div>
  );
}
