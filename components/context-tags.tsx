'use client';

import { useState } from 'react';
import { UserContext } from '@/types';

interface ContextTagsProps {
  onSave?: (context: UserContext) => void;
}

export default function ContextTags({ onSave }: ContextTagsProps) {
  const [context, setContext] = useState<UserContext>({
    notFeelingWell: false,
    onPeriod: false,
    feelingOverwhelmed: false,
    havingCravings: false,
  });

  const toggleContext = (key: keyof UserContext) => {
    const newContext = { ...context, [key]: !context[key] };
    setContext(newContext);
    onSave?.(newContext);
  };

  const tags = [
    { key: 'notFeelingWell' as const, emoji: '🤒', label: 'Not feeling well' },
    { key: 'onPeriod' as const, emoji: '🩸', label: 'On my period' },
    { key: 'feelingOverwhelmed' as const, emoji: '😰', label: 'Feeling overwhelmed' },
    { key: 'havingCravings' as const, emoji: '🍫', label: 'Having cravings' },
  ];

  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Context</h3>
      <p className="text-sm text-gray-600 mb-4">
        Let Chatita know what&apos;s going on today
      </p>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.key}
            onClick={() => toggleContext(tag.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              context[tag.key]
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{tag.emoji}</span>
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}
