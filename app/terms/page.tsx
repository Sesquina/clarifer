import Link from "next/link";

export const metadata = {
  title: "Terms of Service – Medalyn",
  description: "Medalyn terms of service — rules and guidelines for using our platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 font-[family-name:var(--font-dm-sans)]">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-violet-700 hover:underline"
        >
          ← Back to home
        </Link>

        <h1 className="mb-6 text-3xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mb-4 text-sm text-gray-500">Last updated: March 28, 2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Medalyn (the &quot;Service&quot;), operated by Cassini Design Group, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">2. Description of Service</h2>
            <p>
              Medalyn is an AI-powered health companion designed to help users manage chronic conditions. The Service provides tools for symptom tracking, medication management, health logging, and AI-generated insights.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">3. Medical Disclaimer</h2>
            <p>
              <strong>Medalyn is not a substitute for professional medical advice, diagnosis, or treatment.</strong> Always seek the advice of your physician or other qualified health provider with any questions regarding a medical condition. Never disregard professional medical advice or delay seeking it because of information provided by the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">4. User Accounts</h2>
            <ul className="ml-6 list-disc space-y-1">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Attempt to gain unauthorized access to any part of the Service.</li>
              <li>Interfere with or disrupt the Service or its infrastructure.</li>
              <li>Upload malicious code or content.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">6. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the Service are owned by Cassini Design Group and are protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Cassini Design Group shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">8. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at any time, with or without cause or notice.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">9. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">10. Contact Us</h2>
            <p>
              Questions about these Terms? Contact us at{" "}
              <a href="mailto:hello@cassinidesigngroup.com" className="text-violet-700 hover:underline">
                hello@cassinidesigngroup.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
