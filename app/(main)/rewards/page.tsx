'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/bottom-nav';
import { Trophy, Lock } from 'lucide-react';

export default function RewardsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await fetch('/api/badges');
      if (response.ok) {
        const badgeData = await response.json();
        setData(badgeData);
      }
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-background pb-24 flex items-center justify-center">
        <p className="text-gray-500">Loading rewards...</p>
        <BottomNav />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-background pb-24 flex items-center justify-center">
        <p className="text-gray-500">Unable to load rewards</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-warning" />
            Your Milestones
          </h1>
          <p className="text-gray-600 text-sm mt-1">Keep up the great work! 🌟</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Current Streak */}
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-card shadow-card p-6 text-white">
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">{data.currentStreak}</div>
            <div className="text-xl">Days with Chatita</div>
            <p className="text-sm opacity-90 mt-2">
              You&apos;ve been tracking for {data.currentStreak} consecutive days!
            </p>
          </div>
        </div>

        {/* Next Milestone */}
        {data.nextMilestone && (
          <div className="bg-white rounded-card shadow-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">{data.nextMilestone.badge.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{data.nextMilestone.badge.name}</h3>
                <p className="text-sm text-gray-600">{data.nextMilestone.badge.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-primary">
                  {data.nextMilestone.daysRemaining} days to go
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary rounded-full h-3 transition-all"
                  style={{ width: `${Math.min(data.nextMilestone.progress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Earned Badges */}
        {data.earnedBadges.length > 0 && (
          <>
            <h2 className="font-semibold text-lg">Earned Badges</h2>
            <div className="grid grid-cols-2 gap-4">
              {data.earnedBadges.map((badge: any) => (
                <div
                  key={badge.id}
                  className="bg-white rounded-card shadow-card p-6 text-center"
                >
                  <div className="text-5xl mb-3">{badge.icon}</div>
                  <h3 className="font-semibold mb-1">{badge.name}</h3>
                  <p className="text-xs text-gray-600">{badge.description}</p>
                  <div className="mt-3 px-3 py-1 bg-success/10 text-success rounded-full text-xs font-medium inline-block">
                    Unlocked!
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Locked Badges */}
        {data.lockedBadges.length > 0 && (
          <>
            <h2 className="font-semibold text-lg">Locked Badges</h2>
            <div className="grid grid-cols-2 gap-4">
              {data.lockedBadges.map((badge: any) => (
                <div
                  key={badge.id}
                  className="bg-white rounded-card shadow-card p-6 text-center opacity-60"
                >
                  <div className="relative">
                    <div className="text-5xl mb-3 filter grayscale">{badge.icon}</div>
                    <Lock className="w-6 h-6 text-gray-400 absolute top-0 right-1/4" />
                  </div>
                  <h3 className="font-semibold mb-1 text-gray-600">{badge.name}</h3>
                  <p className="text-xs text-gray-500">{badge.description}</p>
                  <div className="mt-3 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium inline-block">
                    {badge.daysRequired} days
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Encouragement */}
        <div className="bg-success/10 border border-success/30 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            💚 <strong>You&apos;re doing great, mi amor!</strong> Every day you track is a step toward better health.
            Keep going!
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
