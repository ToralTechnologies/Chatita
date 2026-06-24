'use client';

import { useState } from 'react';
import { Mood } from '@/types';

interface MoodSelectorProps {
  onSave?: (mood: Mood, stressLevel: number) => void;
}

// Mood groups matching the design HTML exactly
const MOOD_GROUPS = [
  {
    label: 'Bright',
    dotColor: '#C8932B',
    moods: [
      { value: 'happy' as Mood, label: 'Great' },
      { value: 'grateful' as Mood, label: 'Grateful' },
      { value: 'calm' as Mood, label: 'Calm' },
    ],
  },
  {
    label: 'In-between',
    dotColor: 'rgba(1,35,116,0.4)',
    moods: [
      { value: 'neutral' as Mood, label: 'Okay' },
      { value: 'tired' as Mood, label: 'Tired' },
    ],
  },
  {
    label: 'Heavy',
    dotColor: '#E3171A',
    moods: [
      { value: 'anxious' as Mood, label: 'Anxious' },
      { value: 'sad' as Mood, label: 'Down' },
    ],
  },
];

// Orb colors by mood — from the design file
const ORB_COLORS: Record<string, { from: string; to: string; shadow: string }> = {
  happy:    { from: '#E5BC5E', to: '#C8932B', shadow: '#C8932B' },
  grateful: { from: '#D8A53E', to: '#B07C1C', shadow: '#B07C1C' },
  calm:     { from: '#7C86AB', to: '#5C77AE', shadow: '#5C77AE' },
  neutral:  { from: '#A4ACC6', to: '#7C86AB', shadow: '#7C86AB' },
  tired:    { from: '#5C77AE', to: '#34508C', shadow: '#34508C' },
  anxious:  { from: '#34508C', to: '#001A4D', shadow: '#001A4D' },
  sad:      { from: '#34508C', to: '#001A4D', shadow: '#001A4D' },
};

const STRESS_LEVELS = ['Easy', 'Mild', 'Some', 'Heavy', 'A lot'];
const STRESS_VALUES: Record<string, number> = { Easy: 2, Mild: 4, Some: 6, Heavy: 8, 'A lot': 10 };

export default function MoodSelector({ onSave }: MoodSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedStress, setSelectedStress] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = (mood: Mood) => {
    setSelectedMood(mood);
    const stressVal = selectedStress ? STRESS_VALUES[selectedStress] : 5;
    onSave?.(mood, stressVal);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleStressSelect = (level: string) => {
    setSelectedStress(level);
    if (selectedMood) {
      const stressVal = STRESS_VALUES[level];
      onSave?.(selectedMood, stressVal);
    }
  };

  const orb = selectedMood ? ORB_COLORS[selectedMood] : { from: '#A4ACC6', to: '#7C86AB', shadow: '#7C86AB' };

  return (
    <div>
      {/* Section header matching design */}
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-serif-italic" style={{ fontSize: '24px', color: '#012374', lineHeight: '1.1' }}>
          How do you feel?
        </h2>
        <span style={{ fontSize: '11px', color: '#C8932B', fontWeight: 700 }}>¿Cómo te sientes?</span>
      </div>

      {/* Mood orb */}
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
          {selectedMood ? (
            <>
              <p className="font-serif-italic" style={{ fontSize: '20px', color: '#012374', lineHeight: '1.1' }}>
                {MOOD_GROUPS.flatMap(g => g.moods).find(m => m.value === selectedMood)?.label}
              </p>
              {saved && (
                <p style={{ fontSize: '11px', color: '#C8932B', fontWeight: 600, marginTop: '2px' }}>Saved</p>
              )}
            </>
          ) : (
            <p style={{ fontSize: '13px', color: 'rgba(1,35,116,0.5)' }}>
              Choose how you feel today
            </p>
          )}
        </div>
      </div>

      {/* Grouped mood pills — NO emojis */}
      <div className="space-y-3">
        {MOOD_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-[6px] h-[6px] rounded-full shrink-0"
                style={{ background: group.dotColor }}
              />
              <span
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#16182A',
                  opacity: 0.6,
                  fontWeight: 600,
                }}
              >
                {group.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-[6px]">
              {group.moods.map((mood) => {
                const isSelected = selectedMood === mood.value;
                return (
                  <button
                    key={mood.value}
                    onClick={() => handleSave(mood.value)}
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

      {/* Stress segmented selector */}
      <div
        className="mt-4"
        style={{
          background: 'var(--bg-card)',
          borderRadius: '18px',
          padding: '14px 16px',
          border: '1px solid rgba(1,35,116,0.06)',
        }}
      >
        <p style={{ fontSize: '13px', color: '#16182A' }}>
          <span className="font-serif-italic" style={{ fontSize: '16px', color: '#012374' }}>
            Stress today is
          </span>
        </p>
        <div className="flex gap-1 mt-3">
          {STRESS_LEVELS.map((level) => {
            const isSelected = selectedStress === level;
            return (
              <button
                key={level}
                onClick={() => handleStressSelect(level)}
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
    </div>
  );
}
