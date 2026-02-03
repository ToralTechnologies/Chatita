'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, MapPin } from 'lucide-react';
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

export default function AddMealPage() {
  const router = useRouter();
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

  /** Fetch nearby restaurants using GPS from EXIF */
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
          // AI analysis successful - move to confirmation
          setAnalysis(data);
          setFlowState('confirmation');
        } else {
          // AI disabled or no foods detected - show manual entry
          setError('AI analysis unavailable. Please add meal details manually.');
          setFlowState('editing');
        }
      } else {
        setError('Failed to analyze photo. You can still add meal details manually.');
        setFlowState('editing');
      }
    } catch (err) {
      console.error('AI analysis error:', err);
      setError('Failed to analyze photo. You can still add meal details manually.');
      setFlowState('editing');
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
                          onClick={() => setSelectedRestaurant(selectedRestaurant?.id === r.id ? null : r)}
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
