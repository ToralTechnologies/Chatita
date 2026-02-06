'use client';

import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/bottom-nav';
import LanguageSwitcher from '@/components/language-switcher';
import { useTranslation } from '@/lib/i18n/context';
import { Mail, Send } from 'lucide-react';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sendingReport, setSendingReport] = useState(false);
  const [lastReportSent, setLastReportSent] = useState<string | null>(null);

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setWeeklyReportEnabled(data.user.weeklyReportEnabled ?? true);
        setLastReportSent(data.user.lastReportSent);
      }
    } catch (error) {
      console.error('Failed to fetch user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWeeklyReport = async () => {
    const newValue = !weeklyReportEnabled;
    setWeeklyReportEnabled(newValue);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklyReportEnabled: newValue }),
      });

      if (!response.ok) {
        setWeeklyReportEnabled(!newValue);
        alert('Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to update weekly report setting:', error);
      setWeeklyReportEnabled(!newValue);
      alert('Failed to update settings');
    }
  };

  const sendTestReport = async () => {
    setSendingReport(true);
    try {
      const response = await fetch('/api/reports/weekly', {
        method: 'POST',
      });

      if (response.ok) {
        alert('Weekly report sent successfully! Check your email.');
        fetchUserSettings();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send report');
      }
    } catch (error) {
      console.error('Failed to send weekly report:', error);
      alert('Failed to send report');
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      <div className="max-w-2xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-bold mb-6">{t.settings.title}</h1>

        <div className="space-y-4">
          <div className="bg-white rounded-card shadow-card p-6">
            <LanguageSwitcher />
          </div>

          {/* Weekly Reports Section */}
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Weekly Reports
            </h2>

            {!loading && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Email Weekly Summary</p>
                    <p className="text-sm text-gray-500">
                      Get a weekly email with your progress, insights, and patterns
                    </p>
                  </div>
                  <button
                    onClick={toggleWeeklyReport}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      weeklyReportEnabled ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        weeklyReportEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {weeklyReportEnabled && (
                  <div className="border-t pt-4">
                    <button
                      onClick={sendTestReport}
                      disabled={sendingReport}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      {sendingReport ? 'Sending...' : 'Send Test Report Now'}
                    </button>
                    {lastReportSent && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last sent: {new Date(lastReportSent).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="font-semibold mb-4">Account</h2>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 text-danger font-medium"
            >
              {t.auth.logout}
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
