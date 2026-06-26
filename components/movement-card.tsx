'use client';

import { useState } from 'react';

const ACTIVITY_TYPES = [
  { value: 'walking', label: 'Walking' },
  { value: 'chores', label: 'Chores' },
  { value: 'dancing', label: 'Dancing' },
  { value: 'gym', label: 'Gym' },
  { value: 'strength_training', label: 'Strength' },
  { value: 'sports', label: 'Sports' },
  { value: 'physical_work', label: 'Physical work' },
  { value: 'chair_exercises', label: 'Chair exercises' },
  { value: 'stretching_yoga', label: 'Stretching / yoga' },
  { value: 'biking', label: 'Biking' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'other', label: 'Other' },
];

const INTENSITY = [
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'vigorous', label: 'Vigorous' },
  { value: 'not_sure', label: 'Not sure' },
];

interface Props {
  lastMealId?: string;
}

export default function MovementCard({ lastMealId }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    activityType: '',
    activityMinutes: '',
    activityIntensity: '',
    steps: '',
    relatedToMeal: false,
    notes: '',
  });

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
      setOpen(false);
      setForm({ activityType: '', activityMinutes: '', activityIntensity: '', steps: '', relatedToMeal: false, notes: '' });
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: '#FFFDF9',
        borderRadius: '18px',
        border: '1px solid rgba(1,35,116,0.06)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ textAlign: 'left' }}
      >
        <div className="flex items-center gap-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M13 4.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" stroke="#012374" strokeWidth="1.6"/>
            <path d="M7.5 11.5l1 2.5 3.5 1.5 2-3.5M10.5 14l-1 5M14 14.5l1.5 4.5" stroke="#012374" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#012374' }}>Log movement</div>
            <div style={{ fontSize: '11.5px', color: 'rgba(22,24,42,0.55)', marginTop: '1px' }}>
              {saved ? '✓ Saved!' : 'Walking, chores, gym, anything counts'}
            </div>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6" stroke="#012374" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(1,35,116,0.06)' }}>
          {/* Activity type chips */}
          <div className="pt-3">
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', marginBottom: '8px' }}>What kind?</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, activityType: f.activityType === t.value ? '' : t.value }))}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '12.5px',
                    border: form.activityType === t.value ? '1.5px solid #012374' : '1.5px solid rgba(1,35,116,0.18)',
                    background: form.activityType === t.value ? '#012374' : 'transparent',
                    color: form.activityType === t.value ? '#FFFDF9' : '#012374',
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Minutes + intensity */}
          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>Minutes</label>
              <input
                type="number"
                min={1}
                max={480}
                value={form.activityMinutes}
                onChange={(e) => setForm((f) => ({ ...f, activityMinutes: e.target.value }))}
                placeholder="e.g. 20"
                style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>Feel</label>
              <select
                value={form.activityIntensity}
                onChange={(e) => setForm((f) => ({ ...f, activityIntensity: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }}
              >
                <option value="">— How was it? —</option>
                {INTENSITY.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
          </div>

          {/* Steps */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>Steps <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <input
              type="number"
              min={0}
              value={form.steps}
              onChange={(e) => setForm((f) => ({ ...f, steps: e.target.value }))}
              placeholder="e.g. 3000"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }}
            />
          </div>

          {/* After a meal toggle */}
          {lastMealId && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.relatedToMeal}
                onChange={(e) => setForm((f) => ({ ...f, relatedToMeal: e.target.checked }))}
              />
              <span style={{ fontSize: '13px', color: '#16182A' }}>This was after my last meal</span>
            </label>
          )}

          {/* Notes */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>Notes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="How did it feel? Any observations..."
              rows={2}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none', resize: 'none' }}
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (!form.activityType && !form.activityMinutes && !form.steps)}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '12px',
              background: '#012374',
              color: '#FFFDF9',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save movement'}
          </button>
        </div>
      )}
    </div>
  );
}
