'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import MealForm from '@/components/meal-form';
import { useTranslation } from '@/lib/i18n/context';
import { MealType } from '@/types';

interface MealData {
  id: string;
  detectedFoods?: string | null;
  calories?: number | null;
  carbs?: number | null;
  protein?: number | null;
  fat?: number | null;
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  portionSize?: string | null;
  mealType?: string | null;
  feeling?: string | null;
  restaurantName?: string | null;
  restaurantAddress?: string | null;
  restaurantPlaceId?: string | null;
  eatenAt: string;
}

export default function EditMealPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const [meal, setMeal] = useState<MealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eatenAt, setEatenAt] = useState('');

  useEffect(() => {
    fetchMeal();
  }, [id]);

  const fetchMeal = async () => {
    try {
      const res = await fetch(`/api/meals/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMeal(data.meal);
        // Format eatenAt as local datetime string for <input type="datetime-local">
        const date = new Date(data.meal.eatenAt);
        setEatenAt(formatLocalDatetime(date));
      } else if (res.status === 404) {
        setError(t.editMeal.mealNotFound);
      } else {
        setError(t.common.error);
      }
    } catch {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  /** Format a Date to YYYY-MM-DDThh:mm for datetime-local input */
  const formatLocalDatetime = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleSubmit = async (formData: {
    detectedFoods: string[];
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    portionSize?: string;
    mealType: MealType;
    feeling?: string;
    restaurantName?: string;
    restaurantAddress?: string;
    restaurantPlaceId?: string;
  }) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/meals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          eatenAt: new Date(eatenAt).toISOString(),
        }),
      });

      if (res.ok) {
        router.push('/meal-history');
      } else {
        setError(t.common.error);
        setSaving(false);
      }
    } catch {
      setError(t.common.error);
      setSaving(false);
    }
  };

  // --- Render states ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-background flex items-center justify-center">
        <p className="text-gray-500">{t.editMeal.loadingMeal}</p>
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="min-h-screen bg-gray-background">
        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          <p className="text-gray-600 mb-4">{error || t.editMeal.mealNotFound}</p>
          <button
            onClick={() => router.push('/meal-history')}
            className="bg-primary text-white px-6 py-2 rounded-button hover:bg-primary-dark transition-colors"
          >
            {t.editMeal.backToHistory}
          </button>
        </div>
      </div>
    );
  }

  // Parse stored JSON foods array
  const detectedFoods: string[] = meal.detectedFoods ? JSON.parse(meal.detectedFoods) : [];

  const initialData = {
    detectedFoods,
    nutrition: {
      calories: meal.calories ?? undefined,
      carbs: meal.carbs ?? undefined,
      protein: meal.protein ?? undefined,
      fat: meal.fat ?? undefined,
      fiber: meal.fiber ?? undefined,
      sugar: meal.sugar ?? undefined,
      sodium: meal.sodium ?? undefined,
    },
    portionSize: meal.portionSize ?? undefined,
    mealType: (meal.mealType as MealType) ?? undefined,
    feeling: meal.feeling ?? undefined,
    restaurantName: meal.restaurantName ?? undefined,
    restaurantAddress: meal.restaurantAddress ?? undefined,
    restaurantPlaceId: meal.restaurantPlaceId ?? undefined,
  };

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center">
          <button
            onClick={() => router.push('/meal-history')}
            className="text-primary hover:underline mr-4"
          >
            ← {t.editMeal.backToHistory}
          </button>
          <h1 className="text-2xl font-bold">{t.editMeal.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Date / Time Picker */}
        <div className="bg-white rounded-card shadow-card p-6">
          <label className="block text-sm font-medium mb-2">{t.editMeal.dateTimeLabel}</label>
          <input
            type="datetime-local"
            value={eatenAt}
            onChange={(e) => setEatenAt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* MealForm pre-populated */}
        <div className="bg-white rounded-card shadow-card p-6">
          <MealForm
            initialData={initialData}
            onSubmit={handleSubmit}
            loading={saving}
            editMode
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
