'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string;
  label?: string;
  light?: boolean; // white text, for dark backgrounds
}

export default function BackButton({ href, label = 'Back', light = false }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        fontWeight: 600,
        color: light ? 'rgba(255,253,249,0.75)' : 'rgba(1,35,116,0.55)',
        background: 'none',
        border: 'none',
        // 44px touch target without shifting surrounding layout
        padding: '12px 8px',
        margin: '-8px -8px -8px -8px',
        minHeight: 44,
        cursor: 'pointer',
        fontFamily: 'inherit',
        letterSpacing: '0.01em',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </button>
  );
}
