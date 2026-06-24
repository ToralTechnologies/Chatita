import Link from 'next/link';

export const metadata = {
  title: 'Consent — Chatita',
};

export default function ConsentPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-ink">
      <h1 className="font-serif text-4xl mb-2">Data Processing Consent</h1>
      <p className="text-sm text-gray-secondary mb-8">
        This page describes what you consent to when using Chatita&apos;s features.
      </p>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-4">1. AI Processing Consent</h2>
        <div className="border border-gray-200 rounded-lg p-5 bg-canvas">
          <p className="font-semibold mb-2">What this means:</p>
          <p className="mb-4 text-sm">
            When you use Chatita&apos;s AI chat or meal analysis features, your messages, meal photos,
            and health context (glucose readings, recent meals, diabetes type) are sent to
            Anthropic&apos;s Claude AI for processing. Anthropic may retain this data per their
            privacy policy.
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm mb-4">
            <li>Chat messages are processed by Claude (Anthropic)</li>
            <li>Meal photos are analyzed by Claude Vision</li>
            <li>Your recent health data is included as context for AI responses</li>
            <li>AI responses are informational only — not medical advice</li>
          </ul>
          <p className="text-sm text-gray-secondary">
            You may disable AI features in Settings at any time. Without AI, Chatita uses template
            responses for chat.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-4">2. CGM Connection Consent</h2>
        <div className="border border-gray-200 rounded-lg p-5 bg-canvas">
          <p className="font-semibold mb-2">What this means:</p>
          <p className="mb-4 text-sm">
            If you connect a Continuous Glucose Monitor (Dexcom or FreeStyle Libre), Chatita will:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm mb-4">
            <li>Store your CGM credentials encrypted at rest (AES-256-GCM)</li>
            <li>Periodically fetch your glucose readings from the CGM provider&apos;s API</li>
            <li>Store glucose readings in our database associated with your account</li>
            <li>Include recent glucose data as context for AI responses</li>
          </ul>
          <p className="text-sm text-gray-secondary">
            You may disconnect your CGM at any time from Settings. Disconnecting stops future
            syncing but does not delete previously synced readings.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-3">3. Your Rights</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>You may delete your account and all data from Settings → Account → Delete Account.</li>
          <li>You may opt out of AI features at any time in Settings.</li>
          <li>You may disconnect CGM integrations at any time in Settings.</li>
        </ul>
      </section>

      <div className="border-t border-gray-200 pt-6 mt-8 flex gap-6 text-sm text-gray-secondary">
        <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-primary">Terms of Use</Link>
        <Link href="/" className="hover:text-primary">← Back to app</Link>
      </div>
    </div>
  );
}
