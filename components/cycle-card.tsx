'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

const CYCLE_PHASE_VALUES = ['period', 'follicular', 'ovulation', 'luteal', 'not_sure'] as const;
const FLOW_VALUES = ['light', 'medium', 'heavy', 'not_sure'] as const;
const SYMPTOM_VALUES = ['cramps', 'headache', 'bloating', 'fatigue', 'breast_tenderness', 'mood_changes', 'cravings', 'nausea', 'acne', 'other'] as const;
const APPETITE_VALUES = ['increased', 'decreased', 'unchanged', 'not_sure'] as const;

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
  const { t } = useTranslation();
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
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#012374' }}>{t.cycleCard.title}</div>
            <div style={{ fontSize: '11.5px', color: 'rgba(22,24,42,0.55)', marginTop: '1px' }}>
              {saved ? t.cycleCard.savedCheck : t.cycleCard.subtitle}
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
            {t.cycleCard.intro}
          </p>

          {/* Cycle phase */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '8px' }}>{t.cycleCard.phaseLabel}</label>
            <div className="flex flex-wrap gap-2">
              {CYCLE_PHASE_VALUES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('cyclePhase', form.cyclePhase === p ? '' : p)}
                  style={{
                    padding: '5px 12px', borderRadius: '999px', fontSize: '12.5px',
                    border: form.cyclePhase === p ? '1.5px solid #012374' : '1.5px solid rgba(1,35,116,0.18)',
                    background: form.cyclePhase === p ? '#012374' : 'transparent',
                    color: form.cyclePhase === p ? '#FFFDF9' : '#012374',
                    cursor: 'pointer',
                  }}
                >{t.cycleCard.phases[p]}</button>
              ))}
            </div>
          </div>

          {/* Flow (only if period phase) */}
          {form.cyclePhase === 'period' && (
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '8px' }}>{t.cycleCard.flow}</label>
              <div className="flex gap-2 flex-wrap">
                {FLOW_VALUES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => set('flow', form.flow === f ? '' : f)}
                    style={{
                      padding: '5px 12px', borderRadius: '999px', fontSize: '12.5px',
                      border: form.flow === f ? '1.5px solid #C8932B' : '1.5px solid rgba(200,147,43,0.3)',
                      background: form.flow === f ? '#C8932B' : 'transparent',
                      color: form.flow === f ? '#FFFDF9' : '#C8932B',
                      cursor: 'pointer',
                    }}
                  >{t.cycleCard.flows[f]}</button>
                ))}
              </div>
            </div>
          )}

          {/* Symptoms */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '8px' }}>{t.cycleCard.symptoms} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{t.cycleCard.selectAll}</span></label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_VALUES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  style={{
                    padding: '5px 12px', borderRadius: '999px', fontSize: '12.5px',
                    border: form.symptoms.includes(s) ? '1.5px solid #012374' : '1.5px solid rgba(1,35,116,0.18)',
                    background: form.symptoms.includes(s) ? '#012374' : 'transparent',
                    color: form.symptoms.includes(s) ? '#FFFDF9' : '#012374',
                    cursor: 'pointer',
                  }}
                >{t.cycleCard.symptomOptions[s]}</button>
              ))}
            </div>
          </div>

          {/* Appetite + energy */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '8px' }}>{t.cycleCard.appetite}</label>
            <div className="flex flex-wrap gap-2">
              {APPETITE_VALUES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => set('appetiteChange', form.appetiteChange === a ? '' : a)}
                  style={{
                    padding: '5px 12px', borderRadius: '999px', fontSize: '12.5px',
                    border: form.appetiteChange === a ? '1.5px solid #012374' : '1.5px solid rgba(1,35,116,0.18)',
                    background: form.appetiteChange === a ? '#012374' : 'transparent',
                    color: form.appetiteChange === a ? '#FFFDF9' : '#012374',
                    cursor: 'pointer',
                  }}
                >{t.cycleCard.appetiteOptions[a]}</button>
              ))}
            </div>
          </div>

          <ScaleRow label={t.cycleCard.energy} value={form.energy} onChange={(v) => set('energy', v)} />

          {/* Glucose notice */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>{t.cycleCard.glucoseNoticed} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{t.cycleCard.optional}</span></label>
            <input
              type="text"
              value={form.glucoseChangesNoticed}
              onChange={(e) => set('glucoseChangesNoticed', e.target.value)}
              placeholder={t.cycleCard.glucosePlaceholder}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.18)', background: 'rgba(1,35,116,0.03)', fontSize: '13px', color: '#16182A', outline: 'none' }}
            />
            <p style={{ fontSize: '10.5px', color: 'rgba(1,35,116,0.4)', marginTop: '4px' }}>{t.cycleCard.careTeamNote}</p>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.45)', display: 'block', marginBottom: '5px' }}>{t.cycleCard.notes} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{t.cycleCard.optional}</span></label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder={t.cycleCard.notesPlaceholder}
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
          >{saving ? t.cycleCard.saving : t.cycleCard.save}</button>
        </div>
      )}
    </div>
  );
}
