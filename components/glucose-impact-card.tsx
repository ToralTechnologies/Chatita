'use client';

import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface GlucoseImpactData {
  available: boolean;
  preMealGlucose: number | null;
  peakPostMeal: number | null;
  glucoseRise: number | null;
  timeToSpike: number | null;
  impact: 'minimal' | 'moderate' | 'significant' | 'high' | 'unknown';
  readings: Array<{
    value: number;
    measuredAt: string;
    minutesFromMeal: number;
  }>;
  windowComplete: boolean;
  minutesUntilComplete: number | null;
}

interface GlucoseImpactCardProps {
  mealId: string;
  compact?: boolean;
}

const impactConfig = {
  minimal: {
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
  },
  moderate: {
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  significant: {
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-800',
  },
  high: {
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
  },
  unknown: {
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
  },
};

export default function GlucoseImpactCard({ mealId, compact = false }: GlucoseImpactCardProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<GlucoseImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImpact();
  }, [mealId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchImpact = async () => {
    try {
      const res = await fetch(`/api/meals/${mealId}/glucose-impact`);
      if (res.ok) {
        const json = await res.json();
        setData(json.impact);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
        <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        <span>{t.common?.loading || 'Loading...'}</span>
      </div>
    );
  }

  if (!data || !data.available) {
    if (compact) return null;
    return (
      <div className="text-sm text-gray-400 py-2 text-center">
        <Activity className="w-4 h-4 inline mr-1" />
        {t.glucoseImpact?.noData || 'No CGM data for this meal'}
      </div>
    );
  }

  const config = impactConfig[data.impact];
  const impactLabels: Record<string, string> = {
    minimal: t.glucoseImpact?.minimal || 'Minimal Impact',
    moderate: t.glucoseImpact?.moderate || 'Moderate Impact',
    significant: t.glucoseImpact?.significant || 'Significant Impact',
    high: t.glucoseImpact?.high || 'High Impact',
    unknown: t.glucoseImpact?.title || 'Blood Sugar Impact',
  };
  const impactLabel = impactLabels[data.impact] || data.impact;

  // Still tracking state
  if (!data.windowComplete && data.glucoseRise === null) {
    return (
      <div className={`${config.bg} border ${config.border} rounded-lg p-3`}>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className={config.color}>
            {t.glucoseImpact?.stillTracking || 'Still tracking...'}
          </span>
          {data.minutesUntilComplete && (
            <span className="text-xs text-gray-500">
              {(t.glucoseImpact?.completeIn || 'Complete in {minutes} min').replace(
                '{minutes}',
                String(data.minutesUntilComplete)
              )}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Render mini sparkline from readings
  const renderSparkline = () => {
    if (data.readings.length < 2) return null;

    const values = data.readings.map((r) => r.value);
    const min = Math.min(...values) - 10;
    const max = Math.max(...values) + 10;
    const range = max - min || 1;

    const width = 120;
    const height = 32;
    const points = data.readings
      .map((r, i) => {
        const x = (i / (data.readings.length - 1)) * width;
        const y = height - ((r.value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="flex-shrink-0">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={config.color}
        />
      </svg>
    );
  };

  if (compact) {
    return (
      <div className={`${config.bg} border ${config.border} rounded-lg p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${config.color}`} />
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
              {impactLabel}
            </span>
          </div>
          {renderSparkline()}
        </div>
        {data.glucoseRise !== null && (
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
            {data.preMealGlucose !== null && (
              <span>{t.glucoseImpact?.preMeal || 'Before'}: {data.preMealGlucose} mg/dL</span>
            )}
            <span className="font-medium">
              <TrendingUp className="w-3 h-3 inline mr-0.5" />
              +{data.glucoseRise} mg/dL
            </span>
          </div>
        )}
        {!data.windowComplete && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {t.glucoseImpact?.stillTracking || 'Still tracking...'}
          </p>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className={`${config.bg} border ${config.border} rounded-card shadow-card p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className={`w-5 h-5 ${config.color}`} />
          <h3 className="text-sm font-semibold text-gray-900">
            {t.glucoseImpact?.title || 'Blood Sugar Impact'}
          </h3>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.badge}`}>
          {impactLabel}
        </span>
      </div>

      {renderSparkline()}

      <div className="grid grid-cols-2 gap-3 mt-3">
        {data.preMealGlucose !== null && (
          <div>
            <p className="text-xs text-gray-500">{t.glucoseImpact?.preMeal || 'Before meal'}</p>
            <p className="text-lg font-semibold text-gray-900">{data.preMealGlucose} <span className="text-xs font-normal">mg/dL</span></p>
          </div>
        )}
        {data.peakPostMeal !== null && (
          <div>
            <p className="text-xs text-gray-500">{t.glucoseImpact?.peak || 'Peak'}</p>
            <p className="text-lg font-semibold text-gray-900">{data.peakPostMeal} <span className="text-xs font-normal">mg/dL</span></p>
          </div>
        )}
        {data.glucoseRise !== null && (
          <div>
            <p className="text-xs text-gray-500">{t.glucoseImpact?.rise || 'Rise'}</p>
            <p className={`text-lg font-semibold ${config.color}`}>+{data.glucoseRise} <span className="text-xs font-normal">mg/dL</span></p>
          </div>
        )}
        {data.timeToSpike !== null && (
          <div>
            <p className="text-xs text-gray-500">{t.glucoseImpact?.timeToSpike || 'Time to peak'}</p>
            <p className="text-lg font-semibold text-gray-900">{data.timeToSpike} <span className="text-xs font-normal">{t.glucoseImpact?.minutes || 'min'}</span></p>
          </div>
        )}
      </div>

      {!data.windowComplete && (
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {t.glucoseImpact?.stillTracking || 'Still tracking...'}
          {data.minutesUntilComplete && (
            <span>
              {' '}- {(t.glucoseImpact?.completeIn || 'Complete in {minutes} min').replace(
                '{minutes}',
                String(data.minutesUntilComplete)
              )}
            </span>
          )}
        </p>
      )}

      {data.impact === 'high' && (
        <div className="mt-3 p-2 bg-red-100 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            {t.glucoseImpact?.highWarning || 'This meal caused a significant glucose spike. Consider smaller portions or pairing with protein/fiber next time.'}
          </p>
        </div>
      )}
    </div>
  );
}
