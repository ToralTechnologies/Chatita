'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
import BackButton from '@/components/back-button';
import ExportButton from '@/components/export-button';
import { exportAnalyticsToPDF, exportAnalyticsToCSV } from '@/lib/export-utils';
import dynamic from 'next/dynamic';

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

const TYPE_THEME: Record<string, { color: string; bg: string; iconD: string; kicker: string }> = {
  'spike':           { color: '#B5562E', bg: 'rgba(181,86,46,0.12)',  iconD: 'M12 3l9 16H3L12 3zM12 10v4M12 16.5v.5', kicker: 'A gentle pattern to watch' },
  'fasting-high':    { color: '#9A6F18', bg: 'rgba(200,147,43,0.14)', iconD: 'M4 19V5m0 14h16M4 15l4-4 3 3 5-6 4 5',  kicker: 'Glucose patterns' },
  'timeofday-high':  { color: '#9A6F18', bg: 'rgba(200,147,43,0.14)', iconD: 'M4 19V5m0 14h16M4 15l4-4 3 3 5-6 4 5',  kicker: 'Glucose patterns' },
  'fasting-good':    { color: '#1C7A4F', bg: 'rgba(28,122,79,0.12)',  iconD: 'M4 19V5m0 14h16M4 15l4-4 3 3 5-6 4 5',  kicker: 'Glucose patterns' },
  'lowcarb-success': { color: '#1C7A4F', bg: 'rgba(28,122,79,0.12)',  iconD: 'M5 11h14M5 11a4 4 0 0 1 8 0M5 11a4 4 0 0 0 8 0M9 5v2M12 19v-4', kicker: 'Protein + fiber' },
  'warning':         { color: '#9A6F18', bg: 'rgba(200,147,43,0.14)', iconD: 'M12 3l9 16H3L12 3zM12 10v4M12 16.5v.5', kicker: 'A gentle pattern to watch' },
  'tip':             { color: '#012374', bg: 'rgba(1,35,116,0.08)',   iconD: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 8v4M12 16v.5', kicker: 'Chatita suggests' },
};

function domainTheme(type?: string, severity?: string) {
  if (type && TYPE_THEME[type]) return TYPE_THEME[type];
  if (severity && SEVERITY_THEME[severity]) return {
    ...SEVERITY_THEME[severity],
    kicker: severity === 'warning' ? 'Something to notice' : severity === 'success' ? 'Going well' : 'Insight',
  };
  return { color: '#012374', bg: 'rgba(1,35,116,0.08)', iconD: 'M4 14l4-4 3 3 5-6 4 5', kicker: 'Insight' };
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

function getDateRange(period: number) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - period + 1);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${start.getDate()} ${months[start.getMonth()]}–${now.getDate()} ${months[now.getMonth()]}`;
}

// ── Glucose scatter chart ─────────────────────────────────────────────────────

interface GlucoseDot { x: number; y: number; color: string; v: number; label: string }

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

function ScatterChart({ dots, targetMin = 70, targetMax = 180 }: {
  dots: GlucoseDot[];
  targetMin?: number;
  targetMax?: number;
}) {
  const [tooltip, setTooltip] = useState<{ dot: GlucoseDot } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const yScale = (v: number) => 220 - (Math.max(0, Math.min(300, v)) / 300) * 210;
  const band180Y = yScale(targetMax);
  const band70Y  = yScale(targetMin);
  const bandH    = band70Y - band180Y;

  // SVG viewBox 1000×240, rendered height 180px with preserveAspectRatio="none"
  const pctX = (svgX: number) => `${(svgX / 1000) * 100}%`;
  const pxY  = (svgY: number) => `${(svgY / 240) * 180}px`;

  return (
    <div ref={containerRef} style={{ overflowX: 'auto', position: 'relative' }}>
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
        {dots.map((d, i) => (
          <g key={i}>
            <circle cx={d.x} cy={d.y} r="4" fill={d.color} opacity="0.82" />
            <circle
              cx={d.x} cy={d.y} r="12" fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ dot: d })}
              onClick={() => setTooltip(prev => prev?.dot === d ? null : { dot: d })}
            />
          </g>
        ))}
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
            {glucoseStatusLabel(tooltip.dot.v, targetMin, targetMax)} · {tooltip.dot.label}
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
        <span>12 am</span><span>6 am</span><span>12 pm</span><span>6 pm</span><span>11 pm</span>
      </div>
    </div>
  );
}

// ── TIR bar ───────────────────────────────────────────────────────────────────

function TirBar({ low = 0, normal = 0, high = 0 }: { low?: number; normal?: number; high?: number }) {
  return (
    <div>
      <div style={{ display: 'flex', height: '14px', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ width: `${low}%`, background: '#B5562E' }} />
        <div style={{ width: `${normal}%`, background: '#1C7A4F' }} />
        <div style={{ width: `${high}%`, background: '#C8932B' }} />
      </div>
      <div style={{ marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#16182A' }}>
        {[
          { color: '#1C7A4F', label: `In range ${normal}%` },
          { color: '#B5562E', label: `Low ${low}%` },
          { color: '#C8932B', label: `High ${high}%` },
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

// ── Insight card ─────────────────────────────────────────────────────────────

function InsightCard({ title, message, type, severity, action, foods }: {
  title: string; message: string; type?: string; severity?: string; action?: string; foods?: string[];
}) {
  const theme = domainTheme(type, severity);
  return (
    <div style={{ background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.07)', padding: '20px', boxShadow: '0 14px 30px -26px rgba(1,35,116,.3)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
        <span style={{ width: '32px', height: '32px', borderRadius: '9px', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MiniIcon d={theme.iconD} color={theme.color} size={16} />
        </span>
        <span style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, color: theme.color }}>
          {theme.kicker}
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

function InsightsContent({ correlation, aiInsights, scatterDots, allCards, period, setPeriod, isWeb = false }: {
  correlation: any;
  aiInsights: any[];
  scatterDots: GlucoseDot[];
  allCards: any[];
  period: number;
  setPeriod: (p: number) => void;
  isWeb?: boolean;
}) {
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
        <h2 className="font-serif-italic" style={{ fontSize: '24px', color: '#012374', marginBottom: '12px' }}>Patterns appear over time.</h2>
        <p style={{ fontSize: '14px', color: 'rgba(22,24,42,0.62)', maxWidth: '380px', margin: '0 auto 24px', lineHeight: 1.6 }}>
          Log a few meals and glucose readings and Chatita will start connecting them — offered as observations, never scores.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <a href="/add-meal" style={{ padding: '11px 22px', borderRadius: '999px', background: '#012374', color: '#FFFDF9', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Log a meal</a>
          <a href="/home" style={{ padding: '11px 22px', borderRadius: '999px', border: '1px solid rgba(1,35,116,0.2)', color: '#001A4D', background: '#FFFDF9', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Add glucose</a>
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
            <h2 className="font-serif-italic" style={{ fontSize: isWeb ? '24px' : '22px', color: '#012374' }}>Daily glucose pattern</h2>
            <p style={{ fontSize: '13px', color: 'rgba(22,24,42,0.6)', marginTop: '3px' }}>Every reading, plotted by time of day — your target band shaded.</p>
          </div>
          <div style={{ display: 'flex', gap: '7px', flexShrink: 0 }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setPeriod(d)} style={{
                padding: '7px 15px', borderRadius: '999px', fontSize: '12.5px', fontWeight: 600,
                cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                background: period === d ? '#012374' : '#F7EFE1',
                color: period === d ? '#FFFDF9' : '#012374',
                outline: period === d ? 'none' : '1px solid rgba(1,35,116,0.16)',
              }}>{d} days</button>
            ))}
          </div>
        </div>

        {/* Stat boxes */}
        <div style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Avg glucose', val: stats?.averageGlucose ? `${Math.round(stats.averageGlucose)}` : '—', unit: 'mg/dL', color: '#012374' },
            { label: 'Time in range', val: stats?.inRangePercent != null ? `${stats.inRangePercent}%` : '—', unit: '70–180', color: '#1C7A4F' },
            { label: 'Est. A1C', val: correlation?.a1cEstimate?.estimated ? `${correlation.a1cEstimate.estimated}%` : '—', unit: 'from readings', color: '#012374' },
            { label: 'Readings', val: stats?.readingsCount ?? correlation?.mealsTracked ?? '—', unit: 'individual', color: '#2A8A8A' },
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
            <ScatterChart
              dots={scatterDots}
              targetMin={correlation?.targetGlucoseMin ?? 70}
              targetMax={correlation?.targetGlucoseMax ?? 180}
            />
          ) : correlation?.chartData?.trendData ? (
            <GlucoseTrendChart data={correlation.chartData.trendData} />
          ) : (
            <div style={{ height: '120px', borderRadius: '12px', background: '#F7EFE1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '13px', color: 'rgba(22,24,42,0.4)' }}>No readings in this period yet.</p>
            </div>
          )}
        </div>

        {/* TIR bar */}
        {tir && <div style={{ marginTop: '18px' }}><TirBar low={tir.low} normal={tir.normal} high={tir.high} /></div>}

        {(stats?.readingsCount ?? 0) > 0 && (
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(28,122,79,0.08)', borderRadius: '999px', padding: '7px 14px', width: 'fit-content' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1C7A4F', display: 'inline-block' }} />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1C7A4F' }}>{stats.readingsCount} readings · all visible</span>
          </div>
        )}
      </div>

      {/* ── Featured insight (navy) ── */}
      {featuredCard && (
        <div style={{ marginTop: '20px', background: '#012374', borderRadius: '22px', padding: '26px 28px', color: '#FFFDF9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
            <span style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'rgba(42,138,138,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 19V5m0 14h16M4 15l4-4 3 3 5-6 4 5" stroke="#7FD0D0" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7FD0D0', fontWeight: 700 }}>Pattern of the week</span>
          </div>
          <h2 className="font-serif-italic" style={{ fontSize: isWeb ? '26px' : '24px', lineHeight: 1.25, maxWidth: '600px' }}>{featuredCard.title}</h2>
          <p style={{ fontSize: '14.5px', color: 'rgba(255,253,249,0.82)', marginTop: '10px', lineHeight: 1.55, maxWidth: '580px' }}>{featuredCard.message}</p>
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

      {/* ── Extra charts ── */}
      {(correlation?.chartData?.mealComparison?.length > 0 || correlation?.chartData?.dailyPattern?.length > 0) && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {correlation.chartData.mealComparison?.length > 0 && (
            <div style={{ background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.07)', padding: '22px 24px', boxShadow: '0 14px 30px -26px rgba(1,35,116,.3)' }}>
              <h3 className="font-serif-italic" style={{ fontSize: '18px', color: '#012374', marginBottom: '16px' }}>Average glucose by meal type</h3>
              <MealComparisonChart data={correlation.chartData.mealComparison} />
            </div>
          )}
          {correlation.chartData.dailyPattern?.length > 0 && (
            <div style={{ background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.07)', padding: '22px 24px', boxShadow: '0 14px 30px -26px rgba(1,35,116,.3)' }}>
              <h3 className="font-serif-italic" style={{ fontSize: '18px', color: '#012374', marginBottom: '16px' }}>Hourly glucose pattern</h3>
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
          Insights are observations to explore with your care team — not diagnoses or medical advice.
          Chatita follows global diabetes principles (IDF &amp; WHO) and adapts to your foods and goals.
        </span>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [correlation, setCorrelation] = useState<any>(null);
  const [aiInsights, setAiInsights]   = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [period, setPeriod]           = useState(30);

  useEffect(() => { fetchAnalytics(); }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [corrRes, insRes] = await Promise.all([
        fetch(`/api/analytics/correlation?days=${period}`),
        fetch(`/api/analytics/insights?days=${period}`),
      ]);
      if (corrRes.ok)  setCorrelation(await corrRes.json());
      if (insRes.ok) { const d = await insRes.json(); setAiInsights(d.insights || []); }
    } catch { /* keep previous state */ } finally { setLoading(false); }
  };

  const scatterDots = useMemo((): GlucoseDot[] => {
    const raw = correlation?.chartData?.trendData;
    if (!raw?.length) return [];
    const targetMin = correlation?.targetGlucoseMin ?? 70;
    const targetMax = correlation?.targetGlucoseMax ?? 180;
    return raw.map((pt: any) => {
      const date = new Date(pt.time ?? pt.measuredAt ?? pt.date);
      const hourFraction = (date.getHours() + date.getMinutes() / 60) / 24;
      const x = Math.round(10 + hourFraction * 980);
      const v = pt.value ?? pt.glucose ?? 0;
      const yVal = 220 - (Math.max(0, Math.min(300, v)) / 300) * 210;
      const label = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return { x, y: Math.round(yVal), color: glucoseDotColor(v, targetMin, targetMax), v, label };
    });
  }, [correlation]);

  const allCards = useMemo(() => {
    const cards: any[] = [];
    (correlation?.patterns ?? []).forEach((p: any) => {
      cards.push({ title: p.title, message: p.description, type: p.type, severity: p.severity, foods: p.foods });
    });
    aiInsights.forEach(ins => {
      cards.push({ title: ins.title, message: ins.message, type: ins.type, action: ins.action });
    });
    return cards;
  }, [correlation, aiInsights]);

  const sharedProps = { correlation, aiInsights, scatterDots, allCards, period, setPeriod };

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
      <div className="lg:hidden min-h-screen mobile-page-pb" style={{ background: '#F7EFE1' }}>
        {/* Mobile header */}
        <div style={{ background: '#FFFDF9', borderBottom: '1px solid rgba(1,35,116,0.07)', padding: '18px 20px 14px' }}>
          <BackButton href="/home" />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: '10px', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>
                Insights · {getDateRange(period)}
              </div>
              <h1 className="font-serif-italic" style={{ fontSize: '28px', color: '#012374', lineHeight: 1.05, marginTop: '5px' }}>
                Gentle patterns worth noticing.
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(22,24,42,0.62)', marginTop: '4px', lineHeight: 1.5 }}>
                Connections across your week — offered as observations, never scores.
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

      {/* ── Web / desktop layout ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex" style={{ height: '100vh', background: '#F7EFE1', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
        <WebNav />

        <div style={{ flex: 1, overflowY: 'auto', padding: '34px 44px 48px' }}>
          {/* Web header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>
                Insights · {getDateRange(period)}
              </div>
              <h1 className="font-serif-italic" style={{ fontSize: '38px', color: '#012374', lineHeight: 1.05, marginTop: '6px' }}>
                Gentle patterns worth noticing.
              </h1>
              <p style={{ fontSize: '16px', color: 'rgba(22,24,42,0.65)', marginTop: '4px', lineHeight: 1.5 }}>
                Connections across your week — offered as observations, never scores.
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
    </>
  );
}
