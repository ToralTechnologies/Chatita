'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Clock, Users, ChefHat, UtensilsCrossed, Lightbulb, Plus } from 'lucide-react';
import BottomNav from '@/components/bottom-nav';

interface Recipe {
  id: string;
  name: string;
  nameEs?: string;
  description?: string;
  photoUrl?: string;
  servings: number;
  prepTime?: number;
  cookTime?: number;
  ingredients: string;
  instructions: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  tags?: string;
  carbCount?: string;
  diabetesTips?: string;
  isPublic: boolean;
  userId: string;
}

export default function RecipeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToMeal, setAddingToMeal] = useState(false);

  useEffect(() => {
    fetchRecipe();
  }, [recipeId]);

  const fetchRecipe = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recipes/saved/${recipeId}`);
      if (response.ok) {
        const data = await response.json();
        setRecipe(data.recipe);
      } else {
        setError('Recipe not found');
      }
    } catch (err) {
      console.error('Failed to fetch recipe:', err);
      setError('Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const addRecipeToMeal = async () => {
    if (!recipe) return;

    setAddingToMeal(true);
    try {
      const ingredients = JSON.parse(recipe.ingredients);
      const instructions = JSON.parse(recipe.instructions);

      // Create a meal based on this recipe
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detectedFoods: recipe.name,
          calories: recipe.calories,
          carbs: recipe.carbs,
          protein: recipe.protein,
          fat: recipe.fat,
          fiber: recipe.fiber,
          sugar: recipe.sugar,
          portionSize: `${recipe.servings} serving(s)`,
          feeling: `Made: ${recipe.name}`,
          mealType: 'lunch', // default to lunch
          nutritionSource: 'recipe',
        }),
      });

      if (response.ok) {
        router.push('/meal-history');
      } else {
        setError('Failed to add recipe to meal log');
      }
    } catch (err) {
      console.error('Failed to add recipe to meal:', err);
      setError('Failed to add recipe to meal log');
    } finally {
      setAddingToMeal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-background pb-24 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-12 h-12 text-primary mx-auto mb-3 animate-pulse" />
          <p className="text-gray-500">Loading recipe...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gray-background pb-24">
        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Recipe Not Found</h3>
          <p className="text-gray-600 text-sm mb-4">{error || 'This recipe could not be loaded.'}</p>
          <button
            onClick={() => router.push('/recipe-library')}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Back to Library
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const ingredients = JSON.parse(recipe.ingredients);
  const instructions = JSON.parse(recipe.instructions);
  const tags = recipe.tags ? JSON.parse(recipe.tags) : [];
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  const getCarbLevel = (carbs: number) => {
    if (carbs < 15) return { label: 'Low Carb', color: 'bg-success/10 text-success border-success/30' };
    if (carbs < 30) return { label: 'Moderate', color: 'bg-warning/10 text-warning border-warning/30' };
    return { label: 'High Carb', color: 'bg-danger/10 text-danger border-danger/30' };
  };

  const carbLevel = getCarbLevel(recipe.carbs);

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:underline mb-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>

      {/* Hero image */}
      {recipe.photoUrl ? (
        <div className="max-w-2xl mx-auto">
          <img
            src={recipe.photoUrl}
            alt={recipe.name}
            className="w-full h-64 object-cover"
          />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-primary/5 h-64 flex items-center justify-center">
          <ChefHat className="w-24 h-24 text-primary/30" />
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Title and description */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{recipe.name}</h1>
          {recipe.description && (
            <p className="text-gray-600">{recipe.description}</p>
          )}
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-card shadow-card p-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            {totalTime > 0 && (
              <div className="text-center">
                <Clock className="w-6 h-6 text-primary mx-auto mb-1" />
                <div className="text-sm font-bold text-gray-700">{totalTime} min</div>
                <div className="text-xs text-gray-500">Total Time</div>
              </div>
            )}
            <div className="text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-1" />
              <div className="text-sm font-bold text-gray-700">{recipe.servings}</div>
              <div className="text-xs text-gray-500">Servings</div>
            </div>
            <div className="text-center">
              <UtensilsCrossed className="w-6 h-6 text-primary mx-auto mb-1" />
              <div className={`text-sm font-bold px-2 py-1 rounded-full border inline-block ${carbLevel.color}`}>
                {carbLevel.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">{recipe.carbs}g carbs</div>
            </div>
          </div>

          {/* Prep and cook time breakdown */}
          {(recipe.prepTime || recipe.cookTime) && (
            <div className="flex gap-4 pt-4 border-t border-gray-100 text-sm">
              {recipe.prepTime && (
                <div className="flex-1">
                  <span className="text-gray-500">Prep:</span>{' '}
                  <span className="font-medium">{recipe.prepTime} min</span>
                </div>
              )}
              {recipe.cookTime && (
                <div className="flex-1">
                  <span className="text-gray-500">Cook:</span>{' '}
                  <span className="font-medium">{recipe.cookTime} min</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nutrition facts */}
        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="font-semibold text-lg mb-4">Nutrition Facts (per serving)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-gray-600">Calories</span>
              <span className="font-bold">{recipe.calories}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-gray-600">Carbs</span>
              <span className="font-bold">{recipe.carbs}g</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-gray-600">Protein</span>
              <span className="font-bold">{recipe.protein}g</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-gray-600">Fat</span>
              <span className="font-bold">{recipe.fat}g</span>
            </div>
            {recipe.fiber != null && (
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-gray-600">Fiber</span>
                <span className="font-bold">{recipe.fiber}g</span>
              </div>
            )}
            {recipe.sugar != null && (
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-gray-600">Sugar</span>
                <span className="font-bold">{recipe.sugar}g</span>
              </div>
            )}
          </div>
          {recipe.carbCount && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
              🌾 <strong>Carb Info:</strong> {recipe.carbCount}
            </div>
          )}
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            Ingredients
          </h2>
          <ul className="space-y-2">
            {ingredients.map((ingredient: string | { foodName: string; amount: string; unit: string }, idx: number) => {
              const displayText = typeof ingredient === 'string'
                ? ingredient
                : `${ingredient.amount} ${ingredient.unit} ${ingredient.foodName}`;

              return (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                  <span className="text-gray-700">{displayText}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
            Instructions
          </h2>
          <ol className="space-y-4">
            {instructions.map((step: string, idx: number) => (
              <li key={idx} className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-sm flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span className="text-gray-700 pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Diabetes tips */}
        {recipe.diabetesTips && (
          <div className="bg-blue-50 border border-blue-200 rounded-card p-6">
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2 text-blue-900">
              <Lightbulb className="w-5 h-5" />
              Diabetes Management Tips
            </h2>
            <p className="text-sm text-blue-800 whitespace-pre-line">{recipe.diabetesTips}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="bg-white rounded-card shadow-card p-6">
          <button
            onClick={addRecipeToMeal}
            disabled={addingToMeal}
            className="w-full bg-primary text-white py-3 rounded-button font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {addingToMeal ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Adding to Meal Log...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Add to Meal Log</span>
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            This will create a meal entry with this recipe's nutrition info
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
