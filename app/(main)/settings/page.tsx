'use client';

import { signOut } from 'next-auth/react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/bottom-nav';
import LanguageSwitcher from '@/components/language-switcher';
import HealthProfileCard from '@/components/health-profile-card';
import ThemeToggle from '@/components/theme-toggle';
import { useTranslation } from '@/lib/i18n/context';
import { Mail, Send, Activity, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const cardStyle = {
  background: 'var(--bg-card)',
  borderRadius: '22px',
  border: '1px solid var(--border-card)',
  boxShadow: '0 12px 28px -10px rgba(1,35,116,0.22)',
  padding: '20px',
} as const;

const primaryBtnStyle = {
  borderRadius: '12px',
  background: '#012374',
  color: '#FFFDF9',
  boxShadow: '0 10px 22px -10px rgba(1,35,116,0.5)',
  padding: '10px 18px',
  fontSize: '14px',
  fontWeight: 600,
} as const;

const outlineBtnStyle = {
  borderRadius: '12px',
  border: '1px solid rgba(1,35,116,0.2)',
  background: 'transparent',
  color: 'var(--text-primary)',
  padding: '10px 18px',
  fontSize: '14px',
  fontWeight: 600,
} as const;

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

  // Libre integration state
  const [libreConnected, setLibreConnected] = useState(false);
  const [libreLoading, setLibreLoading] = useState(true);
  const [libreSyncing, setLibreSyncing] = useState(false);
  const [libreStatus, setLibreStatus] = useState<any>(null);
  const [showLibreConnect, setShowLibreConnect] = useState(false);
  const [libreEmail, setLibreEmail] = useState('');
  const [librePassword, setLibrePassword] = useState('');
  const [libreRegion, setLibreRegion] = useState('US');
  const [libreConnecting, setLibreConnecting] = useState(false);

  useEffect(() => {
    fetchUserSettings();
    fetchDexcomStatus();
    fetchLibreStatus();

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

  // Libre functions
  const fetchLibreStatus = async () => {
    try {
      const response = await fetch('/api/libre/sync');
      if (response.ok) {
        const data = await response.json();
        setLibreConnected(data.connected);
        setLibreStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch Libre status:', error);
    } finally {
      setLibreLoading(false);
    }
  };

  const connectLibre = async () => {
    if (!libreEmail || !librePassword) {
      alert('Please enter your LibreLinkUp email and password');
      return;
    }

    setLibreConnecting(true);
    try {
      const response = await fetch('/api/libre/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: libreEmail,
          password: librePassword,
          region: libreRegion,
        }),
      });

      if (response.ok) {
        alert('LibreLinkUp connected successfully!');
        setShowLibreConnect(false);
        setLibreEmail('');
        setLibrePassword('');
        fetchLibreStatus();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to connect');
      }
    } catch (error) {
      console.error('Failed to connect Libre:', error);
      alert('Failed to connect LibreLinkUp');
    } finally {
      setLibreConnecting(false);
    }
  };

  const disconnectLibre = async () => {
    if (!confirm('Are you sure you want to disconnect LibreLinkUp? Your existing glucose data will remain, but new data will not sync automatically.')) {
      return;
    }

    try {
      const response = await fetch('/api/libre/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setLibreConnected(false);
        setLibreStatus(null);
        alert('LibreLinkUp disconnected successfully');
      } else {
        alert('Failed to disconnect LibreLinkUp');
      }
    } catch (error) {
      console.error('Failed to disconnect Libre:', error);
      alert('Failed to disconnect LibreLinkUp');
    }
  };

  const syncLibreNow = async () => {
    setLibreSyncing(true);
    try {
      const response = await fetch('/api/libre/sync', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Synced successfully! Imported ${data.imported} new glucose readings.`);
        fetchLibreStatus();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to sync');
      }
    } catch (error) {
      console.error('Failed to sync Libre:', error);
      alert('Failed to sync glucose data');
    } finally {
      setLibreSyncing(false);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-[30px] leading-[1.1] font-serif-italic"
            style={{ color: 'var(--text-primary)' }}
          >
            {t.settings.title}
          </h1>
          <ThemeToggle />
        </div>

        <div className="space-y-4">
          <div style={cardStyle}>
            <LanguageSwitcher />
          </div>

          {/* Health Profile */}
          <HealthProfileCard />

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
          <div style={cardStyle}>
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Activity className="w-4 h-4" style={{ color: '#012374' }} />
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

          {/* FreeStyle Libre Integration Section */}
          <div style={cardStyle}>
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Activity className="w-4 h-4" style={{ color: '#C8932B' }} />
              FreeStyle Libre CGM (LibreLinkUp)
            </h2>

            {libreLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading LibreLinkUp status...
              </div>
            ) : libreConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">Connected</p>
                    <p className="text-sm text-green-700">
                      LibreLinkUp is connected and syncing glucose data
                    </p>
                  </div>
                </div>

                {libreStatus?.lastSyncAt && (
                  <p className="text-sm text-gray-600">
                    Last synced: {new Date(libreStatus.lastSyncAt).toLocaleString()}
                  </p>
                )}

                {libreStatus?.lastError && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ {libreStatus.lastError}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={syncLibreNow}
                    disabled={libreSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {libreSyncing ? (
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
                    onClick={disconnectLibre}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Email: {libreStatus?.libreEmail}</p>
                  <p>• Region: {libreStatus?.region || 'US'}</p>
                  <p>• Auto-sync: {libreStatus?.autoSync ? 'Yes' : 'No'}</p>
                  <p>• Sync frequency: Every {libreStatus?.syncFrequency || 15} minutes</p>
                </div>
              </div>
            ) : showLibreConnect ? (
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-900 font-medium mb-2">
                    LibreLinkUp Login
                  </p>
                  <p className="text-xs text-orange-800">
                    Enter your LibreLinkUp credentials (not your FreeStyle Libre account).
                    If you don't have LibreLinkUp, download it from the App Store or Google Play.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={libreEmail}
                    onChange={(e) => setLibreEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={librePassword}
                    onChange={(e) => setLibrePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Region</label>
                  <select
                    value={libreRegion}
                    onChange={(e) => setLibreRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="US">United States</option>
                    <option value="EU">Europe</option>
                    <option value="AP">Asia-Pacific</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={connectLibre}
                    disabled={libreConnecting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {libreConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowLibreConnect(false);
                      setLibreEmail('');
                      setLibrePassword('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  🔒 Your credentials are encrypted and never shared. We only use them to fetch
                  your glucose data from LibreLinkUp.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Connect your FreeStyle Libre CGM via LibreLinkUp to automatically sync glucose readings.
                  Works with Libre 1, 2, 3, and Pro.
                </p>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-medium text-orange-900 mb-2">Benefits:</h3>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>✓ Automatic glucose data sync via LibreLinkUp</li>
                    <li>✓ Works with all Libre sensors (1, 2, 3, Pro)</li>
                    <li>✓ No app registration needed</li>
                    <li>✓ Sync every 15 minutes</li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowLibreConnect(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  <Activity className="w-5 h-5" />
                  Connect LibreLinkUp
                </button>

                <p className="text-xs text-gray-500">
                  Requires LibreLinkUp app installed on your phone. Download from App Store or Google Play.
                </p>
              </div>
            )}
          </div>

          {/* Weekly Reports Section */}
          <div style={cardStyle}>
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Mail className="w-4 h-4" style={{ color: '#012374' }} />
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

          <div style={cardStyle}>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              Account
            </p>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full text-left px-4 py-3 text-sm font-semibold transition-all rounded-[12px]"
              style={{ color: '#D0021B' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(208,2,27,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {t.auth.logout}
            </button>
            <div
              className="mt-3 pt-3 flex gap-4 text-[11px]"
              style={{ borderTop: '1px solid rgba(1,35,116,0.08)', color: 'var(--text-muted)' }}
            >
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              <Link href="/terms" className="hover:underline">Terms of Use</Link>
              <Link href="/consent" className="hover:underline">Consent</Link>
            </div>
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
      <div className="min-h-screen pb-24 flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#012374' }} />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
