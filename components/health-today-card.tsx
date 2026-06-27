'use client';

import { useEffect, useState } from 'react';

type DailySummary = {
  provider: string;
  steps?: number | null;
  activeMinutes?: number | null;
  exerciseMinutes?: number | null;
  distanceMeters?: number | null;
  sleepMinutes?: number | null;
  restingHeartRate?: number | null;
  averageHeartRate?: number | null;
  activeCalories?: number | null;
  importedAt: string;
};

const PROVIDER_LABELS: Record<string, string> = {
  google_health: 'Google Health',
  apple_health_export: 'Apple Health',
  apple_healthkit_companion_future: 'Apple Health',
  manual: 'Manual',
};

function fmt(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function HealthTodayCard() {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchToday() {
      try {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const res = await fetch(`/api/health/today?date=${dateStr}`);
        if (res.ok) {
          const data = await res.json();
          setSummaries(data.summaries ?? []);
        }
      } catch {
        // Non-fatal
      } finally {
        setLoading(false);
      }
    }
    fetchToday();
  }, []);

  if (loading || summaries.length === 0) return null;

  // Pick the most recent summary (prefer google_health if available)
  const summary =
    summaries.find(s => s.provider === 'google_health') ??
    summaries.find(s => s.provider === 'apple_health_export') ??
    summaries[0];

  const providerLabel = PROVIDER_LABELS[summary.provider] ?? summary.provider;

  const hasData =
    summary.steps != null ||
    summary.activeMinutes != null ||
    summary.sleepMinutes != null ||
    summary.restingHeartRate != null;

  if (!hasData) return null;

  return (
    <div
      style={{
        background: '#FFFDF9',
        borderRadius: 22,
        border: '1px solid rgba(1,35,116,0.07)',
        boxShadow: '0 14px 30px -24px rgba(1,35,116,.28)',
        padding: '16px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#012374', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Today from {providerLabel}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(22,24,42,0.35)' }}>
          Updated {new Date(summary.importedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px' }}>
        {summary.steps != null && (
          <Metric label="Steps" value={summary.steps.toLocaleString()} />
        )}
        {summary.activeMinutes != null && (
          <Metric label="Active minutes" value={String(summary.activeMinutes)} />
        )}
        {summary.exerciseMinutes != null && summary.exerciseMinutes !== summary.activeMinutes && (
          <Metric label="Exercise" value={`${summary.exerciseMinutes} min`} />
        )}
        {summary.sleepMinutes != null && (
          <Metric label="Sleep" value={fmt(summary.sleepMinutes)} />
        )}
        {summary.restingHeartRate != null && (
          <Metric label="Resting HR" value={`${summary.restingHeartRate} bpm`} />
        )}
        {summary.activeCalories != null && (
          <Metric label="Active cal" value={String(Math.round(summary.activeCalories))} />
        )}
      </div>

      <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.35)', marginTop: 10, lineHeight: 1.5 }}>
        Connected data may be incomplete. Log manually anytime to add more detail.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#012374', fontFamily: 'var(--font-dm-serif), serif' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.5)', marginTop: 1 }}>{label}</div>
    </div>
  );
}
