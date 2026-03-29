import Link from "next/link";

export const metadata = {
  title: "Privacy Policy – Medalyn",
  description: "Medalyn privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 font-[family-name:var(--font-dm-sans)]">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-violet-700 hover:underline"
        >
          ← Back to home
        </Link>

        <h1 className="mb-6 text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mb-4 text-sm text-gray-500">Last updated: March 28, 2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">1. Introduction</h2>
            <p>
              Medalyn (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is operated by Cassini Design Group. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application and related services (collectively, the &quot;Service&quot;).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li><strong>Account Information:</strong> name, email address, and authentication credentials.</li>
              <li><strong>Health Information:</strong> symptoms, medications, vitals, and other health data you choose to enter.</li>
              <li><strong>Usage Data:</strong> how you interact with the Service, including pages viewed and features used.</li>
              <li><strong>Device Information:</strong> browser type, operating system, and device identifiers.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">3. How We Use Your Information</h2>
            <ul className="ml-6 list-disc space-y-1">
              <li>To provide, maintain, and improve the Service.</li>
              <li>To personalize your experience and deliver AI-powered health insights.</li>
              <li>To communicate with you about updates, support, and service-related notices.</li>
              <li>To ensure the security and integrity of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">4. Data Sharing &amp; Disclosure</h2>
            <p>
              We do not sell your personal information. We may share data with trusted service providers who assist in operating the Service, or when required by law. All third-party providers are bound by confidentiality obligations.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information, including encryption in transit and at rest. However, no method of electronic transmission or storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">6. Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data at any time by contacting us. Where applicable, you may also have the right to data portability and to withdraw consent.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">7. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
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
