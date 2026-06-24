'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import GlucoseWidget from '@/components/glucose-widget';
import MealFollowUpBanner from '@/components/meal-followup-banner';
import MoodSelector from '@/components/mood-selector';
import ContextTags from '@/components/context-tags';
import BottomNav from '@/components/bottom-nav';
import ChatInterface from '@/components/chat-interface';
import ThemeToggle from '@/components/theme-toggle';
import WebHomeLayout from '@/components/web-home-layout';
import { Mood, UserContext } from '@/types';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme-context';

// Feature cards matching the exact HTML design
const FEATURE_CARDS = [
  {
    href: '/restaurant-finder',
    title: 'Find restaurants',
    subtitle: 'Nearby, kind options',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" stroke="#012374" strokeWidth="1.6" />
        <circle cx="12" cy="10" r="2.5" stroke="#012374" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: '/menu-scanner',
    title: 'Scan a menu',
    subtitle: 'Photo → ranked dishes',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="#012374" strokeWidth="1.6" />
        <circle cx="12" cy="12.5" r="3.5" stroke="#012374" strokeWidth="1.6" />
        <path d="M8 6l1.5-2h5L16 6" stroke="#012374" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: '/meal-history',
    title: 'Meal history',
    subtitle: 'Patterns, not scores',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#012374" strokeWidth="1.6" />
        <path d="M12 7v5l3.5 2" stroke="#012374" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/recipes',
    title: 'Recipes',
    subtitle: 'From your pantry',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 12a8 8 0 0 1 16 0v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1z" stroke="#012374" strokeWidth="1.6" />
        <path d="M3 19h18" stroke="#012374" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/insights',
    title: 'Insights',
    subtitle: 'Trends over time',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 19V5m0 14h16M4 15l4-4 3 3 5-6 4 5" stroke="#012374" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/meal-plan',
    title: 'Meal plan',
    subtitle: 'Plan your week',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2.5" stroke="#012374" strokeWidth="1.6" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke="#012374" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/mood-log',
    title: 'Mood log',
    subtitle: 'Your mood history',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#012374" strokeWidth="1.6" />
        <path d="M8.5 14s1 1.5 3.5 1.5 3.5-1.5 3.5-1.5M9 9.5h.01M15 9.5h.01" stroke="#012374" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
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

  const handleGlucoseUpdate = async (value: number, context?: string, relatedMealId?: string, notes?: string) => {
    try {
      const res = await fetch('/api/glucose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, context, relatedMealId, notes }),
      });
      if (res.ok) setCurrentGlucose(value);
    } catch (err) { console.error(err); }
  };

  const handleMoodSave = async (mood: Mood, stressLevel: number, notes?: string) => {
    setUserContext(prev => ({ ...prev, mood }));
    try {
      await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, stressLevel, notes }),
      });
    } catch (err) { console.error(err); }
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
    <div className="lg:hidden min-h-screen pb-24" style={{ background: '#F7EFE1' }}>

      {/* ── Navy hero band ── */}
      <div
        style={{
          background: '#012374',
          padding: '0 24px 72px',
          position: 'relative',
        }}
      >
        {/* Header row */}
        <div
          className="flex items-center justify-between"
          style={{ paddingTop: '16px', paddingBottom: '0' }}
        >
          <Image
            src="/logo-horizontal.svg"
            alt="Chatita"
            width={110}
            height={28}
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div className="flex items-center gap-2">
            <ThemeToggle onDark />
            <div
              className="flex items-center justify-center"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(255,253,249,0.12)',
              }}
            >
              <span className="font-serif-italic" style={{ color: '#FFFDF9', fontSize: '15px' }}>
                {firstName[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Date + greeting */}
        <div style={{ marginTop: '20px' }}>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#C8932B',
              fontWeight: 700,
            }}
          >
            {getDayLabel()}
          </div>
          <h1
            className="font-serif-italic"
            style={{ fontSize: '32px', lineHeight: '1.05', color: '#FFFDF9', marginTop: '4px' }}
          >
            Hola, {firstName}.
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,253,249,0.85)', marginTop: '4px' }}>
            {t.home.subtitle}
          </p>
        </div>
      </div>

      {/* ── Content overlapping the hero ── */}
      <div
        className="max-w-2xl mx-auto"
        style={{ marginTop: '-60px', padding: '0 20px' }}
      >
        {/* Glucose card — overlapping the navy */}
        <GlucoseWidget
          currentValue={currentGlucose}
          minRange={userData?.targetGlucoseMin || 70}
          maxRange={userData?.targetGlucoseMax || 180}
          onUpdate={handleGlucoseUpdate}
        />

        {/* Meal follow-up */}
        <div style={{ marginTop: '10px' }}>
          <MealFollowUpBanner />
        </div>

        {/* ── Feature grid ── */}
        <div
          className="grid grid-cols-2 gap-[10px]"
          style={{ marginTop: '20px' }}
        >
          {FEATURE_CARDS.map(({ href, title, subtitle, icon }) => (
            <Link
              key={href}
              href={href}
              className="block transition-all active:scale-[0.97]"
              style={{
                background: '#FFFDF9',
                borderRadius: '18px',
                padding: '14px 14px 16px',
                border: '1px solid rgba(1,35,116,0.06)',
              }}
            >
              {icon}
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#012374',
                  marginTop: '10px',
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: '11.5px',
                  color: '#16182A',
                  opacity: 0.65,
                  marginTop: '2px',
                }}
              >
                {subtitle}
              </div>
            </Link>
          ))}
        </div>

        {/* ── Mood section (inline, no card wrapper) ── */}
        <div style={{ marginTop: '28px' }}>
          <MoodSelector onSave={handleMoodSave} />
        </div>

        {/* ── Context tags ── */}
        <div style={{ marginTop: '24px' }}>
          <ContextTags onSave={handleContextSave} />
        </div>

        {/* ── Disclaimer ── */}
        <div
          style={{
            marginTop: '24px',
            marginBottom: '8px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(200,147,43,0.12)',
            borderLeft: '3px solid #C8932B',
          }}
        >
          <p style={{ fontSize: '11px', color: 'rgba(1,35,116,0.65)', lineHeight: 1.5 }}>
            ⚠️ {t.home.disclaimer}
          </p>
        </div>
      </div>

      {/* ── Floating chat button ── */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-24 right-5 flex items-center justify-center transition-all active:scale-95 hover:scale-105 z-20"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: '#012374',
            boxShadow: '0 6px 16px -4px rgba(1,35,116,0.5)',
          }}
        >
          <MessageCircle className="w-5 h-5" style={{ color: '#FFFDF9' }} />
        </button>
      )}

      {/* ── Chat Interface ── */}
      {showChat && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center"
          style={{ background: 'rgba(0,26,77,0.38)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-2xl h-[82vh] md:h-[600px] flex flex-col overflow-hidden"
            style={{
              background: '#FFFDF9',
              borderRadius: '26px 26px 0 0',
              boxShadow: '0 40px 90px -30px rgba(0,26,77,0.6)',
            }}
          >
            <ChatInterface userContext={userContext} onClose={() => setShowChat(false)} />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
    </>
  );
}
