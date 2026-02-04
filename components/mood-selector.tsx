'use client';

import { useState } from 'react';
import { Mood } from '@/types';

interface MoodSelectorProps {
  onSave?: (mood: Mood, stressLevel: number) => void;
}

export default function MoodSelector({ onSave }: MoodSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [stressLevel, setStressLevel] = useState(5);

  const moods: { value: Mood; emoji: string; label: string }[] = [
    { value: 'happy', emoji: '😊', label: 'Great' },
    { value: 'grateful', emoji: '🥰', label: 'Grateful' },
    { value: 'calm', emoji: '😌', label: 'Calm' },
    { value: 'neutral', emoji: '😐', label: 'Okay' },
    { value: 'tired', emoji: '😴', label: 'Tired' },
    { value: 'anxious', emoji: '😟', label: 'Anxious' },
    { value: 'sad', emoji: '😞', label: 'Down' },
  ];

  const handleSave = () => {
    if (selectedMood) {
      onSave?.(selectedMood, stressLevel);
      // Reset after save
      setSelectedMood(null);
      setStressLevel(5);
    }
  };

  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <h3 className="text-lg font-semibold mb-4">How do you feel?</h3>

      {/* Mood selection */}
      <div className="flex flex-wrap gap-2 mb-6">
        {moods.map((mood) => (
          <button
            key={mood.value}
            onClick={() => setSelectedMood(mood.value)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all ${
              selectedMood === mood.value
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <span className="text-xl">{mood.emoji}</span>
            <span className="text-sm font-medium">{mood.label}</span>
          </button>
        ))}
      </div>

      {/* Stress level */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">
          Stress Level: <span className="text-primary font-semibold">{stressLevel}</span>
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={stressLevel}
          onChange={(e) => setStressLevel(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low (1)</span>
          <span>High (10)</span>
        </div>
      </div>

      {selectedMood && (
        <button
          onClick={handleSave}
          className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Save Mood
        </button>
      )}
    </div>
  );
}
