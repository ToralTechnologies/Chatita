'use client';

import { useState } from 'react';
import { Mood } from '@/types';

interface MoodSelectorProps {
  onSave?: (mood: Mood, stressLevel: number, notes?: string) => void;
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

export default function MoodSelector({ onSave }: MoodSelectorProps) {
  const [zone, setZone] = useState<Zone | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [selectedStress, setSelectedStress] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const orb = selectedMood ? ORB_COLORS[selectedMood] : { from: '#A4ACC6', to: '#7C86AB', shadow: '#7C86AB' };

  const handleZoneSelect = (z: Zone) => {
    setZone(z);
    // Reset word selection when changing zone
    setSelectedMood(null);
    setSelectedLabel(null);
  };

  const handleWordSelect = (mood: Mood, label: string) => {
    setSelectedMood(mood);
    setSelectedLabel(label);
  };

  const handleSave = () => {
    if (!selectedMood) return;
    const stressVal = selectedStress ? STRESS_VALUES[selectedStress] : 5;
    onSave?.(selectedMood, stressVal, notes || undefined);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const ZONES: Zone[] = ['unpleasant', 'neutral', 'pleasant'];

  return (
    <div>
      {/* Header */}
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-serif-italic" style={{ fontSize: '24px', color: '#012374', lineHeight: '1.1' }}>
          How do you feel?
        </h2>
        <span style={{ fontSize: '11px', color: '#C8932B', fontWeight: 700 }}>¿Cómo te sientes?</span>
      </div>

      {/* Mood orb + label */}
      <div className="flex items-center gap-4 mb-5">
        <div
          className="shrink-0 transition-all duration-500"
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, ${orb.from}, ${orb.to})`,
            boxShadow: `0 12px 28px -8px ${orb.shadow}88`,
          }}
        />
        <div>
          {selectedLabel ? (
            <>
              <p className="font-serif-italic" style={{ fontSize: '20px', color: '#012374', lineHeight: '1.1' }}>
                {selectedLabel}
              </p>
              {zone && (
                <p style={{ fontSize: '11px', color: 'rgba(1,35,116,0.45)', marginTop: '2px' }}>
                  {ZONE_LABELS[zone]}
                </p>
              )}
            </>
          ) : zone ? (
            <p style={{ fontSize: '13px', color: 'rgba(1,35,116,0.5)' }}>
              Pick a word below
            </p>
          ) : (
            <p style={{ fontSize: '13px', color: 'rgba(1,35,116,0.5)' }}>
              Start by choosing a zone
            </p>
          )}
          {saved && (
            <p style={{ fontSize: '11px', color: '#7ED321', fontWeight: 600, marginTop: '2px' }}>Saved ✓</p>
          )}
        </div>
      </div>

      {/* Step 1 — Zone selector (3 big tap targets) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '6px',
          marginBottom: '16px',
        }}
      >
        {ZONES.map((z) => {
          const isActive = zone === z;
          const c = ZONE_COLORS[z];
          return (
            <button
              key={z}
              onClick={() => handleZoneSelect(z)}
              className="transition-all active:scale-95"
              style={{
                padding: '10px 6px',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 500,
                background: isActive ? c.bg : 'var(--bg-card)',
                color: isActive ? c.text : 'rgba(1,35,116,0.55)',
                border: isActive ? `1.5px solid ${c.border}` : '1px solid rgba(1,35,116,0.14)',
                textAlign: 'center',
              }}
            >
              {ZONE_LABELS[z]}
            </button>
          );
        })}
      </div>

      {/* Step 2 — Specific word chips (shown after zone is picked) */}
      {zone && (
        <div style={{ marginBottom: '16px' }}>
          <p
            style={{
              fontSize: '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#16182A',
              opacity: 0.5,
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            {ZONE_LABELS[zone]} — pick a word
          </p>
          <div className="flex flex-wrap gap-[7px]">
            {ZONE_WORDS[zone].map((w) => {
              const isSelected = selectedLabel === w.label;
              return (
                <button
                  key={w.label}
                  onClick={() => handleWordSelect(w.value, w.label)}
                  className="transition-all active:scale-95"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '99px',
                    fontSize: '13px',
                    fontWeight: isSelected ? 600 : 400,
                    background: isSelected ? '#012374' : 'var(--bg-card)',
                    color: isSelected ? '#FFFDF9' : '#012374',
                    border: isSelected ? '1px solid #012374' : '1px solid rgba(1,35,116,0.22)',
                  }}
                >
                  {w.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stress selector */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '18px',
          padding: '14px 16px',
          border: '1px solid rgba(1,35,116,0.06)',
          marginBottom: '14px',
        }}
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

      {/* Notes */}
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
          marginBottom: '12px',
          boxSizing: 'border-box',
        }}
      />

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={!selectedMood}
        style={{
          width: '100%',
          padding: '13px',
          borderRadius: '14px',
          background: saved ? '#7ED321' : selectedMood ? '#012374' : 'rgba(1,35,116,0.2)',
          color: '#FFFDF9',
          fontSize: '14px',
          fontWeight: 600,
          border: 'none',
          cursor: selectedMood ? 'pointer' : 'not-allowed',
          transition: 'background 0.3s',
        }}
      >
        {saved ? 'Check-in saved ✓' : 'Save check-in'}
      </button>
    </div>
  );
}
