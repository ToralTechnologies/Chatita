'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import MealPhotoUpload from '@/components/meal-photo-upload';
import MealForm from '@/components/meal-form';

export default function AddMealPage() {
  const router = useRouter();
  const [photoBase64, setPhotoBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          photoBase64: photoBase64 || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save meal');
      }

      setSuccess(true);

      // Redirect to meal history after 1.5 seconds
      setTimeout(() => {
        router.push('/meal-history');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-background flex items-center justify-center pb-24">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Meal Saved!</h2>
          <p className="text-gray-600">Great job tracking your food, mi amor</p>
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
          <h1 className="text-2xl font-bold">Add Meal</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-danger/30 text-danger p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Photo Upload */}
        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Meal Photo (Optional)</h2>
          <MealPhotoUpload onPhotoCapture={setPhotoBase64} />
        </div>

        {/* Meal Form */}
        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Meal Details</h2>
          <MealForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-warning/30 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            💡 <strong>Tip:</strong> Track what you eat to help identify patterns.
            Nutrition info is optional - even just listing the foods helps!
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
