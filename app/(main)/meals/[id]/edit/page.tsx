'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import BackButton from '@/components/back-button';
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

interface AiNutrition {
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  confidence?: string;
  note?: string;
}

interface AiEnhanceResult {
  mode: 'ai' | '$0';
  nutritionEstimate?: AiNutrition;
  diabetesTips?: string[];
  mealBalance?: { balanceScore?: string; balanceReason?: string; portionGuidance?: string };
  message?: string;
  error?: string;
}

type InitialData = {
  detectedFoods: string[];
  nutrition: {
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  portionSize?: string;
  mealType?: MealType;
  feeling?: string;
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantPlaceId?: string;
  mealName?: string;
  source?: string;
  portionEatenPercent?: number;
};

export default function EditMealPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const [meal, setMeal] = useState<MealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eatenAt, setEatenAt] = useState('');

  // AI update panel
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiDesc, setAiDesc] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiEnhanceResult | null>(null);
  const [aiApplied, setAiApplied] = useState(false);

  // Re-keying MealForm forces it to re-initialize with new initialData
  const [formKey, setFormKey] = useState(0);
  const [initialData, setInitialData] = useState<InitialData | null>(null);

  useEffect(() => {
    fetchMeal();
  }, [id]);

  const fetchMeal = async () => {
    try {
      const res = await fetch(`/api/meals/${id}`);
      if (res.ok) {
        const data = await res.json();
        const m: MealData = data.meal;
        setMeal(m);
        const date = new Date(m.eatenAt);
        setEatenAt(formatLocalDatetime(date));

        const foods: string[] = m.detectedFoods ? JSON.parse(m.detectedFoods) : [];
        setInitialData({
          detectedFoods: foods,
          nutrition: {
            calories: m.calories ?? undefined,
            carbs: m.carbs ?? undefined,
            protein: m.protein ?? undefined,
            fat: m.fat ?? undefined,
            fiber: m.fiber ?? undefined,
            sugar: m.sugar ?? undefined,
            sodium: m.sodium ?? undefined,
          },
          portionSize: m.portionSize ?? undefined,
          mealType: (m.mealType as MealType) ?? undefined,
          feeling: m.feeling ?? undefined,
          restaurantName: m.restaurantName ?? undefined,
          restaurantAddress: m.restaurantAddress ?? undefined,
          restaurantPlaceId: m.restaurantPlaceId ?? undefined,
          mealName: m.mealName ?? undefined,
          source: m.source ?? undefined,
          portionEatenPercent: m.portionEatenPercent ?? undefined,
        });
        setAiDesc(foods.join(', '));
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

  const formatLocalDatetime = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleAiAnalyze = async () => {
    if (!aiDesc.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    setAiApplied(false);
    try {
      const res = await fetch('/api/enhance-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: aiDesc,
          foods: aiDesc.split(',').map(s => s.trim()).filter(Boolean),
          mealType: meal?.mealType,
          portionSize: meal?.portionSize,
        }),
      });
      const data: AiEnhanceResult = await res.json();
      setAiResult(data);
    } catch {
      setAiResult({ mode: '$0', error: 'Could not reach AI. Try again.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiNutrition = () => {
    if (!aiResult?.nutritionEstimate || !initialData) return;
    const est = aiResult.nutritionEstimate;
    setInitialData(prev => prev ? {
      ...prev,
      nutrition: {
        ...prev.nutrition,
        ...(est.calories != null && { calories: est.calories }),
        ...(est.carbs != null && { carbs: est.carbs }),
        ...(est.protein != null && { protein: est.protein }),
        ...(est.fat != null && { fat: est.fat }),
        ...(est.fiber != null && { fiber: est.fiber }),
        ...(est.sugar != null && { sugar: est.sugar }),
      },
    } : prev);
    setFormKey(k => k + 1);
    setAiApplied(true);
    setShowAiPanel(false);
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

  // ── Loading / error states ──

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7EFE1' }}>
        <p style={{ color: 'rgba(1,35,116,0.45)', fontSize: '13px' }}>{t.editMeal.loadingMeal}</p>
      </div>
    );
  }

  if (error || !meal || !initialData) {
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

  const confidenceColor = (c?: string) =>
    c === 'high' ? '#1C7A4F' : c === 'medium' ? '#9A6F18' : '#012374';

  return (
    <div className="min-h-screen mobile-page-pb" style={{ background: '#F7EFE1' }}>

      {/* ── Header ── */}
      <div style={{ background: '#FFFDF9', borderBottom: '1px solid rgba(1,35,116,0.07)' }}>
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div style={{ marginBottom: '8px' }}>
            <BackButton href="/meal-history" label={t.editMeal.backToHistory} />
          </div>
          <h1 className="font-serif-italic" style={{ fontSize: '1.5rem', color: '#012374' }}>{t.editMeal.title}</h1>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-6 py-5" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Date / Time */}
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

        {/* ── AI Update panel ── */}
        <div style={{ background: '#FFFDF9', borderRadius: '18px', border: `1px solid ${showAiPanel ? 'rgba(1,35,116,0.18)' : 'rgba(1,35,116,0.07)'}`, boxShadow: '0 8px 24px -16px rgba(1,35,116,0.2)', overflow: 'hidden' }}>

          {/* Header row — always visible */}
          <button
            type="button"
            onClick={() => { setShowAiPanel(v => !v); setAiResult(null); setAiApplied(false); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '13px', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <span style={{ width: '36px', height: '36px', borderRadius: '11px', background: 'rgba(1,35,116,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" stroke="#012374" strokeWidth="1.5"/>
                <path d="M9 9c0-1.66 1.34-3 3-3s3 1.34 3 3c0 1.25-.76 2.33-1.86 2.79L12 13" stroke="#012374" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="16.5" r="1" fill="#012374"/>
              </svg>
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#012374' }}>
                Update nutrition with AI
                {aiApplied && (
                  <span style={{ marginLeft: '8px', fontSize: '11px', background: 'rgba(28,122,79,0.12)', color: '#1C7A4F', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                    Applied ✓
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(22,24,42,0.55)', marginTop: '2px' }}>
                Describe the meal and let AI re-estimate the nutrition.
              </div>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              style={{ transform: showAiPanel ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
            >
              <path d="M6 9l6 6 6-6" stroke="#012374" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Expanded panel */}
          {showAiPanel && (
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(1,35,116,0.07)' }}>

              {/* Description input */}
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(1,35,116,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '16px', marginBottom: '7px' }}>
                Describe the meal as it actually was
              </label>
              <textarea
                value={aiDesc}
                onChange={e => setAiDesc(e.target.value)}
                rows={3}
                placeholder="e.g. Two corn tortillas, grilled chicken breast, salsa verde, half cup of rice"
                style={{ width: '100%', padding: '11px 13px', borderRadius: '12px', border: '1px solid rgba(1,35,116,0.15)', background: '#F7EFE1', fontSize: '13.5px', color: '#16182A', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
              />

              <button
                type="button"
                onClick={handleAiAnalyze}
                disabled={aiLoading || !aiDesc.trim()}
                style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: aiLoading || !aiDesc.trim() ? 'rgba(1,35,116,0.3)' : '#012374', color: '#FFFDF9', border: 'none', borderRadius: '11px', padding: '11px 18px', fontSize: '13.5px', fontWeight: 600, cursor: aiLoading || !aiDesc.trim() ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
              >
                {aiLoading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,253,249,0.3)" strokeWidth="2.5"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#FFFDF9" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    Analyzing…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 8v4l3 3" stroke="#FFFDF9" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    Analyze with AI
                  </>
                )}
              </button>

              {/* Spinner keyframe */}
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

              {/* AI result */}
              {aiResult && (
                <div style={{ marginTop: '14px' }}>
                  {aiResult.mode === '$0' || aiResult.error ? (
                    <div style={{ background: 'rgba(163,62,62,0.07)', border: '1px solid rgba(163,62,62,0.18)', borderRadius: '12px', padding: '12px 14px', fontSize: '13px', color: '#A33E3E' }}>
                      {aiResult.message || aiResult.error || 'AI could not analyze this meal. Try adding more detail.'}
                    </div>
                  ) : (
                    <div style={{ background: '#F7EFE1', borderRadius: '14px', padding: '16px' }}>

                      {/* Nutrition estimate */}
                      {aiResult.nutritionEstimate && (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(1,35,116,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                              AI Estimate
                            </span>
                            {aiResult.nutritionEstimate.confidence && (
                              <span style={{ fontSize: '11px', fontWeight: 600, color: confidenceColor(aiResult.nutritionEstimate.confidence), background: `${confidenceColor(aiResult.nutritionEstimate.confidence)}18`, padding: '2px 9px', borderRadius: '99px' }}>
                                {aiResult.nutritionEstimate.confidence} confidence
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                            {[
                              { label: 'Calories', value: aiResult.nutritionEstimate.calories, unit: '' },
                              { label: 'Carbs', value: aiResult.nutritionEstimate.carbs, unit: 'g' },
                              { label: 'Protein', value: aiResult.nutritionEstimate.protein, unit: 'g' },
                              { label: 'Fat', value: aiResult.nutritionEstimate.fat, unit: 'g' },
                              { label: 'Fiber', value: aiResult.nutritionEstimate.fiber, unit: 'g' },
                              { label: 'Sugar', value: aiResult.nutritionEstimate.sugar, unit: 'g' },
                            ].filter(n => n.value != null).map(n => (
                              <div key={n.label} style={{ background: '#FFFDF9', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                                <div className="font-serif-italic" style={{ fontSize: '18px', color: '#012374', lineHeight: 1 }}>{n.value}{n.unit}</div>
                                <div style={{ fontSize: '10px', color: 'rgba(22,24,42,0.5)', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{n.label}</div>
                              </div>
                            ))}
                          </div>

                          {aiResult.nutritionEstimate.note && (
                            <p style={{ fontSize: '11.5px', color: 'rgba(22,24,42,0.55)', lineHeight: 1.5, marginBottom: '12px' }}>
                              {aiResult.nutritionEstimate.note}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={handleApplyAiNutrition}
                            style={{ width: '100%', padding: '12px', borderRadius: '11px', background: '#012374', color: '#FFFDF9', border: 'none', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            Apply nutrition to form
                          </button>
                        </>
                      )}

                      {/* Tips */}
                      {aiResult.diabetesTips && aiResult.diabetesTips.length > 0 && (
                        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                          {aiResult.diabetesTips.map((tip, i) => (
                            <div key={i} style={{ display: 'flex', gap: '9px', alignItems: 'flex-start' }}>
                              <span style={{ marginTop: '2px', flexShrink: 0, width: '6px', height: '6px', borderRadius: '50%', background: '#C8932B', display: 'inline-block' }} />
                              <span style={{ fontSize: '12.5px', color: '#16182A', lineHeight: 1.55 }}>{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Portion guidance */}
                      {aiResult.mealBalance?.portionGuidance && (
                        <div style={{ marginTop: '12px', padding: '11px 13px', background: 'rgba(200,147,43,0.1)', borderRadius: '10px', fontSize: '12.5px', color: '#7A5A00', lineHeight: 1.55 }}>
                          {aiResult.mealBalance.portionGuidance}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background: 'rgba(163,62,62,0.07)', border: '1px solid rgba(163,62,62,0.2)', borderRadius: '12px', padding: '12px 14px' }}>
            <p style={{ fontSize: '13px', color: '#A33E3E' }}>{error}</p>
          </div>
        )}

        {/* MealForm — re-keyed when AI nutrition is applied */}
        <div style={{ background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.07)', boxShadow: '0 8px 24px -16px rgba(1,35,116,0.2)', padding: '18px 20px' }}>
          <MealForm
            key={formKey}
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
