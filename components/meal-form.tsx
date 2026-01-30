'use client';

import { useState } from 'react';
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
}

interface MealFormProps {
  onSubmit: (data: MealFormData) => void;
  loading?: boolean;
}

export default function MealForm({ onSubmit, loading }: MealFormProps) {
  const [formData, setFormData] = useState<MealFormData>({
    description: '',
    detectedFoods: [],
    mealType: 'lunch',
  });

  const [foodInput, setFoodInput] = useState('');
  const [showNutrition, setShowNutrition] = useState(false);

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
