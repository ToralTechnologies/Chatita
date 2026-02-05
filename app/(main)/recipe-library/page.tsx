'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Heart, Clock, ChefHat, Bookmark, BookmarkCheck } from 'lucide-react';
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
  createdAt: string;
}

export default function RecipeLibraryPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showPublic, setShowPublic] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, [showPublic]);

  useEffect(() => {
    filterRecipes();
  }, [recipes, search, selectedTag]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const url = `/api/recipes/saved?public=${showPublic}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes || []);
      }
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = [...recipes];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((recipe) => {
        const nameMatch = recipe.name.toLowerCase().includes(searchLower);
        const nameEsMatch = recipe.nameEs?.toLowerCase().includes(searchLower);
        const descMatch = recipe.description?.toLowerCase().includes(searchLower);
        return nameMatch || nameEsMatch || descMatch;
      });
    }

    // Tag filter
    if (selectedTag !== 'all') {
      filtered = filtered.filter((recipe) => {
        if (!recipe.tags) return false;
        const tags = JSON.parse(recipe.tags);
        return tags.includes(selectedTag);
      });
    }

    setFilteredRecipes(filtered);
  };

  const getAllTags = () => {
    const tagSet = new Set<string>();
    recipes.forEach((recipe) => {
      if (recipe.tags) {
        const tags = JSON.parse(recipe.tags);
        tags.forEach((tag: string) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  };

  const getCarbLevel = (carbs: number) => {
    if (carbs < 15) return { label: 'Low Carb', color: 'bg-success/10 text-success border-success/30' };
    if (carbs < 30) return { label: 'Moderate', color: 'bg-warning/10 text-warning border-warning/30' };
    return { label: 'High Carb', color: 'bg-danger/10 text-danger border-danger/30' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-background pb-24 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-12 h-12 text-primary mx-auto mb-3 animate-pulse" />
          <p className="text-gray-500">Loading recipes...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            Recipe Library
          </h1>

          {/* Search bar */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Tag filters */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedTag === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Recipes
            </button>
            {getAllTags().map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedTag === tag
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Toggle public recipes */}
          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="showPublic"
              checked={showPublic}
              onChange={(e) => setShowPublic(e.target.checked)}
              className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="showPublic" className="text-sm text-gray-700">
              Include public recipes
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6">
        {filteredRecipes.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-8 text-center">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              {search || selectedTag !== 'all' ? 'No Recipes Found' : 'No Saved Recipes Yet'}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {search || selectedTag !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Save recipes from our AI generator or add your own favorites!'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/recipes')}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                Generate Recipes
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecipes.map((recipe) => {
              const carbLevel = getCarbLevel(recipe.carbs);
              const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

              return (
                <div
                  key={recipe.id}
                  onClick={() => router.push(`/recipe-library/${recipe.id}`)}
                  className="bg-white rounded-card shadow-card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                >
                  {/* Recipe photo */}
                  {recipe.photoUrl ? (
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={recipe.photoUrl}
                        alt={recipe.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <ChefHat className="w-16 h-16 text-primary/30" />
                    </div>
                  )}

                  {/* Recipe details */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{recipe.name}</h3>
                    {recipe.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-3 mb-3 text-sm text-gray-500">
                      {totalTime > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{totalTime} min</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span>🍽️</span>
                        <span>{recipe.servings} servings</span>
                      </div>
                    </div>

                    {/* Nutrition badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${carbLevel.color}`}>
                        {recipe.carbs}g carbs
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {recipe.protein}g protein
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {recipe.calories} cal
                      </span>
                    </div>

                    {/* Tags */}
                    {recipe.tags && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {JSON.parse(recipe.tags).slice(0, 3).map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-primary/5 text-primary rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
