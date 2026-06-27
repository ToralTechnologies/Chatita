import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Consent — Chatita',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '1.35rem',
  color: '#001A4D',
  marginBottom: '14px',
};

const consentCardStyle: React.CSSProperties = {
  background: '#FFFDF9',
  border: '1px solid rgba(1,35,116,0.08)',
  borderRadius: '18px',
  padding: '20px 22px',
  boxShadow: '0 8px 24px -16px rgba(1,35,116,0.14)',
};

export default function ConsentPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F7EFE1' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid rgba(1,35,116,0.07)',
          padding: '14px 24px',
          background: '#FFFDF9',
        }}
      >
        <div
          style={{
            maxWidth: '48rem',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Image src="/logo-horizontal.svg" alt="Chatita" width={110} height={32} />
          <Link
            href="/"
            style={{ fontSize: '13px', color: 'rgba(1,35,116,0.6)', fontWeight: 500 }}
          >
            ← Back to app
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '48rem', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1
          className="font-serif-italic"
          style={{ fontSize: '2.6rem', color: '#012374', marginBottom: '6px', lineHeight: 1.15 }}
        >
          Data Processing Consent
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(1,35,116,0.5)', marginBottom: '44px' }}>
          This page describes what you consent to when using Chatita&apos;s features.
        </p>

        {/* 1. AI Processing */}
        <section style={{ marginBottom: '32px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>1. AI Processing Consent</h2>
          <div style={consentCardStyle}>
            <p style={{ fontWeight: 600, color: '#001A4D', marginBottom: '10px' }}>What this means:</p>
            <p style={{ fontSize: '14px', color: '#16182A', marginBottom: '14px', lineHeight: 1.7 }}>
              When you use Chatita&apos;s AI chat or meal analysis features, your messages, meal photos,
              and health context (glucose readings, recent meals, diabetes type) are sent to
              Anthropic&apos;s Claude AI for processing. Anthropic may retain this data per their
              privacy policy.
            </p>
            <ul style={{ paddingLeft: '18px', fontSize: '14px', color: '#16182A', lineHeight: 1.85, marginBottom: '14px' }}>
              <li>Chat messages are processed by Claude (Anthropic)</li>
              <li>Meal photos are analyzed by Claude Vision</li>
              <li>Your recent health data is included as context for AI responses</li>
              <li>AI responses are informational only — not medical advice</li>
            </ul>
            <p style={{ fontSize: '13px', color: 'rgba(1,35,116,0.55)', lineHeight: 1.65 }}>
              You may disable AI features in Settings at any time. Without AI, Chatita uses template
              responses for chat.
            </p>
          </div>
        </section>

        {/* 2. CGM Connection */}
        <section style={{ marginBottom: '32px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>2. CGM Connection Consent</h2>
          <div style={consentCardStyle}>
            <p style={{ fontWeight: 600, color: '#001A4D', marginBottom: '10px' }}>What this means:</p>
            <p style={{ fontSize: '14px', color: '#16182A', marginBottom: '14px', lineHeight: 1.7 }}>
              If you connect a Continuous Glucose Monitor (Dexcom or FreeStyle Libre), Chatita will:
            </p>
            <ul style={{ paddingLeft: '18px', fontSize: '14px', color: '#16182A', lineHeight: 1.85, marginBottom: '14px' }}>
              <li>Store your CGM credentials encrypted at rest (AES-256-GCM)</li>
              <li>Periodically fetch your glucose readings from the CGM provider&apos;s API</li>
              <li>Store glucose readings in our database associated with your account</li>
              <li>Include recent glucose data as context for AI responses</li>
            </ul>
            <p style={{ fontSize: '13px', color: 'rgba(1,35,116,0.55)', lineHeight: 1.65 }}>
              You may disconnect your CGM at any time from Settings. Disconnecting stops future
              syncing but does not delete previously synced readings.
            </p>
          </div>
        </section>

        {/* 3. Connected Health */}
        <section style={{ marginBottom: '32px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>3. Connected Health Data Consent</h2>
          <div style={consentCardStyle}>
            <p style={{ fontWeight: 600, color: '#001A4D', marginBottom: '10px' }}>What this means:</p>
            <p style={{ fontSize: '14px', color: '#16182A', marginBottom: '14px', lineHeight: 1.7 }}>
              If you connect Google Health or import Apple Health data, Chatita will:
            </p>
            <ul style={{ paddingLeft: '18px', fontSize: '14px', color: '#16182A', lineHeight: 1.85, marginBottom: '14px' }}>
              <li>Store OAuth tokens encrypted at rest (AES-256-GCM) for ongoing sync</li>
              <li>Fetch daily summaries of steps, sleep, heart rate, and activity</li>
              <li>Use aggregated daily data to provide context to AI responses</li>
              <li>Never store raw wearable files after processing</li>
            </ul>
            <p style={{ fontSize: '13px', color: 'rgba(1,35,116,0.55)', lineHeight: 1.65 }}>
              You may disconnect health integrations at any time from Settings → Connected Health.
            </p>
          </div>
        </section>

        {/* 4. Your Rights */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>4. Your Rights</h2>
          <ul style={{ paddingLeft: '20px', color: '#16182A', lineHeight: 1.9 }}>
            <li>Delete your account and all data from Settings → Account → Delete Account.</li>
            <li>Opt out of AI features at any time in Settings.</li>
            <li>Disconnect CGM or health integrations at any time in Settings.</li>
          </ul>
        </section>

        {/* Footer nav */}
        <div
          style={{
            borderTop: '1px solid rgba(1,35,116,0.1)',
            paddingTop: '24px',
            marginTop: '12px',
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/privacy" style={{ fontSize: '13px', color: 'rgba(1,35,116,0.55)', fontWeight: 500 }}>
            Privacy Policy
          </Link>
          <Link href="/terms" style={{ fontSize: '13px', color: 'rgba(1,35,116,0.55)', fontWeight: 500 }}>
            Terms of Use
          </Link>
        </div>
      </main>
    </div>
  );
}
