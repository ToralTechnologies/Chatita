import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Privacy Policy — Chatita',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '1.35rem',
  color: '#001A4D',
  marginBottom: '12px',
};

const noteBoxStyle: React.CSSProperties = {
  background: 'rgba(200,147,43,0.08)',
  border: '1px solid rgba(200,147,43,0.28)',
  borderRadius: '14px',
  padding: '14px 18px',
  marginBottom: '12px',
};

const linkStyle: React.CSSProperties = {
  color: '#012374',
  fontWeight: 600,
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(1,35,116,0.5)', marginBottom: '44px' }}>
          Last updated: June 2026
        </p>

        {/* 1. Overview */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>1. Overview</h2>
          <p style={{ marginBottom: '12px', color: '#16182A', lineHeight: 1.75 }}>
            Chatita (&quot;we,&quot; &quot;our,&quot; or &quot;the app&quot;) is a personal diabetes management
            companion. This Privacy Policy describes how we collect, use, and protect your
            information when you use our service.
          </p>
          <div style={noteBoxStyle}>
            <p className="text-sm" style={{ color: '#7A5200', lineHeight: 1.65 }}>
              <strong>Not a HIPAA-covered entity.</strong> Chatita is not a healthcare provider,
              health plan, or healthcare clearinghouse and is not subject to HIPAA. Your data is
              protected under this Privacy Policy and applicable data protection laws.
            </p>
          </div>
        </section>

        {/* 2. Data We Collect */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>2. Data We Collect</h2>
          <ul style={{ paddingLeft: '20px', color: '#16182A', lineHeight: 1.9 }}>
            <li>Account information (email address, name)</li>
            <li>Glucose readings you log manually</li>
            <li>Meal photos and nutrition data</li>
            <li>Mood and symptom entries</li>
            <li>CGM integration credentials (encrypted at rest with AES-256-GCM)</li>
            <li>Chat messages with Chatita&apos;s AI assistant</li>
          </ul>
        </section>

        {/* 3. Third-Party Services */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>3. Third-Party Services</h2>
          <p style={{ marginBottom: '12px', color: '#16182A', lineHeight: 1.75 }}>
            We use the following third-party services to provide Chatita:
          </p>
          <ul style={{ paddingLeft: '20px', color: '#16182A', lineHeight: 1.9 }}>
            <li>
              <strong>Anthropic</strong> — AI responses processed by Claude. Your chat messages and
              health context are sent to Anthropic&apos;s API.{' '}
              <a href="https://www.anthropic.com/privacy" style={linkStyle} target="_blank" rel="noopener noreferrer">
                Anthropic&apos;s Privacy Policy
              </a>
            </li>
            <li>
              <strong>Vercel</strong> — Hosting provider.{' '}
              <a href="https://vercel.com/legal/privacy-policy" style={linkStyle} target="_blank" rel="noopener noreferrer">
                Vercel&apos;s Privacy Policy
              </a>
            </li>
            <li>
              <strong>Neon (PostgreSQL)</strong> — Database hosting. Your data is stored in Neon&apos;s
              managed PostgreSQL.{' '}
              <a href="https://neon.tech/privacy-policy" style={linkStyle} target="_blank" rel="noopener noreferrer">
                Neon&apos;s Privacy Policy
              </a>
            </li>
            <li>
              <strong>Dexcom</strong> — Optional CGM integration.{' '}
              <a href="https://www.dexcom.com/en-us/legal/privacy-policy" style={linkStyle} target="_blank" rel="noopener noreferrer">
                Dexcom&apos;s Privacy Policy
              </a>
            </li>
            <li>
              <strong>Abbott / FreeStyle Libre</strong> — Optional LibreLinkUp integration.
              Credentials are encrypted and stored only to sync your data.
            </li>
            <li>
              <strong>Google Fitness / Health</strong> — Optional wearable data integration.
              Activity, sleep, and heart rate data may be fetched from Google&apos;s APIs.{' '}
              <a href="https://policies.google.com/privacy" style={linkStyle} target="_blank" rel="noopener noreferrer">
                Google&apos;s Privacy Policy
              </a>
            </li>
            <li><strong>USDA FoodData Central</strong> — Nutrition data for food search.</li>
            <li><strong>Stripe</strong> (future) — Payment processing for Pro subscriptions.</li>
          </ul>
        </section>

        {/* 4. How We Use Your Data */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>4. How We Use Your Data</h2>
          <ul style={{ paddingLeft: '20px', color: '#16182A', lineHeight: 1.9 }}>
            <li>To provide personalized diabetes management guidance</li>
            <li>To generate AI-powered chat responses and meal analysis</li>
            <li>To display your health history and trends</li>
            <li>We do not sell your data to third parties</li>
          </ul>
        </section>

        {/* 5. Data Deletion */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>5. Data Deletion</h2>
          <p style={{ color: '#16182A', lineHeight: 1.75 }}>
            You may delete your account and all associated data at any time from the Settings page.
            Account deletion permanently removes all your data from our systems.
          </p>
        </section>

        {/* 6. Contact */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>6. Contact</h2>
          <p style={{ color: '#16182A', lineHeight: 1.75 }}>
            Questions about this policy? Contact us at{' '}
            <a href="mailto:privacy@chatita.app" style={linkStyle}>
              privacy@chatita.app
            </a>
            .
          </p>
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
          <Link href="/terms" style={{ fontSize: '13px', color: 'rgba(1,35,116,0.55)', fontWeight: 500 }}>
            Terms of Use
          </Link>
          <Link href="/consent" style={{ fontSize: '13px', color: 'rgba(1,35,116,0.55)', fontWeight: 500 }}>
            Consent
          </Link>
        </div>
      </main>
    </div>
  );
}
