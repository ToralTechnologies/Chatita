'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function WelcomePage() {
  const router = useRouter();

  const dotBase: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '999px',
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-6"
      style={{ background: '#F7EFE1' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full">
        <div className="text-center space-y-6">
          <Image src="/logo.svg" alt="Chatita" width={192} height={72} className="mx-auto mb-4" />

          <h1
            className="font-serif-italic"
            style={{ fontSize: '2.2rem', color: '#012374', lineHeight: 1.2 }}
          >
            Welcome to Chatita
          </h1>

          <div
            style={{
              background: '#FFFDF9',
              borderRadius: '22px',
              border: '1px solid rgba(1,35,116,0.07)',
              boxShadow: '0 14px 30px -24px rgba(1,35,116,0.28)',
              padding: '24px',
            }}
          >
            <p
              className="text-lg italic leading-relaxed"
              style={{ color: 'rgba(1,35,116,0.7)' }}
            >
              &quot;I&apos;m here to help you manage your diabetes with warmth and care,
              just like your abuelita would.&quot;
            </p>
          </div>

          <p style={{ color: 'rgba(1,35,116,0.55)' }}>
            Let&apos;s take this journey together, one step at a time.
          </p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        <button
          onClick={() => router.push('/onboarding/how-it-helps')}
          className="w-full py-4 text-base font-semibold transition-all"
          style={{
            borderRadius: '999px',
            background: '#012374',
            color: '#FFFDF9',
            boxShadow: '0 10px 24px -10px rgba(1,35,116,0.5)',
          }}
        >
          Get Started
        </button>

        <button
          onClick={() => router.push('/home')}
          className="w-full py-3 text-sm transition-colors"
          style={{ color: 'rgba(1,35,116,0.5)' }}
        >
          Skip for now
        </button>

        <div className="flex justify-center gap-2 pt-2">
          <div style={{ ...dotBase, background: '#012374' }} />
          <div style={{ ...dotBase, background: 'rgba(1,35,116,0.18)' }} />
          <div style={{ ...dotBase, background: 'rgba(1,35,116,0.18)' }} />
        </div>
      </div>
    </div>
  );
}
