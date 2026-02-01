'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter } from 'lucide-react';
import BottomNav from '@/components/bottom-nav';
import MealCard from '@/components/meal-card';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { useTranslation } from '@/lib/i18n/context';

export default function MealHistoryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      const response = await fetch('/api/meals?limit=50');
      if (response.ok) {
        const data = await response.json();
        setMeals(data.meals);
      }
    } catch (error) {
      console.error('Failed to fetch meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/meals/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMeals(meals.filter((m) => m.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete meal:', error);
      throw error;
    }
  };

  // Filter meals
  const filteredMeals = meals.filter((meal) => {
    const matchesSearch =
      searchTerm === '' ||
      meal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meal.detectedFoods?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === '' || meal.mealType === filterType;

    return matchesSearch && matchesType;
  });

  // Group meals by date
  const groupedMeals: Record<string, any[]> = {};
  filteredMeals.forEach((meal) => {
    const date = parseISO(meal.eatenAt);
    let dateKey: string;

    if (isToday(date)) {
      dateKey = t.mealHistory.today;
    } else if (isYesterday(date)) {
      dateKey = t.mealHistory.yesterday;
    } else {
      dateKey = format(date, 'EEEE, MMM d');
    }

    if (!groupedMeals[dateKey]) {
      groupedMeals[dateKey] = [];
    }
    groupedMeals[dateKey].push(meal);
  });

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold mb-4">{t.mealHistory.title}</h1>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.mealHistory.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Filter className="w-4 h-4" />
            {filterType ? `${t.mealHistory.filter}: ${t.mealHistory.types[filterType as keyof typeof t.mealHistory.types]}` : t.mealHistory.filterByType}
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setFilterType('')}
                className={`px-3 py-1 rounded-full text-sm ${
                  filterType === ''
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {t.mealHistory.all}
              </button>
              {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 rounded-full text-sm capitalize ${
                    filterType === type
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {t.mealHistory.types[type as keyof typeof t.mealHistory.types]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t.mealHistory.loadingMeals}</p>
          </div>
        ) : filteredMeals.length === 0 ? (
          <div className="text-center py-12">
            {meals.length === 0 ? (
              <>
                <p className="text-gray-500 mb-4">{t.mealHistory.noMealsYet}</p>
                <button
                  onClick={() => router.push('/add-meal')}
                  className="bg-primary text-white px-6 py-2 rounded-button hover:bg-primary-dark transition-colors"
                >
                  {t.mealHistory.logFirstMeal}
                </button>
              </>
            ) : (
              <p className="text-gray-500">{t.mealHistory.noMatchingMeals}</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMeals).map(([dateKey, dateMeals]) => (
              <div key={dateKey}>
                <h2 className="text-lg font-semibold mb-3 text-gray-700">
                  {dateKey}
                </h2>
                <div className="space-y-4">
                  {dateMeals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
