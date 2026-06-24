'use client';

import { useState } from 'react';
import { Mood } from '@/types';

interface MoodSelectorProps {
  onSave?: (mood: Mood, stressLevel: number, notes?: string) => void;
}

// Ordered from low → high energy/positivity (maps to slider 0–100)
const MOOD_GROUPS = [
  {
    label: 'Heavy',
    dotColor: '#E3171A',
    moods: [
      { value: 'sad' as Mood, label: 'Down', sliderPos: 5 },
      { value: 'anxious' as Mood, label: 'Anxious', sliderPos: 18 },
    ],
  },
  {
    label: 'In-between',
    dotColor: 'rgba(1,35,116,0.4)',
    moods: [
      { value: 'tired' as Mood, label: 'Drained', sliderPos: 32 },
      { value: 'tired' as Mood, label: 'Tired', sliderPos: 44 },
      { value: 'neutral' as Mood, label: 'Okay', sliderPos: 56 },
    ],
  },
  {
    label: 'Bright',
    dotColor: '#C8932B',
    moods: [
      { value: 'calm' as Mood, label: 'Calm', sliderPos: 68 },
      { value: 'grateful' as Mood, label: 'Grateful', sliderPos: 80 },
      { value: 'happy' as Mood, label: 'Great', sliderPos: 90 },
      { value: 'happy' as Mood, label: 'Energized', sliderPos: 98 },
    ],
  },
];

const ALL_MOODS = MOOD_GROUPS.flatMap(g => g.moods);

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

function sliderToMoodEntry(v: number) {
  // Find closest mood by sliderPos
  let best = ALL_MOODS[0];
  let bestDist = Math.abs(v - best.sliderPos);
  for (const m of ALL_MOODS) {
    const d = Math.abs(v - m.sliderPos);
    if (d < bestDist) { best = m; bestDist = d; }
  }
  return best;
}

export default function MoodSelector({ onSave }: MoodSelectorProps) {
  const [sliderValue, setSliderValue] = useState(56); // default: Okay
  const [selectedLabel, setSelectedLabel] = useState('Okay');
  const [selectedMood, setSelectedMood] = useState<Mood>('neutral');
  const [selectedStress, setSelectedStress] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const orb = ORB_COLORS[selectedMood] ?? ORB_COLORS.neutral;

  const handleSliderChange = (v: number) => {
    setSliderValue(v);
    const entry = sliderToMoodEntry(v);
    setSelectedMood(entry.value);
    setSelectedLabel(entry.label);
  };

  const handlePillClick = (mood: Mood, label: string, sliderPos: number) => {
    setSelectedMood(mood);
    setSelectedLabel(label);
    setSliderValue(sliderPos);
  };

  const handleSave = () => {
    const stressVal = selectedStress ? STRESS_VALUES[selectedStress] : 5;
    onSave?.(selectedMood, stressVal, notes || undefined);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-serif-italic" style={{ fontSize: '24px', color: '#012374', lineHeight: '1.1' }}>
          How do you feel?
        </h2>
        <span style={{ fontSize: '11px', color: '#C8932B', fontWeight: 700 }}>¿Cómo te sientes?</span>
      </div>

      {/* Mood orb + label */}
      <div className="flex items-center gap-5 mb-5">
        <div
          className="shrink-0 transition-all duration-500"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, ${orb.from}, ${orb.to})`,
            boxShadow: `0 14px 32px -10px ${orb.shadow}88`,
          }}
        />
        <div>
          <p className="font-serif-italic" style={{ fontSize: '20px', color: '#012374', lineHeight: '1.1' }}>
            {selectedLabel}
          </p>
          {saved && (
            <p style={{ fontSize: '11px', color: '#C8932B', fontWeight: 600, marginTop: '2px' }}>Saved ✓</p>
          )}
        </div>
      </div>

      {/* Gradient slider */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="range"
          min={0}
          max={100}
          value={sliderValue}
          onChange={e => handleSliderChange(Number(e.target.value))}
          className="mood-slider"
        />
        <div className="flex justify-between" style={{ marginTop: '4px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(1,35,116,0.45)', letterSpacing: '0.05em' }}>Low</span>
          <span style={{ fontSize: '10px', color: 'rgba(1,35,116,0.45)', letterSpacing: '0.05em' }}>High</span>
        </div>
      </div>

      {/* Grouped mood pills */}
      <div className="space-y-3">
        {MOOD_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: group.dotColor }} />
              <span style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#16182A', opacity: 0.6, fontWeight: 600 }}>
                {group.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-[6px]">
              {group.moods.map((mood) => {
                const isSelected = selectedLabel === mood.label;
                return (
                  <button
                    key={`${mood.value}-${mood.label}`}
                    onClick={() => handlePillClick(mood.value, mood.label, mood.sliderPos)}
                    className="transition-all active:scale-95"
                    style={{
                      padding: '7px 13px',
                      borderRadius: '99px',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      background: isSelected ? '#012374' : 'var(--bg-card)',
                      color: isSelected ? '#FFFDF9' : '#012374',
                      border: isSelected ? '1px solid #012374' : '1px solid rgba(1,35,116,0.25)',
                    }}
                  >
                    {mood.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Stress selector */}
      <div
        className="mt-4"
        style={{ background: 'var(--bg-card)', borderRadius: '18px', padding: '14px 16px', border: '1px solid rgba(1,35,116,0.06)' }}
      >
        <p className="font-serif-italic" style={{ fontSize: '16px', color: '#012374' }}>
          Stress today is
        </p>
        <div className="flex gap-1 mt-3">
          {STRESS_LEVELS.map((level) => {
            const isSelected = selectedStress === level;
            return (
              <button
                key={level}
                onClick={() => setSelectedStress(level)}
                className="flex-1 transition-all"
                style={{
                  textAlign: 'center',
                  padding: '8px 0',
                  fontSize: '11.5px',
                  borderRadius: '10px',
                  fontWeight: isSelected ? 600 : 400,
                  background: isSelected ? '#012374' : 'transparent',
                  color: isSelected ? '#FFFDF9' : '#012374',
                  border: isSelected ? '1px solid #012374' : '1px solid rgba(1,35,116,0.18)',
                }}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes field */}
      <div style={{ marginTop: '16px' }}>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Tell me more about how you're feeling… (optional)"
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '14px',
            border: '1px solid rgba(1,35,116,0.18)',
            background: 'var(--bg-card)',
            fontSize: '13px',
            color: '#16182A',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: '1.5',
          }}
        />
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        style={{
          marginTop: '14px',
          width: '100%',
          padding: '13px',
          borderRadius: '14px',
          background: saved ? '#7ED321' : '#012374',
          color: '#FFFDF9',
          fontSize: '14px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.3s',
        }}
      >
        {saved ? 'Check-in saved ✓' : 'Save check-in'}
      </button>
    </div>
  );
}
