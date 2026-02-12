'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, MapPin, Navigation } from 'lucide-react';
import BottomNav from '@/components/bottom-nav';
import MealPhotoUpload from '@/components/meal-photo-upload';
import MealConfirmation from '@/components/meal-confirmation';
import EditDrawer from '@/components/edit-drawer';
import SuccessScreen from '@/components/success-screen';
import { useTranslation } from '@/lib/i18n/context';
import { ExifData } from '@/lib/exif';

type FlowState = 'photo' | 'confirmation' | 'editing' | 'success';

/** Restaurant suggestion returned by /api/restaurants/search nearby mode */
interface NearbyRestaurant {
  id: string;
  name: string;
  address: string;
  cuisine: string;
}

interface MenuItem {
  name: string;
  category: string;
  score: 'great' | 'moderate' | 'caution';
  carbEstimate: string;
  tip: string;
}

export default function AddMealPage() {
  return (
    <Suspense fallback={null}>
      <AddMealPageInner />
    </Suspense>
  );
}

function AddMealPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [flowState, setFlowState] = useState<FlowState>('photo');
  const [photoBase64, setPhotoBase64] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [savedMeal, setSavedMeal] = useState<any>(null);

  // Dish selection state (for multiple dishes)
  const [showDishSelection, setShowDishSelection] = useState(false);
  const [allDetectedDishes, setAllDetectedDishes] = useState<string[]>([]);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);

  // EXIF-derived state
  const [exifDate, setExifDate] = useState<Date | null>(null);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<NearbyRestaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<NearbyRestaurant | null>(null);

  // Menu items for the selected restaurant (for "What did you order?" selector)
  const [restaurantMenu, setRestaurantMenu] = useState<MenuItem[]>([]);
  const [menuSelectedDishes, setMenuSelectedDishes] = useState<string[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Restaurant fallback state (when AI analysis fails)
  const [showRestaurantFallback, setShowRestaurantFallback] = useState(false);
  const [fallbackStep, setFallbackStep] = useState<'prompt' | 'locating' | 'select-restaurant' | 'select-dishes'>('prompt');

  // ── Read query params from restaurant-finder "Save as Meal" ────
  useEffect(() => {
    const restaurantName = searchParams.get('restaurant');
    const restaurantAddress = searchParams.get('restaurantAddress');
    const restaurantPlaceId = searchParams.get('restaurantPlaceId');
    const foods = searchParams.get('foods');

    if (restaurantName && restaurantPlaceId) {
      const restaurant: NearbyRestaurant = {
        id: restaurantPlaceId,
        name: restaurantName,
        address: restaurantAddress || '',
        cuisine: '',
      };
      setSelectedRestaurant(restaurant);
      // Pre-populate foods from query params
      if (foods) {
        setMenuSelectedDishes(foods.split(',').filter(Boolean));
      }
      // Fetch the menu so user can adjust their selection
      fetchRestaurantMenu(restaurant);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch menu when restaurant is picked from nearby chips ────
  useEffect(() => {
    if (selectedRestaurant && restaurantMenu.length === 0 && !loadingMenu) {
      fetchRestaurantMenu(selectedRestaurant);
    }
  }, [selectedRestaurant]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── When nearby restaurants arrive during fallback, advance to selection ────
  useEffect(() => {
    if (showRestaurantFallback && fallbackStep === 'locating' && nearbyRestaurants.length > 0) {
      setFallbackStep('select-restaurant');
    }
  }, [nearbyRestaurants, showRestaurantFallback, fallbackStep]);

  /** Fetch nearby restaurants using GPS from EXIF or live geolocation */
  const fetchNearbyFromGps = async (lat: number, lng: number) => {
    try {
      const res = await fetch('/api/restaurants/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'nearby', lat, lng }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestions && data.suggestions.length > 0) {
          setNearbyRestaurants(data.suggestions);
        }
      }
    } catch {
      // GPS restaurant lookup is best-effort — fail silently
    }
  };

  /** Share current device location (used when EXIF GPS is not available) */
  const handleShareLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchNearbyFromGps(latitude, longitude);
      },
      () => {
        setError('Unable to retrieve your location. Please enable location services.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  /** Fetch the menu for a restaurant so the user can pick what they ordered */
  const fetchRestaurantMenu = async (restaurant: NearbyRestaurant) => {
    setLoadingMenu(true);
    try {
      // Derive cuisine from the restaurant object; if empty, pass a generic hint
      const res = await fetch('/api/restaurants/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantName: restaurant.name, cuisine: restaurant.cuisine || 'general' }),
      });
      if (res.ok) {
        const data = await res.json();
        setRestaurantMenu(data.dishes || []);
      }
    } catch {
      console.error('Failed to fetch restaurant menu');
    } finally {
      setLoadingMenu(false);
    }
  };

  /** Toggle a dish in the "What did you order?" selector */
  const toggleMenuDish = (dish: string) => {
    setMenuSelectedDishes((prev) =>
      prev.includes(dish) ? prev.filter((d) => d !== dish) : [...prev, dish]
    );
  };

  const handlePhotoCapture = async (base64: string, exif: ExifData) => {
    setPhotoBase64(base64);
    setAnalyzing(true);
    setError('');
    setAnalysis(null);
    setExifDate(null);
    setNearbyRestaurants([]);
    setSelectedRestaurant(null);

    // Store EXIF date and kick off GPS restaurant lookup (both non-blocking)
    if (exif.date) setExifDate(exif.date);
    if (exif.gps) fetchNearbyFromGps(exif.gps.lat, exif.gps.lng);

    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoBase64: base64 }),
      });

      if (response.ok) {
        const data = await response.json();

        // Check if user needs to select which dishes are theirs
        if (data.needsSelection && data.allDetectedDishes && data.allDetectedDishes.length > 1) {
          setAllDetectedDishes(data.allDetectedDishes);
          setSelectedDishes(data.detectedFoods || []); // Pre-select AI's best guess
          setShowDishSelection(true);
        } else if (data.mode === 'ai' && data.detectedFoods.length > 0) {
          // Check confidence threshold
          if (data.confidence < 40) {
            // Low confidence -- offer restaurant fallback
            setAnalysis(data);
            setShowRestaurantFallback(true);
            setFallbackStep('prompt');
          } else {
            // AI analysis successful - move to confirmation
            setAnalysis(data);
            setFlowState('confirmation');
          }
        } else {
          // AI disabled or no foods detected - offer restaurant fallback
          setShowRestaurantFallback(true);
          setFallbackStep('prompt');
        }
      } else {
        // HTTP error - offer restaurant fallback
        setShowRestaurantFallback(true);
        setFallbackStep('prompt');
      }
    } catch (err) {
      console.error('AI analysis error:', err);
      setShowRestaurantFallback(true);
      setFallbackStep('prompt');
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleDishSelection = (dish: string) => {
    setSelectedDishes(prev =>
      prev.includes(dish)
        ? prev.filter(d => d !== dish)
        : [...prev, dish]
    );
  };

  const confirmDishSelection = () => {
    // Create analysis with only selected dishes
    setAnalysis({
      detectedFoods: selectedDishes,
      aiSummary: selectedDishes.join(', '),
      nutrition: {},
      confidence: 70,
      mode: 'ai',
    });
    setShowDishSelection(false);
    setFlowState('confirmation');
  };

  const handleQuickSave = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/meals/quick-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoBase64,
          ...(exifDate && { eatenAt: exifDate.toISOString() }),
          ...(selectedRestaurant && {
            restaurantName: selectedRestaurant.name,
            restaurantAddress: selectedRestaurant.address,
            restaurantPlaceId: selectedRestaurant.id,
          }),
          ...(menuSelectedDishes.length > 0 && { detectedFoods: menuSelectedDishes }),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save meal');
      }

      const data = await response.json();
      setSavedMeal(data.meal);
      setFlowState('success');
    } catch (err: any) {
      setError(err.message || 'Failed to save meal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (formData: any) => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          photoBase64: photoBase64 || null,
          aiSummary: analysis?.aiSummary,
          aiConfidence: analysis?.confidence,
          aiMode: analysis?.mode,
          nutritionSource: 'user-edited',
          // Pre-fill restaurant from EXIF GPS if the user didn't type one in the form
          ...(selectedRestaurant && !formData.restaurantName && {
            restaurantName: selectedRestaurant.name,
            restaurantAddress: selectedRestaurant.address,
            restaurantPlaceId: selectedRestaurant.id,
          }),
          ...(exifDate && { eatenAt: exifDate.toISOString() }),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save meal');
      }

      const data = await response.json();
      setSavedMeal(data.meal);
      setFlowState('success');
    } catch (err: any) {
      setError(err.message || 'Failed to save meal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Success Screen
  if (flowState === 'success' && savedMeal) {
    return <SuccessScreen meal={savedMeal} />;
  }

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-primary hover:underline mr-4"
          >
            ← {t.common.back}
          </button>
          <h1 className="text-2xl font-bold">{t.addMeal.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-danger/30 text-danger p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Photo Upload (Initial State) */}
        {flowState === 'photo' && (
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">{t.addMeal.photoTitle}</h2>
            <MealPhotoUpload onPhotoCapture={handlePhotoCapture} />

            {analyzing && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-primary">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">{t.addMeal.analyzingPhoto}</span>
                </div>
              </div>
            )}

            {/* Dish Selection UI */}
            {showDishSelection && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-300 rounded-lg">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>👥</span>
                  Multiple dishes detected! Which ones are yours?
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Select all the items YOU ate (tap to toggle):
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {allDetectedDishes.map((dish, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDishSelection(dish)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedDishes.includes(dish)
                          ? 'bg-primary text-white border-2 border-primary'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-primary'
                      }`}
                    >
                      {selectedDishes.includes(dish) && '✓ '}
                      {dish}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={confirmDishSelection}
                  disabled={selectedDishes.length === 0}
                  className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Selection ({selectedDishes.length} item{selectedDishes.length !== 1 ? 's' : ''})
                </button>
              </div>
            )}

            {/* Restaurant Fallback (when AI analysis fails) */}
            {showRestaurantFallback && (
              <div className="mt-4 space-y-4">
                {/* Step 1: Prompt */}
                {fallbackStep === 'prompt' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-sm mb-2">
                      {t.addMeal.troubleIdentifying || 'Having trouble identifying this meal'}
                    </h3>
                    <p className="text-xs text-gray-600 mb-4">
                      {t.addMeal.areYouAtRestaurant || 'Are you at a restaurant? We can look up the menu to help identify your meal.'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (nearbyRestaurants.length > 0) {
                            setFallbackStep('select-restaurant');
                          } else {
                            setFallbackStep('locating');
                            handleShareLocation();
                          }
                        }}
                        className="flex-1 bg-primary text-white py-2 rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors"
                      >
                        {t.addMeal.yesFindRestaurant || 'Yes, find my restaurant'}
                      </button>
                      <button
                        onClick={() => {
                          setShowRestaurantFallback(false);
                          setFlowState('editing');
                        }}
                        className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                      >
                        {t.addMeal.noEnterManually || 'No, enter manually'}
                      </button>
                    </div>
                    {/* If we have a low-confidence AI result, offer to use it anyway */}
                    {analysis && (
                      <button
                        onClick={() => {
                          setShowRestaurantFallback(false);
                          setFlowState('confirmation');
                        }}
                        className="w-full mt-2 text-xs text-primary hover:underline"
                      >
                        {t.addMeal.useAiAnyway || 'Use AI result anyway (low confidence)'}
                      </button>
                    )}
                  </div>
                )}

                {/* Step 2: Locating / Restaurant selection */}
                {(fallbackStep === 'locating' || fallbackStep === 'select-restaurant') && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {t.addMeal.selectYourRestaurant || 'Select your restaurant'}
                    </h4>
                    {nearbyRestaurants.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {nearbyRestaurants.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setSelectedRestaurant(r);
                              setRestaurantMenu([]);
                              setMenuSelectedDishes([]);
                              setFallbackStep('select-dishes');
                            }}
                            className="px-3 py-1.5 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:border-primary transition-all"
                          >
                            {r.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>{t.addMeal.findingNearby || 'Finding nearby restaurants...'}</span>
                      </div>
                    )}
                    {nearbyRestaurants.length === 0 && fallbackStep !== 'locating' && (
                      <button
                        type="button"
                        onClick={handleShareLocation}
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark mt-2"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>{t.addMeal.shareLocation}</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowRestaurantFallback(false);
                        setFlowState('editing');
                      }}
                      className="w-full mt-3 text-xs text-gray-500 hover:underline"
                    >
                      {t.addMeal.skipEnterManually || 'Skip, enter manually instead'}
                    </button>
                  </div>
                )}

                {/* Step 3: Menu item selection */}
                {fallbackStep === 'select-dishes' && selectedRestaurant && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-purple-900">
                        {(t.addMeal.whatDidYouOrderAt || 'What did you order at {restaurant}?').replace('{restaurant}', selectedRestaurant.name)}
                      </h4>
                    </div>
                    {loadingMenu ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>{t.addMeal.loadingMenu || 'Loading menu...'}</span>
                      </div>
                    ) : restaurantMenu.length > 0 ? (
                      <>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {restaurantMenu.map((item, idx) => {
                            const isSelected = menuSelectedDishes.includes(item.name);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => toggleMenuDish(item.name)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                                  isSelected
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                                }`}
                              >
                                {isSelected && '+ '}{item.name}
                              </button>
                            );
                          })}
                        </div>
                        {menuSelectedDishes.length > 0 && (
                          <button
                            onClick={() => {
                              setAnalysis({
                                detectedFoods: menuSelectedDishes,
                                aiSummary: menuSelectedDishes.join(', '),
                                nutrition: {},
                                confidence: 60,
                                mode: 'ai',
                              });
                              setShowRestaurantFallback(false);
                              setFlowState('confirmation');
                            }}
                            className="w-full bg-primary text-white py-2 rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors"
                          >
                            {(t.addMeal.continueWith || 'Continue with {count} item(s)').replace('{count}', String(menuSelectedDishes.length))}
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">{t.addMeal.noMenuAvailable}</p>
                    )}
                    <button
                      onClick={() => {
                        setSelectedRestaurant(null);
                        setRestaurantMenu([]);
                        setMenuSelectedDishes([]);
                        setFallbackStep('select-restaurant');
                      }}
                      className="w-full mt-2 text-xs text-gray-500 hover:underline"
                    >
                      {t.addMeal.backToRestaurants || 'Back to restaurant selection'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Confirmation State (Fast Path) */}
        {flowState === 'confirmation' && analysis && (
          <>
            {/* EXIF hints — shown as small badges above the confirmation card */}
            {(exifDate || nearbyRestaurants.length > 0) && (
              <div className="bg-white rounded-card shadow-card p-4 space-y-3">
                {exifDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>
                      {t.exifHints.timeFromPhoto}{' '}
                      <span className="font-semibold text-primary">
                        {exifDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                        {exifDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                  </div>
                )}

                {nearbyRestaurants.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{t.exifHints.restaurantFromPhoto}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {nearbyRestaurants.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            if (selectedRestaurant?.id === r.id) {
                              setSelectedRestaurant(null);
                              setRestaurantMenu([]);
                              setMenuSelectedDishes([]);
                            } else {
                              setSelectedRestaurant(r);
                              setRestaurantMenu([]);
                              setMenuSelectedDishes([]);
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all border ${
                            selectedRestaurant?.id === r.id
                              ? 'bg-primary text-white border-primary'
                              : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-primary'
                          }`}
                        >
                          {r.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t.exifHints.tapToTag}</p>
                  </div>
                )}

                {/* ── Share location button (when no GPS available) ── */}
                {nearbyRestaurants.length === 0 && !selectedRestaurant && (
                  <button
                    type="button"
                    onClick={handleShareLocation}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{t.addMeal.shareLocation}</span>
                  </button>
                )}
              </div>
            )}

            {/* ── What did you order? (menu chip selector) ──── */}
            {selectedRestaurant && (
              <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                    <span>🍽️</span>
                    <span>{t.addMeal.whatDidYouOrder}</span>
                  </h4>
                  <span className="text-xs text-purple-600">{selectedRestaurant.name}</span>
                </div>

                {loadingMenu ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>{t.common.loading}</span>
                  </div>
                ) : restaurantMenu.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {restaurantMenu.map((item, idx) => {
                      const isSelected = menuSelectedDishes.includes(item.name);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleMenuDish(item.name)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                            isSelected
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                          }`}
                        >
                          {isSelected && '✓ '}{item.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">{t.addMeal.noMenuAvailable}</p>
                )}

                {menuSelectedDishes.length > 0 && (
                  <p className="text-xs text-purple-700 mt-2">
                    {t.addMeal.selectedCount.replace('{count}', String(menuSelectedDishes.length))}
                  </p>
                )}
              </div>
            )}

            <MealConfirmation
              photo={photoBase64}
              analysis={analysis}
              onSave={handleQuickSave}
              onEdit={() => setFlowState('editing')}
              loading={saving}
            />
          </>
        )}

        {/* Manual Entry Option */}
        {flowState === 'photo' && !analyzing && !showDishSelection && (
          <div className="text-center">
            <button
              onClick={() => setFlowState('editing')}
              className="text-primary hover:underline text-sm font-medium"
            >
              Or add meal details manually →
            </button>
          </div>
        )}

        {/* Disclaimer */}
        {flowState === 'photo' && (
          <div className="bg-yellow-50 border border-warning/30 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              💡 <strong>{t.common.tip}:</strong> {t.addMeal.trackingTip}
            </p>
          </div>
        )}
      </div>

      {/* Edit Drawer (Slides up when user wants to edit) */}
      <EditDrawer
        isOpen={flowState === 'editing'}
        onClose={() => {
          if (analysis) {
            setFlowState('confirmation');
          } else {
            setFlowState('photo');
          }
        }}
        onSubmit={handleEditSubmit}
        loading={saving}
        initialData={analysis}
      />

      <BottomNav />
    </div>
  );
}
