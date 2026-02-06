'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
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

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            Meal Plan Generator
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Generate personalized meal plans based on your history
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Configuration Form */}
        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="font-semibold mb-4">Plan Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Days
              </label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days (1 week)</option>
                <option value={14}>14 days (2 weeks)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Calories per Day
              </label>
              <input
                type="number"
                value={targetCalories}
                onChange={(e) => setTargetCalories(Number(e.target.value))}
                min={1200}
                max={4000}
                step={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Carbs per Meal (g)
              </label>
              <input
                type="number"
                value={maxCarbs}
                onChange={(e) => setMaxCarbs(Number(e.target.value))}
                min={10}
                max={200}
                step={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            onClick={generateMealPlan}
            disabled={loading}
            className="w-full mt-6 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
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
              <p className="text-sm text-gray-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-card border border-primary/20 p-6">
            <h2 className="font-semibold text-lg mb-4">Plan Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{summary.days}</div>
                <div className="text-sm text-gray-600 mt-1">Days</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{summary.avgCaloriesPerDay}</div>
                <div className="text-sm text-gray-600 mt-1">Avg Cal/Day</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{summary.avgCarbsPerDay}g</div>
                <div className="text-sm text-gray-600 mt-1">Avg Carbs/Day</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{summary.basedOnMeals}</div>
                <div className="text-sm text-gray-600 mt-1">Meals Used</div>
              </div>
            </div>
          </div>
        )}

        {/* Meal Plan */}
        {mealPlan && mealPlan.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Your {days}-Day Meal Plan</h2>

            {mealPlan.map((day) => (
              <div key={day.day} className="bg-white rounded-card shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">
                      Day {day.day} - {day.date}
                    </h3>
                  </div>
                  <div className="text-sm text-gray-600">
                    {day.totalCalories} cal | {day.totalCarbs}g carbs
                  </div>
                </div>

                <div className="space-y-3">
                  {day.meals.map((meal, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase">
                            {meal.category}
                          </div>
                          <div className="font-medium text-gray-900 mt-1">{meal.name}</div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${getImpactColor(
                            meal.expectedGlucoseImpact
                          )}`}
                        >
                          {meal.expectedGlucoseImpact} impact
                        </span>
                      </div>

                      <div className="flex gap-4 text-sm text-gray-600 mt-2">
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
          <div className="bg-white rounded-card shadow-card p-8 text-center">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Meal Plan Yet</h3>
            <p className="text-gray-600 text-sm">
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
