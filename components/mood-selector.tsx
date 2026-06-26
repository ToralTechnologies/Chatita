'use client';

import { useState } from 'react';
import { Mood, MoodCheckInData } from '@/types';

interface MoodSelectorProps {
  onSave?: (data: MoodCheckInData) => void;
}

type Zone = 'unpleasant' | 'neutral' | 'pleasant';

const ZONE_WORDS: Record<Zone, Array<{ value: Mood; label: string }>> = {
  unpleasant: [
    { value: 'sad',     label: 'Down' },
    { value: 'sad',     label: 'Sad' },
    { value: 'anxious', label: 'Anxious' },
    { value: 'anxious', label: 'Overwhelmed' },
    { value: 'anxious', label: 'Frustrated' },
    { value: 'tired',   label: 'Drained' },
    { value: 'anxious', label: 'Irritable' },
  ],
  neutral: [
    { value: 'neutral', label: 'Okay' },
    { value: 'tired',   label: 'Tired' },
    { value: 'calm',    label: 'Calm' },
    { value: 'neutral', label: 'Distracted' },
    { value: 'tired',   label: 'Low energy' },
    { value: 'neutral', label: 'Uncertain' },
  ],
  pleasant: [
    { value: 'calm',     label: 'Calm' },
    { value: 'calm',     label: 'Content' },
    { value: 'grateful', label: 'Grateful' },
    { value: 'grateful', label: 'Hopeful' },
    { value: 'happy',    label: 'Happy' },
    { value: 'happy',    label: 'Energized' },
    { value: 'happy',    label: 'Excited' },
  ],
};

const ZONE_LABELS: Record<Zone, string> = {
  unpleasant: 'Unpleasant',
  neutral: 'Neutral',
  pleasant: 'Pleasant',
};

const ZONE_COLORS: Record<Zone, { bg: string; border: string; text: string }> = {
  unpleasant: { bg: 'rgba(227,23,26,0.08)', border: '#E3171A', text: '#E3171A' },
  neutral:    { bg: 'rgba(1,35,116,0.06)',  border: '#012374',  text: '#012374' },
  pleasant:   { bg: 'rgba(200,147,43,0.1)', border: '#C8932B',  text: '#9A6F18' },
};

const ORB_COLORS: Record<string, { from: string; to: string; shadow: string }> = {
  happy:    { from: '#E5BC5E', to: '#C8932B', shadow: '#C8932B' },
  grateful: { from: '#D8A53E', to: '#B07C1C', shadow: '#B07C1C' },
  calm:     { from: '#7C86AB', to: '#5C77AE', shadow: '#5C77AE' },
  neutral:  { from: '#A4ACC6', to: '#7C86AB', shadow: '#7C86AB' },
  tired:    { from: '#5C77AE', to: '#34508C', shadow: '#34508C' },
  anxious:  { from: '#34508C', to: '#001A4D', shadow: '#001A4D' },
  sad:      { from: '#2A3A6E', to: '#001A4D', shadow: '#001A4D' },
};

const STRESS_LEVELS = ['Easy', 'Mild', 'Some', 'Heavy', 'A lot'];
const STRESS_VALUES: Record<string, number> = { Easy: 2, Mild: 4, Some: 6, Heavy: 8, 'A lot': 10 };

const CRAVING_OPTIONS = ['None', 'Sweet', 'Salty', 'Crunchy', 'Carbs', 'Late-night', 'Not sure'];

const SYMPTOM_OPTIONS = [
  'Headache', 'Thirsty', 'Dry mouth', 'Nausea', 'Reflux',
  'Constipation', 'Diarrhea', 'Shaky', 'Tired', 'Dizzy', 'Bloated',
];

const CONTEXT_TAG_OPTIONS = [
  'Poor sleep', 'High stress', 'On period', 'Sick day',
  'Skipped meal', 'Ate less than usual', 'Ate more than usual',
  'Medication change', 'Injection day', 'After exercise', 'No movement today',
];

const SCALE_LABELS: Record<string, string[]> = {
  energy: ['Very low', 'Low', '', 'Low-mid', '', 'Mid', '', 'Good', '', 'High'],
  hunger: ['Not hungry', '', '', 'A little', '', 'Moderate', '', 'Hungry', '', 'Very hungry'],
  fullness: ['Empty', '', '', 'A little', '', 'Half full', '', 'Full', '', 'Very full'],
};

export default function MoodSelector({ onSave }: MoodSelectorProps) {
  const [zone, setZone] = useState<Zone | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [selectedStress, setSelectedStress] = useState<string | null>(null);

  // Extended fields
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [hungerLevel, setHungerLevel] = useState<number | null>(null);
  const [fullnessLevel, setFullnessLevel] = useState<number | null>(null);
  const [selectedCravings, setSelectedCravings] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedContextTags, setSelectedContextTags] = useState<string[]>([]);
  const [showSymptoms, setShowSymptoms] = useState(false);
  const [showContextTags, setShowContextTags] = useState(false);

  // Free text
  const [userWords, setUserWords] = useState('');
  const [foodMoodConnection, setFoodMoodConnection] = useState('');
  const [supportWanted, setSupportWanted] = useState('');

  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const orb = selectedMood ? ORB_COLORS[selectedMood] : { from: '#A4ACC6', to: '#7C86AB', shadow: '#7C86AB' };

  const handleZoneSelect = (z: Zone) => {
    setZone(z);
    setSelectedMood(null);
    setSelectedLabel(null);
  };

  const handleWordSelect = (mood: Mood, label: string) => {
    setSelectedMood(mood);
    setSelectedLabel(label);
  };

  const toggleCraving = (c: string) => {
    setSelectedCravings((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleContextTag = (t: string) => {
    setSelectedContextTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleSave = () => {
    if (!selectedMood) return;
    const stressVal = selectedStress ? STRESS_VALUES[selectedStress] : 5;

    const data: MoodCheckInData = {
      mood: selectedMood,
      stressLevel: stressVal,
      energyLevel: energyLevel ?? undefined,
      hungerLevel: hungerLevel ?? undefined,
      fullnessLevel: fullnessLevel ?? undefined,
      cravings: selectedCravings.length ? selectedCravings : undefined,
      symptoms: selectedSymptoms.length ? selectedSymptoms : undefined,
      contextTags: selectedContextTags.length ? selectedContextTags : undefined,
      userWords: userWords || undefined,
      foodMoodConnection: foodMoodConnection || undefined,
      supportWanted: supportWanted || undefined,
      notes: notes || undefined,
    };

    onSave?.(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const ZONES: Zone[] = ['unpleasant', 'neutral', 'pleasant'];

  const ScaleRow = ({
    label,
    value,
    onChange,
    scaleKey,
  }: {
    label: string;
    value: number | null;
    onChange: (v: number) => void;
    scaleKey: string;
  }) => (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#012374', marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 12, fontWeight: value === n ? 700 : 400,
              background: value === n ? '#012374' : 'transparent',
              color: value === n ? '#FFFDF9' : '#012374',
              border: value === n ? '1px solid #012374' : '1px solid rgba(1,35,116,0.15)',
              cursor: 'pointer',
            }}
          >
            {n}
          </button>
        ))}
      </div>
      {value && SCALE_LABELS[scaleKey]?.[value - 1] && (
        <p style={{ fontSize: 11, color: 'rgba(1,35,116,0.5)', marginTop: 3 }}>
          {SCALE_LABELS[scaleKey][value - 1]}
        </p>
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="font-serif-italic" style={{ fontSize: 24, color: '#012374', lineHeight: 1.1 }}>
          How do you feel?
        </h2>
        <span style={{ fontSize: 11, color: '#C8932B', fontWeight: 700 }}>¿Cómo te sientes?</span>
      </div>

      {/* Mood orb + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div
          style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: `radial-gradient(circle at 35% 30%, ${orb.from}, ${orb.to})`,
            boxShadow: `0 12px 28px -8px ${orb.shadow}88`,
            transition: 'all 0.5s',
          }}
        />
        <div>
          {selectedLabel ? (
            <>
              <p className="font-serif-italic" style={{ fontSize: 20, color: '#012374', lineHeight: 1.1 }}>{selectedLabel}</p>
              {zone && <p style={{ fontSize: 11, color: 'rgba(1,35,116,0.45)', marginTop: 2 }}>{ZONE_LABELS[zone]}</p>}
            </>
          ) : zone ? (
            <p style={{ fontSize: 13, color: 'rgba(1,35,116,0.5)' }}>Pick a word below</p>
          ) : (
            <p style={{ fontSize: 13, color: 'rgba(1,35,116,0.5)' }}>Start by choosing a zone</p>
          )}
          {saved && <p style={{ fontSize: 11, color: '#7ED321', fontWeight: 600, marginTop: 2 }}>Saved ✓</p>}
        </div>
      </div>

      {/* Zone selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
        {ZONES.map((z) => {
          const isActive = zone === z;
          const c = ZONE_COLORS[z];
          return (
            <button key={z} onClick={() => handleZoneSelect(z)}
              style={{ padding: '10px 6px', borderRadius: 14, fontSize: 12, fontWeight: isActive ? 700 : 500, background: isActive ? c.bg : 'var(--bg-card)', color: isActive ? c.text : 'rgba(1,35,116,0.55)', border: isActive ? `1.5px solid ${c.border}` : '1px solid rgba(1,35,116,0.14)', cursor: 'pointer', textAlign: 'center' }}>
              {ZONE_LABELS[z]}
            </button>
          );
        })}
      </div>

      {/* Word chips */}
      {zone && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#16182A', opacity: 0.5, fontWeight: 600, marginBottom: 8 }}>
            {ZONE_LABELS[zone]} — pick a word
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {ZONE_WORDS[zone].map((w) => {
              const isSelected = selectedLabel === w.label;
              return (
                <button key={w.label} onClick={() => handleWordSelect(w.value, w.label)}
                  style={{ padding: '8px 14px', borderRadius: 99, fontSize: 13, fontWeight: isSelected ? 600 : 400, background: isSelected ? '#012374' : 'var(--bg-card)', color: isSelected ? '#FFFDF9' : '#012374', border: isSelected ? '1px solid #012374' : '1px solid rgba(1,35,116,0.22)', cursor: 'pointer' }}>
                  {w.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stress */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '14px 16px', border: '1px solid rgba(1,35,116,0.06)', marginBottom: 14 }}>
        <p className="font-serif-italic" style={{ fontSize: 16, color: '#012374' }}>Stress today is</p>
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {STRESS_LEVELS.map((level) => {
            const isSelected = selectedStress === level;
            return (
              <button key={level} onClick={() => setSelectedStress(level)}
                style={{ flex: 1, textAlign: 'center', padding: '8px 0', fontSize: 11.5, borderRadius: 10, fontWeight: isSelected ? 600 : 400, background: isSelected ? '#012374' : 'transparent', color: isSelected ? '#FFFDF9' : '#012374', border: isSelected ? '1px solid #012374' : '1px solid rgba(1,35,116,0.18)', cursor: 'pointer' }}>
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Energy / Hunger / Fullness scales */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '14px 16px', border: '1px solid rgba(1,35,116,0.06)', marginBottom: 14 }}>
        <ScaleRow label="Energy level" value={energyLevel} onChange={setEnergyLevel} scaleKey="energy" />
        <ScaleRow label="Hunger level" value={hungerLevel} onChange={setHungerLevel} scaleKey="hunger" />
        <ScaleRow label="Fullness" value={fullnessLevel} onChange={setFullnessLevel} scaleKey="fullness" />
      </div>

      {/* Cravings */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#012374', marginBottom: 8 }}>Any cravings?</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CRAVING_OPTIONS.map((c) => {
            const active = selectedCravings.includes(c);
            return (
              <button key={c} onClick={() => toggleCraving(c)}
                style={{ padding: '6px 12px', borderRadius: 99, fontSize: 12.5, fontWeight: active ? 600 : 400, background: active ? '#012374' : 'var(--bg-card)', color: active ? '#FFFDF9' : '#012374', border: active ? '1px solid #012374' : '1px solid rgba(1,35,116,0.2)', cursor: 'pointer' }}>
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body symptoms (expandable) */}
      <div style={{ marginBottom: 14 }}>
        <button onClick={() => setShowSymptoms(!showSymptoms)}
          style={{ fontSize: 13, fontWeight: 600, color: '#012374', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showSymptoms ? 8 : 0, textDecoration: 'underline' }}>
          {showSymptoms ? '− Body symptoms' : '+ Any body symptoms?'} {selectedSymptoms.length > 0 && `(${selectedSymptoms.length})`}
        </button>
        {showSymptoms && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SYMPTOM_OPTIONS.map((s) => {
              const active = selectedSymptoms.includes(s);
              return (
                <button key={s} onClick={() => toggleSymptom(s)}
                  style={{ padding: '6px 12px', borderRadius: 99, fontSize: 12.5, fontWeight: active ? 600 : 400, background: active ? '#E3171A' : 'var(--bg-card)', color: active ? '#FFFDF9' : '#012374', border: active ? '1px solid #E3171A' : '1px solid rgba(1,35,116,0.2)', cursor: 'pointer' }}>
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Context tags (expandable) */}
      <div style={{ marginBottom: 14 }}>
        <button onClick={() => setShowContextTags(!showContextTags)}
          style={{ fontSize: 13, fontWeight: 600, color: '#012374', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showContextTags ? 8 : 0, textDecoration: 'underline' }}>
          {showContextTags ? '− Context tags' : '+ What\'s going on today?'} {selectedContextTags.length > 0 && `(${selectedContextTags.length})`}
        </button>
        {showContextTags && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CONTEXT_TAG_OPTIONS.map((t) => {
              const active = selectedContextTags.includes(t);
              return (
                <button key={t} onClick={() => toggleContextTag(t)}
                  style={{ padding: '6px 12px', borderRadius: 99, fontSize: 12.5, fontWeight: active ? 600 : 400, background: active ? '#012374' : 'var(--bg-card)', color: active ? '#FFFDF9' : '#012374', border: active ? '1px solid #012374' : '1px solid rgba(1,35,116,0.2)', cursor: 'pointer' }}>
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Free text fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#012374', marginBottom: 5 }}>
            What&apos;s going on in your own words?
          </p>
          <textarea
            value={userWords}
            onChange={(e) => setUserWords(e.target.value)}
            placeholder="e.g. I feel overwhelmed and I ate late because I had class."
            rows={2}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(1,35,116,0.16)', background: 'var(--bg-card)', fontSize: 13, color: '#16182A', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#012374', marginBottom: 5 }}>
            What do you think affected your glucose, food, or mood today?
          </p>
          <textarea
            value={foodMoodConnection}
            onChange={(e) => setFoodMoodConnection(e.target.value)}
            placeholder="e.g. I didn't drink much water and I skipped breakfast."
            rows={2}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(1,35,116,0.16)', background: 'var(--bg-card)', fontSize: 13, color: '#16182A', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#012374', marginBottom: 5 }}>
            What kind of support would feel helpful right now?
          </p>
          <textarea
            value={supportWanted}
            onChange={(e) => setSupportWanted(e.target.value)}
            placeholder="e.g. Give me a quick snack idea. / I just want to log it."
            rows={2}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(1,35,116,0.16)', background: 'var(--bg-card)', fontSize: 13, color: '#16182A', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Legacy notes */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anything else? (optional)"
        rows={2}
        style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(1,35,116,0.18)', background: 'var(--bg-card)', fontSize: 13, color: '#16182A', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, marginBottom: 12, boxSizing: 'border-box' }}
      />

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={!selectedMood}
        style={{
          width: '100%', padding: '13px', borderRadius: 14,
          background: saved ? '#7ED321' : selectedMood ? '#012374' : 'rgba(1,35,116,0.2)',
          color: '#FFFDF9', fontSize: 14, fontWeight: 600, border: 'none',
          cursor: selectedMood ? 'pointer' : 'not-allowed', transition: 'background 0.3s',
        }}
      >
        {saved ? 'Check-in saved ✓' : 'Save check-in'}
      </button>
    </div>
  );
}
