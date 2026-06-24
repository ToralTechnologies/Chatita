'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, TrendingUp, Award, Settings } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { href: '/home', icon: Home, label: t.nav.home },
    { href: '/insights', icon: TrendingUp, label: t.nav.insights },
    { href: '/add-meal', icon: Camera, label: t.nav.add, isPrimary: true },
    { href: '/rewards', icon: Award, label: t.nav.rewards },
    { href: '/settings', icon: Settings, label: t.nav.settings },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 pb-safe"
      style={{
        background: 'var(--bg-nav)',
        borderTop: '1px solid var(--border-nav)',
      }}
    >
      {/* Gold top border — always visible */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'var(--border-nav, rgba(200,147,43,0.3))' }}
      />
      <div
        className="h-px w-full"
        style={{ background: 'rgba(200,147,43,0.3)' }}
      />
      <div className="flex justify-around items-center h-[68px] max-w-2xl mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div
                  className="w-[42px] h-[42px] rounded-full flex items-center justify-center transition-transform active:scale-95"
                  style={{
                    background: '#012374',
                    boxShadow: '0 6px 16px -4px rgba(1,35,116,0.5)',
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: '#FFFDF9' }} strokeWidth={2} />
                </div>
                <span
                  className="text-[10px] font-semibold mt-1"
                  style={{ color: 'var(--text-primary)', opacity: isActive ? 1 : 0.55 }}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center min-w-[52px] py-1 transition-opacity"
              style={{
                color: 'var(--text-primary)',
                opacity: isActive ? 1 : 0.5,
              }}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-semibold mt-[3px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
