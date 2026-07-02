'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type DailySummary = {
  provider: string;
  date?: string | null;
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

type Overview = {
  totalDays: number;
  daysWithSteps: number;
  avgSteps: number | null;
  avgSleepMinutes: number | null;
  firstDate?: string | null;
  lastDate?: string | null;
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
  const { t, language } = useTranslation();
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [isToday, setIsToday] = useState(true);
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
          setOverview(data.overview ?? null);
          setIsToday(data.isToday !== false);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#012374', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {(isToday ? t.healthToday.todayFrom : t.healthToday.latestFrom).replace('{provider}', providerLabel)}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(22,24,42,0.4)', flexShrink: 0 }}>
          {!isToday && summary.date
            ? new Date(summary.date).toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : t.healthToday.updatedAt.replace('{time}', new Date(summary.importedAt).toLocaleTimeString(language === 'es' ? 'es-MX' : 'en-US', { hour: '2-digit', minute: '2-digit' }))}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px' }}>
        {summary.steps != null && (
          <Metric label={t.healthToday.steps} value={summary.steps.toLocaleString()} />
        )}
        {summary.activeMinutes != null && (
          <Metric label={t.healthToday.activeMinutes} value={String(summary.activeMinutes)} />
        )}
        {summary.exerciseMinutes != null && summary.exerciseMinutes !== summary.activeMinutes && (
          <Metric label={t.healthToday.exercise} value={`${summary.exerciseMinutes} min`} />
        )}
        {summary.sleepMinutes != null && (
          <Metric label={t.healthToday.sleep} value={fmt(summary.sleepMinutes)} />
        )}
        {summary.restingHeartRate != null && (
          <Metric label={t.healthToday.restingHr} value={`${summary.restingHeartRate} bpm`} />
        )}
        {summary.activeCalories != null && (
          <Metric label={t.healthToday.activeCal} value={String(Math.round(summary.activeCalories))} />
        )}
      </div>

      {overview && overview.totalDays > 1 && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid rgba(1,35,116,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 12, color: 'rgba(22,24,42,0.6)', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, color: '#012374' }}>{t.healthToday.daysImported.replace('{days}', overview.totalDays.toLocaleString())}</span> {t.healthToday.imported}
            {overview.avgSteps != null && <> · {t.healthToday.avgSteps.replace('{steps}', overview.avgSteps.toLocaleString())}</>}
            {overview.avgSleepMinutes != null && <> · {t.healthToday.avgSleep.replace('{sleep}', fmt(overview.avgSleepMinutes))}</>}
          </div>
          <a
            href="/insights"
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: '#012374',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              padding: '13px 10px',
              margin: '-13px -10px',
            }}
          >
            {t.healthToday.viewTrends}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      )}

      <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.35)', marginTop: 10, lineHeight: 1.5 }}>
        {t.healthToday.incompleteNote}
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
