'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import BackButton from '@/components/back-button';
import { Calendar, ChefHat, TrendingUp, Loader2, AlertCircle, Download } from 'lucide-react';

interface MealPlanDay {
  day: number;
  date: string;
  meals: Array<{
    category: string;
    name: string;
    calories?: number;
    carbs?: number;
    protein?: number;
    expectedGlucoseImpact: string;
  }>;
  totalCalories: number;
  totalCarbs: number;
}

interface MealPlanSummary {
  days: number;
  avgCaloriesPerDay: number;
  avgCarbsPerDay: number;
  basedOnMeals: number;
}

export default function MealPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlanDay[] | null>(null);
  const [summary, setSummary] = useState<MealPlanSummary | null>(null);

  // Form state
  const [days, setDays] = useState(7);
  const [targetCalories, setTargetCalories] = useState(2000);
  const [maxCarbs, setMaxCarbs] = useState(150);

  const generateMealPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/meal-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days, targetCalories, maxCarbs }),
      });

      if (response.ok) {
        const data = await response.json();
        setMealPlan(data.mealPlan);
        setSummary(data.summary);
      } else {
        const data = await response.json();
        setError(data.message || data.error || 'Failed to generate meal plan');
      }
    } catch (err) {
      console.error('Generate meal plan error:', err);
      setError('Failed to generate meal plan');
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low':
        return 'bg-success/10 text-success border-success/20';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'high':
        return 'bg-danger/10 text-danger border-danger/20';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(1,35,116,0.15)',
    background: '#F7EFE1',
    fontSize: '14px',
    color: '#001A4D',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '8px',
    color: '#001A4D',
  };

  return (
    <div className="min-h-screen mobile-page-pb" style={{ background: '#F7EFE1' }}>
      {/* Header */}
      <div style={{ background: '#FFFDF9', borderBottom: '1px solid rgba(1,35,116,0.07)' }}>
        <div className="max-w-2xl mx-auto px-6 py-4">
          <BackButton href="/home" />
          <h1 className="font-serif-italic flex items-center gap-2 mt-2" style={{ fontSize: '1.6rem', color: '#012374' }}>
            <ChefHat className="w-6 h-6" />
            Meal Plan Generator
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(1,35,116,0.55)' }}>
            Generate personalized meal plans based on your history
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Configuration Form */}
        <div className="rounded-card shadow-card p-6" style={{ background: '#FFFDF9' }}>
          <h2 className="font-serif-italic mb-4" style={{ fontSize: '1.1rem', color: '#001A4D' }}>Plan Configuration</h2>

          <div className="space-y-4">
            <div>
              <label style={labelStyle}>Number of Days</label>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={inputStyle}>
                <option value={3}>3 days</option>
                <option value={7}>7 days (1 week)</option>
                <option value={14}>14 days (2 weeks)</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Target Calories per Day</label>
              <input
                type="number"
                value={targetCalories}
                onChange={(e) => setTargetCalories(Number(e.target.value))}
                min={1200} max={4000} step={100}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Max Carbs per Meal (g)</label>
              <input
                type="number"
                value={maxCarbs}
                onChange={(e) => setMaxCarbs(Number(e.target.value))}
                min={10} max={200} step={5}
                style={inputStyle}
              />
            </div>
          </div>

          <button
            onClick={generateMealPlan}
            disabled={loading}
            className="w-full mt-6 py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              borderRadius: '999px',
              background: '#012374',
              color: '#FFFDF9',
              boxShadow: '0 10px 22px -10px rgba(1,35,116,0.5)',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                Generate Meal Plan
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-danger">Error</p>
              <p className="text-sm mt-1" style={{ color: '#16182A' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="rounded-card border p-6" style={{ background: 'rgba(1,35,116,0.05)', border: '1px solid rgba(1,35,116,0.12)' }}>
            <h2 className="font-serif-italic mb-4" style={{ fontSize: '1.1rem', color: '#001A4D' }}>Plan Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: summary.days, label: 'Days' },
                { value: summary.avgCaloriesPerDay, label: 'Avg Cal/Day' },
                { value: `${summary.avgCarbsPerDay}g`, label: 'Avg Carbs/Day' },
                { value: summary.basedOnMeals, label: 'Meals Used' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-3xl font-bold" style={{ color: '#012374' }}>{value}</div>
                  <div className="text-sm mt-1" style={{ color: 'rgba(1,35,116,0.55)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meal Plan */}
        {mealPlan && mealPlan.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-serif-italic" style={{ fontSize: '1.15rem', color: '#001A4D' }}>Your {days}-Day Meal Plan</h2>

            {mealPlan.map((day) => (
              <div key={day.day} className="rounded-card shadow-card p-6" style={{ background: '#FFFDF9' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" style={{ color: '#012374' }} />
                    <h3 className="font-semibold" style={{ color: '#001A4D' }}>
                      Day {day.day} — {day.date}
                    </h3>
                  </div>
                  <div className="text-sm" style={{ color: 'rgba(1,35,116,0.55)' }}>
                    {day.totalCalories} cal | {day.totalCarbs}g carbs
                  </div>
                </div>

                <div className="space-y-3">
                  {day.meals.map((meal, idx) => (
                    <div
                      key={idx}
                      className="p-4 transition-colors rounded-[14px]"
                      style={{ border: '1px solid rgba(1,35,116,0.08)', background: 'rgba(1,35,116,0.02)' }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-xs font-semibold uppercase" style={{ color: 'rgba(1,35,116,0.45)', letterSpacing: '0.06em' }}>
                            {meal.category}
                          </div>
                          <div className="font-medium mt-1" style={{ color: '#001A4D' }}>{meal.name}</div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${getImpactColor(meal.expectedGlucoseImpact)}`}
                        >
                          {meal.expectedGlucoseImpact} impact
                        </span>
                      </div>

                      <div className="flex gap-4 text-sm mt-2" style={{ color: 'rgba(1,35,116,0.55)' }}>
                        {meal.calories && <span>{meal.calories} cal</span>}
                        {meal.carbs && <span>{meal.carbs}g carbs</span>}
                        {meal.protein && <span>{meal.protein}g protein</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!mealPlan && !loading && !error && (
          <div className="rounded-card shadow-card p-8 text-center" style={{ background: '#FFFDF9' }}>
            <ChefHat className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgba(1,35,116,0.2)' }} />
            <h3 className="font-serif-italic mb-2" style={{ fontSize: '1.1rem', color: '#001A4D' }}>No Meal Plan Yet</h3>
            <p className="text-sm" style={{ color: 'rgba(1,35,116,0.55)' }}>
              Configure your preferences above and click Generate to create a personalized meal
              plan based on your meal history.
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
