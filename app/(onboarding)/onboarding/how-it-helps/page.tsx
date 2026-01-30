'use client';

import { useRouter } from 'next/navigation';
import { Camera, Sparkles, ScanLine, Trophy } from 'lucide-react';

export default function HowItHelpsPage() {
  const router = useRouter();

  const features = [
    {
      icon: Camera,
      title: 'Photo Meal Logging',
      description: 'Snap a photo of your meal and log it in seconds',
    },
    {
      icon: Sparkles,
      title: 'Smart Insights',
      description: 'Get gentle, personalized guidance based on your patterns',
    },
    {
      icon: ScanLine,
      title: 'Menu Scanning',
      description: 'Scan restaurant menus for diabetes-friendly recommendations',
    },
    {
      icon: Trophy,
      title: 'Milestones & Rewards',
      description: 'Celebrate your progress with badges and encouragement',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gray-background p-6">
      <div className="flex-1 w-full max-w-md space-y-6 pt-8">
        <h1 className="text-3xl font-bold text-center">How Chatita Helps</h1>

        <div className="space-y-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-card shadow-card p-5 flex gap-4"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        <button
          onClick={() => router.push('/onboarding/profile-setup')}
          className="w-full bg-primary text-white py-4 rounded-button font-medium text-lg hover:bg-primary-dark transition-colors"
        >
          Continue
        </button>

        <button
          onClick={() => router.push('/home')}
          className="w-full text-gray-600 py-3 text-sm hover:text-gray-800 transition-colors"
        >
          Skip for now
        </button>

        <div className="flex justify-center gap-2 pt-2">
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        </div>
      </div>
    </div>
  );
}
