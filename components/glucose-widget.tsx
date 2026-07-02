'use client';

import { useState, useEffect } from 'react';

type GlucoseContext = 'fasting' | 'pre-meal' | 'post-meal' | 'bedtime' | 'random';

interface RecentMeal {
  id: string;
  aiSummary?: string;
  detectedFoods?: string;
  mealType: string;
  eatenAt: string;
}

interface GlucoseWidgetProps {
  currentValue?: number;
  minRange: number;
  maxRange: number;
  onUpdate?: (value: number, context?: GlucoseContext, relatedMealId?: string, notes?: string) => void;
}

const CONTEXT_LABELS: Record<GlucoseContext, string> = {
  fasting:    'Fasting',
  'pre-meal': 'Before meal',
  'post-meal':'After meal',
  bedtime:    'Bedtime',
  random:     'Random',
};

function getTimeString() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function GlucoseWidget({ currentValue, minRange, maxRange, onUpdate }: GlucoseWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [context, setContext] = useState<GlucoseContext>('random');
  const [notes, setNotes] = useState('');
  const [recentMeals, setRecentMeals] = useState<RecentMeal[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string | undefined>();
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [timeStr] = useState(getTimeString);

  const getStatus = (v?: number) => {
    if (!v) return null;
    if (v < minRange) return { label: 'Below range', color: '#D0021B', bg: 'rgba(208,2,27,0.12)' };
    if (v > maxRange) return { label: 'A bit above range · that\'s okay', color: '#9A6F18', bg: 'rgba(200,147,43,0.16)' };
    return { label: 'In range', color: '#4A8C00', bg: 'rgba(126,211,33,0.15)' };
  };

  const status = getStatus(currentValue);

  // Range bar: target zone left% and right%, current dot left%
  // Scale: 40–300 mg/dL → 0–100%
  const toPercent = (v: number) => Math.min(100, Math.max(0, ((v - 40) / 260) * 100));
  const targetLeft = toPercent(minRange);
  const targetRight = 100 - toPercent(maxRange);
  const dotLeft = currentValue ? toPercent(currentValue) : null;

  useEffect(() => {
    if (isEditing && (context === 'post-meal' || context === 'pre-meal')) {
      setLoadingMeals(true);
      fetch('/api/meals?limit=10')
        .then(r => r.ok ? r.json() : { meals: [] })
        .then(d => setRecentMeals(d.meals || []))
        .catch(console.error)
        .finally(() => setLoadingMeals(false));
    }
  }, [isEditing, context]);

  const handleSave = () => {
    const v = parseFloat(inputValue);
    if (!isNaN(v) && v > 0) {
      onUpdate?.(v, context, selectedMealId, notes.trim() || undefined);
      setIsEditing(false);
      setInputValue('');
      setContext('random');
      setNotes('');
      setSelectedMealId(undefined);
      setRecentMeals([]);
    }
  };

  const getMealSummary = (meal: RecentMeal) => {
    if (meal.aiSummary) return meal.aiSummary;
    if (meal.detectedFoods) {
      try { return JSON.parse(meal.detectedFoods).join(', '); }
      catch { return meal.detectedFoods; }
    }
    return `${meal.mealType} meal`;
  };

  const getTimeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
  };

  return (
    <div
      style={{
        background: '#FFFDF9',
        borderRadius: '22px',
        padding: '18px 18px 16px',
        boxShadow: '0 12px 28px -10px rgba(1,35,116,0.28)',
        border: '1px solid rgba(1,35,116,0.07)',
      }}
    >
      {isEditing ? (
        /* ── Edit mode ── */
        <div className="space-y-4">
          {/* Value input */}
          <div>
            <label
              style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.6)', fontWeight: 600, display: 'block', marginBottom: '8px' }}
            >
              Blood Glucose (mg/dL)
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              autoFocus
              placeholder="e.g. 120"
              className="w-full focus:outline-none"
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(1,35,116,0.15)',
                background: '#F7EFE1',
                fontSize: '14px',
                color: '#001A4D',
              }}
            />
          </div>

          {/* Context pills */}
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: '8px' }}>
              When?
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CONTEXT_LABELS) as [GlucoseContext, string][]).map(([ctx, label]) => (
                <button
                  key={ctx}
                  onClick={() => setContext(ctx)}
                  style={{
                    padding: '7px 13px',
                    borderRadius: '99px',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    background: context === ctx ? '#012374' : 'transparent',
                    color: context === ctx ? '#FFFDF9' : '#012374',
                    border: `1px solid ${context === ctx ? '#012374' : 'rgba(1,35,116,0.22)'}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Meal linking */}
          {context === 'post-meal' && (
            <div>
              <p style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: '8px' }}>
                Link to meal (optional)
              </p>
              {loadingMeals ? (
                <p style={{ fontSize: '12px', color: 'rgba(1,35,116,0.4)' }}>Loading…</p>
              ) : recentMeals.length > 0 ? (
                <div className="space-y-1.5">
                  {recentMeals.slice(0, 5).map(meal => (
                    <button
                      key={meal.id}
                      onClick={() => setSelectedMealId(meal.id === selectedMealId ? undefined : meal.id)}
                      className="w-full text-left"
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: `1px solid ${selectedMealId === meal.id ? '#012374' : 'rgba(1,35,116,0.12)'}`,
                        background: selectedMealId === meal.id ? 'rgba(1,35,116,0.06)' : '#F7EFE1',
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#001A4D', textTransform: 'capitalize' }}>{meal.mealType}</p>
                          <p style={{ fontSize: '11.5px', color: 'rgba(22,24,42,0.6)', marginTop: '1px' }}>{getMealSummary(meal)}</p>
                        </div>
                        <span style={{ fontSize: '11px', color: 'rgba(1,35,116,0.5)', marginLeft: '8px', whiteSpace: 'nowrap' }}>{getTimeAgo(meal.eatenAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'rgba(1,35,116,0.4)' }}>No recent meals found</p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: '8px' }}>
              Notes (optional)
            </p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How are you feeling? Any symptoms?"
              rows={2}
              className="w-full resize-none focus:outline-none"
              style={{
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(1,35,116,0.15)',
                background: '#F7EFE1',
                fontSize: '13px',
                color: '#001A4D',
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!inputValue || parseFloat(inputValue) <= 0}
              className="flex-1 transition-all disabled:opacity-40"
              style={{
                padding: '11px',
                borderRadius: '12px',
                background: '#012374',
                color: '#FFFDF9',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 10px 22px -10px rgba(1,35,116,0.5)',
              }}
            >
              Save Reading
            </button>
            <button
              onClick={() => { setIsEditing(false); setInputValue(''); setContext('random'); setNotes(''); setSelectedMealId(undefined); setRecentMeals([]); }}
              className="flex-1 transition-all"
              style={{
                padding: '11px',
                borderRadius: '12px',
                border: '1px solid rgba(1,35,116,0.2)',
                background: 'transparent',
                color: '#001A4D',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* ── Display mode — matching exact HTML design ── */
        <>
          {/* Header row */}
          <div className="flex items-baseline justify-between">
            <span style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#001A4D', opacity: 0.6, fontWeight: 600 }}>
              Today&apos;s Glucose
            </span>
            <button
              onClick={() => setIsEditing(true)}
              style={{ fontSize: '11px', color: '#C8932B', fontWeight: 700, padding: '14px 10px', margin: '-14px -10px' }}
            >
              + {currentValue ? 'Update' : 'Add reading'}
            </button>
          </div>

          {/* Big serif number */}
          <div className="flex items-baseline gap-[10px]" style={{ marginTop: '6px' }}>
            <span
              className="font-serif"
              style={{ fontSize: '60px', color: '#012374', lineHeight: 0.85 }}
            >
              {currentValue ?? '—'}
            </span>
            <span style={{ fontSize: '14px', color: '#16182A', opacity: 0.55, paddingBottom: '8px' }}>
              {currentValue ? 'mg/dL' : 'mg/dL · no data yet'}
            </span>
          </div>

          {/* Status pill */}
          {status && (
            <div
              style={{
                marginTop: '12px',
                display: 'inline-block',
                padding: '6px 14px',
                borderRadius: '999px',
                background: status.bg,
                color: status.color,
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              {status.label}
            </div>
          )}

          {/* Range bar with target zone */}
          <div style={{ marginTop: '16px', position: 'relative', height: '9px', background: '#F7EFE1', borderRadius: '99px' }}>
            {/* Target zone band */}
            <div
              style={{
                position: 'absolute',
                left: `${targetLeft}%`,
                right: `${targetRight}%`,
                top: 0,
                bottom: 0,
                background: 'rgba(1,35,116,0.5)',
                borderRadius: '99px',
              }}
            />
            {/* Current value dot */}
            {dotLeft !== null && (
              <div
                style={{
                  position: 'absolute',
                  left: `${dotLeft}%`,
                  top: '-4px',
                  width: '17px',
                  height: '17px',
                  borderRadius: '50%',
                  background: '#C8932B',
                  border: '3px solid #FFFDF9',
                  transform: 'translateX(-50%)',
                }}
              />
            )}
          </div>
          <div
            className="flex justify-between"
            style={{ marginTop: '6px', fontSize: '11px', color: '#16182A', opacity: 0.65 }}
          >
            <span>Low</span>
            <span>{minRange} – {maxRange} mg/dL</span>
            <span>High</span>
          </div>

          {/* ADA-aligned clinical safety banners — non-dismissible */}
          {currentValue !== undefined && currentValue < 54 && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(208,2,27,0.1)',
                border: '1px solid rgba(208,2,27,0.3)',
                color: '#D0021B',
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              ⚠️ Very low — treat immediately. If you feel confused or cannot swallow safely, call 911.
            </div>
          )}
          {currentValue !== undefined && currentValue >= 54 && currentValue < 70 && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(208,2,27,0.07)',
                border: '1px solid rgba(208,2,27,0.2)',
                color: '#D0021B',
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              ⚠️ Low — treat now with 15g fast-acting carbs. Recheck in 15 minutes.
            </div>
          )}
          {currentValue !== undefined && currentValue >= 240 && currentValue < 300 && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(200,147,43,0.12)',
                border: '1px solid rgba(200,147,43,0.4)',
                color: '#9A6F18',
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              ⚠️ High — check ketones if you have strips. Follow your care plan or contact your care team.
            </div>
          )}
          {currentValue !== undefined && currentValue >= 300 && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(208,2,27,0.1)',
                border: '1px solid rgba(208,2,27,0.3)',
                color: '#D0021B',
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              ⚠️ Very high — please contact your care team or seek urgent care.
            </div>
          )}
        </>
      )}
    </div>
  );
}
