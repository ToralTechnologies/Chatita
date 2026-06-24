import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Chatita',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-ink">
      <h1 className="font-serif text-4xl mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-secondary mb-8">Last updated: June 2026</p>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-3">1. Overview</h2>
        <p className="mb-3">
          Chatita (&quot;we,&quot; &quot;our,&quot; or &quot;the app&quot;) is a personal diabetes management
          companion. This Privacy Policy describes how we collect, use, and protect your
          information when you use our service.
        </p>
        <p className="text-sm bg-yellow-50 border border-yellow-300 rounded p-3">
          <strong>Not a HIPAA-covered entity.</strong> Chatita is not a healthcare provider,
          health plan, or healthcare clearinghouse and is not subject to the Health Insurance
          Portability and Accountability Act (HIPAA). Your data is protected under this Privacy
          Policy and applicable data protection laws, but not HIPAA.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-3">2. Data We Collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Account information (email address, name)</li>
          <li>Glucose readings you log manually</li>
          <li>Meal photos and nutrition data</li>
          <li>Mood and symptom entries</li>
          <li>CGM integration credentials (encrypted at rest with AES-256-GCM)</li>
          <li>Chat messages with Chatita&apos;s AI assistant</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-3">3. Third-Party Services</h2>
        <p className="mb-3">We use the following third-party services to provide Chatita:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Anthropic</strong> — AI responses are processed by Claude (Anthropic&apos;s AI). Your chat messages and health context are sent to Anthropic&apos;s API. See <a href="https://www.anthropic.com/privacy" className="text-primary underline" target="_blank" rel="noopener noreferrer">Anthropic&apos;s Privacy Policy</a>.</li>
          <li><strong>Vercel</strong> — Our hosting provider. See <a href="https://vercel.com/legal/privacy-policy" className="text-primary underline" target="_blank" rel="noopener noreferrer">Vercel&apos;s Privacy Policy</a>.</li>
          <li><strong>Neon (PostgreSQL)</strong> — Database hosting. Your data is stored in Neon&apos;s managed PostgreSQL. See <a href="https://neon.tech/privacy-policy" className="text-primary underline" target="_blank" rel="noopener noreferrer">Neon&apos;s Privacy Policy</a>.</li>
          <li><strong>Dexcom</strong> — Optional CGM integration. If connected, glucose data is fetched from Dexcom&apos;s API. See <a href="https://www.dexcom.com/en-us/legal/privacy-policy" className="text-primary underline" target="_blank" rel="noopener noreferrer">Dexcom&apos;s Privacy Policy</a>.</li>
          <li><strong>Abbott / FreeStyle Libre</strong> — Optional LibreLinkUp integration. Your LibreLinkUp credentials are encrypted and stored only to sync your data.</li>
          <li><strong>Google Places</strong> — Restaurant search (if enabled). Search queries may be sent to Google. See <a href="https://policies.google.com/privacy" className="text-primary underline" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>.</li>
          <li><strong>USDA FoodData Central</strong> — Nutrition data for food search.</li>
          <li><strong>Stripe</strong> (future) — Payment processing for Pro subscriptions.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-3">4. How We Use Your Data</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>To provide personalized diabetes management guidance</li>
          <li>To generate AI-powered chat responses and meal analysis</li>
          <li>To display your health history and trends</li>
          <li>We do not sell your data to third parties</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-3">5. Data Deletion</h2>
        <p>
          You may delete your account and all associated data at any time from the Settings page.
          Account deletion permanently removes all your data from our systems.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-3">6. Contact</h2>
        <p>
          Questions about this policy? Contact us at{' '}
          <a href="mailto:privacy@chatita.app" className="text-primary underline">
            privacy@chatita.app
          </a>
          .
        </p>
      </section>

      <div className="border-t border-gray-200 pt-6 mt-8 flex gap-6 text-sm text-gray-secondary">
        <Link href="/terms" className="hover:text-primary">Terms of Use</Link>
        <Link href="/consent" className="hover:text-primary">Consent</Link>
        <Link href="/" className="hover:text-primary">← Back to app</Link>
      </div>
    </div>
  );
}
