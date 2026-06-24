'use client';

import { useState } from 'react';
import { Mood } from '@/types';

interface MoodSelectorProps {
  onSave?: (mood: Mood, stressLevel: number) => void;
}

const MOOD_COLORS: Record<string, string> = {
  happy:    '#C8932B',
  grateful: '#C8932B',
  calm:     '#7C86AB',
  neutral:  '#7C86AB',
  tired:    '#34508C',
  anxious:  '#34508C',
  sad:      '#001A4D',
};

export default function MoodSelector({ onSave }: MoodSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [stressLevel, setStressLevel] = useState(5);

  const moods: { value: Mood; emoji: string; label: string }[] = [
    { value: 'happy',    emoji: '😊', label: 'Great' },
    { value: 'grateful', emoji: '🥰', label: 'Grateful' },
    { value: 'calm',     emoji: '😌', label: 'Calm' },
    { value: 'neutral',  emoji: '😐', label: 'Okay' },
    { value: 'tired',    emoji: '😴', label: 'Tired' },
    { value: 'anxious',  emoji: '😟', label: 'Anxious' },
    { value: 'sad',      emoji: '😞', label: 'Down' },
  ];

  const handleSave = () => {
    if (selectedMood) {
      onSave?.(selectedMood, stressLevel);
      setSelectedMood(null);
      setStressLevel(5);
    }
  };

  const orbColor = selectedMood ? MOOD_COLORS[selectedMood] : '#7C86AB';

  return (
    <div
      className="p-5"
      style={{
        background: 'var(--bg-card)',
        borderRadius: '22px',
        border: '1px solid var(--border-card)',
        boxShadow: '0 12px 28px -10px rgba(1,35,116,0.22)',
      }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-4"
        style={{ color: 'var(--text-muted)' }}
      >
        How do you feel?
      </p>

      {/* Mood orb + pills row */}
      <div className="flex items-center gap-4 mb-5">
        {/* Mood orb */}
        <div
          className="shrink-0 w-[72px] h-[72px] rounded-full transition-all duration-300"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${orbColor}99, ${orbColor})`,
            boxShadow: `0 12px 30px -8px ${orbColor}88`,
          }}
        />

        {/* Mood pills */}
        <div className="flex flex-wrap gap-2">
          {moods.map((mood) => {
            const selected = selectedMood === mood.value;
            return (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className="flex items-center gap-1.5 transition-all"
                style={{
                  padding: '7px 13px',
                  borderRadius: '99px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  background: selected ? '#012374' : 'var(--bg-card-alt)',
                  color: selected ? '#FFFDF9' : 'var(--text-primary)',
                  border: `1px solid ${selected ? '#012374' : 'rgba(1,35,116,0.22)'}`,
                }}
              >
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stress slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label
            className="text-xs font-semibold"
            style={{ color: 'var(--text-secondary)' }}
          >
            Stress level
          </label>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-chip"
            style={{ background: 'rgba(1,35,116,0.08)', color: '#012374' }}
          >
            {stressLevel} / 10
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={stressLevel}
          onChange={(e) => setStressLevel(parseInt(e.target.value))}
          className="w-full mood-slider"
        />
        <div
          className="flex justify-between text-[10px] font-semibold mt-1.5"
          style={{ color: 'var(--text-muted)' }}
        >
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {selectedMood && (
        <button
          onClick={handleSave}
          className="w-full py-2.5 text-sm font-semibold transition-all"
          style={{
            borderRadius: '12px',
            background: '#012374',
            color: '#FFFDF9',
            boxShadow: '0 10px 22px -10px rgba(1,35,116,0.5)',
          }}
        >
          Save Mood
        </button>
      )}
    </div>
  );
}
