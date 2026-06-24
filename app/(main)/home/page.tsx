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
import { Mood, UserContext } from '@/types';
import { ScanLine, History, MessageCircle, MapPin, ChefHat, Calendar, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme-context';

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
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch('/api/user/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setUserData(data.user))
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
    } catch (error) {
      console.error('Failed to update glucose:', error);
    }
  };

  const handleMoodSave = async (mood: Mood, stressLevel: number) => {
    setUserContext((prev) => ({ ...prev, mood }));
    try {
      await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, stressLevel }),
      });
    } catch (error) {
      console.error('Failed to save mood:', error);
    }
  };

  const handleContextSave = async (context: UserContext) => {
    setUserContext(context);
    try {
      await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...context, mood: 'neutral', stressLevel: 5 }),
      });
    } catch (error) {
      console.error('Failed to save context:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.common.loading}</div>
      </div>
    );
  }

  if (!session) return null;

  const userName = userData?.name || session.user?.name || 'there';
  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-page)' }}>
      {/* Hero Header */}
      <div
        className="relative"
        style={{
          background: isDark ? '#012374' : 'var(--bg-page)',
          paddingBottom: isDark ? '48px' : '0',
        }}
      >
        <div className="max-w-2xl mx-auto px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-[11px] flex items-center justify-center"
                style={{ background: isDark ? '#FFFDF9' : '#012374' }}
              >
                <Image
                  src="/logo-icon.svg"
                  alt="Chatita"
                  width={22}
                  height={22}
                  style={{ filter: isDark ? 'none' : 'brightness(0) invert(1)' }}
                />
              </div>
            </div>
            {/* Theme toggle */}
            <ThemeToggle />
          </div>

          {/* Greeting */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.16em] mb-1"
              style={{ color: isDark ? 'rgba(255,253,249,0.62)' : 'var(--text-muted)' }}
            >
              Good morning
            </p>
            <h1
              className="text-[34px] leading-[1.08] font-serif-italic"
              style={{ color: isDark ? '#FFFDF9' : 'var(--text-primary)' }}
            >
              {t.home.greeting.replace('{name}', userName)}
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: isDark ? 'rgba(255,253,249,0.7)' : 'var(--text-secondary)' }}
            >
              {t.home.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Content — negative margin overlap in dark mode */}
      <div
        className="max-w-2xl mx-auto px-5 space-y-4"
        style={{ marginTop: isDark ? '-32px' : '0', paddingTop: isDark ? '0' : '8px' }}
      >
        {/* Meal Follow-Up Check-In */}
        <MealFollowUpBanner />

        {/* Glucose Widget */}
        <GlucoseWidget
          currentValue={currentGlucose}
          minRange={userData?.targetGlucoseMin || 70}
          maxRange={userData?.targetGlucoseMax || 180}
          onUpdate={handleGlucoseUpdate}
        />

        {/* Primary Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/restaurant-finder"
            className="flex flex-col items-center justify-center gap-2 p-5 transition-all active:scale-[0.98]"
            style={{
              background: 'var(--bg-card)',
              borderRadius: '22px',
              border: '1px solid var(--border-card)',
              boxShadow: '0 12px 28px -10px rgba(1,35,116,0.22)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(1,35,116,0.08)' }}
            >
              <MapPin className="w-5 h-5" style={{ color: '#012374' }} />
            </div>
            <span className="text-sm font-semibold text-center" style={{ color: 'var(--text-primary)' }}>
              {t.home.quickActions.findRestaurants}
            </span>
          </Link>

          <Link
            href="/menu-scanner"
            className="flex flex-col items-center justify-center gap-2 p-5 transition-all active:scale-[0.98]"
            style={{
              background: 'var(--bg-card)',
              borderRadius: '22px',
              border: '1px solid var(--border-card)',
              boxShadow: '0 12px 28px -10px rgba(1,35,116,0.22)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(1,35,116,0.08)' }}
            >
              <ScanLine className="w-5 h-5" style={{ color: '#012374' }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t.home.quickActions.scanMenu}
            </span>
          </Link>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { href: '/meal-history', icon: History, label: t.home.quickActions.mealHistory },
            { href: '/recipes', icon: ChefHat, label: t.home.quickActions.recipes },
            { href: '/insights', icon: TrendingUp, label: t.nav.insights },
            { href: '/meal-plan', icon: Calendar, label: 'Meal Plan' },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1.5 py-4 transition-all active:scale-[0.96]"
              style={{
                background: 'var(--bg-card)',
                borderRadius: '18px',
                border: '1px solid var(--border-card)',
                boxShadow: '0 10px 24px -8px rgba(1,35,116,0.18)',
              }}
            >
              <Icon className="w-5 h-5" style={{ color: '#012374' }} strokeWidth={1.8} />
              <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </span>
            </Link>
          ))}
        </div>

        {/* Mood & Stress */}
        <MoodSelector onSave={handleMoodSave} />

        {/* Context Tags */}
        <ContextTags onSave={handleContextSave} />

        {/* Disclaimer */}
        <div
          className="p-4 rounded-[15px]"
          style={{
            background: 'rgba(200,147,43,0.12)',
            borderLeft: '3px solid #C8932B',
          }}
        >
          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            ⚠️ {t.home.disclaimer}
          </p>
        </div>
      </div>

      {/* Floating Chat Button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 hover:scale-105 z-20"
          style={{
            background: '#012374',
            boxShadow: '0 6px 16px -4px rgba(1,35,116,0.5)',
          }}
        >
          <MessageCircle className="w-6 h-6" style={{ color: '#FFFDF9' }} />
        </button>
      )}

      {/* Chat Interface */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center"
          style={{ background: 'rgba(0,26,77,0.38)', backdropFilter: 'blur(3px)' }}
        >
          <div
            className="w-full max-w-2xl h-[80vh] md:h-[600px] flex flex-col md:rounded-[26px] rounded-t-[26px] overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              boxShadow: '0 40px 90px -30px rgba(0,26,77,0.6)',
            }}
          >
            <ChatInterface userContext={userContext} onClose={() => setShowChat(false)} />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
