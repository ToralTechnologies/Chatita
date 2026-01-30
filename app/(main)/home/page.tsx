'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GlucoseWidget from '@/components/glucose-widget';
import MoodSelector from '@/components/mood-selector';
import ContextTags from '@/components/context-tags';
import BottomNav from '@/components/bottom-nav';
import { Mood, UserContext } from '@/types';
import { ScanLine, History } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [currentGlucose, setCurrentGlucose] = useState<number | undefined>(undefined);

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

  const handleGlucoseUpdate = async (value: number) => {
    try {
      const response = await fetch('/api/glucose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });

      if (response.ok) {
        setCurrentGlucose(value);
      }
    } catch (error) {
      console.error('Failed to update glucose:', error);
    }
  };

  const handleMoodSave = async (mood: Mood, stressLevel: number) => {
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
        <div className="text-lg text-gray-600">Loading...</div>
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
            Hello {userName} 👋
          </h1>
          <p className="text-gray-600 mt-1">How are you feeling today?</p>
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
            href="/menu-scanner"
            className="bg-white rounded-card shadow-card p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ScanLine className="w-8 h-8 text-primary mb-2" />
            <span className="font-medium">Scan Menu</span>
          </Link>

          <Link
            href="/meal-history"
            className="bg-white rounded-card shadow-card p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <History className="w-8 h-8 text-primary mb-2" />
            <span className="font-medium">Meal History</span>
          </Link>
        </div>

        {/* Mood & Stress */}
        <MoodSelector onSave={handleMoodSave} />

        {/* Context Tags */}
        <ContextTags onSave={handleContextSave} />

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-warning/30 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            ⚠️ Chatita provides general guidance only. Always consult your
            healthcare provider for medical decisions.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
