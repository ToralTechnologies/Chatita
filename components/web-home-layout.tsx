'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mood, UserContext } from '@/types';

type GlucoseContext = 'fasting' | 'pre-meal' | 'post-meal' | 'bedtime' | 'random';

interface WebHomeLayoutProps {
  firstName: string;
  currentGlucose?: number;
  userData?: any;
  userContext: UserContext;
  onGlucoseUpdate?: (value: number, context?: GlucoseContext) => void;
  onMoodSave?: (mood: Mood, stress: number) => void;
  onContextSave?: (ctx: UserContext) => void;
}

function getDayLabel() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[now.getDay()]} · ${now.getDate()} ${months[now.getMonth()]}`;
}

const MOOD_GRADIENT: Record<string, { from: string; to: string; shadow: string }> = {
  happy:    { from: '#E5BC5E', to: '#C8932B', shadow: '0 12px 28px -8px rgba(200,147,43,0.55)' },
  grateful: { from: '#E5BC5E', to: '#C8932B', shadow: '0 12px 28px -8px rgba(200,147,43,0.55)' },
  calm:     { from: '#7C86AB', to: '#5C77AE', shadow: '0 12px 28px -8px rgba(92,119,174,0.45)' },
  tired:    { from: '#5C77AE', to: '#34508C', shadow: '0 12px 28px -8px rgba(52,80,140,0.45)' },
  anxious:  { from: '#34508C', to: '#001A4D', shadow: '0 12px 28px -8px rgba(0,26,77,0.5)' },
  sad:      { from: '#34508C', to: '#001A4D', shadow: '0 12px 28px -8px rgba(0,26,77,0.5)' },
  default:  { from: '#7C86AB', to: '#34508C', shadow: '0 12px 28px -8px rgba(52,80,140,0.4)' },
};

const MOODS = [
  { value: 'happy',    label: 'Happy',    group: 'bright' },
  { value: 'grateful', label: 'Grateful', group: 'bright' },
  { value: 'calm',     label: 'Calm',     group: 'mid' },
  { value: 'tired',    label: 'Tired',    group: 'heavy' },
  { value: 'anxious',  label: 'Anxious',  group: 'heavy' },
  { value: 'sad',      label: 'Down',     group: 'heavy' },
];

const STRESS_LABELS = ['Easy', 'Mild', 'Some', 'Heavy', 'A lot'];

const NAV_LINKS = [
  { href: '/home', label: 'Home', active: true },
  { href: '/meal-history', label: 'Meal history' },
  { href: '/mood-log', label: 'Mood log' },
  { href: '/recipes', label: 'Recipes' },
  { href: '/restaurant-finder', label: 'Restaurants' },
  { href: '/insights', label: 'Insights' },
];

const QUICK_ACTIONS = [
  {
    href: '/menu-scanner',
    label: 'Scan menu',
    sub: 'Photo → ranked',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2.5" stroke="#012374" strokeWidth="1.6"/><circle cx="12" cy="12.5" r="3.5" stroke="#012374" strokeWidth="1.6"/><path d="M8 6l1.5-2h5L16 6" stroke="#012374" strokeWidth="1.6"/></svg>,
  },
  {
    href: '/recipes',
    label: 'Recipes',
    sub: 'From pantry',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0 1 16 0v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1z" stroke="#012374" strokeWidth="1.6"/><path d="M3 19h18" stroke="#012374" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
  {
    href: '/restaurant-finder',
    label: 'Restaurants',
    sub: 'Kind spots',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" stroke="#012374" strokeWidth="1.6"/><circle cx="12" cy="10" r="2.5" stroke="#012374" strokeWidth="1.6"/></svg>,
  },
  {
    href: '/meal-plan',
    label: 'Meal plan',
    sub: 'Plan a week',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2.5" stroke="#012374" strokeWidth="1.6"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#012374" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
];

export default function WebHomeLayout({
  firstName,
  currentGlucose,
  userData,
  userContext,
  onGlucoseUpdate,
  onMoodSave,
  onContextSave,
}: WebHomeLayoutProps) {
  const MOOD_SLIDER_POS: Record<string, number> = {
    sad: 8, anxious: 22, tired: 38, calm: 55, grateful: 72, happy: 88,
  };
  const sliderToMood = (v: number): string => {
    if (v <= 15) return 'sad';
    if (v <= 30) return 'anxious';
    if (v <= 48) return 'tired';
    if (v <= 63) return 'calm';
    if (v <= 78) return 'grateful';
    return 'happy';
  };

  const initMood = userContext.mood || '';
  const [selectedMood, setSelectedMood] = useState<string>(initMood);
  const [sliderValue, setSliderValue] = useState<number>(MOOD_SLIDER_POS[initMood] ?? 50);
  const [stressIndex, setStressIndex] = useState(2);
  const [moodSaved, setMoodSaved] = useState(false);
  const [showAddReading, setShowAddReading] = useState(false);
  const [readingInput, setReadingInput] = useState('');
  const [readingContext, setReadingContext] = useState<GlucoseContext>('random');

  const minRange = userData?.targetGlucoseMin || 70;
  const maxRange = userData?.targetGlucoseMax || 180;

  const toPercent = (v: number) => Math.min(100, Math.max(0, ((v - 40) / 260) * 100));
  const targetLeft = toPercent(minRange);
  const targetRight = 100 - toPercent(maxRange);
  const dotLeft = currentGlucose ? toPercent(currentGlucose) : null;

  const getStatus = (v?: number) => {
    if (!v) return null;
    if (v < minRange) return { label: 'Below range', color: '#D0021B', bg: 'rgba(208,2,27,0.1)' };
    if (v > maxRange) return { label: 'A bit above range', color: '#9A6F18', bg: 'rgba(200,147,43,0.16)' };
    return { label: 'In range', color: '#4A8C00', bg: 'rgba(126,211,33,0.15)' };
  };
  const status = getStatus(currentGlucose);

  const grad = MOOD_GRADIENT[selectedMood] || MOOD_GRADIENT.default;

  const handleSaveMood = () => {
    if (!selectedMood) return;
    onMoodSave?.(selectedMood as Mood, stressIndex + 1);
    setMoodSaved(true);
    setTimeout(() => setMoodSaved(false), 2000);
  };

  const handleSaveReading = () => {
    const v = parseFloat(readingInput);
    if (!isNaN(v) && v > 0) {
      onGlucoseUpdate?.(v, readingContext);
      setShowAddReading(false);
      setReadingInput('');
      setReadingContext('random');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7EFE1', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Top nav ── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        height: 68,
        background: '#F7EFE1',
        borderBottom: '1px solid rgba(200,147,43,0.3)',
      }}>
        <Image src="/logo-horizontal.svg" alt="Chatita" width={120} height={30} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: 14,
                fontWeight: link.active ? 600 : 400,
                color: link.active ? '#012374' : 'rgba(22,24,42,0.65)',
                textDecoration: 'none',
                paddingBottom: 2,
                borderBottom: link.active ? '2px solid #C8932B' : '2px solid transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/walkthrough"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(1,35,116,0.55)',
              textDecoration: 'none',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Tour
          </Link>
          <button
            onClick={() => setShowAddReading(true)}
            style={{
              background: '#012374',
              color: '#FFFDF9',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 99,
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#FFFDF9" strokeWidth="2.2" strokeLinecap="round"/></svg>
            Add a reading
          </button>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: '#012374',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#FFFDF9', fontSize: 15, fontFamily: 'DM Serif Display, serif', fontStyle: 'italic' }}>
              {firstName[0]}
            </span>
          </div>
        </div>
      </nav>

      {/* ── Editorial header ── */}
      <div style={{ padding: '36px 48px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>
          {getDayLabel()}
        </div>
        <h1 style={{
          fontFamily: 'DM Serif Display, Georgia, serif',
          fontStyle: 'italic',
          fontSize: 52,
          color: '#012374',
          lineHeight: 1,
          margin: '8px 0 0',
        }}>
          Hola, {firstName}.
        </h1>
        <p style={{ fontSize: 15, color: '#16182A', opacity: 0.72, marginTop: 8, lineHeight: 1.55 }}>
          Take it paso a paso today. The numbers are part of the picture — they&apos;re not the picture.
        </p>
      </div>

      {/* ── 3-column editorial grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.1fr 1fr',
        gap: 22,
        padding: '28px 48px 48px',
        maxWidth: 1280,
        margin: '0 auto',
      }}>

        {/* ─ LEFT: Glucose ─ */}
        <div style={{
          background: '#FFFDF9',
          borderRadius: 22,
          padding: '22px',
          border: '1px solid rgba(200,147,43,0.28)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.6)', fontWeight: 700 }}>
              Today · glucose
            </span>
            <button
              onClick={() => setShowAddReading(true)}
              style={{ fontSize: 11, color: '#C8932B', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {currentGlucose ? '+ Update' : '+ Add reading'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 8 }}>
            <span style={{ fontSize: 64, color: '#012374', lineHeight: 0.9, fontFamily: 'DM Serif Display, Georgia, serif' }}>
              {currentGlucose ?? '—'}
            </span>
            <span style={{ fontSize: 14, color: '#16182A', opacity: 0.6, paddingBottom: 10 }}>
              {currentGlucose ? 'mg/dL' : 'mg/dL · no data yet'}
            </span>
          </div>

          {status && (
            <div style={{
              marginTop: 8,
              display: 'inline-block',
              padding: '6px 12px',
              borderRadius: 99,
              background: status.bg,
              color: status.color,
              fontSize: 12,
              fontWeight: 600,
            }}>
              {status.label}
            </div>
          )}

          <div style={{ marginTop: 18, position: 'relative', height: 8, background: '#F7EFE1', borderRadius: 99 }}>
            <div style={{ position: 'absolute', left: `${targetLeft}%`, right: `${targetRight}%`, top: 0, bottom: 0, background: 'rgba(1,35,116,0.5)', borderRadius: 99 }} />
            {dotLeft !== null && (
              <div style={{ position: 'absolute', left: `${dotLeft}%`, top: -4, width: 16, height: 16, borderRadius: '50%', background: '#C8932B', border: '3px solid #FFFDF9', transform: 'translateX(-50%)' }} />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#16182A', opacity: 0.6 }}>
            <span>{minRange}</span><span>your range</span><span>{maxRange}</span>
          </div>

          {currentGlucose !== undefined && currentGlucose < 54 && (
            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 12, background: 'rgba(208,2,27,0.1)', border: '1px solid rgba(208,2,27,0.3)', color: '#D0021B', fontSize: 12.5, fontWeight: 600 }}>
              ⚠️ This reading may be an emergency. Seek medical care immediately.
            </div>
          )}
          {currentGlucose !== undefined && currentGlucose > 250 && (
            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 12, background: 'rgba(200,147,43,0.12)', border: '1px solid rgba(200,147,43,0.4)', color: '#9A6F18', fontSize: 12.5, fontWeight: 600 }}>
              ⚠️ This is a very high reading. Contact your healthcare provider.
            </div>
          )}
        </div>

        {/* ─ CENTER: Check-in (mood orb + stress) ─ */}
        <div style={{
          background: '#012374',
          color: '#FFFDF9',
          borderRadius: 22,
          padding: '24px 22px',
          boxShadow: '0 18px 36px -16px rgba(1,35,116,0.55)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700, textAlign: 'center' }}>
            Right now · check-in
          </div>
          <div style={{
            fontFamily: 'DM Serif Display, Georgia, serif',
            fontStyle: 'italic',
            fontSize: 26,
            lineHeight: 1.05,
            marginTop: 6,
            textAlign: 'center',
          }}>
            How are you, really?
          </div>

          {/* Mood orb */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 18 }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, ${grad.from}, ${grad.to})`,
              boxShadow: grad.shadow,
              transition: 'background 0.5s ease, box-shadow 0.5s ease',
            }} />
            <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 20, marginTop: 10 }}>
              {selectedMood ? MOODS.find(m => m.value === selectedMood)?.label ?? 'Feeling...' : 'How are you?'}
            </div>
          </div>

          {/* Mood pills grouped */}
          <div style={{ marginTop: 16 }}>
            {[
              { group: 'bright', dot: '#C8932B', moods: MOODS.filter(m => m.group === 'bright') },
              { group: 'mid', dot: '#5C77AE', moods: MOODS.filter(m => m.group === 'mid') },
              { group: 'heavy', dot: '#E3171A', moods: MOODS.filter(m => m.group === 'heavy') },
            ].map(({ group, dot, moods }) => (
              <div key={group} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                {moods.map(m => (
                  <button
                    key={m.value}
                    onClick={() => {
                      setSelectedMood(m.value);
                      setSliderValue(MOOD_SLIDER_POS[m.value] ?? 50);
                    }}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 99,
                      border: 'none',
                      background: selectedMood === m.value ? '#FFFDF9' : 'rgba(255,253,249,0.14)',
                      color: selectedMood === m.value ? '#012374' : '#FFFDF9',
                      fontSize: 12,
                      fontWeight: selectedMood === m.value ? 600 : 400,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Pleasant ↔ Unpleasant slider */}
          <div style={{ marginTop: 16 }}>
            <input
              type="range"
              min={0}
              max={100}
              value={sliderValue}
              onChange={e => {
                const v = Number(e.target.value);
                setSliderValue(v);
                setSelectedMood(sliderToMood(v));
              }}
              className="mood-slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, opacity: 0.65 }}>
              <span>Very unpleasant</span><span>Neutral</span><span>Very pleasant</span>
            </div>
          </div>

          {/* Stress selector */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,253,249,0.6)', marginBottom: 6 }}>Stress level today</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {STRESS_LABELS.map((l, i) => (
                <button
                  key={l}
                  onClick={() => setStressIndex(i)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 8,
                    border: 'none',
                    background: stressIndex === i ? '#C8932B' : 'rgba(255,253,249,0.12)',
                    color: '#FFFDF9',
                    fontSize: 10,
                    fontWeight: stressIndex === i ? 700 : 400,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveMood}
            disabled={!selectedMood}
            style={{
              marginTop: 16,
              width: '100%',
              background: '#C8932B',
              color: '#FFFDF9',
              border: 'none',
              padding: '13px 0',
              borderRadius: 14,
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 600,
              cursor: selectedMood ? 'pointer' : 'not-allowed',
              opacity: selectedMood ? 1 : 0.5,
              transition: 'opacity 0.15s',
            }}
          >
            {moodSaved ? 'Saved ✓' : 'Save this moment →'}
          </button>
        </div>

        {/* ─ RIGHT: This week + Quick actions ─ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* This week */}
          <div style={{ background: '#FFFDF9', borderRadius: 22, padding: '22px', border: '1px solid rgba(200,147,43,0.28)' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.6)', fontWeight: 700 }}>
              This week
            </div>
            <div style={{
              fontFamily: 'DM Serif Display, Georgia, serif',
              fontStyle: 'italic',
              fontSize: 17,
              color: '#012374',
              lineHeight: 1.25,
              marginTop: 6,
            }}>
              Every check-in is a step forward.
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
              {[54, 70, 62, 80, 74, 88, 76].map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    borderRadius: 5,
                    height: `${h}%`,
                    background: i >= 5 ? '#C8932B' : i >= 3 ? 'rgba(1,35,116,0.5)' : '#F7EFE1',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, opacity: 0.55 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ background: '#FFFDF9', borderRadius: 22, padding: '18px 18px 10px', border: '1px solid rgba(200,147,43,0.28)' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.6)', fontWeight: 700, marginBottom: 12 }}>
              Quick actions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {QUICK_ACTIONS.map(a => (
                <Link
                  key={a.href}
                  href={a.href}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    padding: '10px',
                    border: '1px solid rgba(1,35,116,0.1)',
                    borderRadius: 12,
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  {a.icon}
                  <div>
                    <div style={{ fontSize: 12, color: '#012374', fontWeight: 600 }}>{a.label}</div>
                    <div style={{ fontSize: 10, color: '#16182A', opacity: 0.55 }}>{a.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{
            padding: '12px 14px',
            background: 'rgba(200,147,43,0.1)',
            borderLeft: '3px solid #C8932B',
            borderRadius: 10,
            fontSize: 11,
            color: 'rgba(1,35,116,0.65)',
            lineHeight: 1.5,
          }}>
            Chatita provides general guidance. Always consult your doctor for medical advice.
          </div>
        </div>
      </div>

      {/* ── Add reading modal ── */}
      {showAddReading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,26,77,0.38)',
            backdropFilter: 'blur(4px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => e.target === e.currentTarget && setShowAddReading(false)}
        >
          <div style={{
            background: '#FFFDF9',
            borderRadius: 26,
            padding: '28px',
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 40px 80px -24px rgba(0,26,77,0.5)',
          }}>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Add a reading</div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 28, color: '#012374', marginTop: 6 }}>
              What's your number?
            </div>
            <input
              type="number"
              value={readingInput}
              onChange={e => setReadingInput(e.target.value)}
              autoFocus
              placeholder="e.g. 120"
              style={{
                width: '100%',
                marginTop: 16,
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid rgba(1,35,116,0.15)',
                background: '#F7EFE1',
                fontSize: 14,
                color: '#001A4D',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(['fasting', 'pre-meal', 'post-meal', 'bedtime', 'random'] as GlucoseContext[]).map(ctx => (
                <button
                  key={ctx}
                  onClick={() => setReadingContext(ctx)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 99,
                    border: `1px solid ${readingContext === ctx ? '#012374' : 'rgba(1,35,116,0.2)'}`,
                    background: readingContext === ctx ? '#012374' : 'transparent',
                    color: readingContext === ctx ? '#FFFDF9' : '#012374',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textTransform: 'capitalize',
                  }}
                >
                  {ctx.replace('-', ' ')}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                onClick={handleSaveReading}
                disabled={!readingInput || parseFloat(readingInput) <= 0}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#012374',
                  color: '#FFFDF9',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  opacity: !readingInput || parseFloat(readingInput) <= 0 ? 0.4 : 1,
                }}
              >
                Save reading
              </button>
              <button
                onClick={() => { setShowAddReading(false); setReadingInput(''); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  border: '1px solid rgba(1,35,116,0.2)',
                  background: 'transparent',
                  color: '#001A4D',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
