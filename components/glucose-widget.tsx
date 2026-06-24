'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

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

export default function GlucoseWidget({
  currentValue,
  minRange,
  maxRange,
  onUpdate,
}: GlucoseWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(currentValue?.toString() || '');
  const [context, setContext] = useState<GlucoseContext>('random');
  const [notes, setNotes] = useState('');
  const [recentMeals, setRecentMeals] = useState<RecentMeal[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string | undefined>();
  const [loadingMeals, setLoadingMeals] = useState(false);

  const getStatus = (value?: number) => {
    if (!value) return { label: 'No reading', color: 'gray' };
    if (value < minRange) return { label: 'Low', color: 'danger' };
    if (value > maxRange) return { label: 'High', color: 'warning' };
    return { label: 'In Range', color: 'success' };
  };

  const status = getStatus(currentValue);

  const statusStyle = {
    success: { background: 'rgba(126,211,33,0.15)', color: '#4A8C00' },
    danger:  { background: 'rgba(208,2,27,0.12)', color: '#D0021B' },
    warning: { background: 'rgba(245,166,35,0.15)', color: '#9A6F18' },
    gray:    { background: 'rgba(1,35,116,0.08)', color: 'rgba(1,35,116,0.6)' },
  }[status.color];

  useEffect(() => {
    if (isEditing && (context === 'post-meal' || context === 'pre-meal')) {
      fetchRecentMeals();
    }
  }, [isEditing, context]);

  const fetchRecentMeals = async () => {
    setLoadingMeals(true);
    try {
      const res = await fetch('/api/meals?limit=10');
      if (res.ok) {
        const data = await res.json();
        setRecentMeals(data.meals || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent meals:', error);
    } finally {
      setLoadingMeals(false);
    }
  };

  const handleSave = () => {
    const value = parseFloat(inputValue);
    if (!isNaN(value) && value > 0) {
      onUpdate?.(value, context, selectedMealId, notes.trim() || undefined);
      setIsEditing(false);
      setInputValue('');
      setContext('random');
      setNotes('');
      setSelectedMealId(undefined);
      setRecentMeals([]);
    }
  };

  const getContextLabel = (ctx: GlucoseContext) => {
    const labels: Record<GlucoseContext, { emoji: string; label: string }> = {
      fasting:    { emoji: '🌅', label: 'Fasting' },
      'pre-meal': { emoji: '🍽️', label: 'Before meal' },
      'post-meal':{ emoji: '⏱️', label: 'After meal' },
      bedtime:    { emoji: '🌙', label: 'Bedtime' },
      random:     { emoji: '📊', label: 'Random' },
    };
    return labels[ctx];
  };

  const getMealSummary = (meal: RecentMeal) => {
    if (meal.aiSummary) return meal.aiSummary;
    if (meal.detectedFoods) {
      try { return JSON.parse(meal.detectedFoods).join(', '); }
      catch { return meal.detectedFoods; }
    }
    return `${meal.mealType} meal`;
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Range bar position (40–400 mg/dL scale)
  const rangePercent = currentValue
    ? Math.min(100, Math.max(0, ((currentValue - 40) / 360) * 100))
    : null;

  return (
    <div
      className="p-5 transition-all"
      style={{
        background: 'var(--bg-card)',
        borderRadius: '22px',
        border: '1px solid var(--border-card)',
        boxShadow: '0 12px 28px -10px rgba(1,35,116,0.22)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: 'var(--text-muted)' }}
        >
          Blood Glucose
        </p>
        {currentValue && (
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-chip"
            style={statusStyle}
          >
            {status.label}
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Number input */}
          <div>
            <label
              className="block text-xs font-semibold mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Blood Glucose (mg/dL)
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(1,35,116,0.15)',
                background: 'var(--bg-card-alt)',
                color: 'var(--text-primary)',
              }}
              placeholder="e.g. 120"
              autoFocus
            />
          </div>

          {/* Context selector */}
          <div>
            <label
              className="block text-xs font-semibold mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              When did you measure?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['fasting', 'pre-meal', 'post-meal', 'bedtime', 'random'] as GlucoseContext[]).map((ctx) => {
                const { emoji, label } = getContextLabel(ctx);
                const selected = context === ctx;
                return (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => setContext(ctx)}
                    className="px-2 py-2.5 text-xs font-semibold transition-all"
                    style={{
                      borderRadius: '10px',
                      border: `1px solid ${selected ? '#012374' : 'rgba(1,35,116,0.15)'}`,
                      background: selected ? '#012374' : 'var(--bg-card-alt)',
                      color: selected ? '#FFFDF9' : 'var(--text-primary)',
                    }}
                  >
                    <span className="block text-base mb-0.5">{emoji}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meal linking */}
          {context === 'post-meal' && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                <Clock className="w-3.5 h-3.5" />
                Link to recent meal (optional)
              </label>
              {loadingMeals ? (
                <div className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>Loading meals…</div>
              ) : recentMeals.length > 0 ? (
                <div className="space-y-2">
                  {recentMeals.slice(0, 5).map((meal) => (
                    <button
                      key={meal.id}
                      type="button"
                      onClick={() => setSelectedMealId(meal.id === selectedMealId ? undefined : meal.id)}
                      className="w-full text-left px-3 py-2.5 text-sm transition-all"
                      style={{
                        borderRadius: '12px',
                        border: `1px solid ${selectedMealId === meal.id ? '#012374' : 'rgba(1,35,116,0.12)'}`,
                        background: selectedMealId === meal.id ? 'rgba(1,35,116,0.06)' : 'var(--bg-card-alt)',
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{meal.mealType}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{getMealSummary(meal)}</p>
                        </div>
                        <span className="text-[10px] ml-2 shrink-0" style={{ color: 'var(--text-muted)' }}>{getTimeAgo(meal.eatenAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No recent meals found</p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling? Any symptoms?"
              rows={2}
              className="w-full px-3 py-2.5 text-sm focus:outline-none resize-none"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(1,35,116,0.15)',
                background: 'var(--bg-card-alt)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!inputValue || parseFloat(inputValue) <= 0}
              className="flex-1 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                borderRadius: '12px',
                background: '#012374',
                color: '#FFFDF9',
                boxShadow: '0 10px 22px -10px rgba(1,35,116,0.5)',
              }}
            >
              Save Reading
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setInputValue(currentValue?.toString() || '');
                setContext('random');
                setNotes('');
                setSelectedMealId(undefined);
                setRecentMeals([]);
              }}
              className="flex-1 py-2.5 text-sm font-semibold transition-all"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(1,35,116,0.2)',
                background: 'transparent',
                color: 'var(--text-primary)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Large serif number display */}
          <div className="flex items-end gap-2 mb-5">
            <span
              className="leading-none font-serif"
              style={{ fontSize: '64px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              {currentValue ?? '—'}
            </span>
            <span
              className="text-sm font-medium mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              mg/dL
            </span>
          </div>

          {/* Range bar */}
          <div className="mb-5">
            <div
              className="relative h-2 rounded-full overflow-visible"
              style={{ background: '#F7EFE1' }}
            >
              {/* Fill bar */}
              {rangePercent !== null && (
                <div
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{
                    width: `${rangePercent}%`,
                    background: status.color === 'success'
                      ? 'rgba(1,35,116,0.5)'
                      : status.color === 'danger'
                      ? '#D0021B'
                      : '#F5A623',
                    transition: 'width 0.4s ease',
                  }}
                />
              )}
              {/* Indicator dot */}
              {rangePercent !== null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full"
                  style={{
                    left: `calc(${rangePercent}% - 9px)`,
                    background: '#C8932B',
                    border: '3px solid #FFFDF9',
                    boxShadow: '0 2px 8px rgba(200,147,43,0.5)',
                  }}
                />
              )}
            </div>
            <div
              className="flex justify-between text-[10px] font-semibold mt-2"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>Low</span>
              <span>{minRange}–{maxRange} mg/dL target</span>
              <span>High</span>
            </div>
          </div>

          {/* Clinical safety banners — deterministic, non-dismissible */}
          {currentValue !== undefined && currentValue < 54 && (
            <div
              className="p-3 text-sm font-semibold rounded-[12px] mb-4"
              style={{ background: 'rgba(208,2,27,0.1)', border: '1px solid #D0021B', color: '#D0021B' }}
            >
              ⚠️ This reading may be an emergency. Seek medical care immediately.
            </div>
          )}
          {currentValue !== undefined && currentValue > 250 && (
            <div
              className="p-3 text-sm font-semibold rounded-[12px] mb-4"
              style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid #F5A623', color: '#9A6F18' }}
            >
              ⚠️ This is a very high reading. Contact your healthcare provider.
            </div>
          )}

          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-2.5 text-sm font-semibold transition-all"
            style={{
              borderRadius: '12px',
              border: '1px solid rgba(1,35,116,0.2)',
              background: 'transparent',
              color: '#012374',
            }}
          >
            {currentValue ? 'Update Reading' : 'Add Reading'}
          </button>
        </>
      )}
    </div>
  );
}
