'use client';

import { useState } from 'react';
import { UserContext } from '@/types';

interface ContextTagsProps {
  onSave?: (context: UserContext) => void;
}

const TAGS: { key: keyof UserContext; label: string }[] = [
  { key: 'notFeelingWell', label: 'Not feeling well' },
  { key: 'onPeriod', label: 'On my period' },
  { key: 'feelingOverwhelmed', label: 'Feeling overwhelmed' },
  { key: 'havingCravings', label: 'Having cravings' },
];

export default function ContextTags({ onSave }: ContextTagsProps) {
  const [context, setContext] = useState<UserContext>({
    notFeelingWell: false,
    onPeriod: false,
    feelingOverwhelmed: false,
    havingCravings: false,
  });

  const toggle = (key: keyof UserContext) => {
    const updated = { ...context, [key]: !context[key] };
    setContext(updated);
    onSave?.(updated);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-serif-italic" style={{ fontSize: '20px', color: '#012374', lineHeight: '1.1' }}>
          Anything else?
        </h2>
        <span style={{ fontSize: '11px', color: '#C8932B', fontWeight: 700 }}>Quick context</span>
      </div>
      <div className="flex flex-wrap gap-[6px]">
        {TAGS.map((tag) => {
          const active = !!context[tag.key];
          return (
            <button
              key={tag.key}
              onClick={() => toggle(tag.key)}
              className="transition-all active:scale-95"
              style={{
                padding: '7px 13px',
                borderRadius: '99px',
                fontSize: '12.5px',
                fontWeight: 500,
                background: active ? '#012374' : 'var(--bg-card)',
                color: active ? '#FFFDF9' : '#012374',
                border: active ? '1px solid #012374' : '1px solid rgba(1,35,116,0.25)',
              }}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
