'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, Pencil, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { vocab } from '@/lib/i18n/vocab';

const CYCLE_LENGTH_MIN = 15;
const CYCLE_LENGTH_MAX = 60;
const PERIOD_LENGTH_MIN = 1;
const PERIOD_LENGTH_MAX = 14;

interface SleepBodyProfile {
  tracksSleep?: boolean;
  sleepGoalHours?: number | null;
  typicalBedtime?: string | null;
  typicalWakeTime?: string | null;
  sleepTrackingNotes?: string | null;
  tracksMenstrualCycle?: boolean;
  typicalCycleLength?: number | null;
  typicalPeriodLength?: number | null;
  cycleTrackingNotes?: string | null;
}

interface FormState {
  tracksSleep: boolean;
  sleepGoalHours: string;
  typicalBedtime: string;
  typicalWakeTime: string;
  sleepTrackingNotes: string;
  tracksMenstrualCycle: boolean;
  typicalCycleLength: string;
  typicalPeriodLength: string;
  cycleTrackingNotes: string;
}

function profileToForm(p: SleepBodyProfile): FormState {
  return {
    tracksSleep: p.tracksSleep !== false,
    sleepGoalHours: p.sleepGoalHours?.toString() ?? '',
    typicalBedtime: p.typicalBedtime ?? '',
    typicalWakeTime: p.typicalWakeTime ?? '',
    sleepTrackingNotes: p.sleepTrackingNotes ?? '',
    tracksMenstrualCycle: p.tracksMenstrualCycle ?? false,
    typicalCycleLength: p.typicalCycleLength?.toString() ?? '',
    typicalPeriodLength: p.typicalPeriodLength?.toString() ?? '',
    cycleTrackingNotes: p.cycleTrackingNotes ?? '',
  };
}

export default function SleepBodyProfileCard() {
  const { language } = useTranslation();
  const [profile, setProfile] = useState<SleepBodyProfile>({});
  const [form, setForm] = useState<FormState>(profileToForm({}));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user) {
          const p: SleepBodyProfile = {
            tracksSleep: data.user.tracksSleep,
            sleepGoalHours: data.user.sleepGoalHours,
            typicalBedtime: data.user.typicalBedtime,
            typicalWakeTime: data.user.typicalWakeTime,
            sleepTrackingNotes: data.user.sleepTrackingNotes,
            tracksMenstrualCycle: data.user.tracksMenstrualCycle,
            typicalCycleLength: data.user.typicalCycleLength,
            typicalPeriodLength: data.user.typicalPeriodLength,
            cycleTrackingNotes: data.user.cycleTrackingNotes,
          };
          setProfile(p);
          setForm(profileToForm(p));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        tracksSleep: form.tracksSleep,
        sleepGoalHours: form.sleepGoalHours ? Number(form.sleepGoalHours) : null,
        typicalBedtime: form.typicalBedtime || null,
        typicalWakeTime: form.typicalWakeTime || null,
        sleepTrackingNotes: form.sleepTrackingNotes || null,
        tracksMenstrualCycle: form.tracksMenstrualCycle,
        typicalCycleLength: form.tracksMenstrualCycle && form.typicalCycleLength ? Number(form.typicalCycleLength) : null,
        typicalPeriodLength: form.tracksMenstrualCycle && form.typicalPeriodLength ? Number(form.typicalPeriodLength) : null,
        cycleTrackingNotes: form.tracksMenstrualCycle && form.cycleTrackingNotes ? form.cycleTrackingNotes : null,
      };

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      if (data.user) {
        const p: SleepBodyProfile = {
          tracksSleep: data.user.tracksSleep,
          sleepGoalHours: data.user.sleepGoalHours,
          typicalBedtime: data.user.typicalBedtime,
          typicalWakeTime: data.user.typicalWakeTime,
          sleepTrackingNotes: data.user.sleepTrackingNotes,
          tracksMenstrualCycle: data.user.tracksMenstrualCycle,
          typicalCycleLength: data.user.typicalCycleLength,
          typicalPeriodLength: data.user.typicalPeriodLength,
          cycleTrackingNotes: data.user.cycleTrackingNotes,
        };
        setProfile(p);
        setForm(profileToForm(p));
      }
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(profileToForm(profile));
    setEditing(false);
  };

  const s = (k: keyof FormState, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return (
    <div className="rounded-card shadow-card p-6 flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-muted)' }} />
    </div>
  );

  return (
    <div className="rounded-card shadow-card p-6" style={{ background: 'var(--bg-card)', border: 'var(--border-card)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{vocab('Sleep & Body Patterns', language)}</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{vocab('Sleep tracking and optional cycle patterns', language)}</p>
        </div>
        {saved && <Check className="w-4 h-4 text-green-500" />}
        {!editing ? (
          <button onClick={() => setEditing(true)} className="p-2 rounded-lg hover:bg-primary/5 transition-colors">
            <Pencil className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        ) : (
          <button onClick={handleCancel} className="p-2 rounded-lg hover:bg-primary/5 transition-colors">
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p>{vocab('Sleep tracking', language)}: <span className="font-medium">{vocab(profile.tracksSleep !== false ? 'Enabled' : 'Disabled', language)}</span></p>
          {profile.sleepGoalHours && <p>{vocab('Sleep goal', language)}: <span className="font-medium">{profile.sleepGoalHours}h/night</span></p>}
          {profile.typicalBedtime && <p>{vocab('Typical bedtime', language)}: <span className="font-medium">{profile.typicalBedtime}</span></p>}
          {profile.typicalWakeTime && <p>{vocab('Typical wake time', language)}: <span className="font-medium">{profile.typicalWakeTime}</span></p>}
          {profile.sleepTrackingNotes && <p>{vocab('Notes', language)}: <span className="font-medium">{profile.sleepTrackingNotes}</span></p>}

          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-card)' }}>
            <p>{vocab('Cycle tracking', language)}: <span className="font-medium">{vocab(profile.tracksMenstrualCycle ? 'Enabled' : 'Not enabled', language)}</span></p>
            {profile.tracksMenstrualCycle && profile.typicalCycleLength && (
              <p>{vocab('Typical cycle length', language)}: <span className="font-medium">{profile.typicalCycleLength} days</span></p>
            )}
            {profile.tracksMenstrualCycle && profile.typicalPeriodLength && (
              <p>{vocab('Typical period length', language)}: <span className="font-medium">{profile.typicalPeriodLength} days</span></p>
            )}
          </div>

          {!profile.tracksMenstrualCycle && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Cycle tracking is optional. Enable it above to track cycle patterns alongside meals, mood, and glucose.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sleep section */}
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Sleep</p>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.tracksSleep} onChange={(e) => s('tracksSleep', e.target.checked)} />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Enable sleep tracking</span>
          </label>

          {form.tracksSleep && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Sleep goal (hours/night)</label>
                <input
                  type="number" min={3} max={14} step={0.5}
                  value={form.sleepGoalHours}
                  onChange={(e) => s('sleepGoalHours', e.target.value)}
                  placeholder="e.g. 7.5"
                  className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Typical bedtime</label>
                  <input
                    type="time"
                    value={form.typicalBedtime}
                    onChange={(e) => s('typicalBedtime', e.target.value)}
                    className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Typical wake time</label>
                  <input
                    type="time"
                    value={form.typicalWakeTime}
                    onChange={(e) => s('typicalWakeTime', e.target.value)}
                    className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Sleep notes</label>
                <textarea
                  value={form.sleepTrackingNotes}
                  onChange={(e) => s('sleepTrackingNotes', e.target.value)}
                  rows={2} placeholder="e.g. trouble falling asleep, shift worker..."
                  className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                />
              </div>
            </>
          )}

          {/* Cycle section */}
          <div className="pt-3 border-t" style={{ borderColor: 'var(--border-card)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Menstrual cycle tracking, if relevant to you</p>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Cycle tracking is optional. You control whether Chatita uses this information for insights.
            </p>

            <label className="flex items-center gap-2 cursor-pointer mb-4">
              <input type="checkbox" checked={form.tracksMenstrualCycle} onChange={(e) => s('tracksMenstrualCycle', e.target.checked)} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Enable menstrual cycle tracking</span>
            </label>

            {form.tracksMenstrualCycle && (
              <div className="space-y-3 pl-4 border-l-2" style={{ borderColor: 'rgba(1,35,116,0.15)' }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Typical cycle length <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(days)</span></label>
                    <input
                      type="number" min={CYCLE_LENGTH_MIN} max={CYCLE_LENGTH_MAX}
                      value={form.typicalCycleLength}
                      onChange={(e) => s('typicalCycleLength', e.target.value)}
                      placeholder="e.g. 28"
                      className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Typical period length <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(days)</span></label>
                    <input
                      type="number" min={PERIOD_LENGTH_MIN} max={PERIOD_LENGTH_MAX}
                      value={form.typicalPeriodLength}
                      onChange={(e) => s('typicalPeriodLength', e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Cycle notes</label>
                  <textarea
                    value={form.cycleTrackingNotes}
                    onChange={(e) => s('cycleTrackingNotes', e.target.value)}
                    rows={2} placeholder="e.g. glucose tends to run higher before period..."
                    className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 text-sm font-semibold transition-opacity"
            style={{ background: '#012374', color: '#FFFDF9', borderRadius: '12px', border: 'none', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving…</span> : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}
