'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import { MapPin, Loader2, Utensils, Star, Navigation, Search, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

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

interface Suggestion {
  id: string;
  name: string;
  cuisine: string;
  address: string;
}

type SearchMode = 'location' | 'dish' | 'name' | 'detect';

export default function RestaurantFinderPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // ── shared state ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [locationName, setLocationName] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('location');
  const [searchedDish, setSearchedDish] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [selectedDishes, setSelectedDishes] = useState<Record<string, string[]>>({});
  const [gettingTips, setGettingTips] = useState(false);
  const [customTips, setCustomTips] = useState<Record<string, any>>({});

  // ── dish-search state ─────────────────────────────────────────────────────
  const [dishQuery, setDishQuery] = useState('');

  // ── name-search state ─────────────────────────────────────────────────────
  const [nameQuery, setNameQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchingName, setSearchingName] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── detect-location state ────────────────────────────────────────────────
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<Suggestion[]>([]);

  // ── close suggestions on outside click ───────────────────────────────────
  useEffect(() => {
    const handler = () => setShowSuggestions(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── reset results when switching tabs ─────────────────────────────────────
  const switchMode = (mode: SearchMode) => {
    setSearchMode(mode);
    setLocation(null);
    setRestaurants([]);
    setError('');
    setSearchedDish('');
    setNearbyPlaces([]);
    setShowSuggestions(false);
    if (mode === 'name') {
      // focus happens after render
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  };

  // ── existing: browse-nearby & dish-search helpers ─────────────────────────
  const searchRestaurants = (lat: number, lng: number, dish?: string) => {
    setLoading(true);
    setError('');

    fetch('/api/restaurants/nearby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng, dish }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(t.restaurants.noRestaurantsMessage);
        const data = await response.json();
        if (data.restaurants.length === 0 && dish) {
          setError(t.restaurants.noRestaurantsMessage);
        } else {
          setRestaurants(data.restaurants);
          setLocationName(data.locationName || 'your location');
          setSearchedDish(data.searchedDish || '');
        }
      })
      .catch((err: any) => setError(err.message || t.restaurants.noRestaurantsMessage))
      .finally(() => setLoading(false));
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
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        const dish = searchMode === 'dish' ? dishQuery.trim() : undefined;
        searchRestaurants(latitude, longitude, dish);
      },
      () => {
        setError('Unable to retrieve your location. Please enable location services.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleDishSearch = () => {
    if (!dishQuery.trim()) {
      setError(t.restaurants.enterDishName);
      return;
    }
    getCurrentLocation();
  };

  // ── new: name-search helpers ──────────────────────────────────────────────
  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearchingName(true);
    try {
      const res = await fetch('/api/restaurants/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'name', query: query.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setSearchingName(false);
    }
  };

  const handleNameChange = (value: string) => {
    setNameQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 350);
  };

  // When user taps a suggestion, build a single-item restaurant list with tips
  // and show it the same way the existing results are shown.
  const selectSuggestion = (suggestion: Suggestion) => {
    setShowSuggestions(false);
    setNameQuery(suggestion.name);

    // Build a restaurant card from the suggestion (reuses the same card UI)
    const restaurant: Restaurant = {
      id: suggestion.id,
      name: suggestion.name,
      cuisine: suggestion.cuisine,
      address: suggestion.address,
      diabetesFriendly: true,
      recommendations: getRecommendationsForCuisine(suggestion.cuisine),
      healthTips: getTipsForCuisine(suggestion.cuisine),
    };
    setRestaurants([restaurant]);
    setLocation({ lat: 0, lng: 0 }); // truthy so results render
    setLocationName('your selection');
    setSearchedDish('');
  };

  // ── new: detect-location helpers ──────────────────────────────────────────
  const handleDetect = () => {
    setDetectingLocation(true);
    setNearbyPlaces([]);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch('/api/restaurants/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'nearby', lat: latitude, lng: longitude }),
          });
          if (res.ok) {
            const data = await res.json();
            setNearbyPlaces(data.places || []);
          }
        } catch {
          setError('Failed to detect nearby restaurants.');
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setError('Unable to retrieve your location. Please enable location services.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // User confirmed a nearby place → same as selectSuggestion
  const confirmNearbyPlace = (place: Suggestion) => {
    setNearbyPlaces([]);
    const restaurant: Restaurant = {
      id: place.id,
      name: place.name,
      cuisine: place.cuisine,
      address: place.address,
      diabetesFriendly: true,
      recommendations: getRecommendationsForCuisine(place.cuisine),
      healthTips: getTipsForCuisine(place.cuisine),
    };
    setRestaurants([restaurant]);
    setLocation({ lat: 0, lng: 0 });
    setLocationName('your location');
    setSearchedDish('');
  };

  // ── personalized-tips helpers (unchanged) ─────────────────────────────────
  const toggleDishSelection = (restaurantId: string, dish: string) => {
    setSelectedDishes((prev) => {
      const current = prev[restaurantId] || [];
      const isSelected = current.includes(dish);
      return {
        ...prev,
        [restaurantId]: isSelected ? current.filter((d) => d !== dish) : [...current, dish],
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
        body: JSON.stringify({ restaurantName, cuisine, dishes }),
      });
      if (response.ok) {
        const data = await response.json();
        setCustomTips((prev) => ({ ...prev, [restaurantId]: data }));
      }
    } catch (err) {
      console.error('Failed to get custom tips:', err);
    } finally {
      setGettingTips(false);
    }
  };

  // ── render helpers ────────────────────────────────────────────────────────
  // Whether to show the "find near me" / search button block (location & dish modes only)
  const showPrimaryAction = (searchMode === 'location' || searchMode === 'dish') && !location && !loading;

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center">
          <button onClick={() => router.back()} className="text-primary hover:underline mr-4">
            ← {t.common.back}
          </button>
          <h1 className="text-2xl font-bold">{t.restaurants.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Info Card + Search Controls */}
        <div className="bg-white rounded-card shadow-card p-6">
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold mb-2">{t.restaurants.findDiabetesFriendly}</h2>
              <p className="text-gray-600 text-sm">
                {searchMode === 'dish'
                  ? t.restaurants.descriptionDish
                  : t.restaurants.descriptionLocation}
              </p>
            </div>
          </div>

          {/* Tab row – always visible until results load (for location/dish) */}
          {!(location && (searchMode === 'location' || searchMode === 'dish')) && !loading && (
            <div className="mb-4">
              {/* 4-tab row */}
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {([
                  ['location', t.restaurants.browseNearby],
                  ['dish', t.restaurants.searchByDish],
                  ['name', t.restaurants.searchByName],
                  ['detect', t.restaurants.detectLocation],
                ] as [SearchMode, string][]).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => switchMode(mode)}
                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                      searchMode === mode
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ── dish input ──────────────────────────────────────────── */}
              {searchMode === 'dish' && (
                <div className="mb-4 space-y-3">
                  <input
                    type="text"
                    value={dishQuery}
                    onChange={(e) => setDishQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleDishSearch();
                      }
                    }}
                    placeholder={t.restaurants.dishPlaceholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500">💡 {t.restaurants.tryThese}</p>
                </div>
              )}

              {/* ── name-search input + dropdown ─────────────────────── */}
              {searchMode === 'name' && (
                <div className="mb-4 relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={nameQuery}
                      onChange={(e) => handleNameChange(e.target.value)}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                      placeholder={t.restaurants.restaurantNamePlaceholder}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {nameQuery && (
                      <button
                        onClick={() => {
                          setNameQuery('');
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Suggestions dropdown */}
                  {showSuggestions && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {searchingName ? (
                        <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          {t.restaurants.searchingRestaurants}
                        </div>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => selectSuggestion(s)}
                            className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <p className="text-sm font-medium text-gray-900">{s.name}</p>
                            <p className="text-xs text-gray-500">
                              {s.cuisine}{s.address ? ` · ${s.address}` : ''}
                            </p>
                          </button>
                        ))
                      ) : (
                        <p className="px-4 py-3 text-sm text-gray-500">{t.restaurants.noSuggestionsFound}</p>
                      )}
                    </div>
                  )}

                  {!showSuggestions && !nameQuery && (
                    <p className="text-xs text-gray-500 mt-2">{t.restaurants.tapToSelect}</p>
                  )}
                </div>
              )}

              {/* ── detect-location UI ───────────────────────────────── */}
              {searchMode === 'detect' && !detectingLocation && nearbyPlaces.length === 0 && !restaurants.length && (
                <div className="mb-4">
                  <button
                    onClick={handleDetect}
                    className="w-full bg-primary text-white py-3 px-4 rounded-button font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-5 h-5" />
                    {t.restaurants.detectLocation}
                  </button>
                </div>
              )}

              {detectingLocation && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="ml-3 text-gray-600 text-sm">{t.restaurants.detectingLocation}</span>
                </div>
              )}

              {/* "Are you at…?" card list */}
              {nearbyPlaces.length > 0 && (
                <div className="mb-2 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{t.restaurants.areYouAt}</h3>
                    <p className="text-xs text-gray-500">{t.restaurants.areYouAtDescription}</p>
                  </div>
                  {nearbyPlaces.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => confirmNearbyPlace(place)}
                      className="w-full text-left bg-gray-50 hover:bg-primary/5 border border-gray-200 hover:border-primary/40 rounded-lg p-4 transition-colors flex items-center gap-3"
                    >
                      <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
                        <Utensils className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{place.name}</p>
                        <p className="text-xs text-gray-500">
                          {place.cuisine}
                          {(place as any).distance && ` · ${(place as any).distance}`}
                        </p>
                      </div>
                      <span className="text-primary text-xs font-medium">Tap →</span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setNearbyPlaces([]);
                      switchMode('name');
                    }}
                    className="w-full text-center text-sm text-gray-500 hover:text-primary transition-colors py-2"
                  >
                    {t.restaurants.noneOfThese}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── primary action button (location / dish modes) ─────────── */}
          {showPrimaryAction && (searchMode === 'location' || searchMode === 'dish') && (
            <button
              onClick={searchMode === 'dish' ? handleDishSearch : getCurrentLocation}
              className="w-full bg-primary text-white py-3 px-4 rounded-button font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              {searchMode === 'dish' ? t.restaurants.findThisDish : t.restaurants.findNearMe}
            </button>
          )}

          {/* Loading spinner (location / dish modes) */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-gray-600">{t.restaurants.findingRestaurants}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-danger/30 text-danger p-4 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Location Display (location / dish modes) */}
        {location && !loading && (searchMode === 'location' || searchMode === 'dish') && (
          <div className="bg-blue-50 border border-primary/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium">
                {searchedDish
                  ? t.restaurants.foundNear.replace('{dish}', searchedDish).replace('{location}', locationName)
                  : t.restaurants.showingNear.replace('{location}', locationName)}
              </p>
            </div>
            <button
              onClick={() => {
                setLocation(null);
                setRestaurants([]);
                setSearchedDish('');
              }}
              className="text-primary text-xs font-medium mt-1 hover:underline"
            >
              {t.restaurants.tryAgain}
            </button>
          </div>
        )}

        {/* Restaurant Results */}
        {restaurants.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {searchedDish
                  ? t.restaurants.servingDish.replace('{dish}', searchedDish)
                  : t.restaurants.recommended}
              </h3>
              {/* "Search again" link for name / detect results */}
              {(searchMode === 'name' || searchMode === 'detect') && (
                <button
                  onClick={() => {
                    setRestaurants([]);
                    setLocation(null);
                    setNameQuery('');
                    setSuggestions([]);
                  }}
                  className="text-primary text-sm hover:underline"
                >
                  {t.restaurants.tryAgain}
                </button>
              )}
            </div>

            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-white rounded-card shadow-card p-6 space-y-4">
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
                      🍽️ {t.restaurants.serves} {restaurant.hasDish}
                    </div>
                  )}
                  {restaurant.diabetesFriendly && (
                    <div className="inline-flex items-center gap-2 bg-success/10 text-success px-3 py-1 rounded-full text-sm font-medium">
                      ✓ {t.restaurants.diabetesFriendly}
                    </div>
                  )}
                </div>

                {/* Meal Recommendations */}
                {restaurant.recommendations.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-sm mb-2">{t.restaurants.whatToOrder}</h5>
                    <div className="space-y-2">
                      {restaurant.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg p-3 text-sm ${
                            idx === 0 && restaurant.hasDish ? 'bg-primary/10 border border-primary/30' : 'bg-gray-50'
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
                    <h5 className="font-semibold text-sm mb-2">💡 {t.restaurants.orderingTips}</h5>
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
                    onClick={() => setSelectedRestaurant(selectedRestaurant === restaurant.id ? null : restaurant.id)}
                    className="w-full text-left text-sm font-medium text-primary hover:underline flex items-center justify-between"
                  >
                    <span>🎯 {t.restaurants.selectDishes}</span>
                    <span className="text-xs">{selectedRestaurant === restaurant.id ? '▼' : '▶'}</span>
                  </button>

                  {selectedRestaurant === restaurant.id && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-2">{t.restaurants.selectWhatYouConsidering}</p>
                        <div className="flex flex-wrap gap-2">
                          {restaurant.recommendations.map((dish, idx) => {
                            const isSelected = selectedDishes[restaurant.id]?.includes(dish) || false;
                            return (
                              <button
                                key={idx}
                                onClick={() => toggleDishSelection(restaurant.id, dish)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                  isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {isSelected && '✓ '}
                                {dish}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {(selectedDishes[restaurant.id]?.length || 0) > 0 && (
                        <button
                          onClick={() => getCustomTips(restaurant.id, restaurant.name, restaurant.cuisine)}
                          disabled={gettingTips}
                          className="w-full py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {gettingTips ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>{t.restaurants.gettingTips}</span>
                            </>
                          ) : (
                            <>
                              <span>🤖</span>
                              <span>{t.restaurants.getPersonalizedTips}</span>
                            </>
                          )}
                        </button>
                      )}

                      {customTips[restaurant.id] && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 space-y-3">
                          <h5 className="font-semibold text-sm text-blue-900 flex items-center gap-2">
                            <span>✨</span>
                            <span>{t.restaurants.personalizedTips}</span>
                          </h5>

                          {customTips[restaurant.id].dishTips?.map((tipSet: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-lg p-3 space-y-2">
                              <p className="font-medium text-sm text-gray-900">🍽️ {tipSet.dish}</p>
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
                              <p className="text-xs text-blue-900 font-medium mb-1">💡 {t.restaurants.overallAdvice}</p>
                              <p className="text-xs text-blue-800">{customTips[restaurant.id].overallAdvice}</p>
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

        {/* Empty State (location / dish modes only) */}
        {!loading && location && restaurants.length === 0 && (searchMode === 'location' || searchMode === 'dish') && (
          <div className="bg-white rounded-card shadow-card p-8 text-center">
            <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">{t.restaurants.noRestaurantsFound}</h3>
            <p className="text-gray-600 text-sm mb-4">{t.restaurants.noRestaurantsMessage}</p>
            <button onClick={getCurrentLocation} className="text-primary font-medium hover:underline">
              {t.restaurants.tryAgain}
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-warning/30 rounded-lg p-4">
          <p className="text-sm text-gray-700">⚠️ {t.restaurants.disclaimer}</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// ── static recommendation / tip maps (mirrors restaurant-finder.ts) ────────
function getRecommendationsForCuisine(cuisine: string): string[] {
  const map: Record<string, string[]> = {
    Mediterranean: [
      'Grilled fish with vegetables (ADA best choice)',
      'Greek salad with grilled chicken, dressing on side',
      'Lentil soup with side salad',
    ],
    Japanese: [
      'Sashimi platter (lean protein, no rice)',
      'Grilled salmon with steamed vegetables',
      'Chicken yakitori with edamame',
    ],
    Greek: [
      'Grilled chicken or fish with Greek salad',
      'Souvlaki skewers with tzatziki and vegetables',
    ],
    Vietnamese: [
      'Pho: ask for less noodles, extra vegetables',
      'Grilled lemongrass chicken with side salad',
      'Fresh spring rolls (not fried)',
    ],
    Thai: [
      'Tom yum soup with shrimp (no noodles)',
      'Grilled chicken satay with cucumber salad',
    ],
    Indian: [
      'Tandoori chicken (grilled, no breading)',
      'Chana masala with side salad (skip rice/naan)',
    ],
    Mexican: [
      'Grilled chicken or steak with fajita vegetables',
      'Fish tacos: 1-2 corn tortillas or lettuce wraps',
      'Burrito bowl (no tortilla, light on rice/beans)',
    ],
    American: [
      'Grilled chicken breast, no skin, with vegetables',
      'Salmon with asparagus (omega-3)',
      'Small burger: no bun or whole wheat, side salad',
    ],
    Italian: [
      'Grilled chicken or fish with marinara and vegetables',
      'Caprese salad with added lean protein',
      'Minestrone soup (skip pasta inside)',
    ],
    Chinese: [
      'Steamed fish with ginger (not fried)',
      'Stir-fried vegetables with chicken (sauce on side)',
    ],
  };
  return map[cuisine] || ['Grilled protein with vegetables', 'Salad with lean protein'];
}

function getTipsForCuisine(cuisine: string): string[] {
  const common = [
    'Order the smallest size available',
    'Ask for sauces and dressings on the side',
    'Choose grilled, baked, or steamed over fried',
    'Drink water or sugar-free beverages only',
  ];
  const specific: Record<string, string[]> = {
    Mexican: ['Limit tortillas to 1-2 small corn tortillas', 'Skip chips or split a small portion'],
    Italian: ['Limit pasta to 1/2 cup if having any', 'Choose marinara over cream-based sauces'],
    Japanese: ['Avoid tempura – choose grilled', 'Sashimi is excellent (lean protein, no carbs)'],
    Chinese: ['Ask for steamed instead of fried', 'Skip or limit rice to 1/3 cup'],
    Indian: ['Avoid naan or limit to 1/2 piece', 'Choose tandoori (grilled) over curry'],
    Thai: ['Ask for less sugar in sauces', 'Coconut milk in moderation'],
    American: ['Remove bun or scoop out extra bread', 'Use mustard or salsa instead of mayo'],
    Mediterranean: ['Olive oil is a good fat', 'Focus on fish and lean proteins'],
    Greek: ['Greek yogurt is a great choice', 'Load up on salad vegetables'],
    Vietnamese: ['Pho: ask for less noodles, extra vegetables', 'Choose grilled spring rolls'],
  };
  return [...common, ...(specific[cuisine] || [])];
}
