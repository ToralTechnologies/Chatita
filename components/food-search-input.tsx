'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2, Barcode, Camera, Upload } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface FoodItem {
  id?: string;
  fdcId?: string;
  barcode?: string;
  foodName: string;
  foodNameEs?: string;
  brand?: string;
  servingSize: string;
  servingsEaten: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  source: 'usda' | 'barcode' | 'custom' | 'manual';
}

interface FoodSearchResult {
  fdcId?: string;
  barcode?: string;
  foodName: string;
  foodNameEs?: string;
  brand?: string;
  servingSize: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  source: string;
  isLowCarb?: boolean;
  isLowGI?: boolean;
}

interface FoodSearchInputProps {
  onAddFood: (food: FoodItem) => void;
  foodEntries: FoodItem[];
  onRemoveFood: (index: number) => void;
  onUpdateServings: (index: number, servings: number) => void;
}

export default function FoodSearchInput({
  onAddFood,
  foodEntries,
  onRemoveFood,
  onUpdateServings,
}: FoodSearchInputProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchFood = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.foods || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Food search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => searchFood(value), 350);
  };

  const selectFood = (food: FoodSearchResult) => {
    const foodItem: FoodItem = {
      fdcId: food.fdcId,
      barcode: food.barcode,
      foodName: food.foodName,
      foodNameEs: food.foodNameEs,
      brand: food.brand,
      servingSize: food.servingSize,
      servingsEaten: 1,
      calories: food.calories,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat,
      fiber: food.fiber,
      sugar: food.sugar,
      sodium: food.sodium,
      source: food.source as any,
    };

    onAddFood(foodItem);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const lookupBarcode = async (code: string) => {
    if (code.trim().length < 8) {
      alert('Please enter a valid barcode (at least 8 digits)');
      return;
    }

    setScanningBarcode(true);
    try {
      const res = await fetch(`/api/nutrition/barcode?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.food) {
          const foodItem: FoodItem = {
            fdcId: data.food.fdcId,
            barcode: data.food.barcode,
            foodName: data.food.foodName,
            foodNameEs: data.food.foodNameEs,
            brand: data.food.brand,
            servingSize: data.food.servingSize,
            servingsEaten: 1,
            calories: data.food.calories,
            carbs: data.food.carbs,
            protein: data.food.protein,
            fat: data.food.fat,
            fiber: data.food.fiber,
            sugar: data.food.sugar,
            sodium: data.food.sodium,
            source: 'barcode',
          };
          onAddFood(foodItem);
          setBarcodeInput('');
          setShowBarcodeInput(false);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Product not found. Try searching by name instead.');
      }
    } catch (error) {
      console.error('Barcode lookup error:', error);
      alert('Failed to look up barcode. Try searching by name instead.');
    } finally {
      setScanningBarcode(false);
    }
  };

  const handleBarcodeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningBarcode(true);

    try {
      // Import ZXing library dynamically (client-side only)
      const { BrowserMultiFormatReader } = await import('@zxing/browser');

      // Create an image element to load the file
      const img = document.createElement('img');
      const reader = new FileReader();

      reader.onload = async (event) => {
        if (!event.target?.result) {
          alert('Failed to read image file');
          setScanningBarcode(false);
          return;
        }

        img.src = event.target.result as string;
        img.onload = async () => {
          try {
            const codeReader = new BrowserMultiFormatReader();
            const result = await codeReader.decodeFromImageElement(img);

            if (result) {
              const barcode = result.getText();
              setBarcodeInput(barcode);

              // Automatically lookup the barcode
              await lookupBarcode(barcode);
            } else {
              alert('No barcode detected in image. Please try again or enter the barcode manually.');
            }
          } catch (error) {
            console.error('Barcode scanning error:', error);
            alert('Could not read barcode from image. Please try again with a clearer photo or enter the barcode manually.');
            setShowBarcodeInput(true);
          } finally {
            setScanningBarcode(false);
          }
        };

        img.onerror = () => {
          alert('Failed to load image');
          setScanningBarcode(false);
        };
      };

      reader.onerror = () => {
        alert('Failed to read image file');
        setScanningBarcode(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Barcode upload error:', error);
      alert('Failed to process image. Please try again or enter the barcode manually.');
      setScanningBarcode(false);
      setShowBarcodeInput(true);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getTotalNutrition = () => {
    return foodEntries.reduce(
      (acc, food) => {
        const multiplier = food.servingsEaten;
        return {
          calories: acc.calories + food.calories * multiplier,
          carbs: acc.carbs + food.carbs * multiplier,
          protein: acc.protein + food.protein * multiplier,
          fat: acc.fat + food.fat * multiplier,
          fiber: acc.fiber + (food.fiber || 0) * multiplier,
          sugar: acc.sugar + (food.sugar || 0) * multiplier,
          sodium: acc.sodium + (food.sodium || 0) * multiplier,
        };
      },
      { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );
  };

  const totals = getTotalNutrition();

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div ref={wrapperRef}>
        <label className="block text-sm font-medium mb-2">🔍 Search Food Database</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowResults(true);
            }}
            placeholder="Search foods (e.g. chicken breast, brown rice)..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Search Results Dropdown */}
        {(searching || (showResults && searchResults.length > 0)) && (
          <div className="mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {searching ? (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Searching food database...
              </div>
            ) : (
              searchResults.map((food, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectFood(food)}
                  className="w-full text-left px-3 py-2.5 hover:bg-primary/5 transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {food.foodName}
                        {food.brand && <span className="text-xs text-gray-500 ml-1">({food.brand})</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {food.servingSize} · {food.calories} cal · {food.carbs}g carbs
                        {food.isLowCarb && <span className="ml-1 text-green-600">🥗 Low carb</span>}
                        {food.isLowGI && <span className="ml-1 text-blue-600">📉 Low GI</span>}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Barcode Scanner */}
      <div>
        <button
          type="button"
          onClick={() => setShowBarcodeInput(!showBarcodeInput)}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-medium"
        >
          <Barcode className="w-4 h-4" />
          {showBarcodeInput ? 'Hide barcode scanner' : 'Or scan barcode'}
        </button>

        {showBarcodeInput && (
          <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value.replace(/\D/g, ''))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    lookupBarcode(barcodeInput);
                  }
                }}
                placeholder="Enter UPC/EAN barcode number..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => lookupBarcode(barcodeInput)}
                disabled={scanningBarcode || barcodeInput.length < 8}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {scanningBarcode ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Lookup
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment');
                    fileInputRef.current.click();
                  }
                }}
                disabled={scanningBarcode}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanningBarcode ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                {scanningBarcode ? 'Scanning...' : 'Scan from camera'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture');
                    fileInputRef.current.click();
                  }
                }}
                disabled={scanningBarcode}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanningBarcode ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {scanningBarcode ? 'Processing...' : 'Upload photo'}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBarcodeImageUpload}
              className="hidden"
            />
            {scanningBarcode ? (
              <p className="text-xs text-primary font-medium flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Scanning barcode from image...
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                💡 Type the barcode number manually or scan/upload a photo of the product barcode
              </p>
            )}
          </div>
        )}
      </div>

      {/* Added Foods List */}
      {foodEntries.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Added Foods ({foodEntries.length})</h4>
          <div className="space-y-2">
            {foodEntries.map((food, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {food.foodName}
                    {food.brand && <span className="text-xs text-gray-500 ml-1">({food.brand})</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {food.servingSize} · {Math.round(food.calories * food.servingsEaten)} cal · {Math.round(food.carbs * food.servingsEaten)}g carbs
                  </p>
                </div>

                {/* Servings Adjuster */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateServings(index, Math.max(0.25, food.servingsEaten - 0.25))}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-bold"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={food.servingsEaten}
                    onChange={(e) => onUpdateServings(index, Math.max(0.25, parseFloat(e.target.value) || 1))}
                    className="w-16 px-2 py-1 text-center text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateServings(index, food.servingsEaten + 0.25)}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => onRemoveFood(index)}
                  className="text-danger hover:text-danger/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Total Nutrition Summary */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="text-sm font-semibold text-primary mb-2">📊 Total Nutrition</h4>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-gray-600 block">Calories</span>
                <span className="font-bold text-gray-900">{Math.round(totals.calories)}</span>
              </div>
              <div>
                <span className="text-gray-600 block">Carbs</span>
                <span className="font-bold text-gray-900">{Math.round(totals.carbs)}g</span>
              </div>
              <div>
                <span className="text-gray-600 block">Protein</span>
                <span className="font-bold text-gray-900">{Math.round(totals.protein)}g</span>
              </div>
              <div>
                <span className="text-gray-600 block">Fat</span>
                <span className="font-bold text-gray-900">{Math.round(totals.fat)}g</span>
              </div>
            </div>
            {totals.fiber > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                Fiber: {Math.round(totals.fiber)}g · Sugar: {Math.round(totals.sugar)}g · Sodium: {Math.round(totals.sodium)}mg
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
