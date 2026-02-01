'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/bottom-nav';
import { TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '@/lib/i18n/context';

export default function InsightsPage() {
  const { t } = useTranslation();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/insights');
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-background pb-24 flex items-center justify-center">
        <p className="text-gray-500">{t.insights.loadingInsights}</p>
        <BottomNav />
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-gray-background pb-24 flex items-center justify-center">
        <p className="text-gray-500">{t.insights.unableToLoad}</p>
        <BottomNav />
      </div>
    );
  }

  const getPatternColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-success/10 border-success/30';
      case 'tip':
        return 'bg-primary/10 border-primary/30';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            {t.insights.title}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <Calendar className="w-4 h-4" />
            <span>
              {format(new Date(insights.dateRange.start), 'MMM d')} -{' '}
              {format(new Date(insights.dateRange.end), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Card */}
        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="font-semibold mb-4">{t.insights.weeklySummary}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {insights.stats.timeInRange}%
              </div>
              <div className="text-sm text-gray-600 mt-1">{t.insights.timeInRange}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {insights.stats.avgGlucose}
              </div>
              <div className="text-sm text-gray-600 mt-1">{t.insights.avgGlucose}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {insights.stats.mealsLogged}
              </div>
              <div className="text-sm text-gray-600 mt-1">{t.insights.mealsLogged}</div>
            </div>
          </div>
        </div>

        {/* Patterns */}
        {insights.patterns.length > 0 ? (
          <>
            <h2 className="font-semibold text-lg">{t.insights.patternsTips}</h2>
            <div className="space-y-4">
              {insights.patterns.map((pattern: any, index: number) => (
                <div
                  key={index}
                  className={`rounded-card border p-6 ${getPatternColor(pattern.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl flex-shrink-0">{pattern.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{pattern.title}</h3>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {pattern.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-card shadow-card p-8 text-center">
            <div className="text-5xl mb-3">📊</div>
            <h3 className="font-semibold mb-2">{t.insights.keepTracking}</h3>
            <p className="text-gray-600 text-sm">
              {t.insights.keepTrackingMessage}
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-warning/30 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            💡 {t.insights.disclaimer}
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
