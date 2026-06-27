'use client';

import { useState } from 'react';
import { Mood, MoodCheckInData } from '@/types';

interface MoodSelectorProps {
  onSave?: (data: MoodCheckInData) => void;
}

// ── Mood spectrum (0–100 slider) ──────────────────────────────────────────────

interface ZoneInfo {
  mood: Mood;
  label: string;
  sublabel: string;
  orbFrom: string;
  orbTo: string;
  orbShadow: string;
  words: Array<{ value: Mood; label: string }>;
}

const ZONES: ZoneInfo[] = [
  {
    mood: 'sad',
    label: 'Very unpleasant',
    sublabel: 'Muy difícil',
    orbFrom: '#2A3A6E',
    orbTo: '#001A4D',
    orbShadow: '#001A4D',
    words: [
      { value: 'anxious', label: 'Stressed' },
      { value: 'anxious', label: 'Anxious' },
      { value: 'anxious', label: 'Overwhelmed' },
      { value: 'tired',   label: 'Drained' },
      { value: 'sad',     label: 'Sad' },
      { value: 'anxious', label: 'Angry' },
    ],
  },
  {
    mood: 'anxious',
    label: 'Unpleasant',
    sublabel: 'Difícil',
    orbFrom: '#34508C',
    orbTo: '#1A2E5E',
    orbShadow: '#34508C',
    words: [
      { value: 'anxious', label: 'Worried' },
      { value: 'tired',   label: 'Tired' },
      { value: 'anxious', label: 'Frustrated' },
      { value: 'sad',     label: 'Down' },
      { value: 'anxious', label: 'Tense' },
      { value: 'sad',     label: 'Lonely' },
    ],
  },
  {
    mood: 'neutral',
    label: 'Neutral',
    sublabel: 'Neutro',
    orbFrom: '#A4ACC6',
    orbTo: '#7C86AB',
    orbShadow: '#7C86AB',
    words: [
      { value: 'neutral', label: 'Okay' },
      { value: 'tired',   label: 'Tired' },
      { value: 'neutral', label: 'Distracted' },
      { value: 'tired',   label: 'Low energy' },
      { value: 'neutral', label: 'Uncertain' },
      { value: 'neutral', label: 'Restless' },
    ],
  },
  {
    mood: 'calm',
    label: 'Pleasant',
    sublabel: 'Bien',
    orbFrom: '#7CBBBF',
    orbTo: '#2A8A8A',
    orbShadow: '#2A8A8A',
    words: [
      { value: 'calm',    label: 'Calm' },
      { value: 'calm',    label: 'At ease' },
      { value: 'calm',    label: 'Steady' },
      { value: 'calm',    label: 'Present' },
      { value: 'calm',    label: 'Relaxed' },
      { value: 'neutral', label: 'Okay' },
    ],
  },
  {
    mood: 'grateful',
    label: 'Good',
    sublabel: 'Muy bien',
    orbFrom: '#D8A53E',
    orbTo: '#B07C1C',
    orbShadow: '#C8932B',
    words: [
      { value: 'grateful', label: 'Content' },
      { value: 'grateful', label: 'Hopeful' },
      { value: 'grateful', label: 'Grateful' },
      { value: 'calm',     label: 'Motivated' },
      { value: 'grateful', label: 'Relieved' },
      { value: 'calm',     label: 'Peaceful' },
    ],
  },
  {
    mood: 'happy',
    label: 'Very pleasant',
    sublabel: '¡Excelente!',
    orbFrom: '#E5BC5E',
    orbTo: '#C8932B',
    orbShadow: '#C8932B',
    words: [
      { value: 'happy', label: 'Happy' },
      { value: 'happy', label: 'Energized' },
      { value: 'happy', label: 'Excited' },
      { value: 'happy', label: 'Joyful' },
      { value: 'happy', label: 'Great' },
      { value: 'happy', label: 'Thrilled' },
    ],
  },
];

// Map 0-100 slider value → zone index
function getZoneIndex(v: number): number {
  if (v <= 16) return 0;
  if (v <= 33) return 1;
  if (v <= 50) return 2;
  if (v <= 66) return 3;
  if (v <= 83) return 4;
  return 5;
}

// ── Static options ─────────────────────────────────────────────────────────────

const INFLUENCE_OPTIONS = [
  'Food', 'Exercise', 'Sleep', 'Stress', 'Medication',
  'Hormones', 'Work', 'Family', 'Health', 'Weather',
];

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
  energy:   ['Very low', 'Low', '', 'Low-mid', '', 'Mid', '', 'Good', '', 'High'],
  hunger:   ['Not hungry', '', '', 'A little', '', 'Moderate', '', 'Hungry', '', 'Very hungry'],
  fullness: ['Empty', '', '', 'A little', '', 'Half full', '', 'Full', '', 'Very full'],
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MoodSelector({ onSave }: MoodSelectorProps) {
  const [sliderValue, setSliderValue]     = useState(50);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [selectedMood, setSelectedMood]   = useState<Mood | null>(null);
  const [checkInType, setCheckInType]     = useState<'now' | 'today'>('now');
  const [selectedStress, setSelectedStress] = useState<string | null>(null);
  const [influences, setInfluences]       = useState<string[]>([]);

  // Extended fields
  const [energyLevel, setEnergyLevel]     = useState<number | null>(null);
  const [hungerLevel, setHungerLevel]     = useState<number | null>(null);
  const [fullnessLevel, setFullnessLevel] = useState<number | null>(null);
  const [selectedCravings, setSelectedCravings]     = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms]     = useState<string[]>([]);
  const [selectedContextTags, setSelectedContextTags] = useState<string[]>([]);
  const [showMore, setShowMore]           = useState(false);

  const [userWords, setUserWords]                   = useState('');
  const [foodMoodConnection, setFoodMoodConnection] = useState('');
  const [supportWanted, setSupportWanted]           = useState('');
  const [notes, setNotes]                           = useState('');
  const [saved, setSaved]                           = useState(false);

  const zoneIndex  = getZoneIndex(sliderValue);
  const zone       = ZONES[zoneIndex];
  const activeMood = selectedMood ?? zone.mood;
  const activeLabel = selectedLabel ?? zone.label;

  const handleSliderChange = (v: number) => {
    setSliderValue(v);
    setSelectedLabel(null);
    setSelectedMood(null);
  };

  const handleWordSelect = (mood: Mood, label: string) => {
    setSelectedMood(mood);
    setSelectedLabel(label);
  };

  const toggleInfluence = (item: string) =>
    setInfluences(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);

  const toggleCraving = (c: string) =>
    setSelectedCravings(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const toggleSymptom = (s: string) =>
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleContextTag = (t: string) =>
    setSelectedContextTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSave = () => {
    const stressVal = selectedStress ? STRESS_VALUES[selectedStress] : 5;
    const combinedTags = [...influences, ...selectedContextTags];

    const data: MoodCheckInData = {
      mood: activeMood,
      stressLevel: stressVal,
      energyLevel:  energyLevel ?? undefined,
      hungerLevel:  hungerLevel ?? undefined,
      fullnessLevel: fullnessLevel ?? undefined,
      cravings:     selectedCravings.length ? selectedCravings : undefined,
      symptoms:     selectedSymptoms.length ? selectedSymptoms : undefined,
      contextTags:  combinedTags.length ? combinedTags : undefined,
      userWords:    userWords || undefined,
      foodMoodConnection: foodMoodConnection || undefined,
      supportWanted: supportWanted || undefined,
      notes:        notes || undefined,
    };

    onSave?.(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const ScaleRow = ({
    label, value, onChange, scaleKey,
  }: {
    label: string; value: number | null; onChange: (v: number) => void; scaleKey: string;
  }) => (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#012374', marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 12,
            fontWeight: value === n ? 700 : 400,
            background: value === n ? '#012374' : 'transparent',
            color: value === n ? '#FFFDF9' : '#012374',
            border: value === n ? '1px solid #012374' : '1px solid rgba(1,35,116,0.15)',
            cursor: 'pointer',
          }}>{n}</button>
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
      {/* Slider thumb + track styling */}
      <style>{`
        .mood-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 5px; border-radius: 99px; outline: none; cursor: pointer; background: linear-gradient(to right, #001A4D 0%, #34508C 17%, #7C86AB 34%, #7CBBBF 51%, #D8A53E 68%, #E5BC5E 85%, #C8932B 100%); }
        .mood-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #012374; cursor: pointer; box-shadow: 0 3px 10px rgba(1,35,116,0.45); border: 3px solid #FFFDF9; }
        .mood-slider::-moz-range-thumb { width: 24px; height: 24px; border-radius: 50%; background: #012374; cursor: pointer; border: 3px solid #FFFDF9; box-shadow: 0 3px 10px rgba(1,35,116,0.45); }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="font-serif-italic" style={{ fontSize: 24, color: '#012374', lineHeight: 1.1 }}>
          How do you feel?
        </h2>
        <span style={{ fontSize: 11, color: '#C8932B', fontWeight: 700 }}>¿Cómo te sientes?</span>
      </div>

      {/* Right now / Overall today toggle */}
      <div style={{ display: 'flex', background: 'rgba(1,35,116,0.07)', borderRadius: 12, padding: 3, marginBottom: 24, gap: 3 }}>
        {(['now', 'today'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setCheckInType(t)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: checkInType === t ? '#012374' : 'transparent',
              color: checkInType === t ? '#FFFDF9' : 'rgba(1,35,116,0.55)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {t === 'now' ? 'Right now' : 'Overall today'}
          </button>
        ))}
      </div>

      {/* Large orb — centered */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
        <div style={{
          width: 160, height: 160, borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, ${zone.orbFrom}, ${zone.orbTo})`,
          boxShadow: `0 20px 48px -12px ${zone.orbShadow}88`,
          transition: 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
          marginBottom: 16,
        }} />
        <p className="font-serif-italic" style={{ fontSize: 22, color: '#012374', lineHeight: 1.1, textAlign: 'center' }}>
          {activeLabel}
        </p>
        <p style={{ fontSize: 12, color: 'rgba(1,35,116,0.45)', marginTop: 3, textAlign: 'center' }}>
          {selectedLabel ? zone.sublabel : zone.sublabel}
        </p>
        {saved && (
          <p style={{ fontSize: 11, color: '#7ED321', fontWeight: 600, marginTop: 4 }}>Saved ✓</p>
        )}
      </div>

      {/* Horizontal slider */}
      <div style={{ marginBottom: 8, padding: '0 4px' }}>
        <input
          type="range"
          min={0}
          max={100}
          value={sliderValue}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="mood-slider"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(1,35,116,0.45)' }}>Very unpleasant</span>
          <span style={{ fontSize: 11, color: 'rgba(1,35,116,0.45)' }}>Neutral</span>
          <span style={{ fontSize: 11, color: 'rgba(1,35,116,0.45)' }}>Very pleasant</span>
        </div>
      </div>

      {/* Word chips — dynamic by zone */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(22,24,42,0.45)', fontWeight: 700, marginBottom: 10 }}>
          Pick a word
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {zone.words.map((w) => {
            const isSelected = selectedLabel === w.label;
            return (
              <button
                key={w.label}
                onClick={() => handleWordSelect(w.value, w.label)}
                style={{
                  padding: '9px 16px', borderRadius: 99, fontSize: 14,
                  fontWeight: isSelected ? 600 : 400,
                  background: isSelected ? '#012374' : '#FFFDF9',
                  color: isSelected ? '#FFFDF9' : '#012374',
                  border: isSelected ? '1.5px solid #012374' : '1.5px solid rgba(1,35,116,0.2)',
                  cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* What's influencing this */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(22,24,42,0.45)', fontWeight: 700, marginBottom: 10 }}>
          What&apos;s influencing this?
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {INFLUENCE_OPTIONS.map((item) => {
            const active = influences.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggleInfluence(item)}
                style={{
                  padding: '8px 15px', borderRadius: 99, fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  background: active ? 'rgba(1,35,116,0.1)' : '#FFFDF9',
                  color: active ? '#001A4D' : 'rgba(1,35,116,0.65)',
                  border: active ? '1.5px solid rgba(1,35,116,0.35)' : '1.5px solid rgba(1,35,116,0.15)',
                  cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stress */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '14px 16px', border: '1px solid rgba(1,35,116,0.06)', marginBottom: 14 }}>
        <p className="font-serif-italic" style={{ fontSize: 16, color: '#012374' }}>Stress today is</p>
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {STRESS_LEVELS.map((level) => {
            const isSelected = selectedStress === level;
            return (
              <button key={level} onClick={() => setSelectedStress(level)} style={{
                flex: 1, textAlign: 'center', padding: '8px 0', fontSize: 11.5,
                borderRadius: 10, fontWeight: isSelected ? 600 : 400,
                background: isSelected ? '#012374' : 'transparent',
                color: isSelected ? '#FFFDF9' : '#012374',
                border: isSelected ? '1px solid #012374' : '1px solid rgba(1,35,116,0.18)',
                cursor: 'pointer',
              }}>{level}</button>
            );
          })}
        </div>
      </div>

      {/* More options (collapsible) */}
      <button
        onClick={() => setShowMore(!showMore)}
        style={{ fontSize: 13, fontWeight: 600, color: '#012374', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>{showMore ? '−' : '+'}</span>
        {showMore ? 'Less options' : 'Add more detail'}
        {(selectedCravings.length + selectedSymptoms.length + selectedContextTags.length + (energyLevel ? 1 : 0)) > 0 && (
          <span style={{ fontSize: 11, background: '#012374', color: '#FFFDF9', borderRadius: 99, padding: '1px 7px' }}>
            {selectedCravings.length + selectedSymptoms.length + selectedContextTags.length + (energyLevel ? 1 : 0)}
          </span>
        )}
      </button>

      {showMore && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 }}>
          {/* Energy / Hunger / Fullness */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '14px 16px', border: '1px solid rgba(1,35,116,0.06)' }}>
            <ScaleRow label="Energy level" value={energyLevel} onChange={setEnergyLevel} scaleKey="energy" />
            <ScaleRow label="Hunger level" value={hungerLevel} onChange={setHungerLevel} scaleKey="hunger" />
            <ScaleRow label="Fullness" value={fullnessLevel} onChange={setFullnessLevel} scaleKey="fullness" />
          </div>

          {/* Cravings */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#012374', marginBottom: 8 }}>Any cravings?</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CRAVING_OPTIONS.map((c) => {
                const active = selectedCravings.includes(c);
                return (
                  <button key={c} onClick={() => toggleCraving(c)} style={{
                    padding: '6px 12px', borderRadius: 99, fontSize: 12.5,
                    fontWeight: active ? 600 : 400,
                    background: active ? '#012374' : 'var(--bg-card)',
                    color: active ? '#FFFDF9' : '#012374',
                    border: active ? '1px solid #012374' : '1px solid rgba(1,35,116,0.2)',
                    cursor: 'pointer',
                  }}>{c}</button>
                );
              })}
            </div>
          </div>

          {/* Body symptoms */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#012374', marginBottom: 8 }}>Body symptoms?</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SYMPTOM_OPTIONS.map((s) => {
                const active = selectedSymptoms.includes(s);
                return (
                  <button key={s} onClick={() => toggleSymptom(s)} style={{
                    padding: '6px 12px', borderRadius: 99, fontSize: 12.5,
                    fontWeight: active ? 600 : 400,
                    background: active ? '#E3171A' : 'var(--bg-card)',
                    color: active ? '#FFFDF9' : '#012374',
                    border: active ? '1px solid #E3171A' : '1px solid rgba(1,35,116,0.2)',
                    cursor: 'pointer',
                  }}>{s}</button>
                );
              })}
            </div>
          </div>

          {/* Context tags */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#012374', marginBottom: 8 }}>What else is going on?</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CONTEXT_TAG_OPTIONS.map((t) => {
                const active = selectedContextTags.includes(t);
                return (
                  <button key={t} onClick={() => toggleContextTag(t)} style={{
                    padding: '6px 12px', borderRadius: 99, fontSize: 12.5,
                    fontWeight: active ? 600 : 400,
                    background: active ? '#012374' : 'var(--bg-card)',
                    color: active ? '#FFFDF9' : '#012374',
                    border: active ? '1px solid #012374' : '1px solid rgba(1,35,116,0.2)',
                    cursor: 'pointer',
                  }}>{t}</button>
                );
              })}
            </div>
          </div>

          {/* Free text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: "What's going on in your own words?", value: userWords, onChange: setUserWords, placeholder: "e.g. I feel overwhelmed and ate late because I had class." },
              { label: "What affected your glucose, food, or mood today?", value: foodMoodConnection, onChange: setFoodMoodConnection, placeholder: "e.g. I didn't drink much water and skipped breakfast." },
              { label: "What kind of support would feel helpful right now?", value: supportWanted, onChange: setSupportWanted, placeholder: "e.g. Give me a quick snack idea. / I just want to log it." },
            ].map(({ label, value, onChange, placeholder }) => (
              <div key={label}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#012374', marginBottom: 5 }}>{label}</p>
                <textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  rows={2}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(1,35,116,0.16)', background: 'var(--bg-card)', fontSize: 13, color: '#16182A', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else? (optional)"
              rows={2}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(1,35,116,0.18)', background: 'var(--bg-card)', fontSize: 13, color: '#16182A', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        style={{
          width: '100%', padding: '14px', borderRadius: 999,
          background: saved ? '#4A8C00' : '#C8932B',
          color: '#FFFDF9', fontSize: 15, fontWeight: 700, border: 'none',
          cursor: 'pointer', transition: 'background 0.3s',
          boxShadow: saved ? '0 8px 20px -8px rgba(74,140,0,0.5)' : '0 8px 20px -8px rgba(200,147,43,0.6)',
          marginTop: 6,
        }}
      >
        {saved ? 'Check-in saved ✓' : 'Save reading'}
      </button>
    </div>
  );
}
