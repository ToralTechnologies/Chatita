'use client';

import { signOut } from 'next-auth/react';
import BottomNav from '@/components/bottom-nav';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-background pb-24">
      <div className="max-w-2xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="space-y-4">
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="font-semibold mb-4">Language / Idioma</h2>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium">
                English
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700">
                Español (Coming soon)
              </button>
            </div>
          </div>

          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="font-semibold mb-4">Account</h2>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 text-danger font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
