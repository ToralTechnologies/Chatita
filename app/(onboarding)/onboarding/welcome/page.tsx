'use client';

import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gray-background p-6">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full">
        <div className="text-center space-y-6">
          <img src="/logo.svg" alt="Chatita" className="w-48 h-auto mx-auto mb-4" />

          <h1 className="text-4xl font-bold">Welcome to Chatita</h1>

          <div className="bg-white rounded-card shadow-card p-6">
            <p className="text-lg italic text-gray-700 leading-relaxed">
              &quot;I&apos;m here to help you manage your diabetes with warmth and care,
              just like your abuelita would.&quot;
            </p>
          </div>

          <p className="text-gray-600">
            Let&apos;s take this journey together, one step at a time.
          </p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        <button
          onClick={() => router.push('/onboarding/how-it-helps')}
          className="w-full bg-primary text-white py-4 rounded-button font-medium text-lg hover:bg-primary-dark transition-colors"
        >
          Get Started
        </button>

        <button
          onClick={() => router.push('/home')}
          className="w-full text-gray-600 py-3 text-sm hover:text-gray-800 transition-colors"
        >
          Skip for now
        </button>

        <div className="flex justify-center gap-2 pt-2">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        </div>
      </div>
    </div>
  );
}
