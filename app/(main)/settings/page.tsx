'use client';

import { signOut } from 'next-auth/react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import LanguageSwitcher from '@/components/language-switcher';
import { useTranslation } from '@/lib/i18n/context';
import { Mail, Send, Activity, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

function SettingsContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sendingReport, setSendingReport] = useState(false);
  const [lastReportSent, setLastReportSent] = useState<string | null>(null);

  // Dexcom integration state
  const [dexcomConnected, setDexcomConnected] = useState(false);
  const [dexcomLoading, setDexcomLoading] = useState(true);
  const [dexcomSyncing, setDexcomSyncing] = useState(false);
  const [dexcomStatus, setDexcomStatus] = useState<any>(null);
  const [showDexcomSuccess, setShowDexcomSuccess] = useState(false);
  const [showDexcomError, setShowDexcomError] = useState(false);

  useEffect(() => {
    fetchUserSettings();
    fetchDexcomStatus();

    // Check for Dexcom OAuth callback status
    const dexcomSuccess = searchParams?.get('dexcom_success');
    const dexcomError = searchParams?.get('dexcom_error');

    if (dexcomSuccess) {
      setShowDexcomSuccess(true);
      setTimeout(() => setShowDexcomSuccess(false), 5000);
    }

    if (dexcomError) {
      setShowDexcomError(true);
      setTimeout(() => setShowDexcomError(false), 5000);
    }
  }, [searchParams]);

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

  const fetchDexcomStatus = async () => {
    try {
      const response = await fetch('/api/dexcom/sync');
      if (response.ok) {
        const data = await response.json();
        setDexcomConnected(data.connected);
        setDexcomStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch Dexcom status:', error);
    } finally {
      setDexcomLoading(false);
    }
  };

  const connectDexcom = () => {
    window.location.href = '/api/dexcom/authorize';
  };

  const disconnectDexcom = async () => {
    if (!confirm('Are you sure you want to disconnect your Dexcom account? Your existing glucose data will remain, but new data will not sync automatically.')) {
      return;
    }

    try {
      const response = await fetch('/api/dexcom/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setDexcomConnected(false);
        setDexcomStatus(null);
        alert('Dexcom disconnected successfully');
      } else {
        alert('Failed to disconnect Dexcom');
      }
    } catch (error) {
      console.error('Failed to disconnect Dexcom:', error);
      alert('Failed to disconnect Dexcom');
    }
  };

  const syncDexcomNow = async () => {
    setDexcomSyncing(true);
    try {
      const response = await fetch('/api/dexcom/sync', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Synced successfully! Imported ${data.imported} new glucose readings.`);
        fetchDexcomStatus();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to sync');
      }
    } catch (error) {
      console.error('Failed to sync Dexcom:', error);
      alert('Failed to sync glucose data');
    } finally {
      setDexcomSyncing(false);
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

          {/* Success/Error messages */}
          {showDexcomSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">
                Dexcom connected successfully! Your glucose data will now sync automatically.
              </p>
            </div>
          )}

          {showDexcomError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800 font-medium">
                Failed to connect Dexcom. Please try again or check your credentials.
              </p>
            </div>
          )}

          {/* Dexcom Integration Section */}
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Dexcom CGM Integration
            </h2>

            {dexcomLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading Dexcom status...
              </div>
            ) : dexcomConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">Connected</p>
                    <p className="text-sm text-green-700">
                      Your Dexcom CGM is connected and syncing glucose data
                    </p>
                  </div>
                </div>

                {dexcomStatus?.lastSyncAt && (
                  <p className="text-sm text-gray-600">
                    Last synced: {new Date(dexcomStatus.lastSyncAt).toLocaleString()}
                  </p>
                )}

                {dexcomStatus?.lastError && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ {dexcomStatus.lastError}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={syncDexcomNow}
                    disabled={dexcomSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {dexcomSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Sync Now
                      </>
                    )}
                  </button>

                  <button
                    onClick={disconnectDexcom}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Auto-sync enabled: {dexcomStatus?.autoSync ? 'Yes' : 'No'}</p>
                  <p>• Sync frequency: Every {dexcomStatus?.syncFrequency || 15} minutes</p>
                  <p>• Environment: {dexcomStatus?.environment || 'sandbox'}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Connect your Dexcom CGM to automatically sync glucose readings to Chatita.
                  This eliminates manual entry and provides real-time glucose tracking.
                </p>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Benefits:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Automatic glucose data sync</li>
                    <li>✓ Real-time CGM readings</li>
                    <li>✓ Better insights and correlations</li>
                    <li>✓ No manual data entry needed</li>
                  </ul>
                </div>

                <button
                  onClick={connectDexcom}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                >
                  <Activity className="w-5 h-5" />
                  Connect Dexcom Account
                </button>

                <p className="text-xs text-gray-500">
                  You'll be redirected to Dexcom to authorize access. Your Dexcom credentials
                  are never shared with Chatita.
                </p>
              </div>
            )}
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

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-background pb-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
