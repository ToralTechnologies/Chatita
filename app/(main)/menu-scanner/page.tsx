'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Plus, X, CheckCircle } from 'lucide-react';
import BottomNav from '@/components/bottom-nav';
import { analyzeMenu } from '@/lib/menu-scanner';
import { MenuRecommendation } from '@/types';
import { compressImage } from '@/lib/compress-image';

export default function MenuScannerPage() {
  const router = useRouter();
  const [menuPhoto, setMenuPhoto] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [itemInput, setItemInput] = useState('');
  const [recommendations, setRecommendations] = useState<MenuRecommendation[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [overallAdvice, setOverallAdvice] = useState<string>('');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressImage(file);
      setMenuPhoto(base64);

      // Automatically analyze the photo with AI
      await analyzeMenuPhoto(base64);
    } catch (err) {
      console.error('Image compression failed:', err);
    }
  };

  const analyzeMenuPhoto = async (photoBase64: string) => {
    setAnalyzingPhoto(true);
    setRecommendations([]);
    setOverallAdvice('');

    try {
      const response = await fetch('/api/analyze-menu-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoBase64 }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.mode === 'ai' && data.dishes) {
          // Convert AI response to MenuRecommendation format
          const aiRecommendations: MenuRecommendation[] = data.dishes.map((dish: any) => ({
            name: dish.name,
            score: dish.score,
            reason: dish.reason,
            estimatedCarbs: dish.estimatedCarbs,
            estimatedCalories: dish.estimatedCalories,
            tips: dish.tips || [],
          }));

          setRecommendations(aiRecommendations);
          setOverallAdvice(data.overallAdvice || '');
          setShowResults(true);
        }
      }
    } catch (error) {
      console.error('Failed to analyze menu photo:', error);
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const addMenuItem = () => {
    if (itemInput.trim()) {
      setMenuItems([...menuItems, itemInput.trim()]);
      setItemInput('');
    }
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const analyzeMenuItems = () => {
    const results = analyzeMenu(menuItems);
    setRecommendations(results);
    setShowResults(true);
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'great':
        return 'bg-success/10 text-success border-success';
      case 'moderate':
        return 'bg-warning/10 text-warning border-warning';
      case 'caution':
        return 'bg-danger/10 text-danger border-danger';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getScoreLabel = (score: string) => {
    switch (score) {
      case 'great':
        return 'Great Choice';
      case 'moderate':
        return 'Moderate';
      case 'caution':
        return 'Caution';
      default:
        return 'Unknown';
    }
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-background pb-24">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Menu Recommendations</h1>
            <button
              onClick={() => {
                setShowResults(false);
                setMenuItems([]);
                setMenuPhoto(null);
              }}
              className="text-primary hover:underline text-sm"
            >
              Scan Again
            </button>
          </div>
        </div>

        {/* Menu Photo */}
        {menuPhoto && (
          <div className="max-w-2xl mx-auto px-6 pt-6">
            <img
              src={menuPhoto}
              alt="Menu"
              className="w-full rounded-lg shadow-card max-h-64 object-cover"
            />
          </div>
        )}

        {/* Recommendations */}
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
          {overallAdvice && (
            <div className="bg-blue-50 border border-primary/30 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span>🤖</span>
                AI Menu Analysis
              </h3>
              <p className="text-sm text-gray-700">{overallAdvice}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-primary/30 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              💙 Found {recommendations.length} menu item{recommendations.length !== 1 ? 's' : ''} - ranked from best to okay for diabetes
            </p>
          </div>

          {recommendations.map((rec, index) => (
            <div key={index} className="bg-white rounded-card shadow-card p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg flex-1">{rec.name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(rec.score)}`}>
                  {getScoreLabel(rec.score)}
                </span>
              </div>

              <p className="text-gray-700 mb-4 text-sm">{rec.reason}</p>

              {(rec.estimatedCarbs || rec.estimatedCalories) && (
                <div className="flex gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  {rec.estimatedCalories && (
                    <div>
                      <div className="text-sm text-gray-500">Est. Calories</div>
                      <div className="font-semibold text-primary">{rec.estimatedCalories}</div>
                    </div>
                  )}
                  {rec.estimatedCarbs && (
                    <div>
                      <div className="text-sm text-gray-500">Est. Carbs</div>
                      <div className="font-semibold text-primary">{rec.estimatedCarbs}g</div>
                    </div>
                  )}
                </div>
              )}

              {rec.tips && rec.tips.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Tips for ordering:
                  </h4>
                  <ul className="space-y-1">
                    {rec.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-success">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-warning/30 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              ⚠️ These are rough estimates based on typical ingredients. Actual nutrition may vary.
              Always ask your server about preparation methods and ingredients.
            </p>
          </div>
        </div>

        <BottomNav />
      </div>
    );
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
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Menu Scanner</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Info Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-card p-6">
          <div className="text-4xl mb-3 text-center">🍽️</div>
          <h2 className="font-semibold text-lg mb-2 text-center">AI-Powered Menu Scanner</h2>
          <p className="text-sm text-gray-600 text-center mb-3">
            Take a photo of any restaurant menu and AI will automatically:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 max-w-sm mx-auto">
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              <span>Identify all menu items from the photo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              <span>Rank dishes by diabetes-friendliness</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              <span>Provide ordering tips for each dish</span>
            </li>
          </ul>
        </div>

        {/* Photo Upload */}
        <div className="bg-white rounded-card shadow-card p-6">
          <h3 className="font-semibold mb-4">📸 Upload Menu Photo</h3>
          <p className="text-sm text-gray-600 mb-4">
            Take or upload a photo of the menu and AI will automatically suggest the best diabetes-friendly dishes!
          </p>
          {analyzingPhoto ? (
            <div className="border-2 border-dashed border-primary rounded-lg p-8 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-primary font-medium">🤖 AI is analyzing the menu...</p>
              <p className="text-sm text-gray-500 mt-1">Finding diabetes-friendly options for you</p>
            </div>
          ) : menuPhoto ? (
            <div className="relative">
              <img src={menuPhoto} alt="Menu" className="w-full rounded-lg" />
              <button
                onClick={() => {
                  setMenuPhoto(null);
                  setRecommendations([]);
                  setShowResults(false);
                }}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2 font-medium">Take or Upload Menu Photo</p>
              <p className="text-sm text-gray-500 mb-4">AI will analyze and suggest best options</p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {/* Camera Button */}
                <label className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-button cursor-pointer hover:bg-primary-dark transition-colors">
                  <Camera className="w-5 h-5" />
                  Take Photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {/* Gallery Button */}
                <label className="inline-flex items-center gap-2 bg-white border-2 border-primary text-primary px-6 py-3 rounded-button cursor-pointer hover:bg-primary/10 transition-colors">
                  <Upload className="w-5 h-5" />
                  Choose from Gallery
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Manual Menu Items Input (Optional) */}
        <div className="bg-white rounded-card shadow-card p-6">
          <h3 className="font-semibold mb-2">✍️ Or Type Menu Items Manually</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you prefer, you can manually type menu items for comparison
          </p>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={itemInput}
              onChange={(e) => setItemInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addMenuItem();
                }
              }}
              placeholder="Type a menu item (e.g., Grilled Salmon)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={addMenuItem}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {menuItems.length > 0 && (
            <>
              <div className="space-y-2 mb-4">
                {menuItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <span className="text-gray-700">{item}</span>
                    <button
                      onClick={() => removeMenuItem(index)}
                      className="text-gray-400 hover:text-danger transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={analyzeMenuItems}
                className="w-full bg-primary text-white py-3 rounded-button font-medium hover:bg-primary-dark transition-colors"
              >
                Analyze {menuItems.length} Item{menuItems.length !== 1 ? 's' : ''}
              </button>
            </>
          )}

          {menuItems.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Optional: Add items manually to compare with photo analysis
            </p>
          )}
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-warning/30 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            💡 <strong>Tip:</strong> Take a photo of the menu for instant AI analysis! AI will identify all dishes and rank them by diabetes-friendliness.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
