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
    { href: '/add-meal', icon: Camera, label: t.nav.add, isPrimary: true },
    { href: '/insights', icon: TrendingUp, label: t.nav.insights },
    { href: '/rewards', icon: Award, label: t.nav.rewards },
    { href: '/settings', icon: Settings, label: t.nav.settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors">
                  <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <span className="text-xs mt-1 font-medium text-primary">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[64px] py-2 ${
                isActive ? 'text-primary' : 'text-gray-secondary'
              } hover:text-primary transition-colors`}
            >
              <Icon className="w-6 h-6" strokeWidth={2} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
