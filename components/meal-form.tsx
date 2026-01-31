'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { MealType } from '@/types';

interface MealFormData {
  description: string;
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
  };
}

export default function MealForm({ onSubmit, loading, initialData }: MealFormProps) {
  const [formData, setFormData] = useState<MealFormData>({
    description: '',
    detectedFoods: [],
    mealType: 'lunch',
  });

  const [foodInput, setFoodInput] = useState('');
  const [showNutrition, setShowNutrition] = useState(false);
  const [showRestaurant, setShowRestaurant] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [aiEnhancement, setAiEnhancement] = useState<any>(null);

  // Auto-fill form when AI provides suggestions
  useEffect(() => {
    if (initialData) {
      const hasNutrition = initialData.nutrition && Object.keys(initialData.nutrition).length > 0;

      setFormData(prev => ({
        ...prev,
        detectedFoods: initialData.detectedFoods || prev.detectedFoods,
        description: initialData.detectedFoods?.join(', ') || prev.description,
        calories: initialData.nutrition?.calories || prev.calories,
        carbs: initialData.nutrition?.carbs || prev.carbs,
        protein: initialData.nutrition?.protein || prev.protein,
        fat: initialData.nutrition?.fat || prev.fat,
        fiber: initialData.nutrition?.fiber || prev.fiber,
        sugar: initialData.nutrition?.sugar || prev.sugar,
        sodium: initialData.nutrition?.sodium || prev.sodium,
        portionSize: initialData.portionSize || prev.portionSize,
      }));

      // Auto-expand nutrition section if AI provided nutrition data
      if (hasNutrition) {
        setShowNutrition(true);
      }
    }
  }, [initialData]);

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

  const handleAiEnhancement = async () => {
    setEnhancing(true);
    setAiEnhancement(null);

    try {
      const response = await fetch('/api/enhance-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
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
        <label className="block text-sm font-medium mb-2">Meal Type</label>
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
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Meal Description
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., Chicken salad with avocado"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Foods */}
      <div>
        <label className="block text-sm font-medium mb-2">Foods in this meal</label>
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
            placeholder="e.g., Grilled chicken"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={addFood}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
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
                  <span>Enhancing with AI...</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>Get AI Nutrition Estimates & Tips</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              AI will estimate nutrition and ask clarifying questions for better accuracy
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
                  💭 To improve accuracy, mi amor:
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
                  📊 Estimated Nutrition ({aiEnhancement.nutritionEstimate.confidence} confidence):
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Calories:</span>{' '}
                    <span className="font-medium">{aiEnhancement.nutritionEstimate.calories}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Carbs:</span>{' '}
                    <span className="font-medium">{aiEnhancement.nutritionEstimate.carbs}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Protein:</span>{' '}
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
                <h4 className="font-semibold text-sm mb-2 text-blue-900">💡 Diabetes-Friendly Tips:</h4>
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

      {/* Restaurant Location (Optional) */}
      <div>
        <button
          type="button"
          onClick={() => setShowRestaurant(!showRestaurant)}
          className="text-primary font-medium text-sm hover:underline"
        >
          {showRestaurant ? '− Hide' : '+ Add'} Restaurant Location (Optional)
        </button>

        {showRestaurant && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Restaurant Name</label>
              <input
                type="text"
                value={formData.restaurantName || ''}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                placeholder="e.g., Chipotle, Panera Bread"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={formData.restaurantAddress || ''}
                onChange={(e) => setFormData({ ...formData, restaurantAddress: e.target.value })}
                placeholder="e.g., 123 Main St, Ann Arbor, MI"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-xs text-gray-500">
              💡 Track where you ate to identify patterns and favorite diabetes-friendly spots
            </p>
          </div>
        )}
      </div>

      {/* Nutrition (Optional) */}
      <div>
        <button
          type="button"
          onClick={() => setShowNutrition(!showNutrition)}
          className="text-primary font-medium text-sm hover:underline"
        >
          {showNutrition ? '− Hide' : '+ Add'} Nutrition Information (Optional)
        </button>

        {showNutrition && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Calories</label>
              <input
                type="number"
                value={formData.calories || ''}
                onChange={(e) => setFormData({ ...formData, calories: parseFloat(e.target.value) || undefined })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Carbs (g)</label>
              <input
                type="number"
                value={formData.carbs || ''}
                onChange={(e) => setFormData({ ...formData, carbs: parseFloat(e.target.value) || undefined })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Protein (g)</label>
              <input
                type="number"
                value={formData.protein || ''}
                onChange={(e) => setFormData({ ...formData, protein: parseFloat(e.target.value) || undefined })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fat (g)</label>
              <input
                type="number"
                value={formData.fat || ''}
                onChange={(e) => setFormData({ ...formData, fat: parseFloat(e.target.value) || undefined })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fiber (g)</label>
              <input
                type="number"
                value={formData.fiber || ''}
                onChange={(e) => setFormData({ ...formData, fiber: parseFloat(e.target.value) || undefined })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Portion Size</label>
              <input
                type="text"
                value={formData.portionSize || ''}
                onChange={(e) => setFormData({ ...formData, portionSize: e.target.value })}
                placeholder="e.g., 1 cup"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* Feeling */}
      <div>
        <label className="block text-sm font-medium mb-2">
          How did you feel after eating? (Optional)
        </label>
        <textarea
          value={formData.feeling || ''}
          onChange={(e) => setFormData({ ...formData, feeling: e.target.value })}
          placeholder="e.g., Felt satisfied and energized..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || formData.detectedFoods.length === 0}
        className="w-full bg-primary text-white py-3 rounded-button font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Save Meal'}
      </button>

      {formData.detectedFoods.length === 0 && (
        <p className="text-sm text-gray-500 text-center -mt-2">
          Add at least one food to save your meal
        </p>
      )}
    </form>
  );
}
