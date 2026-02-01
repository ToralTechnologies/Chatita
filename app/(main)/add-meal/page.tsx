'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import MealPhotoUpload from '@/components/meal-photo-upload';
import MealForm from '@/components/meal-form';
import { useTranslation } from '@/lib/i18n/context';

export default function AddMealPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [photoBase64, setPhotoBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [showDishSelection, setShowDishSelection] = useState(false);
  const [allDetectedDishes, setAllDetectedDishes] = useState<string[]>([]);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);

  const handlePhotoCapture = async (base64: string) => {
    setPhotoBase64(base64);
    setAnalyzing(true);
    setError('');
    setAiSuggestions(null);

    // Try AI analysis
    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoBase64: base64 }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.mode === 'ai' && data.detectedFoods.length > 0) {
          // Check if user needs to select which dishes are theirs
          if (data.needsSelection && data.allDetectedDishes && data.allDetectedDishes.length > 1) {
            setAllDetectedDishes(data.allDetectedDishes);
            setSelectedDishes(data.detectedFoods); // Pre-select AI's best guess
            setShowDishSelection(true);
          } else {
            setAiSuggestions(data);
          }
        }
      }
    } catch (err) {
      console.log('AI analysis not available, continuing with manual entry');
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleDishSelection = (dish: string) => {
    setSelectedDishes(prev =>
      prev.includes(dish)
        ? prev.filter(d => d !== dish)
        : [...prev, dish]
    );
  };

  const confirmDishSelection = () => {
    // Create AI suggestions with only selected dishes
    setAiSuggestions({
      detectedFoods: selectedDishes,
      nutrition: {},
      confidence: 70,
      mode: 'ai',
    });
    setShowDishSelection(false);
  };

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          photoBase64: photoBase64 || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save meal');
      }

      setSuccess(true);

      // Redirect to meal history after 1.5 seconds
      setTimeout(() => {
        router.push('/meal-history');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-background flex items-center justify-center pb-24">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">{t.addMeal.mealSaved}</h2>
          <p className="text-gray-600">{t.addMeal.successMessage}</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-primary hover:underline mr-4"
          >
            ← {t.common.back}
          </button>
          <h1 className="text-2xl font-bold">{t.addMeal.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-danger/30 text-danger p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Photo Upload */}
        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t.addMeal.photoTitle}</h2>
          <MealPhotoUpload onPhotoCapture={handlePhotoCapture} />

          {analyzing && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 text-primary">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">{t.addMeal.analyzingPhoto}</span>
              </div>
            </div>
          )}

          {showDishSelection && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-300 rounded-lg">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span>👥</span>
                Multiple dishes detected! Which ones are yours?
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Select all the items YOU ate (tap to toggle):
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {allDetectedDishes.map((dish, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDishSelection(dish)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedDishes.includes(dish)
                        ? 'bg-primary text-white border-2 border-primary'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-primary'
                    }`}
                  >
                    {selectedDishes.includes(dish) && '✓ '}
                    {dish}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={confirmDishSelection}
                disabled={selectedDishes.length === 0}
                className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Selection ({selectedDishes.length} item{selectedDishes.length !== 1 ? 's' : ''})
              </button>
            </div>
          )}

          {aiSuggestions && !showDishSelection && (
            <div className="mt-4 p-4 bg-blue-50 border border-primary/30 rounded-lg">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span>🤖</span>
                {t.addMeal.aiDetected.replace('{confidence}', aiSuggestions.confidence)}
              </h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {aiSuggestions.detectedFoods.map((food: string, i: number) => (
                  <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {food}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-600">
                ✨ {t.addMeal.aiAutofill}
              </p>
            </div>
          )}
        </div>

        {/* Meal Form */}
        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t.addMeal.detailsTitle}</h2>
          <MealForm
            onSubmit={handleSubmit}
            loading={loading}
            initialData={aiSuggestions}
          />
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-warning/30 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            💡 <strong>{t.common.tip}:</strong> {t.addMeal.trackingTip}
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
