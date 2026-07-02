'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';

const ACTIVITY_TYPE_VALUES = [
  'walking', 'chores', 'dancing', 'gym', 'strength_training', 'sports',
  'physical_work', 'chair_exercises', 'stretching_yoga', 'biking', 'swimming',
  'not_active', 'other',
] as const;

const INTENSITY_VALUES = ['light', 'moderate', 'vigorous', 'not_sure'] as const;

interface MovementSummary {
  steps?: number;
  activeMinutes?: number;
  lastActivityLabel?: string;
  lastActivityTime?: string;
  lastActivityNotes?: string;
}

interface Props {
  lastMealId?: string;
  /** Open straight into the logging form (used when shown inside a modal). */
  defaultOpen?: boolean;
}

function DancerIcon({ color = '#2A8A8A' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="14.5" cy="5" r="1.8" stroke={color} strokeWidth="1.7"/>
      <path d="M14 7l-2 6M14.5 8l3-3M13.5 9l-3 1M12 13l-3 6M12 13l3 4" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function MovementCard({ lastMealId, defaultOpen = false }: Props) {
  const { t, language } = useTranslation();
  const [summary, setSummary]   = useState<MovementSummary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(defaultOpen);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const [form, setForm] = useState({
    activityType: '',
    activityMinutes: '',
    activityIntensity: '',
    steps: '',
    relatedToMeal: false,
    energyAfter: '',
    notes: '',
  });

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    fetch(`/api/activity?date=${today}&limit=20`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.logs?.length) {
          const logs = d.logs;
          const steps = logs.reduce((s: number, l: any) => s + (l.steps || 0), 0);
          const activeMin = logs.reduce((s: number, l: any) => s + (l.activityMinutes || 0), 0);
          const last = logs[0];
          const lastTime = last.date ? new Date(last.date).toLocaleTimeString(language === 'es' ? 'es-MX' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : undefined;
          setSummary({
            steps: steps || undefined,
            activeMinutes: activeMin || undefined,
            lastActivityLabel: (t.movement.types as Record<string, string>)[last.activityType] ?? last.activityType,
            lastActivityTime: lastTime,
            lastActivityNotes: last.notes,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [saved]);

  const handleSave = async () => {
    if (!form.activityType && !form.activityMinutes && !form.steps) return;
    setSaving(true);
    try {
      await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: form.activityType || undefined,
          activityMinutes: form.activityMinutes ? Number(form.activityMinutes) : undefined,
          activityIntensity: form.activityIntensity || undefined,
          steps: form.steps ? Number(form.steps) : undefined,
          relatedToMeal: form.relatedToMeal,
          mealId: form.relatedToMeal && lastMealId ? lastMealId : undefined,
          mealTiming: form.relatedToMeal ? 'after_meal' : undefined,
          notes: form.notes || undefined,
        }),
      });
      setSaved(true);
      setShowForm(false);
      setForm({ activityType: '', activityMinutes: '', activityIntensity: '', steps: '', relatedToMeal: false, energyAfter: '', notes: '' });
      setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      background: '#FFFDF9',
      borderRadius: '18px',
      border: '1px solid rgba(42,138,138,0.22)',
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(42,138,138,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DancerIcon />
          </span>
          <div style={{ flex: 1 }}>
            <div className="font-serif-italic" style={{ fontSize: '18px', color: '#012374', lineHeight: 1 }}>{t.movement.title}</div>
            {!loading && (
              <div style={{ fontSize: '11px', color: 'rgba(22,24,42,0.5)', marginTop: '2px' }}>{t.movement.subtitle}</div>
            )}
          </div>
          {saved && <span style={{ fontSize: '11.5px', color: '#2A8A8A', fontWeight: 600 }}>{t.movement.savedCheck}</span>}
        </div>
      </div>

      {/* ── Summary / empty state ── */}
      {!loading && !showForm && (
        <div style={{ padding: '12px 16px 0' }}>
          {summary ? (
            <>
              {/* Stats row */}
              {(summary.steps || summary.activeMinutes) && (
                <div style={{ display: 'flex', gap: '9px', marginBottom: '10px' }}>
                  {summary.steps !== undefined && (
                    <div style={{ flex: 1, background: '#F7EFE1', borderRadius: '12px', padding: '11px 12px' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(22,24,42,0.55)', fontWeight: 600 }}>{t.movement.steps}</div>
                      <div style={{ marginTop: '2px' }}>
                        <span className="font-serif-italic" style={{ fontSize: '22px', color: '#2A8A8A' }}>
                          {summary.steps.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                  {summary.activeMinutes !== undefined && summary.activeMinutes > 0 && (
                    <div style={{ flex: 1, background: '#F7EFE1', borderRadius: '12px', padding: '11px 12px' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(22,24,42,0.55)', fontWeight: 600 }}>{t.movement.activeMin}</div>
                      <div style={{ marginTop: '2px' }}>
                        <span className="font-serif-italic" style={{ fontSize: '22px', color: '#2A8A8A' }}>
                          {summary.activeMinutes}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Last activity */}
              {summary.lastActivityLabel && (
                <div style={{ background: '#F7EFE1', borderRadius: '12px', padding: '11px 13px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(42,138,138,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DancerIcon color="#2A8A8A" />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#16182A' }}>{summary.lastActivityLabel}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(22,24,42,0.55)' }}>
                      {t.movement.lastLogged}{summary.lastActivityTime ? ` · ${summary.lastActivityTime}` : ''}
                      {summary.lastActivityNotes ? ` · ${summary.lastActivityNotes}` : ''}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: '#F7EFE1', borderRadius: '13px', padding: '15px 16px', marginBottom: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#012374' }}>{t.movement.emptyTitle}</div>
              <div style={{ fontSize: '13px', color: 'rgba(22,24,42,0.68)', marginTop: '5px', lineHeight: 1.5 }}>
                {t.movement.emptyBody}
              </div>
            </div>
          )}

          {/* Add movement button */}
          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: '#2A8A8A', color: '#FFFDF9', borderRadius: '12px', padding: '12px',
              fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: '14px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#FFFDF9" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            {t.movement.addButton}
          </button>
        </div>
      )}

      {/* ── Add movement form ── */}
      {showForm && (
        <div style={{ padding: '14px 16px 16px', borderTop: '1px solid rgba(42,138,138,0.12)' }}>
          <p style={{ fontSize: '12px', color: 'rgba(22,24,42,0.55)', lineHeight: 1.5, marginBottom: '12px' }}>
            {t.movement.formIntro}
          </p>

          {/* Activity chips */}
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', marginBottom: '8px' }}>{t.movement.whatKind}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {ACTIVITY_TYPE_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm(f => ({ ...f, activityType: f.activityType === value ? '' : value }))}
                style={{
                  padding: '6px 13px', borderRadius: '999px', fontSize: '12.5px',
                  border: form.activityType === value ? '1.5px solid #2A8A8A' : '1.5px solid rgba(1,35,116,0.18)',
                  background: form.activityType === value ? '#2A8A8A' : 'transparent',
                  color: form.activityType === value ? '#FFFDF9' : '#012374',
                  cursor: 'pointer',
                }}
              >{t.movement.types[value]}</button>
            ))}
          </div>

          {/* Minutes + intensity */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>{t.movement.minutes}</label>
              <input type="number" min={1} max={480} value={form.activityMinutes} onChange={e => setForm(f => ({ ...f, activityMinutes: e.target.value }))} placeholder={t.movement.minutesPlaceholder}
                style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>{t.movement.feel}</label>
              <select value={form.activityIntensity} onChange={e => setForm(f => ({ ...f, activityIntensity: e.target.value }))}
                style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }}>
                <option value="">{t.movement.feelPlaceholder}</option>
                {INTENSITY_VALUES.map(v => <option key={v} value={v}>{t.movement.intensity[v]}</option>)}
              </select>
            </div>
          </div>

          {/* Steps */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>{t.movement.steps} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{t.movement.optional}</span></label>
            <input type="number" min={0} value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))} placeholder={t.movement.stepsPlaceholder}
              style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }} />
          </div>

          {/* After meal toggle */}
          {lastMealId && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '10px' }}>
              <input type="checkbox" checked={form.relatedToMeal} onChange={e => setForm(f => ({ ...f, relatedToMeal: e.target.checked }))} />
              <span style={{ fontSize: '13px', color: '#16182A' }}>{t.movement.afterMeal}</span>
            </label>
          )}

          {/* Notes */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>{t.movement.notes} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{t.movement.optional}</span></label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t.movement.notesPlaceholder} rows={2}
              style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setShowForm(false)}
              style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#F7EFE1', color: '#012374', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              {t.common.cancel}
            </button>
            <button type="button" onClick={handleSave} disabled={saving || (!form.activityType && !form.activityMinutes && !form.steps)}
              style={{ flex: 2, padding: '11px', borderRadius: '12px', background: saving ? 'rgba(42,138,138,0.5)' : '#2A8A8A', color: '#FFFDF9', fontSize: '14px', fontWeight: 600, border: 'none', cursor: saving ? 'default' : 'pointer' }}>
              {saving ? t.movement.saving : t.movement.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
