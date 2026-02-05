'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, ChevronDown, ChevronUp, Camera, Upload, Bookmark, BookmarkCheck } from 'lucide-react';
import BottomNav from '@/components/bottom-nav';
import { useTranslation } from '@/lib/i18n/context';
import { compressImage } from '@/lib/compress-image';

interface Recipe {
  title: string;
  description: string;
  carbEstimate: string;
  calorieEstimate: string;
  bloodSugarImpact: 'low' | 'moderate' | 'high';
  ingredients: string[];
  steps: string[];
  tips: string[];
  prepTime: string;
  servings: number;
}

export default function RecipesPage() {
  const router = useRouter();
  const { t } = useTranslation();

  // Input modes
  const [inputMode, setInputMode] = useState<'type' | 'photo'>('type');
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [fridgePhoto, setFridgePhoto] = useState<string | null>(null);

  // Results
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  const [savingRecipe, setSavingRecipe] = useState<number | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Set<number>>(new Set());

  const addIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !ingredients.includes(trimmed.toLowerCase())) {
      setIngredients([...ingredients, trimmed.toLowerCase()]);
      setIngredientInput('');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleFridgePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { base64 } = await compressImage(file);
      setFridgePhoto(base64);
    } catch (err) {
      console.error('Image compression failed:', err);
      setError(t.recipes.photoError);
    }
  };

  const generateRecipes = async () => {
    if (ingredients.length === 0 && !fridgePhoto) {
      setError(t.recipes.noInputError);
      return;
    }

    setLoading(true);
    setError('');
    setRecipes([]);
    setExpandedRecipe(null);

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          ...(fridgePhoto && { photoBase64: fridgePhoto }),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes || []);
      } else {
        setError(t.recipes.generateError);
      }
    } catch {
      setError(t.recipes.generateError);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'bg-success/10 text-success border-success/30';
      case 'moderate': return 'bg-warning/10 text-warning border-warning/30';
      case 'high': return 'bg-danger/10 text-danger border-danger/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'low': return t.recipes.impactLow;
      case 'moderate': return t.recipes.impactModerate;
      case 'high': return t.recipes.impactHigh;
      default: return impact;
    }
  };

  const saveRecipe = async (recipe: Recipe, index: number) => {
    setSavingRecipe(index);
    try {
      // Parse carbs and calories from estimates (e.g., "15-20g" -> 17.5)
      const parseNutrient = (estimate: string): number => {
        const numbers = estimate.match(/\d+/g);
        if (!numbers || numbers.length === 0) return 0;
        if (numbers.length === 1) return parseFloat(numbers[0]);
        // Average if range
        return (parseFloat(numbers[0]) + parseFloat(numbers[1])) / 2;
      };

      const carbsValue = parseNutrient(recipe.carbEstimate);
      const caloriesValue = parseNutrient(recipe.calorieEstimate);

      const response = await fetch('/api/recipes/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recipe.title,
          description: recipe.description,
          servings: recipe.servings,
          prepTime: parseInt(recipe.prepTime) || null,
          ingredients: recipe.ingredients,
          instructions: recipe.steps,
          calories: caloriesValue,
          carbs: carbsValue,
          protein: 0, // Not provided in generated recipes
          fat: 0,
          diabetesTips: recipe.tips.join('\n'),
          tags: [recipe.bloodSugarImpact],
          isPublic: false,
        }),
      });

      if (response.ok) {
        setSavedRecipes(new Set([...savedRecipes, index]));
      } else {
        setError('Failed to save recipe');
      }
    } catch (err) {
      console.error('Failed to save recipe:', err);
      setError('Failed to save recipe');
    } finally {
      setSavingRecipe(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center">
          <button onClick={() => router.back()} className="text-primary hover:underline mr-4">
            ← {t.common.back}
          </button>
          <h1 className="text-2xl font-bold">{t.recipes.title}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Info card */}
        <div className="bg-primary/5 border border-primary/20 rounded-card p-6">
          <div className="text-4xl mb-3 text-center">👨‍🍳</div>
          <h2 className="font-semibold text-lg mb-2 text-center">{t.recipes.subtitle}</h2>
          <p className="text-sm text-gray-600 text-center">{t.recipes.description}</p>
        </div>

        {/* Input mode toggle */}
        <div className="bg-white rounded-card shadow-card p-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputMode('type')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'type' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✍️ {t.recipes.typeIngredients}
            </button>
            <button
              onClick={() => setInputMode('photo')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'photo' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📸 {t.recipes.photoFridge}
            </button>
          </div>

          {/* Type ingredients mode */}
          {inputMode === 'type' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addIngredient();
                    }
                  }}
                  placeholder={t.recipes.ingredientPlaceholder}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={addIngredient}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Ingredient chips */}
              {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {ing}
                      <button onClick={() => removeIngredient(idx)} className="text-primary/60 hover:text-primary">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500">💡 {t.recipes.ingredientTip}</p>
            </div>
          )}

          {/* Photo fridge mode */}
          {inputMode === 'photo' && (
            <div className="space-y-3">
              {fridgePhoto ? (
                <div className="relative">
                  <img src={fridgePhoto} alt="Fridge" className="w-full rounded-lg max-h-64 object-cover" />
                  <button
                    onClick={() => setFridgePhoto(null)}
                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">{t.recipes.uploadFridgePhoto}</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <label className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg cursor-pointer hover:bg-primary-dark transition-colors text-sm font-medium">
                      <Camera className="w-4 h-4" />
                      {t.recipes.takePhoto}
                      <input type="file" accept="image/*" capture="environment" onChange={handleFridgePhoto} className="hidden" />
                    </label>
                    <label className="inline-flex items-center gap-2 bg-white border-2 border-primary text-primary px-5 py-2.5 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors text-sm font-medium">
                      <Upload className="w-4 h-4" />
                      {t.recipes.choosePhoto}
                      <input type="file" accept="image/*" onChange={handleFridgePhoto} className="hidden" />
                    </label>
                  </div>
                </div>
              )}

              {/* Also allow adding typed ingredients alongside photo */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addIngredient();
                    }
                  }}
                  placeholder={t.recipes.addMoreIngredients}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <button
                  onClick={addIngredient}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {ing}
                      <button onClick={() => removeIngredient(idx)} className="text-primary/60 hover:text-primary">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 bg-red-50 border border-danger/30 text-danger p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generateRecipes}
            disabled={loading || (ingredients.length === 0 && !fridgePhoto)}
            className="mt-4 w-full bg-primary text-white py-3 rounded-button font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t.recipes.generating}</span>
              </>
            ) : (
              <>
                <span>🤖</span>
                <span>{t.recipes.generateButton}</span>
              </>
            )}
          </button>
        </div>

        {/* Recipe results */}
        {recipes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t.recipes.resultsTitle}</h3>

            {recipes.map((recipe, idx) => (
              <div key={idx} className="bg-white rounded-card shadow-card overflow-hidden">
                {/* Recipe header (always visible) */}
                <button
                  onClick={() => setExpandedRecipe(expandedRecipe === idx ? null : idx)}
                  className="w-full text-left p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{recipe.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{recipe.description}</p>
                    </div>
                    {expandedRecipe === idx ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    )}
                  </div>

                  {/* Quick stats row */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getImpactColor(recipe.bloodSugarImpact)}`}>
                      🩸 {getImpactLabel(recipe.bloodSugarImpact)}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      🌾 {recipe.carbEstimate} {t.recipes.carbs}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      ⏱️ {recipe.prepTime}
                    </span>
                  </div>
                </button>

                {/* Expanded recipe details */}
                {expandedRecipe === idx && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                    {/* Nutrition summary */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-sm font-bold text-primary">{recipe.carbEstimate}</div>
                        <div className="text-xs text-gray-500">{t.recipes.carbs}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-sm font-bold text-gray-700">{recipe.calorieEstimate}</div>
                        <div className="text-xs text-gray-500">{t.recipes.calories}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-sm font-bold text-gray-700">{recipe.servings}</div>
                        <div className="text-xs text-gray-500">{t.recipes.servings}</div>
                      </div>
                    </div>

                    {/* Ingredients */}
                    <div>
                      <h5 className="font-semibold text-sm mb-2">{t.recipes.ingredientsLabel}</h5>
                      <div className="flex flex-wrap gap-2">
                        {recipe.ingredients.map((ing, i) => (
                          <span key={i} className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-sm">
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Steps */}
                    <div>
                      <h5 className="font-semibold text-sm mb-2">{t.recipes.stepsLabel}</h5>
                      <ol className="space-y-2">
                        {recipe.steps.map((step, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">
                              {i + 1}
                            </span>
                            <span className="text-sm text-gray-700">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Diabetes tips */}
                    {recipe.tips.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-semibold text-sm text-blue-900 mb-2 flex items-center gap-2">
                          <span>💡</span>
                          {t.recipes.diabetesTips}
                        </h5>
                        <ul className="space-y-1">
                          {recipe.tips.map((tip, i) => (
                            <li key={i} className="text-xs text-blue-800 flex items-start gap-2">
                              <span className="text-blue-500">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Save button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveRecipe(recipe, idx);
                      }}
                      disabled={savingRecipe === idx || savedRecipes.has(idx)}
                      className={`w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        savedRecipes.has(idx)
                          ? 'bg-success/10 text-success border-2 border-success'
                          : 'bg-primary text-white hover:bg-primary-dark'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {savingRecipe === idx ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : savedRecipes.has(idx) ? (
                        <>
                          <BookmarkCheck className="w-4 h-4" />
                          <span>Saved to Library</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4" />
                          <span>Save Recipe</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-warning/30 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            ⚠️ {t.recipes.disclaimer}
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
