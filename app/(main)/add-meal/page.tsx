'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
import BackButton from '@/components/back-button';
import type { MealGuidance } from '@/lib/ai/meal-analyzer';

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'scanning' | 'detected' | 'manual';
type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

interface AiNutrition {
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  addedSugar?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  potassium?: number;
}

interface AiResult {
  detectedFoods: string[];
  confidence: number;
  aiSummary?: string;
  nutritionSummary?: string;
  nutrition?: AiNutrition;
  portionSize?: string;
  guidance?: MealGuidance;
  mode: 'ai' | '$0';
  message?: string;
}

interface PageState {
  phase: Phase;
  imagePreview: string | null;
  aiResult: AiResult | null;
  mealType: MealType;
  foods: string[];
  draft: string;
  feeling: string;
  saved: boolean;
  error: string | null;
  correcting: boolean;
  correctionText: string;
}

// ── Tone styles ───────────────────────────────────────────────────────────────

const TONE_STYLE = {
  great:   { cardBg: 'rgba(28,122,79,0.10)',  border: 'rgba(28,122,79,0.22)',  accent: '#1C7A4F' },
  mindful: { cardBg: 'rgba(200,147,43,0.13)', border: 'rgba(200,147,43,0.28)', accent: '#9A6F18' },
  treat:   { cardBg: 'rgba(181,86,46,0.10)',  border: 'rgba(181,86,46,0.24)',  accent: '#B5562E' },
} as const;

// ── CSS animations ────────────────────────────────────────────────────────────

const SCAN_STYLE = `
@keyframes scanline { 0%{top:6%} 50%{top:90%} 100%{top:6%} }
@keyframes pulsedot { 0%,100%{opacity:.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
`;

// ── Icon helpers ──────────────────────────────────────────────────────────────

function TipIcon({ icon }: { icon: string }) {
  if (icon === 'leaf') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 22C6 22 3 16 3 10c0-4 4-7 9-7s9 3 9 7-3 12-9 12z" stroke="#1C7A4F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 10c3 2 6 2 9 0" stroke="#1C7A4F" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
  if (icon === 'walk') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="13" cy="4" r="1.5" stroke="#012374" strokeWidth="1.6"/>
      <path d="M9 8l2 2 3-3 2 5h3M9 14l1 6M14 11l1 4-3 1" stroke="#012374" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (icon === 'water') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 2L5.5 10a7 7 0 1 0 13 0L12 2z" stroke="#2A6FA8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z" stroke="#1C7A4F" strokeWidth="1.6"/>
    </svg>
  );
}

// ── Tone icon ─────────────────────────────────────────────────────────────────

function ToneIcon({ tone, size = 18 }: { tone: string; size?: number }) {
  if (tone === 'great') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="#1C7A4F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (tone === 'mindful') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l2.4 6 6.1.4-4.7 4 1.5 6L12 16.8 6.7 19.4l1.5-6-4.7-4 6.1-.4L12 3z" stroke="#9A6F18" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4v16M7 20h10M5 8h14M5 8l-2.5 5a3 3 0 0 0 5 0L5 8zM19 8l-2.5 5a3 3 0 0 0 5 0L19 8z" stroke="#B5562E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── GuidanceCard ──────────────────────────────────────────────────────────────

function GuidanceCard({ guidance, web }: { guidance: MealGuidance; web?: boolean }) {
  const ts = TONE_STYLE[guidance.tone];
  const iconSize = web ? 22 : 18;
  const boxSize = web ? 42 : 34;
  return (
    <div style={{ background: ts.cardBg, border: `1px solid ${ts.border}`, borderRadius: web ? '20px' : '16px', padding: web ? '24px' : '18px' }}>
      {/* Header row: icon box + kicker + headline */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '13px', marginBottom: '16px' }}>
        <span style={{ flexShrink: 0, width: boxSize, height: boxSize, borderRadius: web ? '12px' : '10px', background: `${ts.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ToneIcon tone={guidance.tone} size={iconSize} />
        </span>
        <div>
          <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: ts.accent, fontWeight: 700 }}>{guidance.kicker}</p>
          <p className="font-serif-italic" style={{ fontSize: web ? '22px' : '17px', color: '#16182A', lineHeight: 1.2, marginTop: '3px' }}>
            {guidance.headline}
          </p>
        </div>
      </div>

      {web ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
          {/* Order steps — white panel */}
          <div style={{ background: 'rgba(255,253,249,0.7)', borderRadius: '14px', padding: '16px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(0,26,77,0.55)', fontWeight: 700, marginBottom: '12px' }}>Eat it in this order</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '11px' }}>
              {guidance.order.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: ts.accent, color: '#FFFDF9', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</span>
                  <div>
                    <p style={{ fontSize: '14.5px', fontWeight: 600, color: '#16182A' }}>{step.label}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(22,24,42,0.62)', marginTop: '1px' }}>{step.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Tips — individual cards */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '11px' }}>
            {guidance.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(255,253,249,0.7)', borderRadius: '12px', padding: '13px 14px' }}>
                <TipIcon icon={tip.icon} />
                <p style={{ fontSize: '13.5px', color: '#16182A', lineHeight: 1.45 }}>{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Order steps — white panel */}
          <div style={{ background: 'rgba(255,253,249,0.7)', borderRadius: '13px', padding: '14px', marginBottom: '13px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(0,26,77,0.55)', fontWeight: 700, marginBottom: '11px' }}>Eat it in this order</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
              {guidance.order.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                  <span style={{ width: '23px', height: '23px', borderRadius: '50%', background: ts.accent, color: '#FFFDF9', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</span>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#16182A' }}>{step.label}</span>
                    <span style={{ fontSize: '13px', color: 'rgba(22,24,42,0.62)' }}> — {step.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Tips */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '9px' }}>
            {guidance.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <TipIcon icon={tip.icon} />
                <p style={{ fontSize: '13.5px', color: '#16182A', lineHeight: 1.45 }}>{tip.text}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ScanningBox({ label }: { label: string }) {
  return (
    <div style={{ height: '200px', borderRadius: '14px', background: 'repeating-linear-gradient(135deg,#EFE4D2,#EFE4D2 12px,#F4EBDC 12px,#F4EBDC 24px)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '18px' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,transparent,#C8932B,transparent)', animation: 'scanline 1.4s ease-in-out infinite', top: '6%' }} />
      <p style={{ fontSize: '12px', color: 'rgba(1,35,116,0.5)', marginBottom: '10px' }}>{label}</p>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <div key={i} style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#012374', animation: 'pulsedot 1.2s infinite', animationDelay: `${delay}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AddMealPage() {
  const [state, setState] = useState<PageState>({
    phase: 'idle',
    imagePreview: null,
    aiResult: null,
    mealType: 'Lunch',
    foods: [],
    draft: '',
    feeling: '',
    saved: false,
    error: null,
    correcting: false,
    correctionText: '',
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<PageState>) => setState((s) => ({ ...s, ...patch }));

  const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  const handleFileSelected = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      update({ phase: 'scanning', imagePreview: dataUrl, error: null });
      try {
        const res = await fetch('/api/analyze-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoBase64: dataUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Analysis failed');
        const aiResult: AiResult = data;
        update({ phase: 'detected', aiResult, foods: aiResult.detectedFoods });
      } catch (err) {
        update({ phase: 'idle', error: (err as Error).message || 'Could not analyze photo. Try again.' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGetGuidance = async () => {
    if (state.foods.length === 0) return;
    update({ phase: 'scanning', error: null });
    try {
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foods: state.foods }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      const aiResult: AiResult = data;
      update({
        phase: 'detected',
        aiResult,
        foods: aiResult.detectedFoods.length ? aiResult.detectedFoods : state.foods,
      });
    } catch (err) {
      update({ phase: 'manual', error: (err as Error).message || 'Could not get guidance. Try again.' });
    }
  };

  const handleSave = async () => {
    update({ saved: true });
    const n = state.aiResult?.nutrition ?? {};
    fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoBase64: state.imagePreview || undefined,
        detectedFoods: state.foods,
        aiSummary: state.aiResult?.aiSummary,
        aiConfidence: state.aiResult?.confidence,
        aiMode: state.aiResult?.mode,
        nutritionSource: state.aiResult?.mode === 'ai' ? 'ai' : 'manual',
        portionSize: state.aiResult?.portionSize || undefined,
        // Core nutrition from AI
        calories: n.calories ?? undefined,
        carbs: n.carbs ?? undefined,
        protein: n.protein ?? undefined,
        fat: n.fat ?? undefined,
        fiber: n.fiber ?? undefined,
        sugar: n.sugar ?? undefined,
        sodium: n.sodium ?? undefined,
        // Extended nutrition
        addedSugar: n.addedSugar ?? undefined,
        saturatedFat: n.saturatedFat ?? undefined,
        transFat: n.transFat ?? undefined,
        cholesterol: n.cholesterol ?? undefined,
        potassium: n.potassium ?? undefined,
        mealType: state.mealType,
        feeling: state.feeling || undefined,
      }),
    }).catch(() => {});
  };

  const handleCorrect = async () => {
    const corrected = state.correctionText.split(',').map(f => f.trim()).filter(Boolean);
    if (!corrected.length) return;
    update({ correcting: false, correctionText: '', phase: 'scanning', foods: corrected, aiResult: null, error: null });
    try {
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foods: corrected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      const finalFoods = data.detectedFoods?.length ? data.detectedFoods : corrected;
      // Auto-save the corrected meal to meal history
      const cn = (data.nutrition as AiNutrition) ?? {};
      fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoBase64: state.imagePreview || undefined,
          detectedFoods: finalFoods,
          aiSummary: data.aiSummary,
          aiConfidence: data.confidence,
          aiMode: data.mode,
          nutritionSource: data.mode === 'ai' ? 'ai' : 'manual',
          portionSize: data.portionSize || undefined,
          calories: cn.calories ?? undefined,
          carbs: cn.carbs ?? undefined,
          protein: cn.protein ?? undefined,
          fat: cn.fat ?? undefined,
          fiber: cn.fiber ?? undefined,
          sugar: cn.sugar ?? undefined,
          sodium: cn.sodium ?? undefined,
          addedSugar: cn.addedSugar ?? undefined,
          saturatedFat: cn.saturatedFat ?? undefined,
          transFat: cn.transFat ?? undefined,
          cholesterol: cn.cholesterol ?? undefined,
          potassium: cn.potassium ?? undefined,
          mealType: state.mealType,
          feeling: state.feeling || undefined,
        }),
      }).catch(() => {});
      update({ phase: 'detected', aiResult: data, foods: finalFoods, saved: true });
    } catch (err) {
      update({ phase: 'detected', error: (err as Error).message || 'Could not get guidance. Try again.' });
    }
  };

  const addFood = () => {
    const trimmed = state.draft.trim();
    if (trimmed) update({ foods: [...state.foods, trimmed], draft: '' });
  };

  const removeFood = (i: number) => update({ foods: state.foods.filter((_, j) => j !== i) });

  // ── Shared sub-sections ────────────────────────────────────────────────────

  const PhotoZone = () => (
    <div style={{ border: '2px dashed rgba(1,35,116,0.2)', borderRadius: '14px', padding: '28px 20px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '12px', background: '#F7EFE1' }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="14" rx="3" stroke="#012374" strokeWidth="1.6" opacity={0.4}/>
        <circle cx="12" cy="14" r="3" stroke="#012374" strokeWidth="1.6" opacity={0.4}/>
        <path d="M8 7l1.5-2h5L16 7" stroke="#012374" strokeWidth="1.6" opacity={0.4}/>
      </svg>
      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])} />
      <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])} />
      <button onClick={() => photoInputRef.current?.click()} style={{ padding: '10px 24px', borderRadius: '999px', background: '#012374', color: '#FFFDF9', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
        Take photo
      </button>
      <button onClick={() => galleryInputRef.current?.click()} style={{ padding: '10px 24px', borderRadius: '999px', background: 'transparent', color: '#012374', fontSize: '14px', fontWeight: 600, border: '1px solid rgba(1,35,116,0.25)', cursor: 'pointer' }}>
        Choose from gallery
      </button>
    </div>
  );

  const MealTypeSelector = () => (
    <div>
      <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(1,35,116,0.5)', fontWeight: 700, marginBottom: '8px' }}>Meal type</p>
      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' as const }}>
        {MEAL_TYPES.map((t) => (
          <button key={t} onClick={() => update({ mealType: t })} style={{ padding: '7px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: state.mealType === t ? 600 : 500, background: state.mealType === t ? '#012374' : '#FFFDF9', color: state.mealType === t ? '#FFFDF9' : '#012374', border: state.mealType === t ? '1px solid #012374' : '1px solid rgba(1,35,116,0.2)', cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );

  const renderFoodEditor = (bgInput: string) => (
    <div>
      <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(1,35,116,0.5)', fontWeight: 700, marginBottom: '8px' }}>Foods</p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input type="text" value={state.draft} onChange={(e) => update({ draft: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addFood()} placeholder="e.g. grilled chicken" style={{ flex: 1, padding: '10px 13px', borderRadius: '12px', border: '1px solid rgba(1,35,116,0.15)', background: bgInput, fontSize: '13px', color: '#001A4D', outline: 'none' }} />
        <button onClick={addFood} style={{ padding: '10px 16px', borderRadius: '12px', background: '#012374', color: '#FFFDF9', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Add</button>
      </div>
      {state.foods.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginTop: '8px' }}>
          {state.foods.map((f, i) => (
            <span key={i} style={{ background: '#012374', color: '#FFFDF9', borderRadius: '999px', padding: '5px 12px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {f}
              <button onClick={() => removeFood(i)} style={{ background: 'none', border: 'none', color: '#FFFDF9', cursor: 'pointer', padding: 0, fontSize: '14px', lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const renderFeelingInput = (bgInput: string) => (
    <div>
      <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(1,35,116,0.5)', fontWeight: 700, marginBottom: '8px' }}>How are you feeling?</p>
      <textarea value={state.feeling} onChange={(e) => update({ feeling: e.target.value })} placeholder="Optional — anything on your mind before this meal?" rows={2} style={{ width: '100%', padding: '10px 13px', borderRadius: '12px', border: '1px solid rgba(1,35,116,0.15)', background: bgInput, fontSize: '13px', color: '#001A4D', outline: 'none', resize: 'none', boxSizing: 'border-box' as const }} />
    </div>
  );

  const DetectedFoodsCard = () => {
    const result = state.aiResult;
    if (!result) return null;
    const confColor = result.confidence >= 80 ? '#1C7A4F' : result.confidence >= 60 ? '#9A6F18' : '#B5562E';
    return (
      <div style={{ background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.08)', padding: '16px 18px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(1,35,116,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.2 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.8-.5L12 3z" stroke="#012374" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          </span>
          <span style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(0,26,77,0.55)', fontWeight: 700 }}>Chatita sees</span>
          {result.confidence > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: confColor }}>{result.confidence}% sure</span>
          )}
        </div>
        {/* Summary */}
        {result.aiSummary && (
          <p className="font-serif-italic" style={{ fontSize: '19px', color: '#012374', lineHeight: 1.25, marginTop: '9px' }}>
            Looks like {result.aiSummary}!
          </p>
        )}
        {/* Food chips */}
        {state.foods.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '7px', marginTop: '11px' }}>
            {state.foods.map((f, i) => (
              <span key={i} style={{ background: '#F7EFE1', color: '#012374', borderRadius: '999px', padding: '7px 11px', fontSize: '12.5px', fontWeight: 500 }}>{f}</span>
            ))}
          </div>
        )}
        {/* Nutrition grid from AI */}
        {result.nutrition && Object.keys(result.nutrition).length > 0 && (() => {
          const n = result.nutrition!;
          const items = [
            { label: 'cal', val: n.calories != null ? String(Math.round(n.calories)) : null },
            { label: 'carbs', val: n.carbs != null ? `${Math.round(n.carbs)}g` : null },
            { label: 'protein', val: n.protein != null ? `${Math.round(n.protein)}g` : null },
            { label: 'fat', val: n.fat != null ? `${Math.round(n.fat)}g` : null },
            { label: 'fiber', val: n.fiber != null ? `${Math.round(n.fiber)}g` : null },
            { label: 'sugar', val: n.sugar != null ? `${Math.round(n.sugar)}g` : null },
            { label: 'sodium', val: n.sodium != null ? `${Math.round(n.sodium)}mg` : null },
          ].filter(i => i.val !== null);
          if (!items.length) return null;
          return (
            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '6px' }}>
              {items.map(({ label, val }) => (
                <div key={label} style={{ background: '#F7EFE1', borderRadius: '10px', padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#012374' }}>{val}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(22,24,42,0.5)', marginTop: '1px' }}>{label}</div>
                </div>
              ))}
            </div>
          );
        })()}
        {result.portionSize && (
          <p style={{ fontSize: '11.5px', color: 'rgba(1,35,116,0.5)', marginTop: '8px' }}>Portion: {result.portionSize}</p>
        )}
      </div>
    );
  };

  // ── MOBILE ─────────────────────────────────────────────────────────────────

  const MobileLayout = (
    <div className="lg:hidden mobile-page-pb" style={{ background: '#F7EFE1', minHeight: '100vh' }}>
      <style>{SCAN_STYLE}</style>

      <div style={{ padding: '20px 20px 0', paddingTop: 'max(20px, env(safe-area-inset-top, 0px))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton href="/meal-history" />
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#C8932B', fontWeight: 700 }}>Meal log · Add</div>
            <h1 className="font-serif-italic" style={{ fontSize: 26, color: '#012374', lineHeight: 1.05 }}>What are you having?</h1>
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
        {state.error && (
          <div style={{ background: 'rgba(181,86,46,0.10)', border: '1px solid rgba(181,86,46,0.22)', borderRadius: '12px', padding: '12px 14px' }}>
            <p style={{ fontSize: '13px', color: '#B5562E' }}>{state.error}</p>
          </div>
        )}

        {state.phase === 'idle' && (
          <>
            <PhotoZone />
            <button onClick={() => update({ phase: 'manual', error: null })} style={{ fontSize: '13px', color: '#012374', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textAlign: 'left' as const, padding: 0 }}>
              Or add meal details manually →
            </button>
          </>
        )}

        {state.phase === 'manual' && (
          <>
            <p className="font-serif-italic" style={{ fontSize: '20px', color: '#012374' }}>What are you eating?</p>
            {renderFoodEditor("#FFFDF9")}
            <button onClick={handleGetGuidance} disabled={state.foods.length === 0} style={{ padding: '12px', borderRadius: '999px', background: state.foods.length > 0 ? '#012374' : 'rgba(1,35,116,0.3)', color: '#FFFDF9', fontSize: '14px', fontWeight: 600, border: 'none', cursor: state.foods.length > 0 ? 'pointer' : 'not-allowed' }}>
              Get eating guidance →
            </button>
            <button onClick={() => update({ phase: 'idle', error: null })} style={{ fontSize: '13px', color: 'rgba(1,35,116,0.5)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const, padding: 0 }}>
              ← Take a photo instead
            </button>
          </>
        )}

        {state.phase === 'scanning' && (
          <ScanningBox label={state.imagePreview ? 'Analyzing your plate…' : 'Getting your eating plan…'} />
        )}

        {state.phase === 'detected' && (
          <>
            {state.imagePreview && (
              <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', height: '180px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.imagePreview} alt="Your meal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => update({ phase: 'idle', imagePreview: null, aiResult: null, foods: [], saved: false })} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.45)', color: '#FFFDF9', border: 'none', borderRadius: '999px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>Retake</button>
              </div>
            )}
            <DetectedFoodsCard />
            {/* Correction flow */}
            {!state.correcting ? (
              <button
                onClick={() => update({ correcting: true })}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#9A6F18', background: 'rgba(200,147,43,0.1)', border: '1px solid rgba(200,147,43,0.2)', borderRadius: 12, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#9A6F18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#9A6F18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Not right? Correct it
              </button>
            ) : (
              <div style={{ background: '#FFFDF9', borderRadius: 16, border: '1.5px solid rgba(200,147,43,0.28)', padding: '16px' }}>
                <p style={{ fontSize: 11, color: '#9A6F18', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 10 }}>What is it really?</p>
                <textarea
                  value={state.correctionText}
                  onChange={e => update({ correctionText: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCorrect(); } }}
                  placeholder="e.g. chicken biryani, naan bread, raita"
                  rows={2}
                  style={{ width: '100%', padding: '10px 13px', borderRadius: 12, border: '1px solid rgba(1,35,116,0.14)', background: '#F7EFE1', fontSize: 13.5, color: '#001A4D', outline: 'none', resize: 'none' as const, boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={handleCorrect} disabled={!state.correctionText.trim()} style={{ flex: 2, padding: '10px', borderRadius: 999, background: state.correctionText.trim() ? '#012374' : 'rgba(1,35,116,0.3)', color: '#FFFDF9', fontSize: 13, fontWeight: 700, border: 'none', cursor: state.correctionText.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                    Regenerate →
                  </button>
                  <button onClick={() => update({ correcting: false, correctionText: '' })} style={{ flex: 1, padding: '10px', borderRadius: 999, background: 'transparent', color: 'rgba(22,24,42,0.5)', fontSize: 13, border: '1px solid rgba(22,24,42,0.2)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {state.aiResult?.guidance && <GuidanceCard guidance={state.aiResult.guidance} />}
            {!state.aiResult?.guidance && state.aiResult?.message && (
              <div style={{ background: 'rgba(200,147,43,0.12)', borderRadius: '14px', padding: '13px 14px' }}>
                <p style={{ fontSize: '13px', color: '#9A6F18' }}>{state.aiResult.message}</p>
              </div>
            )}
            <MealTypeSelector />
            {renderFoodEditor("#FFFDF9")}
            {renderFeelingInput("#FFFDF9")}
            <div style={{ display: 'flex', gap: '10px' }}>
              {!state.imagePreview && (
                <button onClick={() => update({ phase: 'manual', aiResult: null, saved: false })} style={{ flex: 1, padding: '12px', borderRadius: '999px', background: 'transparent', color: '#012374', fontSize: '14px', fontWeight: 600, border: '1px solid rgba(1,35,116,0.25)', cursor: 'pointer' }}>
                  Edit
                </button>
              )}
              <button onClick={handleSave} disabled={state.saved} style={{ flex: 2, padding: '12px', borderRadius: '999px', background: state.saved ? '#1C7A4F' : '#012374', color: '#FFFDF9', fontSize: '14px', fontWeight: 600, border: 'none', cursor: state.saved ? 'default' : 'pointer' }}>
                {state.saved ? '✓ Meal saved' : 'Save meal'}
              </button>
            </div>
            {state.saved && (
              <Link href="/meal-history" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '12px', borderRadius: '999px', background: '#F7EFE1', border: '1px solid rgba(1,35,116,0.15)', color: '#012374', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
                View meal history
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#012374" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            )}
          </>
        )}

        <div style={{ background: 'rgba(200,147,43,0.12)', borderRadius: '14px', padding: '13px 14px' }}>
          <p style={{ fontSize: '12.5px', color: '#9A6F18', lineHeight: 1.5 }}>
            Tracking what you eat helps you spot patterns in how your body responds to different meals.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );

  // ── WEB ────────────────────────────────────────────────────────────────────

  const WebLayout = (
    <div className="hidden lg:flex" style={{ minHeight: '100vh', background: '#F7EFE1' }}>
      <style>{SCAN_STYLE}</style>
      <WebNav />

      <main style={{ flex: 1, padding: '34px 44px', overflowY: 'auto' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#C8932B', fontWeight: 700 }}>Meal log · Add a meal</div>
        <h1 className="font-serif-italic" style={{ fontSize: 38, color: '#012374', marginTop: 6, lineHeight: 1.05 }}>Snap your plate, eat with a plan.</h1>
        <p style={{ fontSize: 16, color: 'rgba(22,24,42,0.65)', marginTop: 4 }}>Take a photo and Chatita will read your plate and build a gentle eating order.</p>

        {state.error && (
          <div style={{ marginTop: '16px', background: 'rgba(181,86,46,0.10)', border: '1px solid rgba(181,86,46,0.22)', borderRadius: '12px', padding: '12px 16px' }}>
            <p style={{ fontSize: '13px', color: '#B5562E' }}>{state.error}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: '22px', marginTop: '28px' }}>
          {/* Left card */}
          <div style={{ background: '#FFFDF9', borderRadius: '22px', border: '1px solid rgba(1,35,116,0.07)', padding: '24px', display: 'flex', flexDirection: 'column' as const, gap: '18px' }}>
            {state.phase === 'idle' && (
              <>
                <PhotoZone />
                <button onClick={() => update({ phase: 'manual', error: null })} style={{ fontSize: '13px', color: '#012374', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textAlign: 'left' as const, padding: 0 }}>
                  Or add meal details manually →
                </button>
              </>
            )}
            {state.phase === 'scanning' && <ScanningBox label={state.imagePreview ? 'Analyzing your plate…' : 'Getting your eating plan…'} />}
            {state.phase === 'manual' && (
              <>
                {renderFoodEditor("#F7EFE1")}
                <button onClick={handleGetGuidance} disabled={state.foods.length === 0} style={{ padding: '12px', borderRadius: '999px', background: state.foods.length > 0 ? '#012374' : 'rgba(1,35,116,0.3)', color: '#FFFDF9', fontSize: '14px', fontWeight: 600, border: 'none', cursor: state.foods.length > 0 ? 'pointer' : 'not-allowed' }}>
                  Get eating guidance →
                </button>
                <button onClick={() => update({ phase: 'idle', error: null })} style={{ fontSize: '13px', color: 'rgba(1,35,116,0.5)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const, padding: 0 }}>
                  ← Take a photo instead
                </button>
              </>
            )}
            {state.phase === 'detected' && (
              <>
                {state.imagePreview && (
                  <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', height: '180px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={state.imagePreview} alt="Your meal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => update({ phase: 'idle', imagePreview: null, aiResult: null, foods: [], saved: false })} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.45)', color: '#FFFDF9', border: 'none', borderRadius: '999px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>Retake</button>
                  </div>
                )}
                <MealTypeSelector />
                {renderFoodEditor("#F7EFE1")}
                {renderFeelingInput("#F7EFE1")}
                <button onClick={handleSave} disabled={state.saved} style={{ padding: '13px', borderRadius: '999px', background: state.saved ? '#1C7A4F' : '#012374', color: '#FFFDF9', fontSize: '15px', fontWeight: 700, border: 'none', cursor: state.saved ? 'default' : 'pointer' }}>
                  {state.saved ? '✓ Meal saved' : 'Save meal'}
                </button>
                {state.saved && (
                  <Link href="/meal-history" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px', borderRadius: '999px', background: '#F7EFE1', border: '1px solid rgba(1,35,116,0.15)', color: '#012374', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
                    View meal history
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#012374" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right panel */}
          <div>
            {state.phase !== 'detected' ? (
              <div style={{ background: '#FFFDF9', borderRadius: '22px', border: '2px dashed rgba(1,35,116,0.12)', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' as const, gap: '8px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="7" width="20" height="14" rx="3" stroke="#012374" strokeWidth="1.4" opacity={0.3}/>
                  <circle cx="12" cy="14" r="3" stroke="#012374" strokeWidth="1.4" opacity={0.3}/>
                </svg>
                <p style={{ fontSize: '14px', color: 'rgba(1,35,116,0.35)', fontWeight: 500 }}>Your eating guidance will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
                <DetectedFoodsCard />
                {/* Correction flow */}
                {!state.correcting ? (
                  <button
                    onClick={() => update({ correcting: true })}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9A6F18', background: 'rgba(200,147,43,0.1)', border: '1px solid rgba(200,147,43,0.2)', borderRadius: 12, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', alignSelf: 'flex-start' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#9A6F18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#9A6F18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Not right? Correct it
                  </button>
                ) : (
                  <div style={{ background: '#FFFDF9', borderRadius: 18, border: '1.5px solid rgba(200,147,43,0.28)', padding: '18px' }}>
                    <p style={{ fontSize: 11, color: '#9A6F18', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 12 }}>What is it really?</p>
                    <textarea
                      value={state.correctionText}
                      onChange={e => update({ correctionText: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCorrect(); } }}
                      placeholder="e.g. chicken biryani, naan bread, raita"
                      rows={2}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(1,35,116,0.14)', background: '#F7EFE1', fontSize: 14, color: '#001A4D', outline: 'none', resize: 'none' as const, boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
                    />
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <button onClick={handleCorrect} disabled={!state.correctionText.trim()} style={{ flex: 2, padding: '11px', borderRadius: 999, background: state.correctionText.trim() ? '#012374' : 'rgba(1,35,116,0.3)', color: '#FFFDF9', fontSize: 14, fontWeight: 700, border: 'none', cursor: state.correctionText.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                        Regenerate guidance →
                      </button>
                      <button onClick={() => update({ correcting: false, correctionText: '' })} style={{ flex: 1, padding: '11px', borderRadius: 999, background: 'transparent', color: 'rgba(22,24,42,0.5)', fontSize: 14, border: '1px solid rgba(22,24,42,0.2)', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {state.aiResult?.guidance && <GuidanceCard guidance={state.aiResult.guidance} web />}
                {!state.aiResult?.guidance && state.aiResult?.message && (
                  <div style={{ background: 'rgba(200,147,43,0.12)', borderRadius: '14px', padding: '13px 14px' }}>
                    <p style={{ fontSize: '13px', color: '#9A6F18' }}>{state.aiResult.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <>
      {MobileLayout}
      {WebLayout}
    </>
  );
}
