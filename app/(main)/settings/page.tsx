'use client';

import { signOut } from 'next-auth/react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
import LanguageSwitcher from '@/components/language-switcher';
import HealthProfileCard from '@/components/health-profile-card';
import ThemeToggle from '@/components/theme-toggle';
import BackButton from '@/components/back-button';
import CulturalFoodProfileCard from '@/components/cultural-food-profile-card';
import SleepBodyProfileCard from '@/components/sleep-body-profile-card';
import ConnectedHealthCard from '@/components/connected-health-card';
import { useTranslation } from '@/lib/i18n/context';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

// ── Shared styles ──────────────────────────────────────────────────────────────

const card = {
  background: '#FFFDF9',
  borderRadius: 22,
  border: '1px solid rgba(1,35,116,0.07)',
  boxShadow: '0 14px 30px -24px rgba(1,35,116,.28)',
  padding: 24,
} as const;

// ── CGM Card ──────────────────────────────────────────────────────────────────

interface CgmCardProps {
  dotColor: string;
  name: string;
  subtitle: string;
  benefits: string[];
  loading: boolean;
  connected: boolean;
  syncing: boolean;
  lastSyncAt?: string | null;
  lastError?: string | null;
  finePrint: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onSyncNow: () => void;
  extraInfo?: React.ReactNode;
  connectForm?: React.ReactNode;
  showConnectForm?: boolean;
}

function CgmCard({
  dotColor, name, subtitle, benefits, loading, connected, syncing,
  lastSyncAt, lastError, finePrint,
  onConnect, onDisconnect, onSyncNow,
  extraInfo, connectForm, showConnectForm,
}: CgmCardProps) {
  return (
    <div style={{ ...card, padding: '20px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <span style={{
          width: 46, height: 46, borderRadius: 14,
          background: `${dotColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={dotColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#16182A' }}>{name}</div>
          <div style={{ fontSize: 12.5, color: 'rgba(22,24,42,0.55)', marginTop: 1 }}>{subtitle}</div>
        </div>
        {connected && (
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(28,122,79,0.1)', borderRadius: 99, padding: '4px 10px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1C7A4F', flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1C7A4F' }}>Connected</span>
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(22,24,42,0.5)', fontSize: 13 }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading status…
        </div>
      ) : connected ? (
        <>
          {lastError && (
            <div style={{ background: 'rgba(200,147,43,0.1)', border: '1px solid rgba(200,147,43,0.3)', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#7A5C10', marginBottom: 12 }}>
              ⚠️ {lastError}
            </div>
          )}
          {lastSyncAt && (
            <p style={{ fontSize: 12, color: 'rgba(22,24,42,0.5)', marginBottom: 12 }}>
              Last synced: {new Date(lastSyncAt).toLocaleString()}
            </p>
          )}
          <div style={{ display: 'flex', gap: 9 }}>
            <button
              onClick={onSyncNow}
              disabled={syncing}
              style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 12, background: dotColor, color: '#FFFDF9', border: 'none', padding: '10px 17px', fontSize: 13.5, fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.6 : 1 }}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
            <button
              onClick={onDisconnect}
              style={{ borderRadius: 12, border: '1px solid rgba(22,24,42,0.18)', background: 'transparent', color: 'rgba(22,24,42,0.7)', padding: '10px 17px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
            >
              Disconnect
            </button>
          </div>
          {extraInfo}
        </>
      ) : showConnectForm && connectForm ? (
        connectForm
      ) : (
        <>
          {/* Benefits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
            {benefits.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M5 13l4 4L19 7" stroke={dotColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 13.5, color: 'rgba(22,24,42,0.75)', lineHeight: 1.4 }}>{b}</span>
              </div>
            ))}
          </div>
          <button
            onClick={onConnect}
            style={{ width: '100%', borderRadius: 14, background: dotColor, color: '#FFFDF9', border: 'none', padding: '12px 18px', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 18px -8px ${dotColor}88` }}
          >
            Connect {name}
          </button>
          <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.4)', marginTop: 11, lineHeight: 1.5 }}>{finePrint}</p>
        </>
      )}
    </div>
  );
}

// ── Reports & account card ─────────────────────────────────────────────────────

interface ReportsAccountCardProps {
  loading: boolean;
  weeklyReportEnabled: boolean;
  sendingReport: boolean;
  lastReportSent: string | null;
  onToggle: () => void;
  onSendTest: () => void;
}

function ReportsAccountCard({ loading, weeklyReportEnabled, sendingReport, lastReportSent, onToggle, onSendTest }: ReportsAccountCardProps) {
  const { t } = useTranslation();
  return (
    <div style={card}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 16 }}>Reports & account</div>

      {/* Weekly report toggle */}
      {!loading && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#16182A' }}>Weekly email summary</div>
              <div style={{ fontSize: 12.5, color: 'rgba(22,24,42,0.55)', marginTop: 2 }}>Progress, insights, and patterns every week</div>
            </div>
            <button
              onClick={onToggle}
              style={{ position: 'relative', width: 44, height: 24, borderRadius: 99, background: weeklyReportEnabled ? '#012374' : 'rgba(22,24,42,0.18)', border: 'none', cursor: 'pointer', flexShrink: 0 }}
            >
              <span style={{ position: 'absolute', top: 3, left: weeklyReportEnabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#FFFDF9', transition: 'left 0.18s' }} />
            </button>
          </div>

          {weeklyReportEnabled && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(1,35,116,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <button
                  onClick={onSendTest}
                  disabled={sendingReport}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(1,35,116,0.07)', borderRadius: 10, border: 'none', padding: '9px 14px', fontSize: 13, fontWeight: 600, color: '#012374', cursor: sendingReport ? 'not-allowed' : 'pointer', opacity: sendingReport ? 0.6 : 1 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="#012374" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {sendingReport ? 'Sending…' : 'Send a test report now'}
                </button>
                {lastReportSent && (
                  <p style={{ fontSize: 11, color: 'rgba(22,24,42,0.4)', marginTop: 6 }}>
                    Last sent: {new Date(lastReportSent).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(1,35,116,0.07)', paddingTop: 16 }}>
        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 0', fontSize: 14, fontWeight: 600, color: '#E3171A', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {t.auth.logout}
        </button>
        {/* Privacy links */}
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11.5, color: 'rgba(22,24,42,0.45)' }}>
          <Link href="/privacy" style={{ textDecoration: 'none', color: 'inherit' }}>Privacy</Link>
          <Link href="/terms" style={{ textDecoration: 'none', color: 'inherit' }}>Terms</Link>
          <Link href="/consent" style={{ textDecoration: 'none', color: 'inherit' }}>Consent</Link>
        </div>
      </div>
    </div>
  );
}

// ── Main settings content ─────────────────────────────────────────────────────

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

    const dexcomSuccess = searchParams?.get('dexcom_success');
    const dexcomError = searchParams?.get('dexcom_error');
    if (dexcomSuccess) { setShowDexcomSuccess(true); setTimeout(() => setShowDexcomSuccess(false), 5000); }
    if (dexcomError) { setShowDexcomError(true); setTimeout(() => setShowDexcomError(false), 5000); }

    const healthSuccess = searchParams?.get('health_success');
    const healthError = searchParams?.get('health_error');
    if (healthSuccess) {
      // Short toast — ConnectedHealthCard will re-fetch status on mount
      console.info('[settings] Google Health connected:', healthSuccess);
    }
    if (healthError) {
      console.warn('[settings] Google Health error:', healthError);
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
      if (!response.ok) { setWeeklyReportEnabled(!newValue); alert('Failed to update settings'); }
    } catch {
      setWeeklyReportEnabled(!newValue);
      alert('Failed to update settings');
    }
  };

  const sendTestReport = async () => {
    setSendingReport(true);
    try {
      const response = await fetch('/api/reports/weekly', { method: 'POST' });
      if (response.ok) { alert('Weekly report sent successfully! Check your email.'); fetchUserSettings(); }
      else { const data = await response.json(); alert(data.error || 'Failed to send report'); }
    } catch { alert('Failed to send report'); }
    finally { setSendingReport(false); }
  };

  const fetchDexcomStatus = async () => {
    try {
      const response = await fetch('/api/dexcom/sync');
      if (response.ok) { const data = await response.json(); setDexcomConnected(data.connected); setDexcomStatus(data); }
    } catch (error) { console.error('Failed to fetch Dexcom status:', error); }
    finally { setDexcomLoading(false); }
  };

  const connectDexcom = () => { window.location.href = '/api/dexcom/authorize'; };

  const disconnectDexcom = async () => {
    if (!confirm('Are you sure you want to disconnect your Dexcom account? Your existing glucose data will remain, but new data will not sync automatically.')) return;
    try {
      const response = await fetch('/api/dexcom/disconnect', { method: 'POST' });
      if (response.ok) { setDexcomConnected(false); setDexcomStatus(null); alert('Dexcom disconnected successfully'); }
      else { alert('Failed to disconnect Dexcom'); }
    } catch { alert('Failed to disconnect Dexcom'); }
  };

  const syncDexcomNow = async () => {
    setDexcomSyncing(true);
    try {
      const response = await fetch('/api/dexcom/sync', { method: 'POST' });
      if (response.ok) { const data = await response.json(); alert(`Synced successfully! Imported ${data.imported} new glucose readings.`); fetchDexcomStatus(); }
      else { const data = await response.json(); alert(data.error || 'Failed to sync'); }
    } catch { alert('Failed to sync glucose data'); }
    finally { setDexcomSyncing(false); }
  };

  const fetchLibreStatus = async () => {
    try {
      const response = await fetch('/api/libre/sync');
      if (response.ok) { const data = await response.json(); setLibreConnected(data.connected); setLibreStatus(data); }
    } catch (error) { console.error('Failed to fetch Libre status:', error); }
    finally { setLibreLoading(false); }
  };

  const connectLibre = async () => {
    if (!libreEmail || !librePassword) { alert('Please enter your LibreLinkUp email and password'); return; }
    setLibreConnecting(true);
    try {
      const response = await fetch('/api/libre/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: libreEmail, password: librePassword, region: libreRegion }),
      });
      if (response.ok) { alert('LibreLinkUp connected successfully!'); setShowLibreConnect(false); setLibreEmail(''); setLibrePassword(''); fetchLibreStatus(); }
      else { const data = await response.json(); alert(data.error || 'Failed to connect'); }
    } catch { alert('Failed to connect LibreLinkUp'); }
    finally { setLibreConnecting(false); }
  };

  const disconnectLibre = async () => {
    if (!confirm('Are you sure you want to disconnect LibreLinkUp? Your existing glucose data will remain, but new data will not sync automatically.')) return;
    try {
      const response = await fetch('/api/libre/disconnect', { method: 'POST' });
      if (response.ok) { setLibreConnected(false); setLibreStatus(null); alert('LibreLinkUp disconnected successfully'); }
      else { alert('Failed to disconnect LibreLinkUp'); }
    } catch { alert('Failed to disconnect LibreLinkUp'); }
  };

  const syncLibreNow = async () => {
    setLibreSyncing(true);
    try {
      const response = await fetch('/api/libre/sync', { method: 'POST' });
      if (response.ok) { const data = await response.json(); alert(`Synced successfully! Imported ${data.imported} new glucose readings.`); fetchLibreStatus(); }
      else { const data = await response.json(); alert(data.error || 'Failed to sync'); }
    } catch { alert('Failed to sync glucose data'); }
    finally { setLibreSyncing(false); }
  };

  // Libre connect form (shown inline when user clicks connect)
  const libreForm = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'rgba(200,147,43,0.09)', border: '1px solid rgba(200,147,43,0.25)', borderRadius: 10, padding: '12px 14px' }}>
        <p style={{ fontSize: 12.5, color: '#7A5C10', lineHeight: 1.55 }}>
          Enter your <strong>LibreLinkUp</strong> credentials — not your FreeStyle Libre account. If you don&apos;t have LibreLinkUp, download it from the App Store or Google Play.
        </p>
      </div>
      {(['Email', 'Password'] as const).map(field => (
        <div key={field}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(22,24,42,0.7)', marginBottom: 5 }}>{field}</label>
          <input
            type={field === 'Password' ? 'password' : 'email'}
            value={field === 'Email' ? libreEmail : librePassword}
            onChange={e => field === 'Email' ? setLibreEmail(e.target.value) : setLibrePassword(e.target.value)}
            placeholder={field === 'Email' ? 'your@email.com' : '••••••••'}
            style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(22,24,42,0.18)', padding: '10px 13px', fontSize: 14, background: '#FFFDF9', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      ))}
      <div>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(22,24,42,0.7)', marginBottom: 5 }}>Region</label>
        <select
          value={libreRegion}
          onChange={e => setLibreRegion(e.target.value)}
          style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(22,24,42,0.18)', padding: '10px 13px', fontSize: 14, background: '#FFFDF9', outline: 'none' }}
        >
          <option value="US">United States</option>
          <option value="EU">Europe</option>
          <option value="AP">Asia-Pacific</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 9 }}>
        <button
          onClick={connectLibre}
          disabled={libreConnecting}
          style={{ flex: 1, borderRadius: 12, background: '#C8932B', color: '#FFFDF9', border: 'none', padding: '11px 18px', fontSize: 14, fontWeight: 700, cursor: libreConnecting ? 'not-allowed' : 'pointer', opacity: libreConnecting ? 0.6 : 1 }}
        >
          {libreConnecting ? 'Connecting…' : 'Connect'}
        </button>
        <button
          onClick={() => { setShowLibreConnect(false); setLibreEmail(''); setLibrePassword(''); }}
          style={{ borderRadius: 12, border: '1px solid rgba(22,24,42,0.18)', background: 'transparent', color: 'rgba(22,24,42,0.7)', padding: '11px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
      <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.4)', lineHeight: 1.5 }}>
        🔒 Your credentials are encrypted and never shared. Used only to fetch glucose data from LibreLinkUp.
      </p>
    </div>
  );

  const dexcomCard = (
    <CgmCard
      dotColor="#012374"
      name="Dexcom CGM"
      subtitle="Automatic glucose sync via OAuth"
      benefits={[
        'Automatic glucose readings, no manual entry',
        'Real-time CGM data in Chatita',
        'Better correlations with meals and mood',
        'Syncs every 15 minutes automatically',
      ]}
      loading={dexcomLoading}
      connected={dexcomConnected}
      syncing={dexcomSyncing}
      lastSyncAt={dexcomStatus?.lastSyncAt}
      lastError={dexcomStatus?.lastError}
      finePrint="You'll be redirected to Dexcom to authorize. Your Dexcom credentials are never shared with Chatita."
      onConnect={connectDexcom}
      onDisconnect={disconnectDexcom}
      onSyncNow={syncDexcomNow}
      extraInfo={dexcomStatus && dexcomConnected && (
        <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.45)', marginTop: 10 }}>
          Auto-sync: {dexcomStatus.autoSync ? 'on' : 'off'} · Every {dexcomStatus.syncFrequency || 15} min · {dexcomStatus.environment || 'sandbox'}
        </p>
      )}
    />
  );

  const libreCard = (
    <CgmCard
      dotColor="#C8932B"
      name="FreeStyle Libre"
      subtitle="LibreLinkUp · Libre 1, 2, 3, and Pro"
      benefits={[
        'Works with all Libre sensors (1, 2, 3, Pro)',
        'Auto-sync via LibreLinkUp — no extra app needed',
        'Syncs every 15 minutes',
        'No Dexcom account required',
      ]}
      loading={libreLoading}
      connected={libreConnected}
      syncing={libreSyncing}
      lastSyncAt={libreStatus?.lastSyncAt}
      lastError={libreStatus?.lastError}
      finePrint="Requires LibreLinkUp app installed on your phone. Download from App Store or Google Play."
      onConnect={() => setShowLibreConnect(true)}
      onDisconnect={disconnectLibre}
      onSyncNow={syncLibreNow}
      showConnectForm={showLibreConnect}
      connectForm={libreForm}
      extraInfo={libreStatus && libreConnected && (
        <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.45)', marginTop: 10 }}>
          {libreStatus.libreEmail} · {libreStatus.region || 'US'} · every {libreStatus.syncFrequency || 15} min
        </p>
      )}
    />
  );

  const reportsCard = (
    <ReportsAccountCard
      loading={loading}
      weeklyReportEnabled={weeklyReportEnabled}
      sendingReport={sendingReport}
      lastReportSent={lastReportSent}
      onToggle={toggleWeeklyReport}
      onSendTest={sendTestReport}
    />
  );

  // Notification banners
  const banners = (
    <>
      {showDexcomSuccess && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(28,122,79,0.09)', border: '1px solid rgba(28,122,79,0.25)', borderRadius: 14, padding: '13px 16px' }}>
          <CheckCircle className="w-5 h-5" style={{ color: '#1C7A4F', flexShrink: 0 }} />
          <p style={{ fontSize: 13.5, color: '#174F35', fontWeight: 500 }}>Dexcom connected! Your glucose data will now sync automatically.</p>
        </div>
      )}
      {showDexcomError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(227,23,26,0.08)', border: '1px solid rgba(227,23,26,0.22)', borderRadius: 14, padding: '13px 16px' }}>
          <XCircle className="w-5 h-5" style={{ color: '#E3171A', flexShrink: 0 }} />
          <p style={{ fontSize: 13.5, color: '#8B0A0C', fontWeight: 500 }}>Failed to connect Dexcom. Please try again or check your credentials.</p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ─── Mobile ─── */}
      <div className="lg:hidden min-h-screen mobile-page-pb" style={{ background: '#F7EFE1', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ padding: '20px 20px 0', paddingTop: 'max(20px, env(safe-area-inset-top, 0px))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <BackButton href="/home" />
            <ThemeToggle />
          </div>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700, marginTop: 12 }}>Account · Settings</div>
          <h1 className="font-serif-italic" style={{ fontSize: 30, color: '#012374', lineHeight: 1.05, marginTop: 4, marginBottom: 20 }}>
            Make Chatita yours.
          </h1>
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {banners}
          <div style={card}><LanguageSwitcher /></div>
          <HealthProfileCard />
          <CulturalFoodProfileCard />
          <SleepBodyProfileCard />
          <ConnectedHealthCard />
          {dexcomCard}
          {libreCard}
          {reportsCard}
        </div>

        <BottomNav />
      </div>

      {/* ─── Web ─── */}
      <div className="hidden lg:flex" style={{ height: '100vh', background: '#F7EFE1', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
        <WebNav />

        <div style={{ flex: 1, overflowY: 'auto', padding: '34px 44px 44px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Account · Settings</div>
              <h1 className="font-serif-italic" style={{ fontSize: 38, color: '#012374', lineHeight: 1.05, marginTop: 6 }}>Make Chatita yours.</h1>
              <p style={{ fontSize: 16, color: 'rgba(22,24,42,0.65)', marginTop: 4 }}>Personalize your health profile, connect your CGM, and manage preferences.</p>
            </div>
            <ThemeToggle />
          </div>

          {(showDexcomSuccess || showDexcomError) && (
            <div style={{ marginBottom: 20 }}>{banners}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, alignItems: 'start' }}>
            {/* Left column: health profile + cultural profile + language */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <HealthProfileCard />
              <CulturalFoodProfileCard />
              <SleepBodyProfileCard />
              <div style={card}><LanguageSwitcher /></div>
            </div>

            {/* Right column: connected health + CGM + reports/account */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <ConnectedHealthCard />
              <div style={{ ...card, padding: '22px' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 18 }}>Connect a CGM</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {dexcomCard}
                  {libreCard}
                </div>
              </div>
              {reportsCard}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="hidden lg:flex" style={{ height: '100vh', background: '#F7EFE1', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#012374' }} />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
