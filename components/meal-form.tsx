'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X, Search, Loader2 } from 'lucide-react';
import { MealType } from '@/types';
import { useTranslation } from '@/lib/i18n/context';
import FoodSearchInput from './food-search-input';

interface FoodEntry {
  id?: string;
  fdcId?: string;
  barcode?: string;
  foodName: string;
  foodNameEs?: string;
  brand?: string;
  servingSize: string;
  servingsEaten: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  source: 'usda' | 'barcode' | 'custom' | 'manual';
}

interface MealFormData {
  detectedFoods: string[];
  foodEntries: FoodEntry[]; // NEW: Individual food items
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
}

interface MealFormProps {
  onSubmit: (data: MealFormData) => void;
  loading?: boolean;
  initialData?: {
    detectedFoods: string[];
    nutrition?: {
      calories?: number;
      carbs?: number;
      protein?: number;
      fat?: number;
      fiber?: number;
      sugar?: number;
      sodium?: number;
    };
    portionSize?: string;
    // Full-meal fields used in edit mode
    mealType?: MealType;
    feeling?: string;
    restaurantName?: string;
    restaurantAddress?: string;
    restaurantPlaceId?: string;
  };
  /** When true the form is in "edit" mode: pre-expands sections that have data, submit button says "Save Changes" */
  editMode?: boolean;
}

export default function MealForm({ onSubmit, loading, initialData, editMode }: MealFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<MealFormData>({
    detectedFoods: [],
    foodEntries: [], // NEW
    mealType: 'lunch',
  });

  const [foodInput, setFoodInput] = useState('');
  const [showNutrition, setShowNutrition] = useState(false);
  const [showEnhancedSearch, setShowEnhancedSearch] = useState(false); // NEW: Toggle between simple/enhanced
  const [enhancing, setEnhancing] = useState(false);
  const [aiEnhancement, setAiEnhancement] = useState<any>(null);

  // Restaurant search state
  const [restaurantQuery, setRestaurantQuery] = useState(formData.restaurantName || '');
  const [restaurantSuggestions, setRestaurantSuggestions] = useState<{ id: string; name: string; cuisine: string; address: string }[]>([]);
  const [searchingRestaurant, setSearchingRestaurant] = useState(false);
  const [showRestaurantSuggestions, setShowRestaurantSuggestions] = useState(false);
  const restaurantDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restaurantWrapperRef = useRef<HTMLDivElement>(null);

  // Auto-fill form when AI provides suggestions or edit-mode pre-populates
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        detectedFoods: initialData.detectedFoods || prev.detectedFoods,
        calories: initialData.nutrition?.calories || prev.calories,
        carbs: initialData.nutrition?.carbs || prev.carbs,
        protein: initialData.nutrition?.protein || prev.protein,
        fat: initialData.nutrition?.fat || prev.fat,
        fiber: initialData.nutrition?.fiber || prev.fiber,
        sugar: initialData.nutrition?.sugar || prev.sugar,
        sodium: initialData.nutrition?.sodium || prev.sodium,
        portionSize: initialData.portionSize || prev.portionSize,
        // Full-meal fields (edit mode)
        ...(initialData.mealType && { mealType: initialData.mealType }),
        ...(initialData.feeling !== undefined && { feeling: initialData.feeling }),
        ...(initialData.restaurantName !== undefined && { restaurantName: initialData.restaurantName }),
        ...(initialData.restaurantAddress !== undefined && { restaurantAddress: initialData.restaurantAddress }),
        ...(initialData.restaurantPlaceId !== undefined && { restaurantPlaceId: initialData.restaurantPlaceId }),
      }));

      // In edit mode, pre-expand sections that have data
      if (editMode) {
        if (initialData.nutrition && Object.keys(initialData.nutrition).length > 0) {
          setShowNutrition(true);
        }
        if (initialData.restaurantName) {
          setRestaurantQuery(initialData.restaurantName);
        }
      }
    }
  }, [initialData, editMode]);

  // Close restaurant suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (restaurantWrapperRef.current && !restaurantWrapperRef.current.contains(e.target as Node)) {
        setShowRestaurantSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchRestaurantSuggestions = async (query: string) => {
    if (query.trim().length < 1) {
      setRestaurantSuggestions([]);
      setShowRestaurantSuggestions(false);
      return;
    }
    setSearchingRestaurant(true);
    try {
      const res = await fetch('/api/restaurants/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'name', query: query.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setRestaurantSuggestions(data.suggestions || []);
        setShowRestaurantSuggestions(true);
      }
    } catch {
      setRestaurantSuggestions([]);
    } finally {
      setSearchingRestaurant(false);
    }
  };

  const handleRestaurantQueryChange = (value: string) => {
    setRestaurantQuery(value);
    // also keep the raw name in formData so manual entry still works
    setFormData((prev) => ({ ...prev, restaurantName: value }));
    if (restaurantDebounceRef.current) clearTimeout(restaurantDebounceRef.current);
    restaurantDebounceRef.current = setTimeout(() => fetchRestaurantSuggestions(value), 350);
  };

  const selectRestaurantSuggestion = (s: { id: string; name: string; cuisine: string; address: string }) => {
    setShowRestaurantSuggestions(false);
    setRestaurantQuery(s.name);
    setFormData((prev) => ({
      ...prev,
      restaurantName: s.name,
      restaurantAddress: s.address,
      restaurantPlaceId: s.id,
    }));
  };

  const addFood = () => {
    if (foodInput.trim()) {
      setFormData({
        ...formData,
        detectedFoods: [...formData.detectedFoods, foodInput.trim()],
      });
      setFoodInput('');
    }
  };

  const removeFood = (index: number) => {
    setFormData({
      ...formData,
      detectedFoods: formData.detectedFoods.filter((_, i) => i !== index),
    });
  };

  // NEW: Enhanced food entry handlers
  const handleAddFoodEntry = (food: FoodEntry) => {
    const newFoodEntries = [...formData.foodEntries, food];
    updateFormWithFoodEntries(newFoodEntries);
  };

  const handleRemoveFoodEntry = (index: number) => {
    const newFoodEntries = formData.foodEntries.filter((_, i) => i !== index);
    updateFormWithFoodEntries(newFoodEntries);
  };

  const handleUpdateServings = (index: number, servings: number) => {
    const newFoodEntries = formData.foodEntries.map((food, i) =>
      i === index ? { ...food, servingsEaten: servings } : food
    );
    updateFormWithFoodEntries(newFoodEntries);
  };

  // Auto-calculate total nutrition from food entries
  const updateFormWithFoodEntries = (foodEntries: FoodEntry[]) => {
    const totals = foodEntries.reduce(
      (acc, food) => {
        const multiplier = food.servingsEaten;
        return {
          calories: acc.calories + food.calories * multiplier,
          carbs: acc.carbs + food.carbs * multiplier,
          protein: acc.protein + food.protein * multiplier,
          fat: acc.fat + food.fat * multiplier,
          fiber: acc.fiber + (food.fiber || 0) * multiplier,
          sugar: acc.sugar + (food.sugar || 0) * multiplier,
          sodium: acc.sodium + (food.sodium || 0) * multiplier,
        };
      },
      { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );

    setFormData((prev) => ({
      ...prev,
      foodEntries,
      calories: totals.calories,
      carbs: totals.carbs,
      protein: totals.protein,
      fat: totals.fat,
      fiber: totals.fiber,
      sugar: totals.sugar,
      sodium: totals.sodium,
      detectedFoods: foodEntries.map((f) => f.foodName), // Keep detectedFoods in sync
    }));

    // Auto-show nutrition section when food entries exist
    if (foodEntries.length > 0) {
      setShowNutrition(true);
    }
  };

  const handleAiEnhancement = async () => {
    setEnhancing(true);
    setAiEnhancement(null);

    try {
      const response = await fetch('/api/enhance-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foods: formData.detectedFoods,
          mealType: formData.mealType,
          portionSize: formData.portionSize,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.mode === 'ai') {
          setAiEnhancement(data);

          // Auto-fill nutrition estimates if user wants
          if (data.nutritionEstimate) {
            setFormData((prev) => ({
              ...prev,
              calories: data.nutritionEstimate.calories || prev.calories,
              carbs: data.nutritionEstimate.carbs || prev.carbs,
              protein: data.nutritionEstimate.protein || prev.protein,
              fat: data.nutritionEstimate.fat || prev.fat,
              fiber: data.nutritionEstimate.fiber || prev.fiber,
              sugar: data.nutritionEstimate.sugar || prev.sugar,
            }));
            setShowNutrition(true);
          }
        }
      }
    } catch (err) {
      console.log('AI enhancement failed:', err);
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Meal Type */}
      <div>
        <label className="block text-sm font-medium mb-2">{t.addMeal.mealType}</label>
        <div className="grid grid-cols-4 gap-2">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ ...formData, mealType: type })}
              className={`py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${
                formData.mealType === type
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.addMeal[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Foods */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium">{t.addMeal.foods}</label>
          <button
            type="button"
            onClick={() => setShowEnhancedSearch(!showEnhancedSearch)}
            className="text-xs text-primary hover:text-primary-dark font-medium underline"
          >
            {showEnhancedSearch ? '← Simple mode' : '🔍 Search nutrition database'}
          </button>
        </div>

        {/* Enhanced Food Search (USDA + Barcode) */}
        {showEnhancedSearch ? (
          <FoodSearchInput
            onAddFood={handleAddFoodEntry}
            foodEntries={formData.foodEntries}
            onRemoveFood={handleRemoveFoodEntry}
            onUpdateServings={handleUpdateServings}
          />
        ) : (
          <>
            {/* Simple Food Input (legacy) */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={foodInput}
                onChange={(e) => setFoodInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFood();
                  }
                }}
                placeholder={t.addMeal.foodPlaceholder}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={addFood}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t.addMeal.add}
              </button>
            </div>

            {formData.detectedFoods.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.detectedFoods.map((food, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {food}
                    <button
                      type="button"
                      onClick={() => removeFood(index)}
                      className="hover:text-danger transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {/* AI Enhancement Button (only show if no photo was taken) */}
        {formData.detectedFoods.length > 0 && !initialData && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleAiEnhancement}
              disabled={enhancing}
              className="w-full py-2 px-4 bg-blue-50 border border-primary/30 text-primary rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {enhancing ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>{t.addMeal.gettingAiTips}</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>{t.addMeal.getAiTips}</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {t.addMeal.aiTipsDescription}
            </p>
          </div>
        )}

        {/* AI Enhancement Results */}
        {aiEnhancement && (
          <div className="mt-4 space-y-3">
            {/* Questions */}
            {aiEnhancement.questions && aiEnhancement.questions.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2 text-purple-900">
                  💭 {t.aiEnhancement.toImproveAccuracy}
                </h4>
                <ul className="space-y-1">
                  {aiEnhancement.questions.map((q: string, i: number) => (
                    <li key={i} className="text-sm text-purple-800 flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Nutrition Estimate */}
            {aiEnhancement.nutritionEstimate && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2 text-green-900">
                  📊 {t.aiEnhancement.estimatedNutrition} ({aiEnhancement.nutritionEstimate.confidence} {t.aiEnhancement.confidence}):
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">{t.addMeal.calories}:</span>{' '}
                    <span className="font-medium">{aiEnhancement.nutritionEstimate.calories}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t.addMeal.carbs}:</span>{' '}
                    <span className="font-medium">{aiEnhancement.nutritionEstimate.carbs}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t.addMeal.protein}:</span>{' '}
                    <span className="font-medium">{aiEnhancement.nutritionEstimate.protein}g</span>
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-2 italic">
                  {aiEnhancement.nutritionEstimate.note}
                </p>
              </div>
            )}

            {/* Diabetes Tips */}
            {aiEnhancement.diabetesTips && aiEnhancement.diabetesTips.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2 text-blue-900">💡 {t.aiEnhancement.diabetesTips}</h4>
                <ul className="space-y-1">
                  {aiEnhancement.diabetesTips.map((tip: string, i: number) => (
                    <li key={i} className="text-xs text-blue-800 flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Restaurant Location — always visible, single seamless input */}
      <div ref={restaurantWrapperRef}>
        <label className="block text-sm font-medium mb-1">{t.addMeal.restaurantLocation}</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={restaurantQuery}
            onChange={(e) => handleRestaurantQueryChange(e.target.value)}
            onFocus={() => { if (restaurantSuggestions.length > 0) setShowRestaurantSuggestions(true); }}
            placeholder={t.addMeal.restaurantNamePlaceholder}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {restaurantQuery && (
            <button
              type="button"
              onClick={() => {
                setRestaurantQuery('');
                setFormData((prev) => ({ ...prev, restaurantName: '', restaurantAddress: '', restaurantPlaceId: '' }));
                setRestaurantSuggestions([]);
                setShowRestaurantSuggestions(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown — only shown while searching or when matches exist */}
        {(searchingRestaurant || (showRestaurantSuggestions && restaurantSuggestions.length > 0)) && (
          <div className="mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {searchingRestaurant ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                {t.restaurants.searchingRestaurants}
              </div>
            ) : (
              restaurantSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectRestaurantSuggestion(s)}
                  className="w-full text-left px-3 py-2 hover:bg-primary/5 transition-colors border-b border-gray-100 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.cuisine}{s.address ? ` · ${s.address}` : ''}</p>
                </button>
              ))
            )}
          </div>
        )}

        {/* Address field — appears only after a restaurant name has been typed, and is optional */}
        {restaurantQuery.trim().length > 0 && (
          <input
            type="text"
            value={formData.restaurantAddress || ''}
            onChange={(e) => setFormData({ ...formData, restaurantAddress: e.target.value })}
            placeholder={t.addMeal.addressPlaceholder}
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        )}

        <p className="text-xs text-gray-500 mt-1.5">
          💡 {t.addMeal.restaurantTip}
        </p>
      </div>

      {/* Nutrition (Optional) */}
      <div>
        <button
          type="button"
          onClick={() => setShowNutrition(!showNutrition)}
          className="text-primary font-medium text-sm hover:underline"
        >
          {showNutrition ? t.addMeal.hideNutrition : t.addMeal.addNutrition} {t.addMeal.nutritionOptional}
        </button>

        {showNutrition && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.addMeal.calories}</label>
              <input
                type="number"
                value={formData.calories || ''}
                onChange={(e) => setFormData({ ...formData, calories: parseFloat(e.target.value) || undefined })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.addMeal.carbs}</label>
              <input
                type="number"
                value={formData.carbs || ''}
                onChange={(e) => setFormData({ ...formData, carbs: parseFloat(e.target.value) || undefined })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.addMeal.protein}</label>
              <input
                type="number"
                value={formData.protein || ''}
                onChange={(e) => setFormData({ ...formData, protein: parseFloat(e.target.value) || undefined })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.addMeal.fat}</label>
              <input
                type="number"
                value={formData.fat || ''}
                onChange={(e) => setFormData({ ...formData, fat: parseFloat(e.target.value) || undefined })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.addMeal.fiber}</label>
              <input
                type="number"
                value={formData.fiber || ''}
                onChange={(e) => setFormData({ ...formData, fiber: parseFloat(e.target.value) || undefined })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.addMeal.portionSize}</label>
              <input
                type="text"
                value={formData.portionSize || ''}
                onChange={(e) => setFormData({ ...formData, portionSize: e.target.value })}
                placeholder={t.addMeal.portionPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* Feeling */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t.addMeal.feeling}
        </label>
        <textarea
          value={formData.feeling || ''}
          onChange={(e) => setFormData({ ...formData, feeling: e.target.value })}
          placeholder={t.addMeal.feelingPlaceholder}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white py-3 rounded-button font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t.addMeal.saving : (editMode ? t.editMeal.saveChanges : t.addMeal.saveMeal)}
      </button>
    </form>
  );
}
