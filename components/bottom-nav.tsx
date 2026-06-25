'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';

// SVG icon components matching the exact design file icons
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8z"
        stroke={active ? '#012374' : '#001A4D'}
        strokeWidth={active ? '2' : '1.6'}
        fill={active ? 'rgba(1,35,116,0.1)' : 'none'}
      />
    </svg>
  );
}

function InsightsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 19V5m0 14h16M4 15l4-4 3 3 5-6 4 5"
        stroke="#001A4D"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.45}
      />
    </svg>
  );
}

function RewardsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="#001A4D"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.45}
      />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3.4" stroke="#001A4D" strokeWidth="1.6" opacity={active ? 1 : 0.45} />
      <path
        d="M19 12a7 7 0 0 0-.5-2.6l1.6-1.2-2-3.5-1.9.7a7 7 0 0 0-2.3-1.3L13.5 2h-3l-.4 2.1a7 7 0 0 0-2.3 1.3l-1.9-.7-2 3.5 1.6 1.2A7 7 0 0 0 5 12c0 .9.2 1.8.5 2.6L4 15.8l2 3.5 1.9-.7c.7.6 1.5 1 2.3 1.3l.4 2.1h3l.4-2.1c.8-.3 1.6-.7 2.3-1.3l1.9.7 2-3.5-1.6-1.2c.3-.8.5-1.7.5-2.6z"
        stroke="#001A4D"
        strokeWidth="1.4"
        opacity={active ? 1 : 0.45}
      />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const navBg = isDark ? '#012374' : '#FFFDF9';
  const iconColor = isDark ? 'rgba(255,253,249,0.5)' : undefined;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 pb-safe"
      style={{
        background: navBg,
        borderTop: `1px solid ${isDark ? 'rgba(255,253,249,0.12)' : 'rgba(200,147,43,0.3)'}`,
        height: 'calc(68px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="flex items-center justify-around h-full max-w-2xl mx-auto px-5">

        {/* Home */}
        <Link href="/home" className="flex items-center justify-center w-10 h-10" style={{ opacity: isDark && pathname !== '/home' ? 0.5 : 1 }}>
          <HomeIcon active={pathname === '/home'} />
        </Link>

        {/* Insights */}
        <Link href="/insights" className="flex items-center justify-center w-10 h-10" style={{ opacity: isDark && pathname !== '/insights' ? 0.5 : 1 }}>
          <InsightsIcon active={pathname === '/insights'} />
        </Link>

        {/* Center — Chatita logo icon */}
        <Link href="/add-meal" className="flex items-center justify-center">
          <div
            className="w-[42px] h-[42px] flex items-center justify-center transition-transform active:scale-95"
            style={{
              borderRadius: '13px',
              background: isDark ? 'rgba(255,253,249,0.15)' : '#FFFDF9',
              border: isDark ? '1px solid rgba(255,253,249,0.2)' : '1px solid rgba(1,35,116,0.12)',
              boxShadow: isDark ? 'none' : '0 4px 12px -4px rgba(1,35,116,0.18)',
            }}
          >
            <Image
              src="/logo-icon.svg"
              alt="Add"
              width={20}
              height={20}
              style={{ filter: isDark ? 'brightness(0) invert(1)' : 'none' }}
            />
          </div>
        </Link>

        {/* Mood log */}
        <Link href="/mood-log" className="flex items-center justify-center w-10 h-10" style={{ opacity: isDark && pathname !== '/mood-log' ? 0.5 : 1 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#001A4D" strokeWidth="1.6" opacity={pathname === '/mood-log' ? 1 : 0.45}/>
            <path d="M8.5 14s1 1.5 3.5 1.5 3.5-1.5 3.5-1.5M9 9.5h.01M15 9.5h.01" stroke="#001A4D" strokeWidth="1.8" strokeLinecap="round" opacity={pathname === '/mood-log' ? 1 : 0.45}/>
          </svg>
        </Link>

        {/* Settings */}
        <Link href="/settings" className="flex items-center justify-center w-10 h-10" style={{ opacity: isDark && pathname !== '/settings' ? 0.5 : 1 }}>
          <SettingsIcon active={pathname === '/settings'} />
        </Link>

      </div>
    </nav>
  );
}
