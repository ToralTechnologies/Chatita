'use client';

import { useTheme } from '@/lib/theme-context';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-chip text-xs font-semibold transition-all active:scale-95 ${className}`}
      style={{
        background: theme === 'dark' ? 'rgba(255,253,249,0.13)' : 'rgba(1,35,116,0.08)',
        color: theme === 'dark' ? '#FFFDF9' : '#012374',
        border: '1px solid ' + (theme === 'dark' ? 'rgba(255,253,249,0.22)' : 'rgba(1,35,116,0.15)'),
      }}
    >
      {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
