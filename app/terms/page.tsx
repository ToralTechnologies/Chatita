import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Terms of Use — Chatita',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '1.35rem',
  color: '#001A4D',
  marginBottom: '12px',
};

const dangerBoxStyle: React.CSSProperties = {
  background: 'rgba(208,2,27,0.06)',
  border: '1px solid rgba(208,2,27,0.18)',
  borderRadius: '14px',
  padding: '16px 18px',
  marginBottom: '16px',
};

export default function TermsPage() {
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
          Terms of Use
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(1,35,116,0.5)', marginBottom: '44px' }}>
          Last updated: June 2026
        </p>

        {/* 1. Acceptance */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>1. Acceptance of Terms</h2>
          <p style={{ color: '#16182A', lineHeight: 1.75 }}>
            By accessing or using Chatita, you agree to these Terms of Use. If you do not agree,
            please do not use the app.
          </p>
        </section>

        {/* 2. Not Medical Advice */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>2. Not Medical Advice</h2>
          <div style={dangerBoxStyle}>
            <p style={{ fontWeight: 700, color: '#D0021B', marginBottom: '8px' }}>
              ⚠️ Important Medical Disclaimer
            </p>
            <p style={{ fontSize: '14px', color: '#7A0011', lineHeight: 1.65 }}>
              Chatita is a personal tracking and informational tool only. It is{' '}
              <strong>not</strong> a medical device, and nothing in the app constitutes medical
              advice, diagnosis, or treatment. Always consult a qualified healthcare provider for
              medical decisions related to your diabetes management.
            </p>
          </div>
          <p style={{ marginBottom: '10px', color: '#16182A', lineHeight: 1.75 }}>Specifically:</p>
          <ul style={{ paddingLeft: '20px', color: '#16182A', lineHeight: 1.9 }}>
            <li>AI-generated responses are for informational purposes only and may be inaccurate.</li>
            <li>
              Meal nutrition estimates are approximations and should not be used as the sole basis
              for insulin dosing or medical decisions.
            </li>
            <li>Chatita is not a substitute for professional medical care.</li>
          </ul>
        </section>

        {/* 3. Not for Emergencies */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>3. Not for Emergencies</h2>
          <div style={dangerBoxStyle}>
            <p style={{ fontWeight: 600, color: '#D0021B', fontSize: '14px', lineHeight: 1.65 }}>
              Chatita is NOT an emergency service. If you are experiencing a medical emergency,
              call 911 (US) or your local emergency number immediately.
            </p>
          </div>
        </section>

        {/* 4. Limitation of Liability */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>4. Limitation of Liability</h2>
          <p style={{ marginBottom: '12px', color: '#16182A', lineHeight: 1.75 }}>
            To the maximum extent permitted by law, Chatita and its creators shall not be liable
            for any direct, indirect, incidental, special, or consequential damages arising from:
          </p>
          <ul style={{ paddingLeft: '20px', color: '#16182A', lineHeight: 1.9 }}>
            <li>Your reliance on any AI-generated content or nutritional estimates</li>
            <li>Errors, inaccuracies, or omissions in app content</li>
            <li>Any health outcomes resulting from use of the app</li>
          </ul>
        </section>

        {/* 5. AI Content */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>5. AI Content</h2>
          <p style={{ color: '#16182A', lineHeight: 1.75 }}>
            Chatita uses artificial intelligence (Claude by Anthropic) to generate responses. AI
            output may occasionally be incorrect, incomplete, or outdated. You should not rely
            solely on AI responses for medical decisions.
          </p>
        </section>

        {/* 6. Account Responsibility */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>6. Account Responsibility</h2>
          <p style={{ color: '#16182A', lineHeight: 1.75 }}>
            You are responsible for maintaining the security of your account credentials. You may
            delete your account at any time from the Settings page.
          </p>
        </section>

        {/* 7. Changes to Terms */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="font-serif-italic" style={sectionHeadingStyle}>7. Changes to Terms</h2>
          <p style={{ color: '#16182A', lineHeight: 1.75 }}>
            We may update these Terms from time to time. Continued use of Chatita after changes
            constitutes acceptance of the updated Terms.
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
          <Link href="/privacy" style={{ fontSize: '13px', color: 'rgba(1,35,116,0.55)', fontWeight: 500 }}>
            Privacy Policy
          </Link>
          <Link href="/consent" style={{ fontSize: '13px', color: 'rgba(1,35,116,0.55)', fontWeight: 500 }}>
            Consent
          </Link>
        </div>
      </main>
    </div>
  );
}
