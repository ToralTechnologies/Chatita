'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';

const QUALITY_VALUES = ['great', 'good', 'fair', 'poor', 'not_sure'] as const;

interface SleepSummary {
  durationLabel?: string;
  quality?: string;
  wakeEnergy?: number;
}

function MoonIcon({ color = '#4A5578' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M20 14a8 8 0 1 1-9.5-9 6.5 6.5 0 0 0 9.5 9z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

function formatDuration(start: string, end: string): string {
  try {
    const s = new Date(start), e = new Date(end);
    const mins = Math.round((e.getTime() - s.getTime()) / 60000);
    const h = Math.floor(mins / 60), m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  } catch { return ''; }
}

export default function SleepCard({ defaultOpen = false }: { defaultOpen?: boolean } = {}) {
  const { t } = useTranslation();
  const [summary, setSummary]   = useState<SleepSummary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(defaultOpen);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const [form, setForm] = useState({
    sleepStart: '',
    wakeTime: '',
    sleepQuality: '',
    wakeEnergy: 0,
    nighttimeWakeups: '',
    stressBeforeBed: 0,
    caffeineLaterInDay: false,
    notes: '',
  });

  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    fetch(`/api/sleep?date=${today}&limit=1`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const log = d?.logs?.[0];
        if (log) {
          setSummary({
            durationLabel: log.sleepStart && log.wakeTime ? formatDuration(log.sleepStart, log.wakeTime)
              : log.totalSleepMinutes ? `${Math.floor(log.totalSleepMinutes / 60)}h ${log.totalSleepMinutes % 60}m`
              : undefined,
            quality: log.sleepQuality,
            wakeEnergy: log.wakeEnergy,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [saved]);

  const handleSave = async () => {
    if (!form.sleepQuality && !form.sleepStart && !form.wakeEnergy) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleepStart: form.sleepStart ? `${today}T${form.sleepStart}` : undefined,
          wakeTime:   form.wakeTime   ? `${today}T${form.wakeTime}`   : undefined,
          sleepQuality: form.sleepQuality || undefined,
          wakeEnergy: form.wakeEnergy || undefined,
          nighttimeWakeups: form.nighttimeWakeups !== '' ? Number(form.nighttimeWakeups) : undefined,
          stressBeforeBed: form.stressBeforeBed || undefined,
          caffeineLaterInDay: form.caffeineLaterInDay,
          notes: form.notes || undefined,
        }),
      });
      setSaved(true);
      setShowForm(false);
      setForm({ sleepStart: '', wakeTime: '', sleepQuality: '', wakeEnergy: 0, nighttimeWakeups: '', stressBeforeBed: 0, caffeineLaterInDay: false, notes: '' });
      setTimeout(() => setSaved(false), 4000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div style={{
      background: '#FFFDF9',
      borderRadius: '18px',
      border: '1px solid rgba(74,85,120,0.22)',
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(74,85,120,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MoonIcon />
          </span>
          <div style={{ flex: 1 }}>
            <div className="font-serif-italic" style={{ fontSize: '18px', color: '#012374', lineHeight: 1 }}>{t.sleepCard.title}</div>
            <div style={{ fontSize: '11px', color: 'rgba(22,24,42,0.5)', marginTop: '2px' }}>{t.sleepCard.subtitle}</div>
          </div>
          {saved && <span style={{ fontSize: '11.5px', color: '#4A5578', fontWeight: 600 }}>{t.sleepCard.savedCheck}</span>}
        </div>
      </div>

      {/* ── Summary / empty state ── */}
      {!loading && !showForm && (
        <div style={{ padding: '12px 16px 0' }}>
          {summary ? (
            <>
              <div style={{ display: 'flex', gap: '9px', marginBottom: '10px' }}>
                {summary.durationLabel && (
                  <div style={{ flex: 1, background: '#F7EFE1', borderRadius: '12px', padding: '11px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(22,24,42,0.55)', fontWeight: 600 }}>{t.sleepCard.slept}</div>
                    <div style={{ marginTop: '2px' }}>
                      <span className="font-serif-italic" style={{ fontSize: '20px', color: '#4A5578' }}>{summary.durationLabel}</span>
                    </div>
                  </div>
                )}
                {summary.quality && (
                  <div style={{ flex: 1, background: '#F7EFE1', borderRadius: '12px', padding: '11px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(22,24,42,0.55)', fontWeight: 600 }}>{t.sleepCard.quality}</div>
                    <div style={{ marginTop: '2px' }}>
                      <span className="font-serif-italic" style={{ fontSize: '20px', color: '#4A5578' }}>{(t.sleepCard.qualityOptions as Record<string, string>)[summary.quality] ?? summary.quality}</span>
                    </div>
                  </div>
                )}
                {summary.wakeEnergy !== undefined && summary.wakeEnergy > 0 && (
                  <div style={{ flex: 1, background: '#F7EFE1', borderRadius: '12px', padding: '11px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(22,24,42,0.55)', fontWeight: 600 }}>{t.sleepCard.amEnergy}</div>
                    <div style={{ marginTop: '2px' }}>
                      <span className="font-serif-italic" style={{ fontSize: '20px', color: '#4A5578' }}>{summary.wakeEnergy}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(22,24,42,0.5)' }}>/10</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ background: '#F7EFE1', borderRadius: '13px', padding: '14px 15px', marginBottom: '10px' }}>
              <div style={{ fontSize: '13.5px', color: '#012374', lineHeight: 1.5 }}>
                {t.sleepCard.emptyBody}
              </div>
            </div>
          )}

          {/* Log sleep button */}
          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: '#F7EFE1', color: '#4A5578', borderRadius: '12px', padding: '12px',
              fontSize: '13.5px', fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: '14px',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#4A5578" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            {t.sleepCard.logButton}
          </button>
        </div>
      )}

      {/* ── Log sleep form ── */}
      {showForm && (
        <div style={{ padding: '14px 16px 16px', borderTop: '1px solid rgba(74,85,120,0.12)' }}>
          <p style={{ fontSize: '12px', color: 'rgba(22,24,42,0.55)', lineHeight: 1.5, marginBottom: '12px' }}>
            {t.sleepCard.formIntro}
          </p>

          {/* Times */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>{t.sleepCard.bedtime}</label>
              <input type="time" value={form.sleepStart} onChange={e => set('sleepStart', e.target.value)}
                style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>{t.sleepCard.wakeTime}</label>
              <input type="time" value={form.wakeTime} onChange={e => set('wakeTime', e.target.value)}
                style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }} />
            </div>
          </div>

          {/* Quality chips */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '8px' }}>{t.sleepCard.sleepQuality}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {QUALITY_VALUES.map(q => (
                <button key={q} type="button" onClick={() => set('sleepQuality', form.sleepQuality === q ? '' : q)}
                  style={{
                    padding: '6px 13px', borderRadius: '999px', fontSize: '12.5px',
                    border: form.sleepQuality === q ? '1.5px solid #4A5578' : '1.5px solid rgba(1,35,116,0.18)',
                    background: form.sleepQuality === q ? '#4A5578' : 'transparent',
                    color: form.sleepQuality === q ? '#FFFDF9' : '#012374',
                    cursor: 'pointer',
                  }}>{t.sleepCard.qualityOptions[q]}</button>
              ))}
            </div>
          </div>

          {/* Wake energy */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '7px' }}>
              {t.sleepCard.wakeEnergy}
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} type="button" onClick={() => set('wakeEnergy', n)}
                  style={{
                    width: '28px', height: '28px', borderRadius: '8px', fontSize: '12px',
                    border: form.wakeEnergy === n ? '2px solid #4A5578' : '1.5px solid rgba(1,35,116,0.2)',
                    background: form.wakeEnergy === n ? '#4A5578' : 'transparent',
                    color: form.wakeEnergy === n ? '#FFFDF9' : '#012374',
                    cursor: 'pointer', fontWeight: form.wakeEnergy === n ? 700 : 400,
                  }}>{n}</button>
              ))}
            </div>
          </div>

          {/* Night wakeups */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>{t.sleepCard.nightWakeups}</label>
              <input type="number" min={0} max={20} value={form.nighttimeWakeups} onChange={e => set('nighttimeWakeups', e.target.value)} placeholder="0"
                style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '7px' }}>{t.sleepCard.stressBeforeBed}</label>
              <select value={form.stressBeforeBed} onChange={e => set('stressBeforeBed', Number(e.target.value))}
                style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }}>
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n === 0 ? t.sleepCard.none : n}</option>)}
              </select>
            </div>
          </div>

          {/* Caffeine */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '10px' }}>
            <input type="checkbox" checked={form.caffeineLaterInDay} onChange={e => set('caffeineLaterInDay', e.target.checked)} />
            <span style={{ fontSize: '13px', color: '#16182A' }}>{t.sleepCard.caffeine}</span>
          </label>

          {/* Notes */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>{t.sleepCard.notes} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{t.sleepCard.optional}</span></label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder={t.sleepCard.notesPlaceholder} rows={2}
              style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setShowForm(false)}
              style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#F7EFE1', color: '#012374', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              {t.common.cancel}
            </button>
            <button type="button" onClick={handleSave} disabled={saving || (!form.sleepQuality && !form.sleepStart && !form.wakeEnergy)}
              style={{ flex: 2, padding: '11px', borderRadius: '12px', background: saving ? 'rgba(74,85,120,0.5)' : '#4A5578', color: '#FFFDF9', fontSize: '14px', fontWeight: 600, border: 'none', cursor: saving ? 'default' : 'pointer' }}>
              {saving ? t.sleepCard.saving : t.sleepCard.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
