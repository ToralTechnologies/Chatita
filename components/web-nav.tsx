'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ChatInterface from '@/components/chat-interface';
import { useTranslation } from '@/lib/i18n/context';

const NAV = [
  {
    href: '/home', labelKey: 'home' as const,
    icon: (op: number) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <path d="M4 12l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8z" stroke="#FFFDF9" strokeWidth="1.6" opacity={op}/>
      </svg>
    ),
  },
  {
    href: '/meal-history', labelKey: 'mealHistory' as const,
    icon: (op: number) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#FFFDF9" strokeWidth="1.6" opacity={op}/>
        <path d="M12 7v5l3.5 2" stroke="#FFFDF9" strokeWidth="1.6" strokeLinecap="round" opacity={op}/>
      </svg>
    ),
  },
  {
    href: '/recipes', labelKey: 'recipes' as const,
    icon: (op: number) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <path d="M4 12a8 8 0 0 1 16 0v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1z" stroke="#FFFDF9" strokeWidth="1.6" opacity={op}/>
        <path d="M3 19h18" stroke="#FFFDF9" strokeWidth="1.6" strokeLinecap="round" opacity={op}/>
      </svg>
    ),
  },
  {
    href: '/saved-recipes', labelKey: 'savedRecipes' as const,
    icon: (op: number) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" stroke="#FFFDF9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity={op}/>
      </svg>
    ),
  },
  {
    href: '/menu-scanner', labelKey: 'scanMenu' as const,
    icon: (op: number) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="#FFFDF9" strokeWidth="1.6" opacity={op}/>
        <circle cx="12" cy="12.5" r="3.5" stroke="#FFFDF9" strokeWidth="1.6" opacity={op}/>
        <path d="M8 6l1.5-2h5L16 6" stroke="#FFFDF9" strokeWidth="1.6" opacity={op}/>
      </svg>
    ),
  },
  {
    href: '/meal-plan', labelKey: 'mealPlan' as const,
    icon: (op: number) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2.5" stroke="#FFFDF9" strokeWidth="1.6" opacity={op}/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="#FFFDF9" strokeWidth="1.6" strokeLinecap="round" opacity={op}/>
      </svg>
    ),
  },
  {
    href: '/grocery-list', labelKey: 'grocery' as const,
    icon: (op: number) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <path d="M5 7h14l-1.2 10a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7z" stroke="#FFFDF9" strokeWidth="1.6" opacity={op}/>
        <path d="M9 7a3 3 0 0 1 6 0" stroke="#FFFDF9" strokeWidth="1.6" opacity={op}/>
      </svg>
    ),
  },
  {
    href: '/restaurant-finder', labelKey: 'restaurants' as const,
    icon: (op: number) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" stroke="#FFFDF9" strokeWidth="1.6" opacity={op}/>
        <circle cx="12" cy="10" r="2.5" stroke="#FFFDF9" strokeWidth="1.6" opacity={op}/>
      </svg>
    ),
  },
  {
    href: '/insights', labelKey: 'insights' as const,
    icon: (op: number) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <path d="M4 19V5m0 14h16M4 15l4-4 3 3 5-6 4 5" stroke="#FFFDF9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity={op}/>
      </svg>
    ),
  },
  {
    href: '/mood-log', labelKey: 'moodJournal' as const,
    icon: (op: number) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#FFFDF9" strokeWidth="1.6" opacity={op}/>
        <path d="M8.5 14s1 1.5 3.5 1.5 3.5-1.5 3.5-1.5M9 9.5h.01M15 9.5h.01" stroke="#FFFDF9" strokeWidth="1.8" strokeLinecap="round" opacity={op}/>
      </svg>
    ),
  },
  {
    href: '/settings', labelKey: 'settings' as const,
    icon: (op: number) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="2.5" stroke="#FFFDF9" strokeWidth="1.6" opacity={op}/>
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#FFFDF9" strokeWidth="1.6" strokeLinecap="round" opacity={op}/>
      </svg>
    ),
  },
];

export default function WebNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const firstName = (session?.user?.name ?? '').split(' ')[0] || 'you';
  const [showChat, setShowChat] = useState(false);

  return (
    <nav
      style={{
        width: '248px',
        flexShrink: 0,
        background: '#012374',
        color: '#FFFDF9',
        display: 'flex',
        flexDirection: 'column',
        padding: '26px 18px',
      }}
    >
      {/* Logo — white reversed mark on navy per brand guidelines */}
      <div style={{ padding: '0 8px' }}>
        <Image
          src="/chatita-horizontal.svg"
          alt="Chatita"
          width={148}
          height={36}
          style={{ filter: 'brightness(0) invert(1)', display: 'block' }}
        />
      </div>

      {/* Nav items */}
      <div style={{ marginTop: '34px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {NAV.map(({ href, labelKey, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '13px',
                padding: '12px 14px',
                borderRadius: '13px',
                fontSize: '15px',
                fontWeight: active ? 600 : 400,
                color: active ? '#FFFDF9' : 'rgba(255,253,249,0.82)',
                background: active ? 'rgba(255,253,249,0.13)' : 'transparent',
                textDecoration: 'none',
                transition: 'background .15s',
              }}
            >
              {icon(active ? 1 : 0.75)}
              {(t.nav as any)[labelKey]}
            </Link>
          );
        })}

        {/* Chat with Chatita */}
        <button
          onClick={() => setShowChat(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '13px', padding: '12px 14px',
            borderRadius: '13px', fontSize: '15px', fontWeight: 600, marginTop: '6px',
            color: '#012374', background: '#FFFDF9', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', textAlign: 'left', width: '100%',
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" stroke="#012374" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t.nav.chatWithChatita}
        </button>
      </div>

      {showChat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,26,77,0.45)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowChat(false); }}>
          <div style={{ width: '100%', maxWidth: 480, height: 'min(680px, 90vh)', display: 'flex' }}>
            <ChatInterface onClose={() => setShowChat(false)} />
          </div>
        </div>
      )}

      {/* User section */}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 10px', borderTop: '1px solid rgba(255,253,249,0.14)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,253,249,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="font-serif-italic" style={{ fontSize: '18px' }}>{firstName[0]?.toUpperCase()}</span>
        </div>
        <div style={{ lineHeight: 1.2, overflow: 'hidden' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,253,249,0.62)' }}>{t.nav.tagline}</div>
        </div>
      </div>
    </nav>
  );
}
