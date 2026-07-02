'use client';

import { useTheme } from '@/lib/theme-context';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex items-center gap-1 transition-all active:scale-95"
      style={{
        padding: '12px 12px',
        borderRadius: '99px',
        fontSize: '11px',
        fontWeight: 600,
        background: onDark || theme === 'dark' ? 'rgba(255,253,249,0.13)' : 'rgba(1,35,116,0.08)',
        color: onDark || theme === 'dark' ? '#FFFDF9' : '#012374',
        border: '1px solid ' + (onDark || theme === 'dark' ? 'rgba(255,253,249,0.2)' : 'rgba(1,35,116,0.15)'),
      }}
    >
      {theme === 'dark'
        ? <><Sun className="w-3 h-3" /> Light</>
        : <><Moon className="w-3 h-3" /> Dark</>
      }
    </button>
  );
}
