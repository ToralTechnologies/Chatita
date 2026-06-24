import Link from 'next/link';

export const metadata = {
  title: 'Terms of Use — Chatita',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-ink">
      <h1 className="font-serif text-4xl mb-2">Terms of Use</h1>
      <p className="text-sm text-gray-secondary mb-8">Last updated: June 2026</p>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-3">1. Acceptance of Terms</h2>
        <p>
          By accessing or using Chatita, you agree to these Terms of Use. If you do not agree,
          please do not use the app.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-3">2. Not Medical Advice</h2>
        <div className="bg-red-50 border border-red-300 rounded p-4 mb-4">
          <p className="font-semibold text-red-800 mb-2">⚠️ Important Medical Disclaimer</p>
          <p className="text-red-700 text-sm">
            Chatita is a personal tracking and informational tool only. It is <strong>not</strong> a
            medical device, and nothing in the app constitutes medical advice, diagnosis, or
            treatment. Always consult a qualified healthcare provider for medical decisions related
            to your diabetes management.
          </p>
        </div>
        <p className="mb-3">Specifically:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>AI-generated responses are for informational purposes only and may be inaccurate.</li>
          <li>Meal nutrition estimates are approximations and should not be used as the sole basis for insulin dosing or medical decisions.</li>
          <li>Chatita is not a substitute for professional medical care.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-3">3. Not for Emergencies</h2>
        <p className="font-semibold text-red-700">
          Chatita is NOT an emergency service. If you are experiencing a medical emergency,
          call 911 (US) or your local emergency number immediately.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-3">4. Limitation of Liability</h2>
        <p className="mb-3">
          To the maximum extent permitted by law, Chatita and its creators shall not be liable for
          any direct, indirect, incidental, special, or consequential damages arising from:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Your reliance on any AI-generated content or nutritional estimates</li>
          <li>Errors, inaccuracies, or omissions in app content</li>
          <li>Any health outcomes resulting from use of the app</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-3">5. AI Content</h2>
        <p>
          Chatita uses artificial intelligence (Claude by Anthropic) to generate responses. AI
          output may occasionally be incorrect, incomplete, or outdated. You should not rely solely
          on AI responses for medical decisions.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-3">6. Account Responsibility</h2>
        <p>
          You are responsible for maintaining the security of your account credentials. You may
          delete your account at any time from the Settings page.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl mb-3">7. Changes to Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of Chatita after changes
          constitutes acceptance of the updated Terms.
        </p>
      </section>

      <div className="border-t border-gray-200 pt-6 mt-8 flex gap-6 text-sm text-gray-secondary">
        <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
        <Link href="/consent" className="hover:text-primary">Consent</Link>
        <Link href="/" className="hover:text-primary">← Back to app</Link>
      </div>
    </div>
  );
}
