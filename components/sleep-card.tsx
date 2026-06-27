'use client';

import { useState } from 'react';

const QUALITY_OPTIONS = [
  { value: 'great', label: 'Great', emoji: '😴' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'fair', label: 'Fair', emoji: '😐' },
  { value: 'poor', label: 'Poor', emoji: '😞' },
  { value: 'not_sure', label: 'Not sure', emoji: '🤷' },
];

function ScaleRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '6px' }}>{label}</label>
      <div className="flex gap-1.5">
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            style={{
              width: '28px', height: '28px', borderRadius: '8px', fontSize: '12px',
              border: value === n ? '2px solid #012374' : '1.5px solid rgba(1,35,116,0.2)',
              background: value === n ? '#012374' : 'transparent',
              color: value === n ? '#FFFDF9' : '#012374',
              cursor: 'pointer', fontWeight: value === n ? 700 : 400,
            }}
          >{n}</button>
        ))}
      </div>
    </div>
  );
}

export default function SleepCard() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.sleepQuality && !form.sleepStart && !form.wakeEnergy) return;
    setSaving(true);
    try {
      await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleepStart: form.sleepStart ? `${new Date().toISOString().slice(0, 10)}T${form.sleepStart}` : undefined,
          wakeTime: form.wakeTime ? `${new Date().toISOString().slice(0, 10)}T${form.wakeTime}` : undefined,
          sleepQuality: form.sleepQuality || undefined,
          wakeEnergy: form.wakeEnergy || undefined,
          nighttimeWakeups: form.nighttimeWakeups !== '' ? Number(form.nighttimeWakeups) : undefined,
          stressBeforeBed: form.stressBeforeBed || undefined,
          caffeineLaterInDay: form.caffeineLaterInDay,
          notes: form.notes || undefined,
        }),
      });
      setSaved(true);
      setOpen(false);
      setForm({ sleepStart: '', wakeTime: '', sleepQuality: '', wakeEnergy: 0, nighttimeWakeups: '', stressBeforeBed: 0, caffeineLaterInDay: false, notes: '' });
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.06)', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ textAlign: 'left' }}
      >
        <div className="flex items-center gap-3">
          {/* Moon icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" stroke="#012374" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#012374' }}>Log sleep</div>
            <div style={{ fontSize: '11.5px', color: 'rgba(22,24,42,0.55)', marginTop: '1px' }}>
              {saved ? '✓ Saved!' : 'Sleep affects energy, appetite, mood, and glucose'}
            </div>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6" stroke="#012374" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid rgba(1,35,116,0.06)' }}>
          <p className="pt-3" style={{ fontSize: '11.5px', color: 'rgba(1,35,116,0.5)', lineHeight: 1.5 }}>
            Sleep can affect hunger, cravings, energy, mood, and glucose. This helps Chatita notice patterns over time.
          </p>

          {/* Times */}
          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>Bedtime</label>
              <input
                type="time"
                value={form.sleepStart}
                onChange={(e) => set('sleepStart', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>Wake time</label>
              <input
                type="time"
                value={form.wakeTime}
                onChange={(e) => set('wakeTime', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }}
              />
            </div>
          </div>

          {/* Quality */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '8px' }}>Sleep quality</label>
            <div className="flex flex-wrap gap-2">
              {QUALITY_OPTIONS.map((q) => (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => set('sleepQuality', form.sleepQuality === q.value ? '' : q.value)}
                  style={{
                    padding: '5px 12px', borderRadius: '999px', fontSize: '12.5px',
                    border: form.sleepQuality === q.value ? '1.5px solid #012374' : '1.5px solid rgba(1,35,116,0.18)',
                    background: form.sleepQuality === q.value ? '#012374' : 'transparent',
                    color: form.sleepQuality === q.value ? '#FFFDF9' : '#012374',
                    cursor: 'pointer',
                  }}
                >{q.emoji} {q.label}</button>
              ))}
            </div>
          </div>

          {/* Wake energy scale */}
          <ScaleRow label="Wake-up energy (1–10)" value={form.wakeEnergy} onChange={(v) => set('wakeEnergy', v)} />

          {/* Nighttime wakeups + stress */}
          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>Night wakeups</label>
              <input
                type="number"
                min={0}
                max={20}
                value={form.nighttimeWakeups}
                onChange={(e) => set('nighttimeWakeups', e.target.value)}
                placeholder="0"
                style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <ScaleRow label="Stress before bed" value={form.stressBeforeBed} onChange={(v) => set('stressBeforeBed', v)} />
            </div>
          </div>

          {/* Caffeine */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.caffeineLaterInDay} onChange={(e) => set('caffeineLaterInDay', e.target.checked)} />
            <span style={{ fontSize: '13px', color: '#16182A' }}>Had caffeine later in the day</span>
          </label>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>Notes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Anything else about your sleep..."
              rows={2}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none', resize: 'none' }}
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (!form.sleepQuality && !form.sleepStart && !form.wakeEnergy)}
            style={{
              width: '100%', padding: '11px', borderRadius: '12px',
              background: '#012374', color: '#FFFDF9', fontSize: '14px', fontWeight: 600,
              border: 'none', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >{saving ? 'Saving…' : 'Save sleep log'}</button>
        </div>
      )}
    </div>
  );
}
