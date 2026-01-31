'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import { MapPin, Loader2, Utensils, Star, Navigation } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating?: number;
  distance?: string;
  address?: string;
  diabetesFriendly: boolean;
  recommendations: string[];
  healthTips: string[];
  hasDish?: string;
}

export default function RestaurantFinderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [locationName, setLocationName] = useState('');
  const [searchMode, setSearchMode] = useState<'location' | 'dish'>('location');
  const [dishQuery, setDishQuery] = useState('');
  const [searchedDish, setSearchedDish] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [selectedDishes, setSelectedDishes] = useState<Record<string, string[]>>({});
  const [gettingTips, setGettingTips] = useState(false);
  const [customTips, setCustomTips] = useState<Record<string, any>>({});

  const searchRestaurants = (lat: number, lng: number, dish?: string) => {
    setLoading(true);
    setError('');

    fetch('/api/restaurants/nearby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng, dish }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch restaurants');
        }
        const data = await response.json();

        if (data.restaurants.length === 0 && dish) {
          setError(`No restaurants found serving "${dish}". Try searching for a different dish.`);
        } else {
          setRestaurants(data.restaurants);
          setLocationName(data.locationName || 'your location');
          setSearchedDish(data.searchedDish || '');
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to fetch nearby restaurants');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getCurrentLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });

        // Search with dish if in dish mode
        const dish = searchMode === 'dish' ? dishQuery.trim() : undefined;
        searchRestaurants(latitude, longitude, dish);
      },
      (err) => {
        setError('Unable to retrieve your location. Please enable location services.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleDishSearch = () => {
    if (!dishQuery.trim()) {
      setError('Please enter a dish name');
      return;
    }
    getCurrentLocation();
  };

  const toggleDishSelection = (restaurantId: string, dish: string) => {
    setSelectedDishes(prev => {
      const current = prev[restaurantId] || [];
      const isSelected = current.includes(dish);

      return {
        ...prev,
        [restaurantId]: isSelected
          ? current.filter(d => d !== dish)
          : [...current, dish]
      };
    });
  };

  const getCustomTips = async (restaurantId: string, restaurantName: string, cuisine: string) => {
    const dishes = selectedDishes[restaurantId] || [];
    if (dishes.length === 0) return;

    setGettingTips(true);

    try {
      const response = await fetch('/api/restaurant-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName,
          cuisine,
          dishes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCustomTips(prev => ({
          ...prev,
          [restaurantId]: data,
        }));
      }
    } catch (err) {
      console.error('Failed to get custom tips:', err);
    } finally {
      setGettingTips(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-primary hover:underline mr-4"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Restaurant Finder</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Info Card */}
        <div className="bg-white rounded-card shadow-card p-6">
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold mb-2">Find Diabetes-Friendly Options</h2>
              <p className="text-gray-600 text-sm">
                {searchMode === 'location'
                  ? "We'll find nearby restaurants and suggest the best meal choices for managing your blood sugar, mi amor."
                  : "Tell me what you're craving, and I'll find nearby restaurants that serve it!"}
              </p>
            </div>
          </div>

          {/* Search Mode Toggle */}
          {!location && !loading && (
            <div className="mb-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSearchMode('location')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    searchMode === 'location'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Browse Nearby
                </button>
                <button
                  onClick={() => setSearchMode('dish')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    searchMode === 'dish'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Search by Dish
                </button>
              </div>

              {/* Dish Search Input */}
              {searchMode === 'dish' && (
                <div className="mb-4 space-y-3">
                  <input
                    type="text"
                    value={dishQuery}
                    onChange={(e) => setDishQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleDishSearch();
                      }
                    }}
                    placeholder="e.g., grilled chicken, salmon, tacos..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500">
                    💡 Try: grilled chicken, salmon, salad, tacos, sushi, soup, stir fry, eggs
                  </p>
                </div>
              )}
            </div>
          )}

          {!location && !loading && (
            <button
              onClick={searchMode === 'dish' ? handleDishSearch : getCurrentLocation}
              className="w-full bg-primary text-white py-3 px-4 rounded-button font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              {searchMode === 'dish' ? 'Find This Dish Near Me' : 'Find Restaurants Near Me'}
            </button>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-gray-600">Finding restaurants nearby...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-danger/30 text-danger p-4 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Location Display */}
        {location && !loading && (
          <div className="bg-blue-50 border border-primary/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium">
                {searchedDish
                  ? `Found restaurants serving "${searchedDish}" near ${locationName}`
                  : `Showing results near ${locationName}`}
              </p>
            </div>
          </div>
        )}

        {/* Restaurant Results */}
        {restaurants.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {searchedDish ? `Restaurants Serving ${searchedDish}` : 'Recommended Restaurants'}
            </h3>
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white rounded-card shadow-card p-6 space-y-4"
              >
                {/* Restaurant Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-primary" />
                      {restaurant.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {restaurant.cuisine}
                      {restaurant.distance && ` • ${restaurant.distance}`}
                    </p>
                    {restaurant.address && (
                      <p className="text-xs text-gray-500 mt-1">{restaurant.address}</p>
                    )}
                  </div>
                  {restaurant.rating && (
                    <div className="flex items-center gap-1 bg-warning/10 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="text-sm font-medium">{restaurant.rating}</span>
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {restaurant.hasDish && (
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      🍽️ Serves {restaurant.hasDish}
                    </div>
                  )}
                  {restaurant.diabetesFriendly && (
                    <div className="inline-flex items-center gap-2 bg-success/10 text-success px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Diabetes-Friendly
                    </div>
                  )}
                </div>

                {/* Meal Recommendations */}
                {restaurant.recommendations.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-sm mb-2">What to Order:</h5>
                    <div className="space-y-2">
                      {restaurant.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg p-3 text-sm ${
                            idx === 0 && restaurant.hasDish
                              ? 'bg-primary/10 border border-primary/30'
                              : 'bg-gray-50'
                          }`}
                        >
                          <p className="text-gray-800">
                            {idx === 0 && restaurant.hasDish && '⭐ '}
                            {rec}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Health Tips */}
                {restaurant.healthTips.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-sm mb-2">💡 Ordering Tips:</h5>
                    <ul className="space-y-1">
                      {restaurant.healthTips.map((tip, idx) => (
                        <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Dish Selector - Get Personalized Tips */}
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => setSelectedRestaurant(
                      selectedRestaurant === restaurant.id ? null : restaurant.id
                    )}
                    className="w-full text-left text-sm font-medium text-primary hover:underline flex items-center justify-between"
                  >
                    <span>🎯 Select dishes for personalized tips</span>
                    <span className="text-xs">
                      {selectedRestaurant === restaurant.id ? '▼' : '▶'}
                    </span>
                  </button>

                  {selectedRestaurant === restaurant.id && (
                    <div className="mt-4 space-y-4">
                      {/* Common Dishes */}
                      <div>
                        <p className="text-xs text-gray-600 mb-2">
                          Select what you're considering ordering:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {restaurant.recommendations.map((dish, idx) => {
                            const isSelected = selectedDishes[restaurant.id]?.includes(dish) || false;
                            return (
                              <button
                                key={idx}
                                onClick={() => toggleDishSelection(restaurant.id, dish)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                  isSelected
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {isSelected && '✓ '}
                                {dish}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Get Tips Button */}
                      {(selectedDishes[restaurant.id]?.length || 0) > 0 && (
                        <button
                          onClick={() => getCustomTips(restaurant.id, restaurant.name, restaurant.cuisine)}
                          disabled={gettingTips}
                          className="w-full py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {gettingTips ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Getting personalized tips...</span>
                            </>
                          ) : (
                            <>
                              <span>🤖</span>
                              <span>Get Diabetes-Friendly Tips for Selected Dishes</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Custom Tips Display */}
                      {customTips[restaurant.id] && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 space-y-3">
                          <h5 className="font-semibold text-sm text-blue-900 flex items-center gap-2">
                            <span>✨</span>
                            <span>Personalized Tips for Your Selection</span>
                          </h5>

                          {customTips[restaurant.id].dishTips?.map((tipSet: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-lg p-3 space-y-2">
                              <p className="font-medium text-sm text-gray-900">
                                🍽️ {tipSet.dish}
                              </p>
                              <ul className="space-y-1">
                                {tipSet.tips.map((tip: string, i: number) => (
                                  <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="text-blue-500">•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}

                          {customTips[restaurant.id].overallAdvice && (
                            <div className="bg-blue-100 rounded-lg p-3">
                              <p className="text-xs text-blue-900 font-medium mb-1">
                                💡 Overall Advice:
                              </p>
                              <p className="text-xs text-blue-800">
                                {customTips[restaurant.id].overallAdvice}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && location && restaurants.length === 0 && (
          <div className="bg-white rounded-card shadow-card p-8 text-center">
            <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">No restaurants found</h3>
            <p className="text-gray-600 text-sm mb-4">
              We couldn't find any restaurants in your area. Try again in a different location.
            </p>
            <button
              onClick={getCurrentLocation}
              className="text-primary font-medium hover:underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-warning/30 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            ⚠️ Restaurant suggestions are general guidance. Always check with the
            restaurant about ingredients and portion sizes, and consult your healthcare
            provider for personalized dietary advice.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
