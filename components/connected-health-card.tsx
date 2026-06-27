'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';

const card = {
  background: '#FFFDF9',
  borderRadius: 22,
  border: '1px solid rgba(1,35,116,0.07)',
  boxShadow: '0 14px 30px -24px rgba(1,35,116,.28)',
  padding: 24,
} as const;

const APPLE_DATA_TYPES = [
  { id: 'steps',            label: 'Steps',              defaultOn: true },
  { id: 'distance_m',       label: 'Distance',           defaultOn: true },
  { id: 'active_calories',  label: 'Active calories',    defaultOn: true },
  { id: 'exercise_minutes', label: 'Exercise minutes',   defaultOn: true },
  { id: 'sleep',            label: 'Sleep',              defaultOn: true },
  { id: 'heart_rate',       label: 'Heart rate',         defaultOn: false },
  { id: 'resting_heart_rate', label: 'Resting heart rate', defaultOn: false },
  { id: 'weight_kg',        label: 'Body weight',        defaultOn: false },
  { id: 'blood_glucose',    label: 'Blood glucose',      defaultOn: false },
];

type Connection = {
  provider: string;
  status: string;
  lastSyncedAt?: string | null;
  errorMessage?: string | null;
};

type Import = {
  id: string;
  provider: string;
  filename?: string | null;
  status: string;
  recordsProcessed?: number | null;
  createdAt: string;
  completedAt?: string | null;
  errorMessage?: string | null;
};

export default function ConnectedHealthCard() {
  const [loading, setLoading] = useState(true);
  const [googleConn, setGoogleConn] = useState<Connection | null>(null);
  const [recentImports, setRecentImports] = useState<Import[]>([]);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleMsg, setGoogleMsg] = useState('');

  // Apple Health import state
  const [showAppleImport, setShowAppleImport] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(APPLE_DATA_TYPES.filter(t => t.defaultOn).map(t => t.id))
  );
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchStatus(); }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch('/api/health/connections');
      if (!res.ok) return;
      const data = await res.json();
      const google = (data.connections as Connection[]).find(c => c.provider === 'google_health');
      setGoogleConn(google ?? null);
      setRecentImports(data.recentImports ?? []);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleConnect() {
    window.location.href = '/api/health/google/connect';
  }

  async function handleGoogleSync() {
    setGoogleSyncing(true);
    setGoogleMsg('');
    try {
      const res = await fetch('/api/health/google/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setGoogleMsg(`Synced ${data.recordsSynced ?? 0} day(s) of data.`);
        await fetchStatus();
      } else {
        setGoogleMsg(data.error ?? 'Sync failed');
      }
    } catch {
      setGoogleMsg('Sync failed');
    } finally {
      setGoogleSyncing(false);
    }
  }

  async function handleGoogleDisconnect() {
    if (!confirm('Disconnect Google Health? Your imported data will be kept but no new data will sync.')) return;
    try {
      const res = await fetch('/api/health/google/disconnect', { method: 'POST' });
      if (res.ok) {
        setGoogleConn(null);
        setGoogleMsg('Disconnected.');
      } else {
        const d = await res.json();
        setGoogleMsg(d.error ?? 'Disconnect failed');
      }
    } catch {
      setGoogleMsg('Disconnect failed');
    }
  }

  function toggleType(id: string) {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleAppleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setImportError('Please choose a file first.');
      return;
    }

    setImporting(true);
    setImportMsg('');
    setImportError('');

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('selectedTypes', JSON.stringify([...selectedTypes]));

      const res = await fetch('/api/health/apple/import', { method: 'POST', body: form });
      const data = await res.json();

      if (res.ok) {
        setImportMsg(`Done! Processed ${data.recordsProcessed?.toLocaleString() ?? 0} records across ${data.daysImported ?? 0} days.`);
        setShowAppleImport(false);
        await fetchStatus();
      } else {
        setImportError(data.error ?? 'Import failed');
      }
    } catch {
      setImportError('Import failed. Please try again.');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const googleConnected = googleConn?.status === 'connected';
  const appleImports = recentImports.filter(i => i.provider === 'apple_health_export');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Section header */}
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700 }}>
        Connected health data
      </div>

      {/* Privacy notice */}
      <div style={{ fontSize: 13, color: 'rgba(22,24,42,0.6)', lineHeight: 1.55 }}>
        Connected data is optional. Chatita only imports what you choose and uses it to personalize supportive insights.
        You can disconnect anytime. Chatita works without a connected device.
      </div>

      {/* ── Google Health / Fitbit card ─────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(66,133,244,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {/* Google-colored activity icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#4285F4" strokeWidth="1.8"/>
              <path d="M12 6v6l4 2" stroke="#4285F4" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#16182A' }}>Google Health / Fitbit</div>
            <div style={{ fontSize: 12.5, color: 'rgba(22,24,42,0.5)', marginTop: 1 }}>
              Steps · Active minutes · Sleep · Heart rate
            </div>
          </div>
          {googleConnected && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(28,122,79,0.1)', borderRadius: 99, padding: '4px 10px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1C7A4F' }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1C7A4F' }}>Connected</span>
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(22,24,42,0.5)', fontSize: 13 }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : googleConnected ? (
          <>
            {googleConn?.errorMessage && (
              <div style={{ background: 'rgba(200,147,43,0.1)', border: '1px solid rgba(200,147,43,0.3)', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#7A5C10', marginBottom: 12 }}>
                ⚠️ {googleConn.errorMessage}
              </div>
            )}
            {googleConn?.lastSyncedAt && (
              <p style={{ fontSize: 12, color: 'rgba(22,24,42,0.5)', marginBottom: 12 }}>
                Last synced: {new Date(googleConn.lastSyncedAt).toLocaleString()}
              </p>
            )}
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              <button
                onClick={handleGoogleSync}
                disabled={googleSyncing}
                style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 12, background: '#4285F4', color: '#fff', border: 'none', padding: '10px 17px', fontSize: 13.5, fontWeight: 600, cursor: googleSyncing ? 'not-allowed' : 'pointer', opacity: googleSyncing ? 0.6 : 1 }}
              >
                <RefreshCw className={`w-4 h-4 ${googleSyncing ? 'animate-spin' : ''}`} />
                {googleSyncing ? 'Syncing…' : 'Sync now'}
              </button>
              <button
                onClick={handleGoogleDisconnect}
                style={{ borderRadius: 12, border: '1px solid rgba(22,24,42,0.18)', background: 'transparent', color: 'rgba(22,24,42,0.7)', padding: '10px 17px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Disconnect
              </button>
            </div>
            {googleMsg && (
              <p style={{ fontSize: 12.5, color: googleMsg.includes('fail') || googleMsg.includes('error') ? '#C0392B' : '#1C7A4F', marginTop: 10 }}>{googleMsg}</p>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
              {['Automatic daily step and activity sync', 'Sleep duration from Fitbit or Pixel Watch', 'Heart rate and resting heart rate', 'Works with Fitbit devices (new Fitbit = Google Health)'].map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                    <path d="M5 13l4 4L19 7" stroke="#4285F4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: 13.5, color: 'rgba(22,24,42,0.75)', lineHeight: 1.4 }}>{b}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleGoogleConnect}
              style={{ width: '100%', borderRadius: 14, background: '#4285F4', color: '#fff', border: 'none', padding: '12px 18px', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 18px -8px #4285F488' }}
            >
              Connect Google Health
            </button>
            {googleMsg && (
              <p style={{ fontSize: 12.5, color: '#C0392B', marginTop: 10 }}>{googleMsg}</p>
            )}
            <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.4)', marginTop: 11, lineHeight: 1.5 }}>
              Google Health API is the next-generation Fitbit integration. Legacy Fitbit Web API is scheduled for shutdown September 2026.
              Google Health API access requires approval at developers.google.com/health.
            </p>
          </>
        )}
      </div>

      {/* ── Apple Health card ────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,45,85,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#FF2D55" opacity=".12"/>
              <path d="M12 6c-1.1 0-2 .9-2 2v1H9c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1h-1V8c0-1.1-.9-2-2-2zm0 1.5c.28 0 .5.22.5.5V9h-1V8c0-.28.22-.5.5-.5z" fill="#FF2D55"/>
            </svg>
          </span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#16182A' }}>Apple Health</div>
            <div style={{ fontSize: 12.5, color: 'rgba(22,24,42,0.5)', marginTop: 1 }}>
              Manual export upload · Future: iOS companion app
            </div>
          </div>
          {appleImports.length > 0 && appleImports[0].status === 'completed' && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(28,122,79,0.1)', borderRadius: 99, padding: '4px 10px' }}>
              <CheckCircle className="w-3.5 h-3.5" style={{ color: '#1C7A4F' }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1C7A4F' }}>Imported</span>
            </span>
          )}
        </div>

        {/* Instructions */}
        <div style={{ background: 'rgba(1,35,116,0.04)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: 'rgba(22,24,42,0.75)', lineHeight: 1.6, margin: 0 }}>
            <strong>How to export:</strong> On your iPhone, open <strong>Health</strong> → tap your profile picture → <strong>Export All Health Data</strong> → share the <code>export.xml</code> file here.
          </p>
          <p style={{ fontSize: 12, color: 'rgba(22,24,42,0.5)', marginTop: 8, marginBottom: 0 }}>
            Note: Extract <code>export.xml</code> from the zip before uploading. Only selected data types are imported — the raw file is not stored.
          </p>
        </div>

        {!showAppleImport ? (
          <button
            onClick={() => setShowAppleImport(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 14, background: '#FF2D55', color: '#fff', border: 'none', padding: '12px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 18px -8px #FF2D5566' }}
          >
            <Upload className="w-4 h-4" />
            Upload Apple Health export
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Data type selector */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#16182A', marginBottom: 10 }}>Choose what to import:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {APPLE_DATA_TYPES.map(type => {
                  const isSelected = selectedTypes.has(type.id);
                  const isSensitive = type.id === 'weight_kg' || type.id === 'blood_glucose';
                  return (
                    <button
                      key={type.id}
                      onClick={() => toggleType(type.id)}
                      style={{
                        borderRadius: 99,
                        border: `1.5px solid ${isSelected ? '#FF2D55' : 'rgba(22,24,42,0.18)'}`,
                        background: isSelected ? 'rgba(255,45,85,0.08)' : 'transparent',
                        color: isSelected ? '#FF2D55' : 'rgba(22,24,42,0.65)',
                        padding: '6px 13px',
                        fontSize: 13,
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {type.label}
                      {isSensitive && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>opt-in</span>}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.4)', marginTop: 8 }}>
                Body weight and blood glucose are off by default — enable only if you want to import them.
              </p>
            </div>

            {/* Consent note */}
            <div style={{ background: 'rgba(200,147,43,0.08)', border: '1px solid rgba(200,147,43,0.25)', borderRadius: 10, padding: '10px 13px' }}>
              <p style={{ fontSize: 12.5, color: '#7A5C10', margin: 0, lineHeight: 1.55 }}>
                Chatita will only import the data types you selected above. This data helps personalize supportive insights about meals, movement, sleep, mood, and glucose patterns. Chatita does not diagnose, prescribe, or replace medical care.
              </p>
            </div>

            {/* File picker */}
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".xml,.zip"
                style={{ fontSize: 13, color: '#16182A' }}
              />
              <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.4)', marginTop: 6 }}>
                Maximum file size: {process.env.NEXT_PUBLIC_HEALTH_IMPORT_MAX_MB || 50} MB
              </p>
            </div>

            <div style={{ display: 'flex', gap: 9 }}>
              <button
                onClick={handleAppleImport}
                disabled={importing}
                style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, background: '#FF2D55', color: '#fff', border: 'none', padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.6 : 1 }}
              >
                {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : <><Upload className="w-4 h-4" /> Import</>}
              </button>
              <button
                onClick={() => { setShowAppleImport(false); setImportError(''); setImportMsg(''); }}
                style={{ borderRadius: 12, border: '1px solid rgba(22,24,42,0.18)', background: 'transparent', color: 'rgba(22,24,42,0.7)', padding: '10px 17px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>

            {importError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(192,57,43,0.07)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 10, padding: '10px 13px' }}>
                <XCircle className="w-4 h-4" style={{ color: '#C0392B', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#C0392B' }}>{importError}</span>
              </div>
            )}
          </div>
        )}

        {importMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(28,122,79,0.07)', border: '1px solid rgba(28,122,79,0.2)', borderRadius: 10, padding: '10px 13px', marginTop: 12 }}>
            <CheckCircle className="w-4 h-4" style={{ color: '#1C7A4F', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#1C7A4F' }}>{importMsg}</span>
          </div>
        )}

        {/* Import history */}
        {appleImports.length > 0 && (
          <div style={{ marginTop: 16, borderTop: '1px solid rgba(22,24,42,0.07)', paddingTop: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(22,24,42,0.5)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recent imports</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {appleImports.slice(0, 3).map(imp => (
                <div key={imp.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  {imp.status === 'completed' ? (
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: '#1C7A4F', flexShrink: 0 }} />
                  ) : imp.status === 'failed' ? (
                    <XCircle className="w-3.5 h-3.5" style={{ color: '#C0392B', flexShrink: 0 }} />
                  ) : (
                    <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(22,24,42,0.4)', flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 12.5, color: 'rgba(22,24,42,0.65)' }}>
                    {imp.filename ?? 'export.xml'} — {imp.status}
                    {imp.recordsProcessed != null ? ` (${imp.recordsProcessed.toLocaleString()} records)` : ''}
                    {' · '}{new Date(imp.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.4)', marginTop: 14, lineHeight: 1.5 }}>
          Direct Apple Health sync requires an iOS companion app (planned for a future release).
          See the export upload flow above in the meantime.
        </p>
      </div>

      {/* ── Manual logging card ─────────────────────────────────────────────── */}
      <div style={{ ...card, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#16182A', marginBottom: 10 }}>Manual logging</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { label: 'Movement', href: '/' },
            { label: 'Sleep', href: '/' },
            { label: 'Glucose', href: '/glucose' },
            { label: 'Meals', href: '/' },
            { label: 'Mood', href: '/' },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              style={{ borderRadius: 99, border: '1.5px solid rgba(1,35,116,0.18)', background: 'transparent', color: 'rgba(22,24,42,0.7)', padding: '6px 14px', fontSize: 13, fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}
            >
              {item.label}
            </a>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(22,24,42,0.45)', marginTop: 11, lineHeight: 1.5 }}>
          Chatita works great without any connected device. Log movement, sleep, meals, mood, and glucose whenever it feels helpful.
        </p>
      </div>
    </div>
  );
}
