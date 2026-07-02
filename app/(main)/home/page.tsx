'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import GlucoseWidget from '@/components/glucose-widget';
import MealFollowUpBanner from '@/components/meal-followup-banner';
import MoodSelector from '@/components/mood-selector';
import BottomNav from '@/components/bottom-nav';
import ChatInterface from '@/components/chat-interface';
import ThemeToggle from '@/components/theme-toggle';
import WebHomeLayout from '@/components/web-home-layout';
import MovementCard from '@/components/movement-card';
import SleepCard from '@/components/sleep-card';
import CycleCard from '@/components/cycle-card';
import HealthTodayCard from '@/components/health-today-card';
import { Mood, UserContext, MoodCheckInData } from '@/types';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme-context';

// Quick actions grid — Log meal · Movement · Mood · Meal history · Insights · Restaurants · Recipes · Meal plan
const QUICK_ACTIONS = [
  {
    href: '/add-meal',
    label: 'Log meal',
    bg: 'rgba(1,35,116,0.08)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0 1 16 0v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1z" stroke="#012374" strokeWidth="1.6"/><path d="M3 19h18" stroke="#012374" strokeWidth="1.6" strokeLinecap="round"/><path d="M12 4v4" stroke="#012374" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
  {
    href: null,  // opens modal
    label: 'Movement',
    bg: 'rgba(42,138,138,0.1)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="14.5" cy="5" r="1.8" stroke="#2A8A8A" strokeWidth="1.6"/><path d="M14 7l-2 6M14.5 8l3-3M13.5 9l-3 1M12 13l-3 6M12 13l3 4" stroke="#2A8A8A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    href: null,  // opens mood modal
    label: 'Mood',
    bg: 'rgba(200,147,43,0.1)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#C8932B" strokeWidth="1.6"/><path d="M8.5 14c1 1.3 5 1.3 6 0M9 9.5v.5M15 9.5v.5" stroke="#C8932B" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
  {
    href: '/meal-history',
    label: 'Meal history',
    bg: 'rgba(1,35,116,0.08)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#012374" strokeWidth="1.6"/><path d="M12 7v5l3.5 2" stroke="#012374" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
  {
    href: '/insights',
    label: 'Insights',
    bg: 'rgba(1,35,116,0.08)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 19V5m0 14h16M4 15l4-4 3 3 5-6 4 5" stroke="#012374" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    href: '/restaurant-finder',
    label: 'Restaurants',
    bg: 'rgba(1,35,116,0.08)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" stroke="#012374" strokeWidth="1.6"/><circle cx="12" cy="10" r="2.5" stroke="#012374" strokeWidth="1.6"/></svg>,
  },
  {
    href: '/grocery-list',
    label: 'Grocery list',
    bg: 'rgba(1,35,116,0.08)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 7h14l-1.2 10a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7z" stroke="#012374" strokeWidth="1.6"/><path d="M9 7a3 3 0 0 1 6 0" stroke="#012374" strokeWidth="1.6"/></svg>,
  },
  {
    href: '/recipes',
    label: 'Recipes',
    bg: 'rgba(1,35,116,0.08)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0 1 16 0v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1z" stroke="#012374" strokeWidth="1.6"/><path d="M3 19h18" stroke="#012374" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
  {
    href: '/meal-plan',
    label: 'Meal plan',
    bg: 'rgba(1,35,116,0.08)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2.5" stroke="#012374" strokeWidth="1.6"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#012374" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
];

function getDayLabel() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[now.getDay()]} · ${now.getDate()} ${months[now.getMonth()]}`;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [userData, setUserData] = useState<any>(null);
  const [currentGlucose, setCurrentGlucose] = useState<number | undefined>(undefined);
  const [showChat, setShowChat] = useState(false);
  const [userContext, setUserContext] = useState<UserContext>({});
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [waterOz, setWaterOz] = useState(0);
  const [gentleInsight, setGentleInsight] = useState<{ message: string; reason?: string } | null>(null);
  const [cgmReading, setCgmReading] = useState<{ value: number; measuredAt: string; trend: string | null; provider: string } | null>(null);
  // Widget-seeding bookkeeping: a manual entry always wins; otherwise the
  // newest of the (racing) /api/glucose and CGM-status reads wins.
  const glucoseSeedTimeRef = useRef(0);
  const manualGlucoseRef = useRef(false);

  const seedGlucose = (value: number, measuredAt: string) => {
    const t = new Date(measuredAt).getTime();
    const isToday = new Date(measuredAt).toDateString() === new Date().toDateString();
    if (manualGlucoseRef.current || !isToday || t <= glucoseSeedTimeRef.current) return;
    glucoseSeedTimeRef.current = t;
    setCurrentGlucose(value);
  };

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch('/api/user/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setUserData(data.user))
      .catch(console.error);
  }, [session]);

  // Seed the glucose widget with today's latest stored reading (manual or CGM)
  // so mobile matches the desktop hero instead of showing "no data yet" until a
  // manual entry. A manual entry this session still overrides via onUpdate.
  useEffect(() => {
    if (!session) return;
    fetch('/api/glucose?limit=1')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const latest = d?.entries?.[0];
        if (latest) seedGlucose(latest.value, latest.measuredAt);
      })
      .catch(() => {});
  }, [session]);

  // Load today's water total from API
  useEffect(() => {
    if (!session) return;
    fetch('/api/hydration')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.totalOz != null) setWaterOz(Math.round(d.totalOz)); })
      .catch(() => {});
  }, [session]);

  // Load CGM latest reading if connected. For Libre, pull fresh data on load so
  // today's glucose is current (the cron only runs once a day), then refetch.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    const applyStatus = (d: any) => {
      if (cancelled) return;
      if (d?.connected && d.latestReading) {
        setCgmReading({ ...d.latestReading, provider: d.provider });
        // Keep the glucose widget in sync with the freshest CGM reading.
        seedGlucose(d.latestReading.value, d.latestReading.measuredAt);
      }
    };

    fetch('/api/cgm/status')
      .then(r => r.ok ? r.json() : null)
      .then(async d => {
        applyStatus(d);
        // If a CGM is connected, refresh it then re-read status so today's
        // glucose is current (the cron only runs once a day).
        const syncPath = d?.connected
          ? d.provider === 'libre' ? '/api/libre/sync'
          : d.provider === 'dexcom' ? '/api/dexcom/sync'
          : null
          : null;
        if (syncPath) {
          try {
            await fetch(syncPath, { method: 'POST' });
            const r2 = await fetch('/api/cgm/status');
            if (r2.ok) applyStatus(await r2.json());
          } catch { /* keep the cached reading */ }
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [session]);

  // Load a gentle insight from API
  useEffect(() => {
    if (!session) return;
    fetch('/api/insights')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const first = d?.insights?.[0];
        if (first?.message) setGentleInsight({ message: first.message, reason: first.reason });
      })
      .catch(() => {});
  }, [session]);

  const handleGlucoseUpdate = async (value: number, context?: string, relatedMealId?: string, notes?: string) => {
    try {
      const res = await fetch('/api/glucose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, context, relatedMealId, notes }),
      });
      if (res.ok) {
        manualGlucoseRef.current = true;
        setCurrentGlucose(value);
      }
    } catch (err) { console.error(err); }
  };

  const handleMoodSave = async (data: MoodCheckInData) => {
    setUserContext(prev => ({ ...prev, mood: data.mood }));
    try {
      await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) { console.error(err); }
  };

  const logWater = async (oz: number) => {
    setWaterOz(w => Math.min(128, w + oz)); // optimistic
    try {
      await fetch('/api/hydration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drinkType: 'water', amountOz: oz }),
      });
    } catch { /* keep optimistic update */ }
  };

  const handleContextSave = async (context: UserContext) => {
    setUserContext(context);
    try {
      await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...context, mood: 'neutral', stressLevel: 5 }),
      });
    } catch (err) { console.error(err); }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7EFE1' }}>
        <div style={{ color: 'rgba(1,35,116,0.4)', fontSize: '13px' }}>Loading…</div>
      </div>
    );
  }
  if (!session) return null;

  const firstName = (userData?.name || session.user?.name || 'there').split(' ')[0];
  const isDark = theme === 'dark';

  return (
    <>
    {/* ── Desktop layout (lg+) ── */}
    <div className="hidden lg:block">
      <WebHomeLayout
        firstName={firstName}
        currentGlucose={currentGlucose}
        userData={userData}
        userContext={userContext}
        onGlucoseUpdate={handleGlucoseUpdate}
        onMoodSave={handleMoodSave}
        onContextSave={handleContextSave}
      />
    </div>

    {/* ── Mobile layout (< lg) ── */}
    <div className="lg:hidden min-h-screen mobile-page-pb" style={{ background: '#F7EFE1' }}>

      {/* ── Simple header ── */}
      <div style={{ padding: 'max(16px, env(safe-area-inset-top, 0px)) 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>{getDayLabel()}</div>
            <h1 className="font-serif-italic" style={{ fontSize: '30px', lineHeight: 1, color: '#012374', marginTop: '5px' }}>
              Hola, {firstName}.
            </h1>
            <p style={{ fontSize: '13.5px', color: 'rgba(22,24,42,0.7)', marginTop: '5px' }}>
              {t.home.subtitle}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <ThemeToggle />
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#012374', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="font-serif-italic" style={{ fontSize: '19px', color: '#FFFDF9' }}>{firstName[0]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto" style={{ padding: '14px 20px 0' }}>

        {/* Glucose widget */}
        <GlucoseWidget
          currentValue={currentGlucose}
          minRange={userData?.targetGlucoseMin || 70}
          maxRange={userData?.targetGlucoseMax || 180}
          onUpdate={handleGlucoseUpdate}
        />

        {/* ── CGM reading pill ── */}
        {cgmReading && <CgmPill reading={cgmReading} />}

        {/* Meal follow-up */}
        <div style={{ marginTop: '10px' }}>
          <MealFollowUpBanner />
        </div>

        {/* ── Log a meal CTA ── */}
        <Link href="/add-meal" style={{ textDecoration: 'none', display: 'block', marginTop: '11px' }}>
          <div style={{ background: '#012374', color: '#FFFDF9', borderRadius: '18px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'rgba(255,253,249,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="#FFFDF9" strokeWidth="1.7"/>
                <circle cx="12" cy="12.5" r="3.4" stroke="#FFFDF9" strokeWidth="1.7"/>
                <path d="M8 6l1.4-2h5.2L16 6" stroke="#FFFDF9" strokeWidth="1.7"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Log a meal</div>
              <div style={{ fontSize: '12.5px', opacity: 0.82, marginTop: '1px' }}>Snap your plate — Chatita reads it.</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </Link>

        {/* ── Movement today ── */}
        <div style={{ marginTop: '11px' }}>
          <MovementCard />
        </div>

        {/* ── Sleep ── */}
        <div style={{ marginTop: '11px' }}>
          <SleepCard />
        </div>

        {/* ── Cycle card — only if user opted in ── */}
        {userData?.tracksMenstrualCycle && (
          <div style={{ marginTop: '11px' }}>
            <CycleCard />
          </div>
        )}

        {/* ── Mood + Hydration row ── */}
        <div style={{ marginTop: '11px', display: 'flex', gap: '11px' }}>
          {/* Mood mini card */}
          <button
            type="button"
            onClick={() => setShowMoodModal(true)}
            style={{ flex: 1, background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.08)', padding: '16px', textAlign: 'left', cursor: 'pointer' }}
          >
            <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(200,147,43,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#C8932B" strokeWidth="1.6"/>
                <path d="M8.5 14c1 1.3 5 1.3 6 0M9 9.5v.5M15 9.5v.5" stroke="#C8932B" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#012374', marginTop: '10px' }}>Mood check-in</div>
            <div style={{ fontSize: '12px', color: 'rgba(22,24,42,0.6)', marginTop: '2px', lineHeight: 1.4 }}>How are you, really?</div>
            <div style={{ marginTop: '11px', fontSize: '12.5px', fontWeight: 600, color: '#9A6F18' }}>Tap to check in →</div>
          </button>

          {/* Hydration card */}
          <div style={{ flex: 1, background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.08)', padding: '16px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(42,111,168,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" stroke="#2A6FA8" strokeWidth="1.7" strokeLinejoin="round"/>
              </svg>
            </span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#012374', marginTop: '10px' }}>Water</div>
            <div style={{ marginTop: '4px' }}>
              <span className="font-serif-italic" style={{ fontSize: '20px', color: '#2A6FA8' }}>{waterOz}</span>
              <span style={{ fontSize: '11px', color: 'rgba(22,24,42,0.5)' }}> / 64 oz</span>
            </div>
            <div style={{ marginTop: '8px', height: '5px', borderRadius: '99px', background: '#F7EFE1', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (waterOz / 64) * 100)}%`, background: '#2A6FA8', transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
              {[8, 12, 16].map(oz => (
                <button key={oz} type="button" onClick={() => logWater(oz)}
                  style={{ flex: 1, padding: '13px 0', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: 'rgba(42,111,168,0.1)', color: '#2A6FA8', border: 'none', cursor: 'pointer' }}>
                  +{oz}oz
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Connected health today ── */}
        <div style={{ marginTop: '11px' }}>
          <HealthTodayCard />
        </div>

        {/* ── Gentle insight ── */}
        {gentleInsight ? (
          <div style={{ marginTop: '11px', background: 'rgba(28,122,79,0.08)', border: '1px solid rgba(28,122,79,0.2)', borderRadius: '18px', padding: '17px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1C7A4F', fontWeight: 700 }}>A gentle pattern</div>
            <div className="font-serif-italic" style={{ fontSize: '16px', color: '#16182A', lineHeight: 1.3, marginTop: '6px' }}>
              {gentleInsight.message}
            </div>
            {gentleInsight.reason && (
              <div style={{ fontSize: '12.5px', color: 'rgba(22,24,42,0.65)', marginTop: '5px', lineHeight: 1.45 }}>
                {gentleInsight.reason} — Discuss with your care team.
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: '11px', background: 'rgba(28,122,79,0.08)', border: '1px solid rgba(28,122,79,0.2)', borderRadius: '18px', padding: '17px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1C7A4F', fontWeight: 700 }}>A gentle pattern</div>
            <div className="font-serif-italic" style={{ fontSize: '16px', color: '#16182A', lineHeight: 1.3, marginTop: '6px' }}>
              Keep logging — your patterns will show up here after a few days.
            </div>
            <div style={{ fontSize: '12.5px', color: 'rgba(22,24,42,0.65)', marginTop: '5px', lineHeight: 1.45 }}>
              No judgment, just gentle context. Discuss anything notable with your care team.
            </div>
          </div>
        )}

        {/* ── Quick actions ── */}
        <div style={{ marginTop: '18px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: '10px' }}>Quick actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
            {QUICK_ACTIONS.map((a) => {
              const inner = (
                <div style={{ background: '#FFFDF9', border: '1px solid rgba(1,35,116,0.08)', borderRadius: '14px', padding: '13px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '30px', height: '30px', borderRadius: '9px', background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {a.icon}
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#16182A' }}>{a.label}</span>
                </div>
              );
              if (a.href === null && a.label === 'Movement') {
                return (
                  <button key={a.label} type="button" onClick={() => setShowMovementModal(true)} style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    {inner}
                  </button>
                );
              }
              if (a.href === null && a.label === 'Mood') {
                return (
                  <button key={a.label} type="button" onClick={() => setShowMoodModal(true)} style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    {inner}
                  </button>
                );
              }
              return (
                <Link key={a.href} href={a.href!} style={{ textDecoration: 'none' }}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div style={{ marginTop: '20px', marginBottom: '8px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(200,147,43,0.10)', border: '1px solid rgba(200,147,43,0.2)' }}>
          <p style={{ fontSize: '11px', color: 'rgba(1,35,116,0.65)', lineHeight: 1.5 }}>
            {t.home.disclaimer}
          </p>
        </div>
      </div>

      {/* ── Mood modal (circle check-in) ── */}
      {showMoodModal && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,26,77,0.35)', backdropFilter: 'blur(3px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowMoodModal(false); }}
        >
          <div
            className="w-full max-w-2xl mx-auto overflow-y-auto"
            style={{ background: '#F7EFE1', borderRadius: '26px 26px 0 0', maxHeight: '90vh', padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Check in</span>
              <button type="button" onClick={() => setShowMoodModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', color: 'rgba(22,24,42,0.45)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <MoodSelector onSave={(data) => { handleMoodSave(data); setShowMoodModal(false); }} />
          </div>
        </div>
      )}

      {/* ── Movement modal ── */}
      {showMovementModal && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,26,77,0.35)', backdropFilter: 'blur(3px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowMovementModal(false); }}
        >
          <div
            className="w-full max-w-2xl mx-auto overflow-y-auto"
            style={{ background: '#F7EFE1', borderRadius: '26px 26px 0 0', maxHeight: '90vh', padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#2A8A8A', fontWeight: 700 }}>Log movement</span>
              <button type="button" onClick={() => setShowMovementModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', color: 'rgba(22,24,42,0.45)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <MovementCard defaultOpen />
          </div>
        </div>
      )}

      {/* ── Floating chat button ── */}
      {!showChat && !showMoodModal && !showMovementModal && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-24 right-5 flex items-center justify-center transition-all active:scale-95 hover:scale-105 z-20"
          style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#012374', boxShadow: '0 6px 16px -4px rgba(1,35,116,0.5)' }}
        >
          <MessageCircle className="w-5 h-5" style={{ color: '#FFFDF9' }} />
        </button>
      )}

      {/* ── Chat Interface ── */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center" style={{ background: 'rgba(0,26,77,0.38)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl h-[82vh] md:h-[600px] flex flex-col overflow-hidden" style={{ background: '#FFFDF9', borderRadius: '26px 26px 0 0', boxShadow: '0 40px 90px -30px rgba(0,26,77,0.6)' }}>
            <ChatInterface userContext={userContext} onClose={() => setShowChat(false)} />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
    </>
  );
}

// ── CGM reading pill ─────────────────────────────────────────────────────────

const TREND_ARROW: Record<string, string> = {
  rising:          '↑',
  'rising quickly': '↑↑',
  falling:         '↓',
  'falling quickly': '↓↓',
  stable:          '→',
  flat:            '→',
  none:            '',
};

function CgmPill({ reading }: {
  reading: { value: number; measuredAt: string; trend: string | null; provider: string }
}) {
  const minutesAgo = Math.round((Date.now() - new Date(reading.measuredAt).getTime()) / 60000);
  const isStale = minutesAgo > 20;
  const arrow = reading.trend ? (TREND_ARROW[reading.trend.toLowerCase()] ?? '') : '';
  const providerLabel = reading.provider === 'dexcom' ? 'Dexcom' : 'FreeStyle Libre';

  return (
    <div style={{
      marginTop: '8px',
      background: '#FFFDF9',
      border: '1px solid rgba(1,35,116,0.08)',
      borderRadius: '14px',
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      {/* CGM icon */}
      <span style={{
        width: '32px', height: '32px', borderRadius: '9px',
        background: isStale ? 'rgba(22,24,42,0.06)' : 'rgba(42,138,138,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h2m10 0h2M12 5v2m0 10v2" stroke={isStale ? 'rgba(22,24,42,0.3)' : '#2A8A8A'} strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="4" stroke={isStale ? 'rgba(22,24,42,0.3)' : '#2A8A8A'} strokeWidth="1.6"/>
        </svg>
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10.5px', color: 'rgba(22,24,42,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          {providerLabel} CGM
        </div>
        <div style={{ marginTop: '1px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: isStale ? 'rgba(22,24,42,0.4)' : '#012374', fontFamily: 'var(--font-dm-serif), serif' }}>
            {reading.value}
          </span>
          {arrow && (
            <span style={{ fontSize: '14px', color: '#2A8A8A', fontWeight: 700 }}>{arrow}</span>
          )}
          <span style={{ fontSize: '11px', color: 'rgba(22,24,42,0.4)' }}>mg/dL</span>
        </div>
      </div>

      <div style={{ fontSize: '11px', color: isStale ? '#B5562E' : 'rgba(22,24,42,0.4)', textAlign: 'right', flexShrink: 0 }}>
        {minutesAgo < 1 ? 'Just now' : `${minutesAgo} min ago`}
        {isStale && <div style={{ fontSize: '10px', color: '#B5562E' }}>Needs sync</div>}
      </div>
    </div>
  );
}
