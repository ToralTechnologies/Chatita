'use client';

import { useState } from 'react';
import { Trash2, Clock, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface MealCardProps {
  meal: {
    id: string;
    photoBase64?: string | null;
    description?: string | null;
    detectedFoods?: string | null;
    calories?: number | null;
    carbs?: number | null;
    protein?: number | null;
    fat?: number | null;
    mealType?: string | null;
    feeling?: string | null;
    eatenAt: Date | string;
  };
  onDelete?: (id: string) => void;
}

export default function MealCard({ meal, onDelete }: MealCardProps) {
  const [showFeeling, setShowFeeling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const foods = meal.detectedFoods ? JSON.parse(meal.detectedFoods) : [];
  const eatenAt = typeof meal.eatenAt === 'string' ? new Date(meal.eatenAt) : meal.eatenAt;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meal?')) return;

    setDeleting(true);
    try {
      await onDelete?.(meal.id);
    } catch (error) {
      alert('Failed to delete meal');
      setDeleting(false);
    }
  };

  const getMealTypeColor = (type?: string | null) => {
    switch (type) {
      case 'breakfast':
        return 'bg-yellow-100 text-yellow-800';
      case 'lunch':
        return 'bg-blue-100 text-blue-800';
      case 'dinner':
        return 'bg-purple-100 text-purple-800';
      case 'snack':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-card shadow-card overflow-hidden ${deleting ? 'opacity-50' : ''}`}>
      {/* Photo */}
      {meal.photoBase64 && (
        <img
          src={meal.photoBase64}
          alt="Meal"
          className="w-full h-48 object-cover"
        />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {meal.mealType && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getMealTypeColor(meal.mealType)}`}>
                  {meal.mealType}
                </span>
              )}
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                {format(eatenAt, 'h:mm a')}
              </div>
            </div>
            {meal.description && (
              <h3 className="font-semibold text-lg">{meal.description}</h3>
            )}
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-gray-400 hover:text-danger transition-colors"
            aria-label="Delete meal"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Foods */}
        {foods.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {foods.map((food: string, index: number) => (
              <span
                key={index}
                className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-700"
              >
                {food}
              </span>
            ))}
          </div>
        )}

        {/* Nutrition */}
        {(meal.calories || meal.carbs || meal.protein || meal.fat) && (
          <div className="grid grid-cols-4 gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
            {meal.calories && (
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{meal.calories}</div>
                <div className="text-xs text-gray-500">cal</div>
              </div>
            )}
            {meal.carbs && (
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{meal.carbs}g</div>
                <div className="text-xs text-gray-500">carbs</div>
              </div>
            )}
            {meal.protein && (
              <div className="text-center">
                <div className="text-lg font-bold text-gray-700">{meal.protein}g</div>
                <div className="text-xs text-gray-500">protein</div>
              </div>
            )}
            {meal.fat && (
              <div className="text-center">
                <div className="text-lg font-bold text-gray-700">{meal.fat}g</div>
                <div className="text-xs text-gray-500">fat</div>
              </div>
            )}
          </div>
        )}

        {/* Feeling */}
        {meal.feeling && (
          <div>
            <button
              onClick={() => setShowFeeling(!showFeeling)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <MessageSquare className="w-4 h-4" />
              {showFeeling ? 'Hide note' : 'View note'}
            </button>
            {showFeeling && (
              <p className="mt-2 text-sm text-gray-700 italic bg-blue-50 p-3 rounded-lg">
                &quot;{meal.feeling}&quot;
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
