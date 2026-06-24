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
        className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        Quick Context
      </p>
      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
        Let Chatita know what&apos;s going on today
      </p>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const active = !!context[tag.key];
          return (
            <button
              key={tag.key}
              onClick={() => toggleContext(tag.key)}
              className="flex items-center gap-1.5 transition-all active:scale-95"
              style={{
                padding: '7px 13px',
                borderRadius: '99px',
                fontSize: '12.5px',
                fontWeight: 600,
                background: active ? '#012374' : 'var(--bg-card-alt)',
                color: active ? '#FFFDF9' : 'var(--text-primary)',
                border: `1px solid ${active ? '#012374' : 'rgba(1,35,116,0.22)'}`,
              }}
            >
              <span>{tag.emoji}</span>
              <span>{tag.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
