'use client';

import { useState, useEffect } from 'react';
import { X, Check, Minus, Utensils } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface FollowUpData {
  id: string;
  scheduledFor: string;
  meal: {
    id: string;
    aiSummary?: string;
    detectedFoods?: string;
    photoBase64?: string;
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
    mealType?: string;
    eatenAt: string;
  };
}

export default function MealFollowUpBanner() {
  const { t } = useTranslation();
  const [followups, setFollowups] = useState<FollowUpData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPortionPicker, setShowPortionPicker] = useState(false);
  const [responding, setResponding] = useState(false);
  const [thankYou, setThankYou] = useState(false);

  useEffect(() => {
    fetchPendingFollowups();
  }, []);

  const fetchPendingFollowups = async () => {
    try {
      const res = await fetch('/api/followups/pending');
      if (res.ok) {
        const data = await res.json();
        setFollowups(data.followups || []);
      }
    } catch {
      // Silent fail - follow-ups are non-critical
    }
  };

  const handleRespond = async (response: string, portionEaten?: number) => {
    const current = followups[currentIndex];
    if (!current || responding) return;

    setResponding(true);
    try {
      const res = await fetch(`/api/followups/${current.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response, portionEaten }),
      });

      if (res.ok) {
        setThankYou(true);
        setShowPortionPicker(false);

        setTimeout(() => {
          setThankYou(false);
          if (currentIndex < followups.length - 1) {
            setCurrentIndex((i) => i + 1);
          } else {
            setFollowups([]);
          }
        }, 1500);
      }
    } catch {
      // Silent fail
    } finally {
      setResponding(false);
    }
  };

  const handleDismiss = async () => {
    const current = followups[currentIndex];
    if (!current) return;

    try {
      await fetch(`/api/followups/${current.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: 'ate_all' }),
      });
    } catch {
      // Silent fail
    }

    if (currentIndex < followups.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFollowups([]);
    }
  };

  if (followups.length === 0) return null;

  const current = followups[currentIndex];
  if (!current) return null;

  const mealName =
    current.meal.aiSummary ||
    (current.meal.detectedFoods
      ? (() => {
          try {
            return JSON.parse(current.meal.detectedFoods).join(', ');
          } catch {
            return current.meal.detectedFoods;
          }
        })()
      : t.followUp?.yourMeal || 'your meal');

  const hoursAgo = Math.round(
    (Date.now() - new Date(current.meal.eatenAt).getTime()) / (60 * 60 * 1000)
  );

  if (thankYou) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-card shadow-card p-4 text-center">
        <Check className="w-6 h-6 text-success mx-auto mb-1" />
        <p className="text-sm font-medium text-green-800">
          {t.followUp?.thanks || 'Thanks for updating!'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-card shadow-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-gray-900">
            {t.followUp?.checkIn || 'Quick Check-in'}
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label={t.followUp?.dismiss || 'Dismiss'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Meal info */}
      <div className="flex items-center gap-3 mb-3">
        {current.meal.photoBase64 && (
          <img
            src={`data:image/jpeg;base64,${current.meal.photoBase64.substring(0, 100) === current.meal.photoBase64 ? current.meal.photoBase64 : current.meal.photoBase64}`}
            alt=""
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{mealName}</p>
          <p className="text-xs text-gray-500">
            {hoursAgo > 0
              ? (t.followUp?.hoursAgo || '{hours}h ago').replace('{hours}', String(hoursAgo))
              : t.followUp?.justNow || 'Just now'}
          </p>
        </div>
      </div>

      {/* Question */}
      <p className="text-sm text-gray-700 mb-3">
        {t.followUp?.didYouEat || 'Did you eat everything?'}
      </p>

      {/* Response buttons */}
      {!showPortionPicker ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleRespond('ate_all')}
            disabled={responding}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            {t.followUp?.ateAll || 'Ate everything'}
          </button>
          <button
            onClick={() => setShowPortionPicker(true)}
            disabled={responding}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50"
          >
            <Minus className="w-3.5 h-3.5" />
            {t.followUp?.ateSome || 'Ate some'}
          </button>
          <button
            onClick={() => handleRespond('didnt_eat')}
            disabled={responding}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            {t.followUp?.didntEat || "Didn't eat"}
          </button>
          <button
            onClick={() => handleRespond('changed_meal')}
            disabled={responding}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Utensils className="w-3.5 h-3.5" />
            {t.followUp?.changedMeal || 'Changed meal'}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            {t.followUp?.howMuch || 'How much did you eat?'}
          </p>
          <div className="flex gap-2">
            {[
              { label: '25%', value: 0.25 },
              { label: '50%', value: 0.5 },
              { label: '75%', value: 0.75 },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleRespond('ate_some', value)}
                disabled={responding}
                className="flex-1 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50"
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowPortionPicker(false)}
            className="w-full mt-2 text-xs text-gray-500 hover:underline"
          >
            {t.common?.back || 'Back'}
          </button>
        </div>
      )}
    </div>
  );
}
