'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import MealForm, { MealFormData } from '@/components/meal-form';
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
  mealName?: string | null;
  source?: string | null;
  portionEatenPercent?: number | null;
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

  const handleSubmit = async (formData: MealFormData) => {
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7EFE1' }}>
        <p style={{ color: 'rgba(1,35,116,0.45)', fontSize: '13px' }}>{t.editMeal.loadingMeal}</p>
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="min-h-screen" style={{ background: '#F7EFE1' }}>
        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          <p style={{ color: 'rgba(22,24,42,0.65)', marginBottom: '16px' }}>{error || t.editMeal.mealNotFound}</p>
          <button
            onClick={() => router.push('/meal-history')}
            style={{ background: '#012374', color: '#FFFDF9', padding: '11px 24px', borderRadius: '999px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
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
    mealName: meal.mealName ?? undefined,
    source: meal.source ?? undefined,
    portionEatenPercent: meal.portionEatenPercent ?? undefined,
  };

  return (
    <div className="min-h-screen mobile-page-pb" style={{ background: '#F7EFE1' }}>
      {/* Header */}
      <div style={{ background: '#FFFDF9', borderBottom: '1px solid rgba(1,35,116,0.07)' }}>
        <div className="max-w-2xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/meal-history')}
            style={{ fontSize: '13px', color: 'rgba(1,35,116,0.55)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {t.editMeal.backToHistory}
          </button>
          <h1 className="font-serif-italic" style={{ fontSize: '1.5rem', color: '#012374' }}>{t.editMeal.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-5 space-y-4">
        {/* Date / Time Picker */}
        <div style={{ background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.07)', boxShadow: '0 8px 24px -16px rgba(1,35,116,0.2)', padding: '18px 20px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(1,35,116,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            {t.editMeal.dateTimeLabel}
          </label>
          <input
            type="datetime-local"
            value={eatenAt}
            onChange={(e) => setEatenAt(e.target.value)}
            style={{ width: '100%', padding: '10px 13px', borderRadius: '11px', border: '1px solid rgba(1,35,116,0.15)', background: '#F7EFE1', fontSize: '14px', color: '#16182A', outline: 'none' }}
          />
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background: 'rgba(163,62,62,0.07)', border: '1px solid rgba(163,62,62,0.2)', borderRadius: '12px', padding: '12px 14px' }}>
            <p style={{ fontSize: '13px', color: '#A33E3E' }}>{error}</p>
          </div>
        )}

        {/* MealForm pre-populated */}
        <div style={{ background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.07)', boxShadow: '0 8px 24px -16px rgba(1,35,116,0.2)', padding: '18px 20px' }}>
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
