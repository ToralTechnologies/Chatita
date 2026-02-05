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
    if (!value) return { label: 'No data', color: 'gray' };
    if (value < minRange) return { label: 'Low', color: 'danger' };
    if (value > maxRange) return { label: 'High', color: 'warning' };
    return { label: 'In Range', color: 'success' };
  };

  const status = getStatus(currentValue);

  // Fetch recent meals when editing and context is post-meal
  useEffect(() => {
    if (isEditing && (context === 'post-meal' || context === 'pre-meal')) {
      fetchRecentMeals();
    }
  }, [isEditing, context]);

  const fetchRecentMeals = async () => {
    setLoadingMeals(true);
    try {
      // Fetch meals from the last 4 hours
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
      fasting: { emoji: '🌅', label: 'Fasting' },
      'pre-meal': { emoji: '🍽️', label: 'Before meal' },
      'post-meal': { emoji: '⏱️', label: 'After meal' },
      bedtime: { emoji: '🌙', label: 'Bedtime' },
      random: { emoji: '📊', label: 'Random' },
    };
    return labels[ctx];
  };

  const getMealSummary = (meal: RecentMeal) => {
    if (meal.aiSummary) return meal.aiSummary;
    if (meal.detectedFoods) {
      try {
        const foods = JSON.parse(meal.detectedFoods);
        return foods.join(', ');
      } catch {
        return meal.detectedFoods;
      }
    }
    return `${meal.mealType} meal`;
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <h3 className="text-lg font-semibold mb-4">Today&apos;s Glucose</h3>

      {isEditing ? (
        <div className="space-y-4">
          {/* Blood Glucose Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Blood Glucose (mg/dL)
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter value"
              autoFocus
            />
          </div>

          {/* Context Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">When did you measure?</label>
            <div className="grid grid-cols-3 gap-2">
              {(['fasting', 'pre-meal', 'post-meal', 'bedtime', 'random'] as GlucoseContext[]).map((ctx) => {
                const { emoji, label } = getContextLabel(ctx);
                return (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => setContext(ctx)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                      context === ctx
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                    }`}
                  >
                    <span className="block text-base mb-0.5">{emoji}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meal Linking (only for post-meal) */}
          {context === 'post-meal' && (
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Link to recent meal (optional)
              </label>
              {loadingMeals ? (
                <div className="text-sm text-gray-500 py-2">Loading meals...</div>
              ) : recentMeals.length > 0 ? (
                <div className="space-y-2">
                  {recentMeals.slice(0, 5).map((meal) => (
                    <button
                      key={meal.id}
                      type="button"
                      onClick={() => setSelectedMealId(meal.id === selectedMealId ? undefined : meal.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                        selectedMealId === meal.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-white border-gray-200 hover:border-primary'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{meal.mealType}</p>
                          <p className="text-xs text-gray-600">{getMealSummary(meal)}</p>
                        </div>
                        <span className="text-xs text-gray-500">{getTimeAgo(meal.eatenAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">No recent meals found</p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling? Any symptoms?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!inputValue || parseFloat(inputValue) <= 0}
              className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-gray-800 mb-2">
              {currentValue ? `${currentValue}` : '—'}
              <span className="text-2xl text-gray-500 ml-2">mg/dL</span>
            </div>
            <span
              className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${
                status.color === 'success'
                  ? 'bg-green-100 text-success'
                  : status.color === 'danger'
                  ? 'bg-red-100 text-danger'
                  : status.color === 'warning'
                  ? 'bg-yellow-100 text-warning'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {status.label}
            </span>
          </div>

          {/* Range visualization */}
          <div className="mb-4">
            <div className="h-2 bg-gradient-to-r from-danger via-success to-warning rounded-full relative">
              {currentValue && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full"
                  style={{
                    left: `${Math.min(
                      100,
                      Math.max(0, ((currentValue - 50) / 200) * 100)
                    )}%`,
                  }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low</span>
              <span>
                {minRange}-{maxRange} mg/dL
              </span>
              <span>High</span>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="w-full border border-primary text-primary py-2 rounded-lg hover:bg-primary/5 transition-colors"
          >
            {currentValue ? 'Update Reading' : 'Add Reading'}
          </button>
        </>
      )}
    </div>
  );
}
