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
      <div
        className="p-4 text-center"
        style={{
          background: 'rgba(126,211,33,0.1)',
          borderRadius: '18px',
          border: '1px solid rgba(126,211,33,0.3)',
        }}
      >
        <Check className="w-5 h-5 mx-auto mb-1" style={{ color: '#4A8C00' }} />
        <p className="text-sm font-semibold" style={{ color: '#4A8C00' }}>
          {t.followUp?.thanks || 'Thanks for updating!'}
        </p>
      </div>
    );
  }

  return (
    <div
      className="p-4"
      style={{
        background: 'var(--bg-card)',
        borderRadius: '18px',
        border: '1px solid var(--border-card-gold)',
        boxShadow: '0 10px 24px -8px rgba(1,35,116,0.18)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4" style={{ color: '#C8932B' }} />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
            {t.followUp?.checkIn || 'Quick Check-in'}
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-full transition-colors"
          style={{ color: 'var(--text-muted)' }}
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
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{mealName}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {hoursAgo > 0
              ? (t.followUp?.hoursAgo || '{hours}h ago').replace('{hours}', String(hoursAgo))
              : t.followUp?.justNow || 'Just now'}
          </p>
        </div>
      </div>

      {/* Question */}
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        {t.followUp?.didYouEat || 'Did you eat everything?'}
      </p>

      {/* Response buttons */}
      {!showPortionPicker ? (
        <div className="grid grid-cols-2 gap-2">
          {[
            { fn: () => handleRespond('ate_all'), icon: <Check className="w-3.5 h-3.5" />, label: t.followUp?.ateAll || 'Ate everything', color: '#4A8C00', bg: 'rgba(126,211,33,0.1)' },
            { fn: () => setShowPortionPicker(true), icon: <Minus className="w-3.5 h-3.5" />, label: t.followUp?.ateSome || 'Ate some', color: '#9A6F18', bg: 'rgba(200,147,43,0.12)' },
            { fn: () => handleRespond('didnt_eat'), icon: <X className="w-3.5 h-3.5" />, label: t.followUp?.didntEat || "Didn't eat", color: '#D0021B', bg: 'rgba(208,2,27,0.08)' },
            { fn: () => handleRespond('changed_meal'), icon: <Utensils className="w-3.5 h-3.5" />, label: t.followUp?.changedMeal || 'Changed meal', color: 'var(--text-primary)', bg: 'var(--bg-card-alt)' },
          ].map(({ fn, icon, label, color, bg }) => (
            <button
              key={label}
              onClick={fn}
              disabled={responding}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold transition-all disabled:opacity-50"
              style={{ borderRadius: '10px', background: bg, color }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
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
                className="flex-1 py-2 text-sm font-semibold transition-all disabled:opacity-50"
                style={{ borderRadius: '10px', background: 'rgba(200,147,43,0.12)', color: '#9A6F18' }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowPortionPicker(false)}
            className="w-full mt-2 text-xs font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            {t.common?.back || 'Back'}
          </button>
        </div>
      )}
    </div>
  );
}
