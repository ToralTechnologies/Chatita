'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GlucoseWidget from '@/components/glucose-widget';
import MoodSelector from '@/components/mood-selector';
import ContextTags from '@/components/context-tags';
import BottomNav from '@/components/bottom-nav';
import ChatInterface from '@/components/chat-interface';
import { Mood, UserContext } from '@/types';
import { ScanLine, History, MessageCircle, X, MapPin, ChefHat, Calendar } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
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
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    if (session) {
      fetchUserData();
    }
  }, [session]);

  const handleGlucoseUpdate = async (
    value: number,
    context?: string,
    relatedMealId?: string,
    notes?: string
  ) => {
    try {
      const response = await fetch('/api/glucose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, context, relatedMealId, notes }),
      });

      if (response.ok) {
        setCurrentGlucose(value);
      }
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
    setUserContext(context); // Save for chat context
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">{t.common.loading}</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userName = userData?.name || session.user?.name || 'there';

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold">
            {t.home.greeting.replace('{name}', userName)} 👋
          </h1>
          <p className="text-gray-600 mt-1">{t.home.subtitle}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Glucose Widget */}
        <GlucoseWidget
          currentValue={currentGlucose}
          minRange={userData?.targetGlucoseMin || 70}
          maxRange={userData?.targetGlucoseMax || 180}
          onUpdate={handleGlucoseUpdate}
        />

        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/restaurant-finder"
            className="bg-white rounded-card shadow-card p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <MapPin className="w-8 h-8 text-primary mb-2" />
            <span className="font-medium text-center">{t.home.quickActions.findRestaurants}</span>
          </Link>

          <Link
            href="/menu-scanner"
            className="bg-white rounded-card shadow-card p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ScanLine className="w-8 h-8 text-primary mb-2" />
            <span className="font-medium">{t.home.quickActions.scanMenu}</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/meal-history"
            className="bg-white rounded-card shadow-card p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <History className="w-7 h-7 text-primary mb-2" />
            <span className="font-medium text-sm text-center">{t.home.quickActions.mealHistory}</span>
          </Link>

          <Link
            href="/recipes"
            className="bg-white rounded-card shadow-card p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChefHat className="w-7 h-7 text-primary mb-2" />
            <span className="font-medium text-sm text-center">{t.home.quickActions.recipes}</span>
          </Link>

          <Link
            href="/insights"
            className="bg-white rounded-card shadow-card p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mb-2">📊</span>
            <span className="font-medium text-sm text-center">{t.nav.insights}</span>
          </Link>

          <Link
            href="/meal-plan"
            className="bg-white rounded-card shadow-card p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-7 h-7 text-primary mb-2" />
            <span className="font-medium text-sm text-center">Meal Plan</span>
          </Link>
        </div>

        {/* Mood & Stress */}
        <MoodSelector onSave={handleMoodSave} />

        {/* Context Tags */}
        <ContextTags onSave={handleContextSave} />

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-warning/30 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            ⚠️ {t.home.disclaimer}
          </p>
        </div>
      </div>

      {/* Floating Chat Button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-dark transition-all hover:scale-110 z-20"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Interface */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center">
          <div className="w-full max-w-2xl h-[80vh] md:h-[600px] bg-white md:rounded-t-2xl flex flex-col">
            <ChatInterface userContext={userContext} onClose={() => setShowChat(false)} />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
