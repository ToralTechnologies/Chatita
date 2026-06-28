'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import WebNav from '@/components/web-nav';
import HealthTodayCard from '@/components/health-today-card';
import { Mood, UserContext, MoodCheckInData } from '@/types';

type GlucoseContext = 'fasting' | 'pre-meal' | 'post-meal' | 'bedtime' | 'random';

interface WebHomeLayoutProps {
  firstName: string;
  currentGlucose?: number;
  userData?: any;
  userContext: UserContext;
  onGlucoseUpdate?: (value: number, context?: GlucoseContext, relatedMealId?: string, notes?: string) => void;
  onMoodSave?: (data: MoodCheckInData) => void;
  onContextSave?: (ctx: UserContext) => void;
}

interface GlucoseEntry {
  value: number;
  measuredAt: string;
  notes?: string;
  context?: string;
}

function getDayLabel() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[now.getDay()]} · ${now.getDate()} ${months[now.getMonth()]}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

const BUCKETS = [
  { label: 'Very unpleasant', es: 'Muy difícil', color: '#001A4D', glow: '#3A4E80', words: ['Stressed', 'Anxious', 'Overwhelmed', 'Drained', 'Sad', 'Angry', 'Scared', 'Discouraged'] },
  { label: 'Unpleasant',      es: 'Difícil',     color: '#34508C', glow: '#5C77AE', words: ['Worried', 'Tired', 'Frustrated', 'Down', 'Tense', 'Lonely', 'Annoyed'] },
  { label: 'Neutral',         es: 'Neutral',     color: '#7C86AB', glow: '#A4ACC6', words: ['Okay', 'Calm', 'Indifferent', 'Content', 'Quiet', 'Steady'] },
  { label: 'Pleasant',        es: 'Bien',        color: '#C8932B', glow: '#E5BC5E', words: ['Hopeful', 'Grateful', 'Relaxed', 'Motivated', 'Proud', 'Cared for'] },
  { label: 'Very pleasant',   es: 'Muy bien',    color: '#B07C1C', glow: '#D8A53E', words: ['Great', 'Joyful', 'Peaceful', 'Energized', 'Confident', 'Loved'] },
];
const getBucket = (v: number) => v < 0.2 ? 0 : v < 0.4 ? 1 : v < 0.6 ? 2 : v < 0.8 ? 3 : 4;

const MEAL_CHIPS = [
  'Before breakfast', 'After breakfast', 'Before lunch', 'After lunch',
  'Before dinner', 'After dinner', 'Fasting / waking', 'Bedtime', 'Snack', 'No meal',
];
const BODY_CHIPS = [
  'I feel fine', 'Shaky', 'Lightheaded', 'Sweaty', 'Tired', 'Hungry',
  'Headache', 'Blurry vision', 'Heart racing', 'Nauseous', 'Irritable', 'Numb or tingly',
];
const FACTOR_CHIPS = ['Food', 'Exercise', 'Sleep', 'Stress', 'Medication', 'Hormones', 'Work', 'Family', 'Health', 'Weather'];

function contextFromMeal(meal: string): GlucoseContext {
  if (meal.includes('After')) return 'post-meal';
  if (meal.includes('Before')) return 'pre-meal';
  if (meal === 'Fasting / waking') return 'fasting';
  if (meal === 'Bedtime') return 'bedtime';
  return 'random';
}

const QUICK_ACTIONS = [
  {
    href: '/menu-scanner',
    title: 'Scan a menu',
    subtitle: 'Photo → ranked dishes',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="#012374" strokeWidth="1.6"/>
        <circle cx="12" cy="12.5" r="3.5" stroke="#012374" strokeWidth="1.6"/>
        <path d="M8 6l1.5-2h5L16 6" stroke="#012374" strokeWidth="1.6"/>
      </svg>
    ),
  },
  {
    href: '/recipes',
    title: 'Recipes',
    subtitle: 'From your pantry',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M4 12a8 8 0 0 1 16 0v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1z" stroke="#012374" strokeWidth="1.6"/>
        <path d="M3 19h18" stroke="#012374" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M12 4v4" stroke="#012374" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/restaurant-finder',
    title: 'Find restaurants',
    subtitle: 'Kind spots nearby',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" stroke="#012374" strokeWidth="1.6"/>
        <circle cx="12" cy="10" r="2.5" stroke="#012374" strokeWidth="1.6"/>
      </svg>
    ),
  },
  {
    href: '/meal-plan',
    title: 'Meal plan',
    subtitle: 'Plan your week',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2.5" stroke="#012374" strokeWidth="1.6"/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="#012374" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
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
  const [showAddReading, setShowAddReading] = useState(false);
  // 'checkin' = mood-first flow; 'reading' = glucose-first flow
  const [flowType, setFlowType] = useState<'checkin' | 'reading'>('checkin');
  const [step, setStep] = useState(1);
  const [glucose, setGlucose] = useState('');
  const [meal, setMeal] = useState('');
  const [body, setBody] = useState<string[]>([]);
  const [moodType, setMoodType] = useState<'now' | 'today'>('now');
  const [moodVal, setMoodVal] = useState(0.5);
  const [moodWords, setMoodWords] = useState<string[]>([]);
  const [factors, setFactors] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [readings, setReadings] = useState<GlucoseEntry[]>([]);
  // reading flow: after done, offer mood add-on
  const [offerMood, setOfferMood] = useState(false);

  // Extended mood state (checkin step 1)
  const [moodStress, setMoodStress] = useState<string | null>(null);
  const [moodExpanded, setMoodExpanded] = useState(false);
  const [moodEnergyLevel, setMoodEnergyLevel] = useState<number | null>(null);
  const [moodHungerLevel, setMoodHungerLevel] = useState<number | null>(null);
  const [moodFullness, setMoodFullness] = useState<number | null>(null);
  const [moodCravings, setMoodCravings] = useState<string[]>([]);
  const [moodBodySymptoms, setMoodBodySymptoms] = useState<string[]>([]);
  const [moodContextTags, setMoodContextTags] = useState<string[]>([]);
  const [moodUserWords, setMoodUserWords] = useState('');
  const [moodFoodMood, setMoodFoodMood] = useState('');
  const [moodSupportWanted, setMoodSupportWanted] = useState('');

  const targetMin = userData?.targetGlucoseMin || (userContext as any)?.targetMin || 70;
  const targetMax = userData?.targetGlucoseMax || (userContext as any)?.targetMax || 180;

  useEffect(() => {
    fetch('/api/glucose?limit=20')
      .then(r => r.json())
      .then(d => setReadings(d.entries || []))
      .catch(() => {});
  }, []);

  const todayReadings = readings.filter(r => isToday(r.measuredAt));
  const latestReading = readings[0];
  const displayGlucose = latestReading?.value ?? currentGlucose;

  const timeInRange = todayReadings.length
    ? Math.round((todayReadings.filter(r => r.value >= targetMin && r.value <= targetMax).length / todayReadings.length) * 100)
    : null;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last7 = readings.filter(r => new Date(r.measuredAt) >= sevenDaysAgo);
  const gentleAverage = last7.length
    ? Math.round(last7.reduce((s, r) => s + r.value, 0) / last7.length)
    : null;

  const getStatus = (v?: number) => {
    if (!v) return null;
    if (v < 70) return { label: 'A little low — be gentle', color: '#012374', bg: 'rgba(1,35,116,0.12)' };
    if (v > 180) return { label: "A bit above range — that's okay", color: '#9A6F18', bg: 'rgba(200,147,43,0.16)' };
    return { label: 'Right in your range', color: '#001A4D', bg: 'rgba(1,35,116,0.10)' };
  };
  const status = getStatus(displayGlucose);

  const toPercent = (v: number) => Math.min(100, Math.max(0, ((v - 40) / 260) * 100));
  const dotLeft = displayGlucose ? toPercent(displayGlucose) : null;

  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekBars: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayReadings = readings.filter(r => {
      const rd = new Date(r.measuredAt);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth() && rd.getDate() === d.getDate();
    });
    weekBars.push(dayReadings.length ? Math.round(dayReadings.reduce((s, r) => s + r.value, 0) / dayReadings.length) : 0);
  }
  const maxBar = Math.max(...weekBars, 1);

  const bucket = BUCKETS[getBucket(moodVal)];

  const resetMoodExtended = () => {
    setMoodStress(null);
    setMoodExpanded(false);
    setMoodEnergyLevel(null);
    setMoodHungerLevel(null);
    setMoodFullness(null);
    setMoodCravings([]);
    setMoodBodySymptoms([]);
    setMoodContextTags([]);
    setMoodUserWords('');
    setMoodFoodMood('');
    setMoodSupportWanted('');
  };

  const openCheckin = () => {
    setFlowType('checkin');
    setStep(1);
    setGlucose('');
    setMeal('');
    setBody([]);
    setMoodVal(0.5);
    setMoodWords([]);
    setFactors([]);
    setOfferMood(false);
    resetMoodExtended();
    setShowAddReading(true);
  };

  const openAddReading = () => {
    setFlowType('reading');
    setStep(1);
    setGlucose('');
    setMeal('');
    setBody([]);
    setMoodVal(0.5);
    setMoodWords([]);
    setFactors([]);
    setOfferMood(false);
    resetMoodExtended();
    setShowAddReading(true);
  };

  const handleSaveReading = () => {
    const v = parseInt(glucose);
    if (!isNaN(v) && v > 0) {
      onGlucoseUpdate?.(v, contextFromMeal(meal), undefined, body.join(', '));
    }

    if (flowType === 'checkin') {
      // Map bucket index → Mood enum
      const BUCKET_MOOD = ['sad', 'anxious', 'neutral', 'calm', 'happy'] as const;
      const bucketIdx = getBucket(moodVal);
      const mood = BUCKET_MOOD[bucketIdx];
      const stressMap: Record<string, number> = { Easy: 2, Mild: 4, Some: 6, Heavy: 8, 'A lot': 10 };
      const stressLevel = moodStress ? stressMap[moodStress] : 5;
      const combinedTags = [...factors, ...moodContextTags];

      const moodData: MoodCheckInData = {
        mood,
        stressLevel,
        energyLevel: moodEnergyLevel ?? undefined,
        hungerLevel: moodHungerLevel ?? undefined,
        fullnessLevel: moodFullness ?? undefined,
        cravings: moodCravings.length ? moodCravings : undefined,
        symptoms: moodBodySymptoms.length ? moodBodySymptoms : undefined,
        contextTags: combinedTags.length ? combinedTags : undefined,
        userWords: moodUserWords || undefined,
        foodMoodConnection: moodFoodMood || undefined,
        supportWanted: moodSupportWanted || undefined,
      };

      fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          stressLevel,
          energyLevel: moodData.energyLevel,
          hungerLevel: moodData.hungerLevel,
          fullnessLevel: moodData.fullnessLevel,
          cravings: moodData.cravings,
          symptoms: moodData.symptoms,
          contextTags: moodData.contextTags,
          userWords: moodData.userWords,
          foodMoodConnection: moodData.foodMoodConnection,
          supportWanted: moodData.supportWanted,
        }),
      }).catch(() => {});

      onMoodSave?.(moodData);
      setStep(5);
    } else {
      setStep(3);
    }
  };


  const handleNumpad = (key: string) => {
    if (key === 'del') {
      setGlucose(g => g.slice(0, -1));
    } else if (glucose.length < 3) {
      setGlucose(g => g + key);
    }
  };

  const handleListen = () => {
    setListening(true);
    setTimeout(() => {
      setListening(false);
      setGlucose('142');
    }, 1200);
  };

  const toggleBody = (chip: string) => {
    if (chip === 'I feel fine') {
      setBody(['I feel fine']);
    } else {
      setBody(prev => {
        const without = prev.filter(b => b !== 'I feel fine');
        return without.includes(chip) ? without.filter(b => b !== chip) : [...without, chip];
      });
    }
  };

  const toggleFactor = (f: string) => {
    setFactors(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const toggleMoodWord = (w: string) => {
    setMoodWords(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);
  };

  const NUMPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F7EFE1', overflow: 'hidden' }}>
      <WebNav />

      <main style={{ flex: 1, overflowY: 'auto', padding: '34px 44px 44px', fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>
              {getDayLabel()}
            </div>
            <h1
              className="font-serif-italic"
              style={{ fontSize: 40, color: '#012374', lineHeight: 1.1, margin: '8px 0 0', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic' }}
            >
              Hola, {firstName}.
            </h1>
            <p style={{ fontSize: 16, color: '#16182A', opacity: 0.72, marginTop: 8, lineHeight: 1.55 }}>
              Here&apos;s how your day is going. No scores, no judgment.
            </p>
          </div>
          <button
            onClick={openAddReading}
            style={{
              background: '#012374', color: '#FFFDF9', border: 'none',
              padding: '11px 22px', borderRadius: 999, fontFamily: 'inherit',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#FFFDF9" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            Add a reading
          </button>
        </div>

        {/* 2-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 20, marginTop: 28 }}>

          {/* LEFT: Glucose Overview Card */}
          <div style={{ background: '#FFFDF9', borderRadius: 22, padding: '26px 28px', border: '1px solid rgba(1,35,116,0.07)', boxShadow: '0 14px 30px -22px rgba(1,35,116,.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.6)', fontWeight: 700 }}>Latest reading</span>
              {latestReading && (
                <span style={{ fontSize: 13, color: 'rgba(22,24,42,0.55)' }}>{formatTime(latestReading.measuredAt)}</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 10 }}>
              <span
                className="font-serif-italic"
                style={{ fontSize: 74, color: '#012374', lineHeight: 0.9, fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic' }}
              >
                {displayGlucose ?? '—'}
              </span>
              {displayGlucose && (
                <span style={{ fontSize: 15, color: '#16182A', opacity: 0.6, paddingBottom: 12 }}>mg/dL</span>
              )}
              {status && (
                <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: status.bg, color: status.color, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                  {status.label}
                </span>
              )}
            </div>

            {/* Range bar */}
            <div style={{ marginTop: 18, position: 'relative', height: 10, background: '#F7EFE1', borderRadius: 99 }}>
              <div style={{ position: 'absolute', left: '16%', right: '22%', top: 0, bottom: 0, background: '#012374', borderRadius: 99 }} />
              {dotLeft !== null && (
                <div style={{
                  position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
                  left: `${dotLeft}%`,
                  width: 16, height: 16, borderRadius: '50%', background: '#C8932B',
                  border: '3px solid #FFFDF9', boxShadow: '0 2px 6px rgba(200,147,43,0.5)',
                  zIndex: 2,
                }} />
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11.5, color: 'rgba(22,24,42,0.45)' }}>
              <span>40</span>
              <span>{targetMin}–{targetMax} mg/dL target</span>
              <span>300</span>
            </div>

            {/* 3 stat boxes */}
            <div style={{ display: 'flex', gap: 14, marginTop: 22 }}>
              {[
                { label: 'Time in range', value: timeInRange != null ? `${timeInRange}%` : '—' },
                { label: 'Readings today', value: todayReadings.length || '—' },
                { label: 'Gentle avg · 7 days', value: gentleAverage ? `${gentleAverage}` : '—' },
              ].map(stat => (
                <div key={stat.label} style={{ flex: 1, background: '#F7EFE1', borderRadius: 15, padding: '15px 16px' }}>
                  <div
                    className="font-serif-italic"
                    style={{ fontSize: 30, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 1 }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(22,24,42,0.55)', marginTop: 6, lineHeight: 1.3 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Today's readings list */}
            {todayReadings.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 12 }}>Today&apos;s readings</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {todayReadings.slice(0, 5).map((r, i) => (
                    <div key={i} style={{ background: '#F7EFE1', borderRadius: 13, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: i === 0 ? '#C8932B' : '#012374', flexShrink: 0 }} />
                      <span
                        className="font-serif-italic"
                        style={{ fontSize: 22, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 1 }}
                      >
                        {r.value}
                      </span>
                      <span style={{ fontSize: 13, color: 'rgba(22,24,42,0.6)', flex: 1 }}>{r.context || 'mg/dL'}</span>
                      <span style={{ fontSize: 12, color: 'rgba(22,24,42,0.45)' }}>{formatTime(r.measuredAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Check-in card */}
            <div style={{ background: '#012374', borderRadius: 22, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Check in</div>
              <h2
                className="font-serif-italic"
                style={{ fontSize: 24, color: '#FFFDF9', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 1.25, marginTop: 10 }}
              >
                How are you feeling right now?
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,253,249,0.72)', lineHeight: 1.5, marginTop: 10 }}>
                Log your mood, how your body feels, and your latest glucose — all in one gentle flow.
              </p>
              <button
                onClick={openCheckin}
                style={{
                  marginTop: 20, background: '#FFFDF9', color: '#012374',
                  border: 'none', padding: '11px 22px', borderRadius: 999,
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Start a check-in
              </button>
            </div>

            {/* Movement today */}
            <div style={{ background: '#FFFDF9', borderRadius: 22, padding: '22px 24px', border: '1px solid rgba(42,138,138,0.22)', boxShadow: '0 14px 30px -22px rgba(1,35,116,.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(42,138,138,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="14.5" cy="5" r="1.8" stroke="#2A8A8A" strokeWidth="1.7"/><path d="M14 7l-2 6M14.5 8l3-3M13.5 9l-3 1M12 13l-3 6M12 13l3 4" stroke="#2A8A8A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <div style={{ flex: 1 }}>
                  <div className="font-serif-italic" style={{ fontSize: 20, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 1 }}>Movement today</div>
                  <div style={{ fontSize: 12, color: 'rgba(22,24,42,0.55)', marginTop: 3 }}>Context for your glucose — never a target.</div>
                </div>
                <button onClick={() => {}} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#2A8A8A', color: '#FFFDF9', borderRadius: 11, padding: '10px 16px', fontSize: 13.5, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#FFFDF9" strokeWidth="2.2" strokeLinecap="round"/></svg>
                  Add movement
                </button>
              </div>
              <div style={{ marginTop: 14, background: '#F7EFE1', borderRadius: 13, padding: '14px 16px' }}>
                <div style={{ fontSize: 13.5, color: '#012374', fontWeight: 600 }}>Nothing logged yet — and that&apos;s okay.</div>
                <div style={{ fontSize: 13, color: 'rgba(22,24,42,0.68)', marginTop: 4, lineHeight: 1.5 }}>Chores, a short walk, stretching, dancing or physical work all count.</div>
              </div>
            </div>

            {/* Sleep */}
            <div style={{ background: '#FFFDF9', borderRadius: 22, padding: '22px 24px', border: '1px solid rgba(74,85,120,0.22)', boxShadow: '0 14px 30px -22px rgba(1,35,116,.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(74,85,120,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 14a8 8 0 1 1-9.5-9 6.5 6.5 0 0 0 9.5 9z" stroke="#4A5578" strokeWidth="1.6" strokeLinejoin="round"/></svg>
                </span>
                <div style={{ flex: 1 }}>
                  <div className="font-serif-italic" style={{ fontSize: 20, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 1 }}>Sleep</div>
                  <div style={{ fontSize: 12, color: 'rgba(22,24,42,0.5)', marginTop: 3 }}>Last night</div>
                </div>
              </div>
              <div style={{ background: '#F7EFE1', borderRadius: 13, padding: '13px 15px', fontSize: 13, color: '#012374', lineHeight: 1.5 }}>
                No sleep logged yet. Sleep can affect energy, appetite, mood, and glucose patterns.
              </div>
              <button onClick={() => {}} style={{ width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#F7EFE1', color: '#4A5578', borderRadius: 11, padding: '11px', fontSize: 13.5, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#4A5578" strokeWidth="2.2" strokeLinecap="round"/></svg>
                Log sleep
              </button>
            </div>

            {/* This week */}
            <div style={{ background: '#FFFDF9', borderRadius: 22, padding: '22px 24px', border: '1px solid rgba(1,35,116,0.07)', boxShadow: '0 14px 30px -22px rgba(1,35,116,.3)' }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700 }}>This week</div>
              <p
                className="font-serif-italic"
                style={{ fontSize: 18, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 1.35, marginTop: 10 }}
              >
                {gentleAverage
                  ? `Your gentle average is ${gentleAverage} mg/dL — keep going.`
                  : 'Start logging to see your weekly picture.'}
              </p>

              {/* Bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 74, marginTop: 18 }}>
                {weekBars.map((val, i) => {
                  const isLast = i === 6;
                  const recent = i >= 4;
                  const height = val ? Math.max(8, Math.round((val / maxBar) * 74)) : 8;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{
                        width: '100%', height: `${height}px`, borderRadius: 5,
                        background: isLast ? '#C8932B' : recent ? 'rgba(1,35,116,0.55)' : '#F7EFE1',
                      }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {DAY_LABELS.map((d, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: i === 6 ? '#C8932B' : 'rgba(22,24,42,0.45)', fontWeight: i === 6 ? 700 : 400 }}>{d}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Connected health overview (Apple/Google) — shows latest day + import summary */}
        <div style={{ marginTop: 24 }}>
          <HealthTodayCard />
        </div>

        {/* Quick shortcuts */}
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {QUICK_ACTIONS.map(action => (
            <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#FFFDF9', borderRadius: 18, padding: '18px 20px',
                border: '1px solid rgba(1,35,116,0.07)', boxShadow: '0 14px 30px -22px rgba(1,35,116,.3)',
                cursor: 'pointer',
              }}>
                {action.icon}
                <div style={{ fontSize: 15, fontWeight: 700, color: '#012374', marginTop: 12 }}>{action.title}</div>
                <div style={{ fontSize: 13, color: '#16182A', opacity: 0.6, marginTop: 4 }}>{action.subtitle}</div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Add Reading Modal */}
      {showAddReading && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,26,77,0.38)',
            backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 30, zIndex: 50,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddReading(false); }}
        >
          <div style={{
            width: 780, maxHeight: 840, background: '#F7EFE1', borderRadius: 26,
            boxShadow: '0 40px 90px -30px rgba(0,26,77,.6)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            fontFamily: "'DM Sans', sans-serif",
          }}>

            {/* Modal header */}
            <div style={{ padding: '24px 32px 20px', background: '#FFFDF9', borderBottom: '1px solid rgba(1,35,116,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>
                    {flowType === 'checkin' && (step < 5 ? `Step ${step} of 4` : 'Done')}
                    {flowType === 'reading' && (step < 3 ? `Step ${step} of 2` : 'Done')}
                  </div>
                  <div
                    className="font-serif-italic"
                    style={{ fontSize: 24, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', marginTop: 6 }}
                  >
                    {/* check-in flow */}
                    {flowType === 'checkin' && step === 1 && 'Your state of mind'}
                    {flowType === 'checkin' && step === 2 && 'How does your body feel?'}
                    {flowType === 'checkin' && step === 3 && 'When did you take it?'}
                    {flowType === 'checkin' && step === 4 && "What's your reading?"}
                    {flowType === 'checkin' && step === 5 && 'Saved with care.'}
                    {/* reading flow */}
                    {flowType === 'reading' && step === 1 && "What's your reading?"}
                    {flowType === 'reading' && step === 2 && 'When did you take it?'}
                    {flowType === 'reading' && step === 3 && 'Saved with care.'}
                  </div>
                </div>
                <button
                  onClick={() => setShowAddReading(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(22,24,42,0.5)', fontSize: 22, lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              {/* Progress bars */}
              {((flowType === 'checkin' && step < 5) || (flowType === 'reading' && step < 3)) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                  {Array.from({ length: flowType === 'checkin' ? 4 : 2 }, (_, i) => i + 1).map(i => (
                    <div key={i} style={{ flex: 1, height: 6, borderRadius: 99, background: 'rgba(1,35,116,0.12)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99, background: '#012374',
                        width: step > i ? '100%' : step === i ? '40%' : '0%',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

              {/* ── CHECK-IN FLOW ── */}

              {/* Checkin Step 1: Mood */}
              {flowType === 'checkin' && step === 1 && (
                <div>
                  <div style={{ display: 'flex', gap: 6, background: '#FFFDF9', borderRadius: 14, padding: 5, width: 'fit-content', marginBottom: 24 }}>
                    {(['now', 'today'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setMoodType(t)}
                        style={{
                          padding: '9px 20px', borderRadius: 10, fontFamily: 'inherit',
                          fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
                          background: moodType === t ? '#012374' : 'transparent',
                          color: moodType === t ? '#FFFDF9' : '#012374',
                          transition: 'all 0.15s',
                        }}
                      >
                        {t === 'now' ? 'Right now' : 'Overall today'}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 150, height: 150, borderRadius: '50%',
                      background: `radial-gradient(circle at 38% 38%, ${bucket.glow}, ${bucket.color})`,
                      boxShadow: `0 20px 50px -14px ${bucket.color}99`,
                      transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }} />
                    <div style={{ textAlign: 'center' }}>
                      <div className="font-serif-italic" style={{ fontSize: 20, fontWeight: 700, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic' }}>{bucket.label}</div>
                      <div style={{ fontSize: 14, color: 'rgba(22,24,42,0.55)', marginTop: 3 }}>{bucket.es}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 22 }}>
                    <input
                      type="range" min={0} max={1} step={0.01} value={moodVal}
                      onChange={e => { setMoodVal(parseFloat(e.target.value)); setMoodWords([]); }}
                      style={{ width: '100%', accentColor: '#012374', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(22,24,42,0.5)', marginTop: 4 }}>
                      <span>Very unpleasant</span><span>Neutral</span><span>Very pleasant</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 20 }}>
                    {bucket.words.slice(0, 6).map(w => (
                      <button key={w} onClick={() => toggleMoodWord(w)} style={{
                        padding: '9px 16px', borderRadius: 999, fontFamily: 'inherit',
                        fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
                        background: moodWords.includes(w) ? '#012374' : '#FFFDF9',
                        color: moodWords.includes(w) ? '#FFFDF9' : '#012374',
                        border: moodWords.includes(w) ? 'none' : '1px solid rgba(1,35,116,0.2)',
                        transition: 'all 0.15s',
                      }}>{w}</button>
                    ))}
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 12 }}>
                      What&apos;s influencing this?
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                      {FACTOR_CHIPS.map(f => (
                        <button key={f} onClick={() => toggleFactor(f)} style={{
                          padding: '9px 16px', borderRadius: 999, fontFamily: 'inherit',
                          fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
                          background: factors.includes(f) ? 'rgba(1,35,116,0.12)' : '#FFFDF9',
                          color: '#012374',
                          border: factors.includes(f) ? '1px solid rgba(1,35,116,0.3)' : '1px solid rgba(1,35,116,0.15)',
                          transition: 'all 0.15s',
                        }}>{f}</button>
                      ))}
                    </div>
                  </div>

                  {/* Stress */}
                  <div style={{ marginTop: 22, background: '#FFFDF9', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(1,35,116,0.07)' }}>
                    <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 10 }}>Stress today is</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['Easy', 'Mild', 'Some', 'Heavy', 'A lot'].map(level => (
                        <button key={level} onClick={() => setMoodStress(moodStress === level ? null : level)} style={{
                          flex: 1, padding: '9px 0', borderRadius: 10, fontFamily: 'inherit',
                          fontSize: 13, fontWeight: moodStress === level ? 600 : 400, cursor: 'pointer',
                          background: moodStress === level ? '#012374' : 'transparent',
                          color: moodStress === level ? '#FFFDF9' : '#012374',
                          border: moodStress === level ? '1px solid #012374' : '1px solid rgba(1,35,116,0.18)',
                          transition: 'all 0.15s',
                        }}>{level}</button>
                      ))}
                    </div>
                  </div>

                  {/* Add more detail toggle */}
                  <button
                    onClick={() => setMoodExpanded(!moodExpanded)}
                    style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#012374', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                  >
                    <span style={{ fontSize: 17, lineHeight: 1 }}>{moodExpanded ? '−' : '+'}</span>
                    {moodExpanded ? 'Less detail' : 'Add more detail'}
                    {(moodCravings.length + moodBodySymptoms.length + moodContextTags.length + (moodEnergyLevel ? 1 : 0) + (moodUserWords ? 1 : 0)) > 0 && (
                      <span style={{ fontSize: 11, background: '#012374', color: '#FFFDF9', borderRadius: 99, padding: '1px 7px' }}>
                        {moodCravings.length + moodBodySymptoms.length + moodContextTags.length + (moodEnergyLevel ? 1 : 0) + (moodUserWords ? 1 : 0)}
                      </span>
                    )}
                  </button>

                  {moodExpanded && (
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 18 }}>

                      {/* Scales */}
                      <div style={{ background: '#FFFDF9', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(1,35,116,0.07)' }}>
                        {[
                          { label: 'Energy level', val: moodEnergyLevel, set: setMoodEnergyLevel },
                          { label: 'Hunger level', val: moodHungerLevel, set: setMoodHungerLevel },
                          { label: 'Fullness', val: moodFullness, set: setMoodFullness },
                        ].map(({ label, val, set }) => (
                          <div key={label} style={{ marginBottom: 14 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#012374', marginBottom: 8 }}>{label}</p>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                <button key={n} onClick={() => set(val === n ? null : n)} style={{
                                  flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12,
                                  fontWeight: val === n ? 700 : 400,
                                  background: val === n ? '#012374' : 'transparent',
                                  color: val === n ? '#FFFDF9' : '#012374',
                                  border: val === n ? '1px solid #012374' : '1px solid rgba(1,35,116,0.15)',
                                  cursor: 'pointer', fontFamily: 'inherit',
                                }}>{n}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Cravings */}
                      <div>
                        <p style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 10 }}>Any cravings?</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {['None', 'Sweet', 'Salty', 'Crunchy', 'Carbs', 'Late-night', 'Not sure'].map(c => (
                            <button key={c} onClick={() => setMoodCravings(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])} style={{
                              padding: '8px 15px', borderRadius: 999, fontFamily: 'inherit', fontSize: 13,
                              fontWeight: moodCravings.includes(c) ? 600 : 400, cursor: 'pointer',
                              background: moodCravings.includes(c) ? '#012374' : '#FFFDF9',
                              color: moodCravings.includes(c) ? '#FFFDF9' : '#012374',
                              border: moodCravings.includes(c) ? 'none' : '1px solid rgba(1,35,116,0.2)',
                            }}>{c}</button>
                          ))}
                        </div>
                      </div>

                      {/* Body symptoms */}
                      <div>
                        <p style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 10 }}>Body symptoms?</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {['Headache', 'Thirsty', 'Dry mouth', 'Nausea', 'Reflux', 'Constipation', 'Shaky', 'Tired', 'Dizzy', 'Bloated'].map(s => (
                            <button key={s} onClick={() => setMoodBodySymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} style={{
                              padding: '8px 15px', borderRadius: 999, fontFamily: 'inherit', fontSize: 13,
                              fontWeight: moodBodySymptoms.includes(s) ? 600 : 400, cursor: 'pointer',
                              background: moodBodySymptoms.includes(s) ? '#E3171A' : '#FFFDF9',
                              color: moodBodySymptoms.includes(s) ? '#FFFDF9' : '#012374',
                              border: moodBodySymptoms.includes(s) ? 'none' : '1px solid rgba(1,35,116,0.2)',
                            }}>{s}</button>
                          ))}
                        </div>
                      </div>

                      {/* Context tags */}
                      <div>
                        <p style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 10 }}>What else is going on?</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {['Poor sleep', 'High stress', 'On period', 'Sick day', 'Skipped meal', 'Ate less than usual', 'Ate more than usual', 'Medication change', 'After exercise', 'No movement today'].map(t => (
                            <button key={t} onClick={() => setMoodContextTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} style={{
                              padding: '8px 15px', borderRadius: 999, fontFamily: 'inherit', fontSize: 13,
                              fontWeight: moodContextTags.includes(t) ? 600 : 400, cursor: 'pointer',
                              background: moodContextTags.includes(t) ? '#012374' : '#FFFDF9',
                              color: moodContextTags.includes(t) ? '#FFFDF9' : '#012374',
                              border: moodContextTags.includes(t) ? 'none' : '1px solid rgba(1,35,116,0.2)',
                            }}>{t}</button>
                          ))}
                        </div>
                      </div>

                      {/* Free text */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                          { label: "What's going on in your own words?", value: moodUserWords, onChange: setMoodUserWords, placeholder: 'e.g. I feel overwhelmed and ate late because I had a long day.' },
                          { label: 'What affected your glucose, food, or mood today?', value: moodFoodMood, onChange: setMoodFoodMood, placeholder: "e.g. I didn't drink much water and skipped breakfast." },
                          { label: 'What kind of support would feel helpful right now?', value: moodSupportWanted, onChange: setMoodSupportWanted, placeholder: 'e.g. Give me a quick snack idea. / I just want to log it.' },
                        ].map(({ label, value, onChange, placeholder }) => (
                          <div key={label}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#012374', marginBottom: 6 }}>{label}</p>
                            <textarea
                              value={value}
                              onChange={e => onChange(e.target.value)}
                              placeholder={placeholder}
                              rows={2}
                              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(1,35,116,0.16)', background: '#F7EFE1', fontSize: 13.5, color: '#16182A', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Checkin Step 2: Body */}
              {flowType === 'checkin' && step === 2 && (
                <div>
                  <p style={{ fontSize: 15, color: 'rgba(22,24,42,0.72)', lineHeight: 1.55, marginBottom: 14 }}>
                    How is your body feeling right now? Select all that apply.
                  </p>
                  <div style={{ background: 'rgba(1,35,116,0.06)', borderRadius: 14, padding: '13px 16px', marginBottom: 20, fontSize: 13.5, color: '#012374', lineHeight: 1.5 }}>
                    If you feel shaky, lightheaded, or sweaty — those can be signs of low blood sugar. Eating 15g of fast-acting carbs can help.
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {BODY_CHIPS.map(chip => (
                      <button key={chip} onClick={() => toggleBody(chip)} style={{
                        padding: '10px 18px', borderRadius: 999, fontFamily: 'inherit',
                        fontSize: 14, fontWeight: 500, cursor: 'pointer',
                        background: body.includes(chip) ? '#012374' : '#FFFDF9',
                        color: body.includes(chip) ? '#FFFDF9' : '#012374',
                        border: body.includes(chip) ? 'none' : '1px solid rgba(1,35,116,0.2)',
                        transition: 'all 0.15s',
                      }}>{chip}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Checkin Step 3: Timing */}
              {flowType === 'checkin' && step === 3 && (
                <div>
                  <p style={{ fontSize: 15, color: 'rgba(22,24,42,0.72)', lineHeight: 1.55, marginBottom: 20 }}>
                    Knowing when you took this reading helps Chatita understand patterns around your meals.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {MEAL_CHIPS.map(chip => (
                      <button key={chip} onClick={() => setMeal(chip)} style={{
                        padding: '10px 18px', borderRadius: 999, fontFamily: 'inherit',
                        fontSize: 14, fontWeight: 500, cursor: 'pointer',
                        background: meal === chip ? '#012374' : '#FFFDF9',
                        color: meal === chip ? '#FFFDF9' : '#012374',
                        border: meal === chip ? 'none' : '1px solid rgba(1,35,116,0.2)',
                        transition: 'all 0.15s',
                      }}>{chip}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Checkin Step 4: Glucose (optional) */}
              {flowType === 'checkin' && step === 4 && (
                <div>
                  <div style={{ background: '#FFFDF9', borderRadius: 18, padding: '24px 28px', textAlign: 'center', border: '1px solid rgba(1,35,116,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10 }}>
                      <span
                        className="font-serif-italic"
                        style={{ fontSize: 88, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 0.9 }}
                      >
                        {glucose || '—'}
                      </span>
                      {glucose && <span style={{ fontSize: 18, color: 'rgba(22,24,42,0.6)', paddingBottom: 14 }}>mg/dL</span>}
                    </div>
                    {glucose && (() => {
                      const v = parseInt(glucose);
                      const s = getStatus(v);
                      return s ? (
                        <div style={{ marginTop: 12, display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: s.bg, color: s.color, fontSize: 13, fontWeight: 600 }}>
                          {s.label}
                        </div>
                      ) : null;
                    })()}
                  </div>

                  <div
                    onClick={handleListen}
                    style={{
                      marginTop: 16, background: '#FFFDF9', borderRadius: 18, padding: '18px 22px',
                      display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer',
                      border: '1px solid rgba(1,35,116,0.08)',
                    }}
                  >
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%', background: listening ? '#E3171A' : '#012374',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      transition: 'background 0.2s',
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" fill="#FFFDF9"/>
                        <path d="M6 12a6 6 0 0 0 12 0M12 18v4M9 22h6" stroke="#FFFDF9" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#012374' }}>
                        {listening ? 'Listening…' : 'Say your number'}
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(22,24,42,0.6)', marginTop: 3 }}>
                        Tap the mic and read your glucose out loud
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
                    {NUMPAD.map((key, i) => (
                      <button
                        key={i}
                        onClick={() => key && handleNumpad(key)}
                        style={{
                          background: key ? '#FFFDF9' : 'transparent',
                          border: key ? '1px solid rgba(1,35,116,0.12)' : 'none',
                          borderRadius: 14, padding: '18px 0', textAlign: 'center',
                          fontSize: key === 'del' ? 18 : 26, color: '#012374',
                          cursor: key ? 'pointer' : 'default', fontFamily: 'inherit',
                        }}
                      >
                        {key === 'del' ? '⌫' : key}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── READING FLOW ── */}

              {/* Reading Step 1: Glucose numpad */}
              {flowType === 'reading' && step === 1 && (
                <div>
                  <div style={{ background: '#FFFDF9', borderRadius: 18, padding: '24px 28px', textAlign: 'center', border: '1px solid rgba(1,35,116,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10 }}>
                      <span className="font-serif-italic" style={{ fontSize: 88, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 0.9 }}>
                        {glucose || '—'}
                      </span>
                      {glucose && <span style={{ fontSize: 18, color: 'rgba(22,24,42,0.6)', paddingBottom: 14 }}>mg/dL</span>}
                    </div>
                    {glucose && (() => { const v = parseInt(glucose); const s = getStatus(v); return s ? <div style={{ marginTop: 12, display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: s.bg, color: s.color, fontSize: 13, fontWeight: 600 }}>{s.label}</div> : null; })()}
                  </div>
                  <div onClick={handleListen} style={{ marginTop: 16, background: '#FFFDF9', borderRadius: 18, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer', border: '1px solid rgba(1,35,116,0.08)' }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: listening ? '#E3171A' : '#012374', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" fill="#FFFDF9"/>
                        <path d="M6 12a6 6 0 0 0 12 0M12 18v4M9 22h6" stroke="#FFFDF9" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#012374' }}>{listening ? 'Listening…' : 'Say your number'}</div>
                      <div style={{ fontSize: 13, color: 'rgba(22,24,42,0.6)', marginTop: 3 }}>Tap the mic and read your glucose out loud</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
                    {NUMPAD.map((key, i) => (
                      <button key={i} onClick={() => key && handleNumpad(key)} style={{ background: key ? '#FFFDF9' : 'transparent', border: key ? '1px solid rgba(1,35,116,0.12)' : 'none', borderRadius: 14, padding: '18px 0', textAlign: 'center', fontSize: key === 'del' ? 18 : 26, color: '#012374', cursor: key ? 'pointer' : 'default', fontFamily: 'inherit' }}>
                        {key === 'del' ? '⌫' : key}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reading Step 2: Timing */}
              {flowType === 'reading' && step === 2 && (
                <div>
                  <p style={{ fontSize: 15, color: 'rgba(22,24,42,0.72)', lineHeight: 1.55, marginBottom: 20 }}>
                    Knowing when you took this reading helps Chatita understand patterns around your meals.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {MEAL_CHIPS.map(chip => (
                      <button key={chip} onClick={() => setMeal(chip)} style={{ padding: '10px 18px', borderRadius: 999, fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: meal === chip ? '#012374' : '#FFFDF9', color: meal === chip ? '#FFFDF9' : '#012374', border: meal === chip ? 'none' : '1px solid rgba(1,35,116,0.2)', transition: 'all 0.15s' }}>{chip}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reading Step 3: Done — with mood check-in offer */}
              {flowType === 'reading' && step === 3 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(200,147,43,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#C8932B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 className="font-serif-italic" style={{ fontSize: 30, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', marginBottom: 12 }}>
                    Reading saved.
                  </h2>
                  <p style={{ fontSize: 15, color: 'rgba(22,24,42,0.65)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 24px' }}>
                    {glucose && <>{glucose} mg/dL {meal ? `· ${meal}` : ''} — logged with care.<br/></>}
                    Numbers tell part of the story. Want to add how you&apos;re feeling?
                  </p>

                  {!offerMood ? (
                    <button
                      onClick={() => setOfferMood(true)}
                      style={{ padding: '13px 28px', borderRadius: 999, background: '#012374', color: '#FFFDF9', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 22px -8px rgba(1,35,116,0.5)' }}
                    >
                      Also log how I feel →
                    </button>
                  ) : (
                    <div style={{ textAlign: 'left', marginTop: 8 }}>
                      {/* Mood mini-form */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                        <div style={{ width: 110, height: 110, borderRadius: '50%', background: `radial-gradient(circle at 38% 38%, ${bucket.glow}, ${bucket.color})`, boxShadow: `0 16px 40px -12px ${bucket.color}99`, transition: 'all 0.3s ease' }} />
                        <div style={{ textAlign: 'center' }}>
                          <div className="font-serif-italic" style={{ fontSize: 18, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic' }}>{bucket.label}</div>
                          <div style={{ fontSize: 13, color: 'rgba(22,24,42,0.5)', marginTop: 2 }}>{bucket.es}</div>
                        </div>
                      </div>
                      <input type="range" min={0} max={1} step={0.01} value={moodVal}
                        onChange={e => { setMoodVal(parseFloat(e.target.value)); setMoodWords([]); }}
                        style={{ width: '100%', accentColor: '#012374', cursor: 'pointer', marginBottom: 6 }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(22,24,42,0.5)', marginBottom: 16 }}>
                        <span>Very unpleasant</span><span>Neutral</span><span>Very pleasant</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                        {bucket.words.slice(0, 6).map(w => (
                          <button key={w} onClick={() => toggleMoodWord(w)} style={{ padding: '8px 14px', borderRadius: 999, fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: moodWords.includes(w) ? '#012374' : '#FFFDF9', color: moodWords.includes(w) ? '#FFFDF9' : '#012374', border: moodWords.includes(w) ? 'none' : '1px solid rgba(1,35,116,0.2)', transition: 'all 0.15s' }}>{w}</button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          const moodMap: Record<string, Mood> = { 'Very unpleasant': 'sad', 'Unpleasant': 'anxious', 'Neutral': 'neutral', 'Pleasant': 'calm', 'Very pleasant': 'happy' };
                          const mood: Mood = moodMap[bucket.label] ?? 'neutral';
                          onMoodSave?.({ mood, stressLevel: 5, contextTags: moodWords.length ? moodWords : undefined });
                          setOfferMood(false);
                        }}
                        style={{ width: '100%', padding: '13px', borderRadius: 999, background: '#C8932B', color: '#FFFDF9', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 22px -8px rgba(200,147,43,0.6)' }}
                      >
                        Save mood check-in
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Check-in flow Done (step 5) */}
              {flowType === 'checkin' && step === 5 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(200,147,43,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#C8932B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 className="font-serif-italic" style={{ fontSize: 30, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', marginBottom: 12 }}>
                    Saved with care.
                  </h2>
                  <p style={{ fontSize: 15, color: 'rgba(22,24,42,0.65)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 28px' }}>
                    Thank you for checking in. Your mood, how your body feels, and your reading are all logged — no judgment, just care.
                  </p>
                  <div style={{ background: '#FFFDF9', borderRadius: 18, padding: '20px 24px', textAlign: 'left', border: '1px solid rgba(1,35,116,0.08)' }}>
                    <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 14 }}>Your check-in summary</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {moodWords.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#16182A' }}>
                          <span style={{ opacity: 0.6 }}>State of mind</span>
                          <span style={{ fontWeight: 500 }}>{bucket.label} · {moodWords.join(', ')}</span>
                        </div>
                      )}
                      {body.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#16182A' }}>
                          <span style={{ opacity: 0.6 }}>Body</span>
                          <span style={{ fontWeight: 500 }}>{body.join(', ')}</span>
                        </div>
                      )}
                      {meal && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#16182A' }}>
                          <span style={{ opacity: 0.6 }}>Timing</span>
                          <span style={{ fontWeight: 500 }}>{meal}</span>
                        </div>
                      )}
                      {glucose && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#16182A' }}>
                          <span style={{ opacity: 0.6 }}>Glucose</span>
                          <span style={{ fontWeight: 600, color: '#012374' }}>{glucose} mg/dL</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ padding: '18px 32px', background: '#FFFDF9', borderTop: '1px solid rgba(1,35,116,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* CHECK-IN FLOW footer */}
              {flowType === 'checkin' && step < 5 && (
                <>
                  <button
                    onClick={() => step === 1 ? setShowAddReading(false) : setStep(s => s - 1)}
                    style={{ background: 'none', border: 'none', color: 'rgba(22,24,42,0.55)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {step === 1 ? 'Cancel' : '← Back'}
                  </button>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {step === 4 && (
                      <button
                        onClick={handleSaveReading}
                        style={{ background: 'none', border: 'none', color: 'rgba(22,24,42,0.55)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Skip reading
                      </button>
                    )}
                    <button
                      onClick={() => step === 4 ? handleSaveReading() : setStep(s => s + 1)}
                      style={{
                        background: step === 4 ? '#C8932B' : '#012374',
                        color: '#FFFDF9', border: 'none', padding: '12px 28px', borderRadius: 999,
                        fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        boxShadow: step === 4 ? '0 8px 22px -8px rgba(200,147,43,0.6)' : '0 8px 22px -8px rgba(1,35,116,0.5)',
                      }}
                    >
                      {step === 4 ? 'Save reading' : 'Continue →'}
                    </button>
                  </div>
                </>
              )}
              {flowType === 'checkin' && step === 5 && (
                <>
                  <button
                    onClick={() => { setFlowType('checkin'); setStep(1); setGlucose(''); setMeal(''); setBody([]); setMoodVal(0.5); setMoodWords([]); setFactors([]); }}
                    style={{ background: 'none', border: 'none', color: 'rgba(22,24,42,0.55)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    New check-in
                  </button>
                  <button onClick={() => setShowAddReading(false)} style={{ background: '#012374', color: '#FFFDF9', border: 'none', padding: '12px 28px', borderRadius: 999, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Done
                  </button>
                </>
              )}
              {/* READING FLOW footer */}
              {flowType === 'reading' && step < 3 && (
                <>
                  <button
                    onClick={() => step === 1 ? setShowAddReading(false) : setStep(s => s - 1)}
                    style={{ background: 'none', border: 'none', color: 'rgba(22,24,42,0.55)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {step === 1 ? 'Cancel' : '← Back'}
                  </button>
                  <button
                    onClick={() => step === 2 ? handleSaveReading() : setStep(s => s + 1)}
                    style={{ background: step === 2 ? '#C8932B' : '#012374', color: '#FFFDF9', border: 'none', padding: '12px 28px', borderRadius: 999, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: step === 2 ? '0 8px 22px -8px rgba(200,147,43,0.6)' : '0 8px 22px -8px rgba(1,35,116,0.5)' }}
                  >
                    {step === 2 ? 'Save reading' : 'Continue →'}
                  </button>
                </>
              )}
              {flowType === 'reading' && step === 3 && (
                <>
                  <button
                    onClick={() => { setFlowType('reading'); setStep(1); setGlucose(''); setMeal(''); setMoodVal(0.5); setMoodWords([]); setOfferMood(false); }}
                    style={{ background: 'none', border: 'none', color: 'rgba(22,24,42,0.55)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Add another
                  </button>
                  <button onClick={() => setShowAddReading(false)} style={{ background: '#012374', color: '#FFFDF9', border: 'none', padding: '12px 28px', borderRadius: 999, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
