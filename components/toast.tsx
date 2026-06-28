'use client';

import { useEffect, useState } from 'react';

/**
 * Lightweight, brand-styled toast — a non-blocking replacement for window.alert().
 *
 * Usage: import { toast } from '@/components/toast'; toast('Saved', 'success').
 * Render <ToastHost /> once near the root (done in app/layout.tsx).
 */

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

function emit() {
  for (const l of listeners) l(items);
}

export function toast(message: string, type: ToastType = 'info', durationMs = 4000) {
  const id = nextId++;
  items = [...items, { id, message, type }];
  emit();
  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      items = items.filter((t) => t.id !== id);
      emit();
    }, durationMs);
  }
}

const THEME: Record<ToastType, { bar: string; icon: JSX.Element }> = {
  success: {
    bar: '#1C7A4F',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#1C7A4F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
  },
  // Errors use the danger token (#D0021B), never the brand red (#E3171A).
  error: {
    bar: '#D0021B',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#D0021B" strokeWidth="1.8" /><path d="M12 7v6M12 16v.5" stroke="#D0021B" strokeWidth="2" strokeLinecap="round" /></svg>
    ),
  },
  info: {
    bar: '#012374',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#012374" strokeWidth="1.8" /><path d="M12 11v5M12 8v.5" stroke="#012374" strokeWidth="2" strokeLinecap="round" /></svg>
    ),
  },
};

export function ToastHost() {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: Listener = (next) => setList([...next]);
    listeners.add(listener);
    setList([...items]);
    return () => { listeners.delete(listener); };
  }, []);

  function dismiss(id: number) {
    items = items.filter((t) => t.id !== id);
    emit();
  }

  if (list.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 'min(420px, calc(100vw - 32px))',
        pointerEvents: 'none',
      }}
      role="status"
      aria-live="polite"
    >
      {list.map((t) => {
        const theme = THEME[t.type];
        return (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              background: '#FFFDF9',
              border: '1px solid rgba(1,35,116,0.1)',
              borderLeft: `4px solid ${theme.bar}`,
              borderRadius: 14,
              padding: '13px 16px',
              boxShadow: '0 16px 40px -16px rgba(1,35,116,0.45)',
            }}
          >
            <span style={{ flexShrink: 0, display: 'flex' }}>{theme.icon}</span>
            <span style={{ fontSize: 13.5, color: '#16182A', lineHeight: 1.45, fontWeight: 500 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
