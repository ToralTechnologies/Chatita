'use client';

import { useState } from 'react';

const CYCLE_PHASES = [
  { value: 'period', label: 'Period' },
  { value: 'follicular', label: 'Follicular' },
  { value: 'ovulation', label: 'Ovulation' },
  { value: 'luteal', label: 'Luteal' },
  { value: 'not_sure', label: 'Not sure' },
];

const FLOW_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
  { value: 'not_sure', label: 'Not sure' },
];

const SYMPTOM_OPTIONS = [
  { value: 'cramps', label: 'Cramps' },
  { value: 'headache', label: 'Headache' },
  { value: 'bloating', label: 'Bloating' },
  { value: 'fatigue', label: 'Fatigue' },
  { value: 'breast_tenderness', label: 'Breast tenderness' },
  { value: 'mood_changes', label: 'Mood changes' },
  { value: 'cravings', label: 'Cravings' },
  { value: 'nausea', label: 'Nausea' },
  { value: 'acne', label: 'Acne' },
  { value: 'other', label: 'Other' },
];

const APPETITE_OPTIONS = [
  { value: 'increased', label: 'Increased' },
  { value: 'decreased', label: 'Decreased' },
  { value: 'unchanged', label: 'Unchanged' },
  { value: 'not_sure', label: 'Not sure' },
];

function ScaleRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '6px' }}>{label}</label>
      <div className="flex gap-1.5 flex-wrap">
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
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

export default function CycleCard() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    cyclePhase: '',
    flow: '',
    symptoms: [] as string[],
    cravings: '',
    appetiteChange: '',
    mood: '',
    energy: 0,
    glucoseChangesNoticed: '',
    notes: '',
  });

  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const toggleSymptom = (s: string) => {
    setForm((f) => ({
      ...f,
      symptoms: f.symptoms.includes(s) ? f.symptoms.filter((x) => x !== s) : [...f.symptoms, s],
    }));
  };

  const handleSave = async () => {
    if (!form.cyclePhase && !form.symptoms.length && !form.energy) return;
    setSaving(true);
    try {
      await fetch('/api/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cyclePhase: form.cyclePhase || undefined,
          flow: form.flow || undefined,
          symptoms: form.symptoms.length ? form.symptoms : undefined,
          cravings: form.cravings || undefined,
          appetiteChange: form.appetiteChange || undefined,
          mood: form.mood || undefined,
          energy: form.energy || undefined,
          glucoseChangesNoticed: form.glucoseChangesNoticed || undefined,
          notes: form.notes || undefined,
        }),
      });
      setSaved(true);
      setOpen(false);
      setForm({ cyclePhase: '', flow: '', symptoms: [], cravings: '', appetiteChange: '', mood: '', energy: 0, glucoseChangesNoticed: '', notes: '' });
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(200,147,43,0.2)', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ textAlign: 'left' }}
      >
        <div className="flex items-center gap-3">
          {/* Calendar/cycle icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#C8932B" strokeWidth="1.6"/>
            <path d="M12 7v5l3 3" stroke="#C8932B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#012374' }}>Cycle patterns</div>
            <div style={{ fontSize: '11.5px', color: 'rgba(22,24,42,0.55)', marginTop: '1px' }}>
              {saved ? '✓ Saved!' : 'Only track what feels useful — skip anytime'}
            </div>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6" stroke="#012374" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid rgba(200,147,43,0.15)' }}>
          <p className="pt-3" style={{ fontSize: '11.5px', color: 'rgba(1,35,116,0.5)', lineHeight: 1.5 }}>
            Some people notice changes in appetite, mood, energy, cravings, or glucose patterns around their cycle. This is optional and used only to personalize your insights.
          </p>

          {/* Cycle phase */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '8px' }}>Where are you in your cycle?</label>
            <div className="flex flex-wrap gap-2">
              {CYCLE_PHASES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set('cyclePhase', form.cyclePhase === p.value ? '' : p.value)}
                  style={{
                    padding: '5px 12px', borderRadius: '999px', fontSize: '12.5px',
                    border: form.cyclePhase === p.value ? '1.5px solid #012374' : '1.5px solid rgba(1,35,116,0.18)',
                    background: form.cyclePhase === p.value ? '#012374' : 'transparent',
                    color: form.cyclePhase === p.value ? '#FFFDF9' : '#012374',
                    cursor: 'pointer',
                  }}
                >{p.label}</button>
              ))}
            </div>
          </div>

          {/* Flow (only if period phase) */}
          {form.cyclePhase === 'period' && (
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '8px' }}>Flow</label>
              <div className="flex gap-2 flex-wrap">
                {FLOW_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => set('flow', form.flow === f.value ? '' : f.value)}
                    style={{
                      padding: '5px 12px', borderRadius: '999px', fontSize: '12.5px',
                      border: form.flow === f.value ? '1.5px solid #C8932B' : '1.5px solid rgba(200,147,43,0.3)',
                      background: form.flow === f.value ? '#C8932B' : 'transparent',
                      color: form.flow === f.value ? '#FFFDF9' : '#C8932B',
                      cursor: 'pointer',
                    }}
                  >{f.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Symptoms */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '8px' }}>Symptoms <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(select all that apply)</span></label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleSymptom(s.value)}
                  style={{
                    padding: '5px 12px', borderRadius: '999px', fontSize: '12.5px',
                    border: form.symptoms.includes(s.value) ? '1.5px solid #012374' : '1.5px solid rgba(1,35,116,0.18)',
                    background: form.symptoms.includes(s.value) ? '#012374' : 'transparent',
                    color: form.symptoms.includes(s.value) ? '#FFFDF9' : '#012374',
                    cursor: 'pointer',
                  }}
                >{s.label}</button>
              ))}
            </div>
          </div>

          {/* Appetite + energy */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '8px' }}>Appetite today</label>
            <div className="flex flex-wrap gap-2">
              {APPETITE_OPTIONS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => set('appetiteChange', form.appetiteChange === a.value ? '' : a.value)}
                  style={{
                    padding: '5px 12px', borderRadius: '999px', fontSize: '12.5px',
                    border: form.appetiteChange === a.value ? '1.5px solid #012374' : '1.5px solid rgba(1,35,116,0.18)',
                    background: form.appetiteChange === a.value ? '#012374' : 'transparent',
                    color: form.appetiteChange === a.value ? '#FFFDF9' : '#012374',
                    cursor: 'pointer',
                  }}
                >{a.label}</button>
              ))}
            </div>
          </div>

          <ScaleRow label="Energy today (1–10)" value={form.energy} onChange={(v) => set('energy', v)} />

          {/* Glucose notice */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>Glucose changes noticed? <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <input
              type="text"
              value={form.glucoseChangesNoticed}
              onChange={(e) => set('glucoseChangesNoticed', e.target.value)}
              placeholder="e.g. higher than usual today, or nothing noticed"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }}
            />
            <p style={{ fontSize: '10.5px', color: 'rgba(1,35,116,0.4)', marginTop: '4px' }}>This may be worth discussing with your care team — Chatita won't diagnose causes.</p>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>Notes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Anything else to note..."
              rows={2}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none', resize: 'none' }}
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (!form.cyclePhase && !form.symptoms.length && !form.energy)}
            style={{
              width: '100%', padding: '11px', borderRadius: '12px',
              background: '#012374', color: '#FFFDF9', fontSize: '14px', fontWeight: 600,
              border: 'none', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >{saving ? 'Saving…' : 'Save cycle notes'}</button>
        </div>
      )}
    </div>
  );
}
