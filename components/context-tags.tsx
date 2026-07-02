'use client';

import { useState } from 'react';
import { UserContext } from '@/types';
import { useTranslation } from '@/lib/i18n/context';

interface ContextTagsProps {
  onSave?: (context: UserContext) => void;
}

const TAG_KEYS = ['notFeelingWell', 'onPeriod', 'feelingOverwhelmed', 'havingCravings'] as const;

export default function ContextTags({ onSave }: ContextTagsProps) {
  const { t } = useTranslation();
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
          {t.contextTags.heading}
        </h2>
        <span style={{ fontSize: '11px', color: '#C8932B', fontWeight: 700 }}>{t.contextTags.kicker}</span>
      </div>
      <div className="flex flex-wrap gap-[6px]">
        {TAG_KEYS.map((tagKey) => {
          const active = !!context[tagKey];
          return (
            <button
              key={tagKey}
              onClick={() => toggle(tagKey)}
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
              {t.contextTags[tagKey]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
