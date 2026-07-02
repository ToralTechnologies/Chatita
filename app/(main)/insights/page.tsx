'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
import BackButton from '@/components/back-button';
import ExportButton from '@/components/export-button';
import { exportAnalyticsToPDF, exportAnalyticsToCSV } from '@/lib/export-utils';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n/context';
import { vocab } from '@/lib/i18n/vocab';

const GlucoseTrendChart = dynamic(() => import('@/components/charts/glucose-trend-chart'), { ssr: false });
const MealComparisonChart = dynamic(() => import('@/components/charts/meal-comparison-chart'), { ssr: false });
const DailyPatternChart = dynamic(() => import('@/components/charts/daily-pattern-chart'), { ssr: false });

// ── Domain theme map ──────────────────────────────────────────────────────────

const SEVERITY_THEME: Record<string, { color: string; bg: string; iconD: string }> = {
  warning:  { color: '#9A6F18', bg: 'rgba(200,147,43,0.14)',  iconD: 'M12 3l9 16H3L12 3zM12 10v4M12 16.5v.5' },
  danger:   { color: '#B5562E', bg: 'rgba(181,86,46,0.12)',   iconD: 'M12 3l9 16H3L12 3zM12 10v4M12 16.5v.5' },
  success:  { color: '#1C7A4F', bg: 'rgba(28,122,79,0.12)',   iconD: 'M4 14l4-4 3 3 5-6 4 5' },
  info:     { color: '#012374', bg: 'rgba(1,35,116,0.08)',    iconD: 'M4 14l4-4 3 3 5-6 4 5' },
};

const TYPE_THEME: Record<string, { color: string; bg: string; iconD: string; kickerKey: string }> = {
  'spike':           { color: '#B5562E', bg: 'rgba(181,86,46,0.12)',  iconD: 'M12 3l9 16H3L12 3zM12 10v4M12 16.5v.5', kickerKey: 'watch' },
  'fasting-high':    { color: '#9A6F18', bg: 'rgba(200,147,43,0.14)', iconD: 'M4 19V5m0 14h16M4 15l4-4 3 3 5-6 4 5',  kickerKey: 'glucose' },
  'timeofday-high':  { color: '#9A6F18', bg: 'rgba(200,147,43,0.14)', iconD: 'M4 19V5m0 14h16M4 15l4-4 3 3 5-6 4 5',  kickerKey: 'glucose' },
  'fasting-good':    { color: '#1C7A4F', bg: 'rgba(28,122,79,0.12)',  iconD: 'M4 19V5m0 14h16M4 15l4-4 3 3 5-6 4 5',  kickerKey: 'glucose' },
  'lowcarb-success': { color: '#1C7A4F', bg: 'rgba(28,122,79,0.12)',  iconD: 'M5 11h14M5 11a4 4 0 0 1 8 0M5 11a4 4 0 0 0 8 0M9 5v2M12 19v-4', kickerKey: 'protein' },
  'warning':         { color: '#9A6F18', bg: 'rgba(200,147,43,0.14)', iconD: 'M12 3l9 16H3L12 3zM12 10v4M12 16.5v.5', kickerKey: 'watch' },
  'tip':             { color: '#012374', bg: 'rgba(1,35,116,0.08)',   iconD: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 8v4M12 16v.5', kickerKey: 'suggests' },
  // Richer connected-data domains (Insights v2)
  'mood':            { color: '#8A6FB0', bg: 'rgba(138,111,176,0.13)', iconD: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM8.5 14c1 1.3 5 1.3 6 0M9 9.5v.5M15 9.5v.5', kickerKey: 'mood' },
  'hydration':       { color: '#2A6FA8', bg: 'rgba(42,111,168,0.13)',  iconD: 'M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z', kickerKey: 'hydration' },
  'protein':         { color: '#1C7A4F', bg: 'rgba(28,122,79,0.12)',   iconD: 'M5 11h14M5 11a4 4 0 0 1 8 0M5 11a4 4 0 0 0 8 0M9 5v2M12 19v-4', kickerKey: 'protein' },
  'glp1':            { color: '#9A6F18', bg: 'rgba(200,147,43,0.16)',  iconD: 'M3 12h18M7 8l-2 4 2 4M17 8l2 4-2 4', kickerKey: 'glp1' },
  'sleep':           { color: '#4A5578', bg: 'rgba(74,85,120,0.13)',   iconD: 'M20 14a8 8 0 1 1-9.5-9 6.5 6.5 0 0 0 9.5 9z', kickerKey: 'sleep' },
  'movement':        { color: '#2A8A8A', bg: 'rgba(42,138,138,0.14)',  iconD: 'M14 7l-2 6M14.5 8l3-3M13.5 9l-3 1M12 13l-3 6M12 13l3 4', kickerKey: 'movement' },
  'cycle':           { color: '#8A6FB0', bg: 'rgba(138,111,176,0.13)', iconD: 'M12 4a8 8 0 1 0 8 8M12 4v8l5 3', kickerKey: 'cycle' },
};

function domainTheme(type?: string, severity?: string) {
  if (type && TYPE_THEME[type]) return TYPE_THEME[type];
  if (severity && SEVERITY_THEME[severity]) return {
    ...SEVERITY_THEME[severity],
    kickerKey: severity === 'warning' ? 'notice' : severity === 'success' ? 'goingWell' : 'insight',
  };
  return { color: '#012374', bg: 'rgba(1,35,116,0.08)', iconD: 'M4 14l4-4 3 3 5-6 4 5', kickerKey: 'insight' };
}

function MiniIcon({ d, color, size = 16 }: { d: string; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {d.split('M').filter(Boolean).map((seg, i) => (
        <path key={i} d={'M' + seg} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      ))}
    </svg>
  );
}

function getDateRange(period: number, language: string = 'en') {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - period + 1);
  const locale = language === 'es' ? 'es-MX' : 'en-US';
  const f = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short' }).replace('.', '');
  return `${f(start)}–${f(now)}`;
}

// ── Glucose scatter chart ─────────────────────────────────────────────────────

interface GlucoseDot { x: number; y: number; color: string; v: number; label: string; t: number }

function glucoseDotColor(v: number, min: number, max: number) {
  if (v < min) return '#B5562E';
  if (v > max) return '#C8932B';
  return '#1C7A4F';
}

function glucoseStatusLabel(v: number, min: number, max: number) {
  if (v < min) return 'Low';
  if (v > max) return 'High';
  return 'In range';
}

function ScatterChart({ dots, targetMin = 70, targetMax = 180, mode = 'timeOfDay', axisLabels, minWidth }: {
  dots: GlucoseDot[];
  targetMin?: number;
  targetMax?: number;
  mode?: 'timeline' | 'timeOfDay';
  axisLabels?: string[];
  /** Widen the chart beyond its container (px) so dense CGM traces stay
   *  explorable by touch — the wrapper scrolls horizontally. */
  minWidth?: number;
}) {
  const { language } = useTranslation();
  const [tooltip, setTooltip] = useState<{ dot: GlucoseDot } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // In timeline mode, connect readings chronologically into a continuous trace.
  const linePoints = useMemo(() => {
    if (mode !== 'timeline') return '';
    return [...dots].sort((a, b) => a.x - b.x).map(d => `${d.x},${d.y}`).join(' ');
  }, [dots, mode]);

  const labels = axisLabels ?? ['12 am', '6 am', '12 pm', '6 pm', '11 pm'];

  const yScale = (v: number) => 220 - (Math.max(0, Math.min(300, v)) / 300) * 210;
  const band180Y = yScale(targetMax);
  const band70Y  = yScale(targetMin);
  const bandH    = band70Y - band180Y;

  // SVG viewBox 1000×240, rendered height 180px with preserveAspectRatio="none"
  const pctX = (svgX: number) => `${(svgX / 1000) * 100}%`;
  const pxY  = (svgY: number) => `${(svgY / 240) * 180}px`;

  return (
    <div ref={containerRef} style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
     <div style={{ position: 'relative', minWidth: minWidth ? `${minWidth}px` : undefined }}>
      <svg
        viewBox="0 0 1000 240"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '180px', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setTooltip(null)}
      >
        <rect x="0" y={band180Y} width="1000" height={bandH} fill="rgba(28,122,79,0.08)" />
        <line x1="0" y1={band180Y} x2="1000" y2={band180Y} stroke="rgba(28,122,79,0.4)" strokeWidth="1.5" strokeDasharray="7 7" />
        <line x1="0" y1={band70Y}  x2="1000" y2={band70Y}  stroke="rgba(28,122,79,0.4)" strokeWidth="1.5" strokeDasharray="7 7" />
        <text x="6" y={band180Y - 3} fill="rgba(22,24,42,0.4)" fontSize="10">{targetMax}</text>
        <text x="6" y={band70Y + 10} fill="rgba(22,24,42,0.4)" fontSize="10">{targetMin}</text>
        {mode === 'timeline' && linePoints && (
          <polyline points={linePoints} fill="none" stroke="rgba(1,35,116,0.35)" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        )}
        {(() => {
          // Dense CGM data (≈288 readings/day) overlaid by time-of-day across
          // many days becomes thousands of points. Shrink + fade the dots so the
          // overlap reads as a pattern cloud rather than a blob, while every
          // reading stays individually hoverable.
          const n = dots.length;
          const r = n > 1500 ? 1.7 : n > 600 ? 2.3 : n > 200 ? 3 : 4;
          const op = n > 1500 ? 0.3 : n > 600 ? 0.42 : n > 200 ? 0.6 : 0.82;
          const hit = n > 1500 ? 5 : n > 600 ? 7 : 10;
          return dots.map((d, i) => (
            <g key={i}>
              <circle cx={d.x} cy={d.y} r={r} fill={d.color} opacity={op} />
              <circle
                cx={d.x} cy={d.y} r={hit} fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setTooltip({ dot: d })}
                onClick={() => setTooltip(prev => prev?.dot === d ? null : { dot: d })}
              />
            </g>
          ));
        })()}
      </svg>

      {tooltip && (
        <div style={{
          position: 'absolute',
          left: pctX(tooltip.dot.x),
          top: pxY(tooltip.dot.y),
          transform: 'translate(-50%, calc(-100% - 10px))',
          pointerEvents: 'none',
          zIndex: 20,
          background: '#16182A',
          color: '#FFFDF9',
          borderRadius: '10px',
          padding: '7px 11px',
          fontSize: '12px',
          lineHeight: 1.4,
          boxShadow: '0 6px 18px -4px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: tooltip.dot.color }}>{tooltip.dot.v}</span>
          <span style={{ opacity: 0.75 }}> mg/dL</span>
          <div style={{ opacity: 0.65, fontSize: '11px', marginTop: '2px' }}>
            {vocab(glucoseStatusLabel(tooltip.dot.v, targetMin, targetMax), language)} · {tooltip.dot.label}
          </div>
          <div style={{
            position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop: '5px solid #16182A',
          }} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(22,24,42,0.45)', marginTop: '4px', padding: '0 4px' }}>
        {labels.map((l, i) => <span key={i}>{l}</span>)}
      </div>
     </div>
    </div>
  );
}


// ── Individual readings browser (mobile-first) ────────────────────────────────
// Dense CGM traces are unreadable point-by-point on a phone, so this gives a
// tappable day-by-day list of every reading in the selected period.

function ReadingsBrowser({ dots, targetMin, targetMax }: {
  dots: GlucoseDot[]; targetMin: number; targetMax: number;
}) {
  const { t, language } = useTranslation();
  const locale = language === 'es' ? 'es-MX' : 'en-US';

  const days = useMemo(() => {
    const map = new Map<string, GlucoseDot[]>();
    for (const d of dots) {
      const key = new Date(d.t).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return [...map.entries()]
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([key, ds]) => ({ key, dots: [...ds].sort((a, b) => b.t - a.t) }));
  }, [dots]);

  const [selected, setSelected] = useState(0);
  useEffect(() => { setSelected(0); }, [days.length]);
  const day = days[Math.min(selected, Math.max(0, days.length - 1))];
  if (!day) return null;

  const values = day.dots.map(d => d.v);
  const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const dayLabel = (key: string) =>
    new Date(key).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' }).replace('.', '');

  return (
    <div style={{ marginTop: '20px', background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.07)', padding: '20px', boxShadow: '0 14px 30px -26px rgba(1,35,116,.3)' }}>
      <h3 className="font-serif-italic" style={{ fontSize: '18px', color: '#012374' }}>{t.insightsPage.browseTitle}</h3>
      <p style={{ fontSize: '12.5px', color: 'rgba(22,24,42,0.55)', marginTop: '3px', lineHeight: 1.45 }}>{t.insightsPage.browseSubtitle}</p>

      {/* Day picker — horizontal scroll, newest first */}
      <div style={{ display: 'flex', gap: '7px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '12px 2px 4px', margin: '0 -2px' }}>
        {days.map((d, i) => (
          <button key={d.key} onClick={() => setSelected(i)} style={{
            flexShrink: 0, padding: '11px 14px', borderRadius: '999px', fontSize: '12.5px', fontWeight: 600,
            border: 'none', fontFamily: 'inherit', cursor: 'pointer', minHeight: 44,
            background: i === selected ? '#012374' : '#F7EFE1',
            color: i === selected ? '#FFFDF9' : '#012374',
          }}>{dayLabel(d.key)}</button>
        ))}
      </div>

      {/* Day summary */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'rgba(22,24,42,0.6)', margin: '8px 2px 10px' }}>
        <span style={{ fontWeight: 700, color: '#012374' }}>
          {day.dots.length === 1 ? t.insightsPage.dayReading : t.insightsPage.dayReadings.replace('{n}', String(day.dots.length))}
        </span>
        <span>{t.insightsPage.dayAvg.replace('{v}', String(avg))} mg/dL</span>
        <span>{t.insightsPage.dayRange.replace('{min}', String(min)).replace('{max}', String(max))}</span>
      </div>

      {/* Readings list — newest first, capped height so the page stays light */}
      <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {day.dots.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '11px', background: '#F7EFE1', borderRadius: '11px', padding: '10px 13px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span className="font-serif-italic" style={{ fontSize: '19px', color: '#012374', lineHeight: 1, minWidth: '46px' }}>{d.v}</span>
            <span style={{ fontSize: '11.5px', color: 'rgba(22,24,42,0.45)' }}>mg/dL</span>
            <span style={{ flex: 1, textAlign: 'right', fontSize: '12.5px', color: 'rgba(22,24,42,0.6)' }}>
              {vocab(glucoseStatusLabel(d.v, targetMin, targetMax), language)} · {new Date(d.t).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TIR bar ───────────────────────────────────────────────────────────────────

function TirBar({ low = 0, normal = 0, high = 0 }: { low?: number; normal?: number; high?: number }) {
  const { t } = useTranslation();
  return (
    <div>
      <div style={{ display: 'flex', height: '14px', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ width: `${low}%`, background: '#B5562E' }} />
        <div style={{ width: `${normal}%`, background: '#1C7A4F' }} />
        <div style={{ width: `${high}%`, background: '#C8932B' }} />
      </div>
      <div style={{ marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#16182A' }}>
        {[
          { color: '#1C7A4F', label: t.insightsPage.legendInRange.replace('{pct}', String(normal)) },
          { color: '#B5562E', label: t.insightsPage.legendLow.replace('{pct}', String(low)) },
          { color: '#C8932B', label: t.insightsPage.legendHigh.replace('{pct}', String(high)) },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── In-card visualizations (Insights v2) ──────────────────────────────────────

interface InsightBar { value: number; highlighted?: boolean; day?: string }
interface InsightSplit { label: string; val: string | number; unit?: string; tone?: 'good' | 'warn' | 'bad' | 'neutral' }

const TONE_COLOR: Record<string, string> = {
  good: '#1C7A4F', warn: '#9A6F18', bad: '#B5562E', neutral: '#012374',
};

// 7-ish day mini bar chart embedded in a card; `value` is 0–1, highlighted bars
// take the card's accent color, the rest a muted navy.
function MiniBars({ bars, color, showDays = false }: { bars: InsightBar[]; color: string; showDays?: boolean }) {
  return (
    <div style={{ marginTop: '14px', display: 'flex', alignItems: 'flex-end', gap: '6px', height: showDays ? '52px' : '44px' }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '18px', height: `${Math.round(8 + Math.max(0, Math.min(1, b.value)) * 34)}px`, borderRadius: '4px', background: b.highlighted ? color : 'rgba(1,35,116,0.18)' }} />
          {showDays && b.day && <span style={{ fontSize: '9px', color: 'rgba(22,24,42,0.4)' }}>{b.day}</span>}
        </div>
      ))}
    </div>
  );
}

// Two side-by-side comparison stats embedded in a card.
function SplitStats({ splits }: { splits: InsightSplit[] }) {
  return (
    <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
      {splits.map((p, i) => (
        <div key={i} style={{ flex: 1, background: '#F7EFE1', borderRadius: '11px', padding: '12px 13px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(22,24,42,0.55)' }}>{p.label}</div>
          <div style={{ marginTop: '3px' }}>
            <span className="font-serif-italic" style={{ fontSize: '23px', color: TONE_COLOR[p.tone ?? 'neutral'] }}>{p.val}</span>
            {p.unit && <span style={{ fontSize: '11px', color: 'rgba(22,24,42,0.5)' }}> {p.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Insight card ─────────────────────────────────────────────────────────────

function InsightCard({ title, message, type, severity, action, foods, bars, splits }: {
  title: string; message: string; type?: string; severity?: string; action?: string; foods?: string[];
  bars?: InsightBar[]; splits?: InsightSplit[];
}) {
  const theme = domainTheme(type, severity);
  const { t } = useTranslation();
  return (
    <div style={{ background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.07)', padding: '20px', boxShadow: '0 14px 30px -26px rgba(1,35,116,.3)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
        <span style={{ width: '32px', height: '32px', borderRadius: '9px', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MiniIcon d={theme.iconD} color={theme.color} size={16} />
        </span>
        <span style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, color: theme.color }}>
          {(t.insightsPage.kickers as Record<string, string>)[theme.kickerKey] ?? theme.kickerKey}
        </span>
      </div>
      <p className="font-serif-italic" style={{ fontSize: '17px', color: '#16182A', lineHeight: 1.28 }}>{title}</p>
      <p style={{ fontSize: '13px', color: 'rgba(22,24,42,0.68)', marginTop: '7px', lineHeight: 1.55, flex: 1 }}>{message}</p>
      {foods && foods.length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {foods.map((f, i) => (
            <span key={i} style={{ fontSize: '11.5px', padding: '3px 10px', borderRadius: '99px', background: '#F7EFE1', border: '1px solid rgba(1,35,116,0.1)', color: '#001A4D' }}>{f}</span>
          ))}
        </div>
      )}
      {bars && bars.length > 0 && <MiniBars bars={bars} color={theme.color} showDays={bars.some(b => b.day)} />}
      {splits && splits.length > 0 && <SplitStats splits={splits} />}
      {action && (
        <div style={{ marginTop: '13px', paddingTop: '11px', borderTop: '1px solid rgba(1,35,116,0.07)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
            <path d="M12 3l2.2 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.8-.5L12 3z" stroke={theme.color} strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '12px', color: 'rgba(22,24,42,0.72)', lineHeight: 1.45 }}>{action}</span>
        </div>
      )}
    </div>
  );
}

// ── Shared content renderer ───────────────────────────────────────────────────

function InsightsContent({ correlation, aiInsights, scatterDots, allCards, period, setPeriod, aiLoading = false, chartMode = 'timeline', setChartMode, axisLabels, isWeb = false }: {
  correlation: any;
  aiInsights: any[];
  scatterDots: GlucoseDot[];
  allCards: any[];
  period: number;
  setPeriod: (p: number) => void;
  aiLoading?: boolean;
  chartMode?: 'timeline' | 'timeOfDay';
  setChartMode?: (m: 'timeline' | 'timeOfDay') => void;
  axisLabels?: string[];
  isWeb?: boolean;
}) {
  const { t } = useTranslation();
  const stats = correlation?.stats;
  const tir = stats?.timeInRange;
  const featuredCard = allCards[0];

  if (!stats || (stats.averageGlucose === 0 && (correlation?.mealsTracked ?? 0) === 0)) {
    return (
      <div style={{ textAlign: 'center', padding: isWeb ? '64px 20px' : '48px 20px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(1,35,116,0.06)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M4 19V5m0 14h16M4 15l4-4 3 3 5-6 4 5" stroke="rgba(1,35,116,0.3)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="font-serif-italic" style={{ fontSize: '24px', color: '#012374', marginBottom: '12px' }}>{t.insightsPage.emptyTitle}</h2>
        <p style={{ fontSize: '14px', color: 'rgba(22,24,42,0.62)', maxWidth: '380px', margin: '0 auto 24px', lineHeight: 1.6 }}>
          {t.insightsPage.emptyBody}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <a href="/add-meal" style={{ padding: '11px 22px', borderRadius: '999px', background: '#012374', color: '#FFFDF9', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>{t.insightsPage.logAMeal}</a>
          <a href="/home" style={{ padding: '11px 22px', borderRadius: '999px', border: '1px solid rgba(1,35,116,0.2)', color: '#001A4D', background: '#FFFDF9', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>{t.insightsPage.addGlucose}</a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Daily glucose scatter ── */}
      <div style={{ background: '#FFFDF9', borderRadius: '22px', border: '1px solid rgba(1,35,116,0.07)', padding: '24px 26px', boxShadow: '0 14px 30px -24px rgba(1,35,116,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h2 className="font-serif-italic" style={{ fontSize: isWeb ? '24px' : '22px', color: '#012374' }}>{chartMode === 'timeline' ? t.insightsPage.glucoseOverTime : t.insightsPage.dailyPattern}</h2>
            <p style={{ fontSize: '13px', color: 'rgba(22,24,42,0.6)', marginTop: '3px' }}>
              {chartMode === 'timeline' ? t.insightsPage.timelineDesc : t.insightsPage.timeOfDayDesc}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '7px', flexShrink: 0 }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setPeriod(d)} style={{
                padding: '13px 16px', borderRadius: '999px', fontSize: '12.5px', fontWeight: 600,
                cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                background: period === d ? '#012374' : '#F7EFE1',
                color: period === d ? '#FFFDF9' : '#012374',
                outline: period === d ? 'none' : '1px solid rgba(1,35,116,0.16)',
              }}>{t.insightsPage.daysButton.replace('{d}', String(d))}</button>
            ))}
          </div>
        </div>

        {/* View toggle: chronological timeline vs time-of-day overlay */}
        {setChartMode && (
          <div style={{ marginTop: '14px', display: 'inline-flex', gap: '4px', background: '#F7EFE1', borderRadius: '999px', padding: '4px' }}>
            {([['timeline', t.insightsPage.timeline], ['timeOfDay', t.insightsPage.timeOfDay]] as const).map(([m, label]) => (
              <button key={m} onClick={() => setChartMode(m)} style={{
                padding: '13px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                background: chartMode === m ? '#012374' : 'transparent',
                color: chartMode === m ? '#FFFDF9' : 'rgba(1,35,116,0.7)',
              }}>{label}</button>
            ))}
          </div>
        )}

        {/* Stat boxes */}
        <div style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          {[
            { label: t.insightsPage.avgGlucose, val: stats?.averageGlucose ? `${Math.round(stats.averageGlucose)}` : '—', unit: 'mg/dL', color: '#012374' },
            { label: t.insightsPage.timeInRange, val: stats?.inRangePercent != null ? `${stats.inRangePercent}%` : '—', unit: '70–180', color: '#1C7A4F' },
            { label: t.insightsPage.estA1c, val: correlation?.a1cEstimate?.estimated ? `${correlation.a1cEstimate.estimated}%` : '—', unit: t.insightsPage.fromReadings, color: '#012374' },
            { label: t.insightsPage.readings, val: stats?.readingsCount != null ? stats.readingsCount.toLocaleString() : '—', unit: t.insightsPage.glucoseReadings, color: '#2A8A8A' },
          ].map(({ label, val, unit, color }) => (
            <div key={label} style={{ background: '#F7EFE1', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(22,24,42,0.58)' }}>{label}</div>
              <div style={{ marginTop: '4px' }}>
                <span className="font-serif-italic" style={{ fontSize: '28px', color }}>{val}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(22,24,42,0.45)', marginTop: '2px' }}>{unit}</div>
            </div>
          ))}
        </div>

        {/* Scatter chart */}
        <div style={{ marginTop: '18px' }}>
          {scatterDots.length > 0 ? (
            <>
              <ScatterChart
                dots={scatterDots}
                targetMin={correlation?.targetGlucoseMin ?? 70}
                targetMax={correlation?.targetGlucoseMax ?? 180}
                mode={chartMode}
                axisLabels={axisLabels}
                // On mobile a 7/30/90-day trace crushes into ~390px; widen so
                // individual readings stay distinguishable and tappable.
                minWidth={!isWeb && chartMode === 'timeline' ? Math.min(2600, period * (period <= 7 ? 110 : period <= 30 ? 60 : 28)) : undefined}
              />
              {!isWeb && chartMode === 'timeline' && (
                <p style={{ fontSize: '11px', color: 'rgba(22,24,42,0.45)', marginTop: '6px' }}>{t.insightsPage.scrollHint}</p>
              )}
            </>
          ) : correlation?.chartData?.trendData ? (
            <GlucoseTrendChart data={correlation.chartData.trendData} />
          ) : (
            <div style={{ height: '120px', borderRadius: '12px', background: '#F7EFE1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '13px', color: 'rgba(22,24,42,0.4)' }}>{t.insightsPage.noReadingsPeriod}</p>
            </div>
          )}
        </div>

        {/* TIR bar */}
        {tir && <div style={{ marginTop: '18px' }}><TirBar low={tir.low} normal={tir.normal} high={tir.high} /></div>}

        {(stats?.readingsCount ?? 0) > 0 && (
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(28,122,79,0.08)', borderRadius: '999px', padding: '7px 14px', width: 'fit-content' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1C7A4F', display: 'inline-block' }} />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1C7A4F' }}>{t.insightsPage.readingsAllVisible.replace('{count}', String(stats.readingsCount))}</span>
          </div>
        )}
      </div>

      {/* ── Individual readings browser (mobile) ── */}
      {!isWeb && scatterDots.length > 0 && (
        <ReadingsBrowser
          dots={scatterDots}
          targetMin={correlation?.targetGlucoseMin ?? 70}
          targetMax={correlation?.targetGlucoseMax ?? 180}
        />
      )}

      {/* ── Featured insight (navy) ── */}
      {featuredCard && (
        <div style={{ marginTop: '20px', background: '#012374', borderRadius: '22px', padding: '26px 28px', color: '#FFFDF9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
            <span style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'rgba(42,138,138,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 19V5m0 14h16M4 15l4-4 3 3 5-6 4 5" stroke="#7FD0D0" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7FD0D0', fontWeight: 700 }}>{t.insightsPage.patternOfWeek}</span>
          </div>
          <h2 className="font-serif-italic" style={{ fontSize: isWeb ? '26px' : '24px', lineHeight: 1.25, maxWidth: '600px' }}>{featuredCard.title}</h2>
          <p style={{ fontSize: '14.5px', color: 'rgba(255,253,249,0.82)', marginTop: '10px', lineHeight: 1.55, maxWidth: '580px' }}>{featuredCard.message}</p>
          {featuredCard.bars && featuredCard.bars.length > 0 && (
            <div style={{ marginTop: '18px', maxWidth: '420px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,253,249,0.6)', fontWeight: 700, marginBottom: '12px' }}>
                {t.insightsPage.tirByDay}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '92px' }}>
                {featuredCard.bars.map((b: InsightBar, i: number) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', maxWidth: '24px', height: `${Math.round(12 + Math.max(0, Math.min(1, b.value)) * 64)}px`, borderRadius: '6px', background: b.highlighted ? '#7FD0D0' : 'rgba(255,253,249,0.28)' }} />
                    {b.day && <span style={{ fontSize: '11px', color: 'rgba(255,253,249,0.6)' }}>{b.day}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {featuredCard.action && (
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path d="M12 3l2.2 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.8-.5L12 3z" stroke="#C8932B" strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: '13px', color: 'rgba(255,253,249,0.75)', lineHeight: 1.5 }}>{featuredCard.action}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Insight cards grid ── */}
      {allCards.length > 1 && (
        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: isWeb ? 'repeat(auto-fill, minmax(300px, 1fr))' : 'repeat(auto-fill, minmax(270px, 1fr))', gap: '14px' }}>
          {allCards.slice(1).map((card, i) => (
            <InsightCard key={i} {...card} />
          ))}
        </div>
      )}

      {/* ── AI insights still loading (charts already shown) ── */}
      {aiLoading && aiInsights.length === 0 && (
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.07)', padding: '18px 22px' }}>
          <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(1,35,116,0.18)', borderTopColor: '#012374', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '13.5px', color: 'rgba(22,24,42,0.6)' }}>{t.insightsPage.aiLooking}</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Extra charts ── */}
      {(correlation?.chartData?.mealComparison?.length > 0 || correlation?.chartData?.dailyPattern?.length > 0) && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {correlation.chartData.mealComparison?.length > 0 && (
            <div style={{ background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.07)', padding: '22px 24px', boxShadow: '0 14px 30px -26px rgba(1,35,116,.3)' }}>
              <h3 className="font-serif-italic" style={{ fontSize: '18px', color: '#012374', marginBottom: '16px' }}>{t.insightsPage.avgByMealType}</h3>
              <MealComparisonChart data={correlation.chartData.mealComparison} />
            </div>
          )}
          {correlation.chartData.dailyPattern?.length > 0 && (
            <div style={{ background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.07)', padding: '22px 24px', boxShadow: '0 14px 30px -26px rgba(1,35,116,.3)' }}>
              <h3 className="font-serif-italic" style={{ fontSize: '18px', color: '#012374', marginBottom: '16px' }}>{t.insightsPage.hourlyPattern}</h3>
              <DailyPatternChart data={correlation.chartData.dailyPattern} />
            </div>
          )}
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div style={{ marginTop: '18px', display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '12.5px', color: 'rgba(22,24,42,0.6)', lineHeight: 1.5, padding: '0 4px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
          <path d="M12 3l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" stroke="#9A6F18" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
        <span>
          {t.insightsPage.disclaimer}
        </span>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const { t, language } = useTranslation();
  const [correlation, setCorrelation] = useState<any>(null);
  const [aiInsights, setAiInsights]   = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [aiLoading, setAiLoading]     = useState(true);
  const [period, setPeriod]           = useState(30);
  const [chartMode, setChartMode]     = useState<'timeline' | 'timeOfDay'>('timeline');

  // After mount, render only the active layout tree. Rendering both (one
  // CSS-hidden) makes recharts measure the hidden tree at 0×0 and log
  // container-size warnings. Both trees still render pre-mount so hydration
  // matches the server HTML.
  const [layout, setLayout] = useState<'both' | 'mobile' | 'desktop'>('both');
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setLayout(mq.matches ? 'desktop' : 'mobile');
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => { fetchAnalytics(); }, [period]);

  // The charts/stats (correlation) come from fast DB queries and drive the page
  // render. AI insights require a Claude call, so they load independently and
  // stream in — the page is no longer blocked on that latency.
  const fetchAnalytics = () => {
    setLoading(true);
    setAiLoading(true);

    fetch(`/api/analytics/correlation?days=${period}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setCorrelation(data); })
      .catch(() => { /* keep previous state */ })
      .finally(() => setLoading(false));

    fetch(`/api/analytics/insights?days=${period}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { setAiInsights(data?.insights || []); })
      .catch(() => { /* AI insights are best-effort */ })
      .finally(() => setAiLoading(false));
  };

  const scatterDots = useMemo((): GlucoseDot[] => {
    const raw = correlation?.chartData?.trendData;
    if (!raw?.length) return [];
    const targetMin = correlation?.targetGlucoseMin ?? 70;
    const targetMax = correlation?.targetGlucoseMax ?? 180;

    const points = raw
      .map((pt: any) => ({ date: new Date(pt.time ?? pt.measuredAt ?? pt.date), v: pt.value ?? pt.glucose ?? 0 }))
      .filter((p: any) => !isNaN(p.date.getTime()));

    // Timeline: spread chronologically so each reading sits at its own x (a real
    // CGM trace, one point per moment). The axis spans the SELECTED period
    // (now − period … now) so switching 7/30/90 days visibly changes the range.
    // Time-of-day: overlay every day on a 24h axis.
    const maxT = Date.now();
    const minT = maxT - period * 24 * 60 * 60 * 1000;
    const span = maxT - minT || 1;

    return points.map((p: any) => {
      const t = p.date.getTime();
      const x = chartMode === 'timeline'
        ? Math.round(10 + ((t - minT) / span) * 980)
        : Math.round(10 + ((p.date.getHours() + p.date.getMinutes() / 60) / 24) * 980);
      const yVal = 220 - (Math.max(0, Math.min(300, p.v)) / 300) * 210;
      const label = chartMode === 'timeline'
        ? p.date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
        : p.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return { x, y: Math.round(yVal), color: glucoseDotColor(p.v, targetMin, targetMax), v: p.v, label, t };
    });
  }, [correlation, chartMode, period]);

  // X-axis labels depend on the mode: dates across the SELECTED period (timeline)
  // or fixed times of day (overlay).
  const axisLabels = useMemo((): string[] => {
    if (chartMode !== 'timeline') return ['12 am', '6 am', '12 pm', '6 pm', '11 pm'];
    const maxT = Date.now();
    const minT = maxT - period * 24 * 60 * 60 * 1000;
    const fmt = (t: number) => new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' });
    return [0, 0.25, 0.5, 0.75, 1].map(f => fmt(minT + (maxT - minT) * f));
  }, [chartMode, period]);

  // Real daily time-in-range bars (last 7 days) for the featured card.
  const dailyTirBars = useMemo((): InsightBar[] => {
    const raw = correlation?.chartData?.trendData;
    if (!raw?.length) return [];
    const targetMin = correlation?.targetGlucoseMin ?? 70;
    const targetMax = correlation?.targetGlucoseMax ?? 180;
    const byDay = new Map<string, { inRange: number; total: number; date: Date }>();
    raw.forEach((pt: any) => {
      const date = new Date(pt.time ?? pt.measuredAt ?? pt.date);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const v = pt.value ?? pt.glucose ?? 0;
      const d = byDay.get(key) ?? { inRange: 0, total: 0, date };
      d.total += 1;
      if (v >= targetMin && v <= targetMax) d.inRange += 1;
      byDay.set(key, d);
    });
    const days = Array.from(byDay.values()).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(-7);
    const wd = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return days.map(d => {
      const frac = d.total > 0 ? d.inRange / d.total : 0;
      return { value: frac, highlighted: frac >= 0.8, day: wd[d.date.getDay()] };
    });
  }, [correlation]);

  // Normalize an AI insight's optional viz into the card's bars/splits shape.
  const normalizeViz = (ins: any): { bars?: InsightBar[]; splits?: InsightSplit[]; barsLabel?: string } => {
    const viz = ins?.viz;
    if (!viz || typeof viz !== 'object') return {};
    if (viz.kind === 'bars' && Array.isArray(viz.bars)) {
      const hi: number[] = Array.isArray(viz.highlight) ? viz.highlight : [];
      const days: string[] = Array.isArray(viz.days) ? viz.days : [];
      return {
        barsLabel: typeof viz.label === 'string' ? viz.label : undefined,
        bars: viz.bars.slice(0, 14).map((v: any, i: number) => ({
          value: Math.max(0, Math.min(1, Number(v) || 0)),
          highlighted: hi.includes(i),
          day: days[i],
        })),
      };
    }
    if (viz.kind === 'split' && Array.isArray(viz.splits)) {
      return {
        splits: viz.splits.slice(0, 2).map((s: any) => ({
          label: String(s.label ?? ''), val: s.val ?? '—', unit: s.unit, tone: s.tone,
        })),
      };
    }
    return {};
  };

  const allCards = useMemo(() => {
    const cards: any[] = [];
    (correlation?.patterns ?? []).forEach((p: any) => {
      cards.push({ title: p.title, message: p.description, type: p.type, severity: p.severity, foods: p.foods });
    });
    aiInsights.forEach(ins => {
      cards.push({ title: ins.title, message: ins.message, type: ins.type, action: ins.action, ...normalizeViz(ins) });
    });
    // Give the featured card (first) a real daily time-in-range chart if it has
    // no viz of its own.
    if (cards.length > 0 && !cards[0].bars && !cards[0].splits && dailyTirBars.length >= 3) {
      cards[0] = { ...cards[0], bars: dailyTirBars };
    }
    return cards;
  }, [correlation, aiInsights, dailyTirBars]);

  const sharedProps = { correlation, aiInsights, scatterDots, allCards, period, setPeriod, aiLoading, chartMode, setChartMode, axisLabels };

  // ── Loading skeleton ──

  if (loading) {
    return (
      <>
        {/* Mobile skeleton */}
        <div className="lg:hidden min-h-screen mobile-page-pb" style={{ background: '#F7EFE1' }}>
          <div style={{ background: '#FFFDF9', borderBottom: '1px solid rgba(1,35,116,0.07)', padding: '16px 24px' }}>
            <div style={{ height: '12px', width: '120px', borderRadius: '6px', background: 'rgba(1,35,116,0.08)', marginBottom: '10px' }} />
            <div style={{ height: '32px', width: '260px', borderRadius: '8px', background: 'rgba(1,35,116,0.06)' }} />
          </div>
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '120px', borderRadius: '18px', background: '#FFFDF9', border: '1px solid rgba(1,35,116,0.06)' }} className="animate-pulse" />
            ))}
          </div>
          <BottomNav />
        </div>

        {/* Web skeleton */}
        <div className="hidden lg:flex" style={{ height: '100vh', background: '#F7EFE1', overflow: 'hidden' }}>
          <WebNav />
          <div style={{ flex: 1, overflowY: 'auto', padding: '34px 44px 44px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '120px', borderRadius: '18px', background: '#FFFDF9', border: '1px solid rgba(1,35,116,0.06)' }} className="animate-pulse" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Mobile layout ─────────────────────────────────────────────────────── */}
      {layout !== 'desktop' && (
      <div className="lg:hidden min-h-screen mobile-page-pb" style={{ background: '#F7EFE1' }}>
        {/* Mobile header */}
        <div style={{ background: '#FFFDF9', borderBottom: '1px solid rgba(1,35,116,0.07)', padding: '18px 20px 14px' }}>
          <BackButton href="/home" />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: '10px', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>
                {t.insightsPage.kicker} · {getDateRange(period, language)}
              </div>
              <h1 className="font-serif-italic" style={{ fontSize: '28px', color: '#012374', lineHeight: 1.05, marginTop: '5px' }}>
                {t.insightsPage.heading}
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(22,24,42,0.62)', marginTop: '4px', lineHeight: 1.5 }}>
                {t.insightsPage.subtitle}
              </p>
            </div>
            {correlation && (
              <ExportButton
                onExportPDF={() => exportAnalyticsToPDF(correlation, period)}
                onExportCSV={() => exportAnalyticsToCSV(correlation, period)}
              />
            )}
          </div>
        </div>

        <div style={{ padding: '20px 20px 48px' }}>
          <InsightsContent {...sharedProps} />
        </div>

        <BottomNav />
      </div>
      )}

      {/* ── Web / desktop layout ───────────────────────────────────────────────── */}
      {layout !== 'mobile' && (
      <div className="hidden lg:flex" style={{ height: '100vh', background: '#F7EFE1', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
        <WebNav />

        <div style={{ flex: 1, overflowY: 'auto', padding: '34px 44px 48px' }}>
          {/* Web header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>
                {t.insightsPage.kicker} · {getDateRange(period, language)}
              </div>
              <h1 className="font-serif-italic" style={{ fontSize: '38px', color: '#012374', lineHeight: 1.05, marginTop: '6px' }}>
                {t.insightsPage.heading}
              </h1>
              <p style={{ fontSize: '16px', color: 'rgba(22,24,42,0.65)', marginTop: '4px', lineHeight: 1.5 }}>
                {t.insightsPage.subtitle}
              </p>
            </div>
            {correlation && (
              <div style={{ marginTop: '4px' }}>
                <ExportButton
                  onExportPDF={() => exportAnalyticsToPDF(correlation, period)}
                  onExportCSV={() => exportAnalyticsToCSV(correlation, period)}
                />
              </div>
            )}
          </div>

          <InsightsContent {...sharedProps} isWeb />
        </div>
      </div>
      )}
    </>
  );
}
