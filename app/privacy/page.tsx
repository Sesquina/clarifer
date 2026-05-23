import Link from "next/link";

export const metadata = {
  title: "Privacy Policy -- Clarifer",
  description: "Clarifer privacy policy: how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", color: "var(--text)" }}>
      <main style={{ backgroundColor: "var(--background)", minHeight: "100vh", padding: "80px 24px 60px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Link
            href="/"
            style={{ fontSize: 14, color: "var(--primary)", textDecoration: "underline" }}
          >
            &larr; Back to home
          </Link>

          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(32px, 5vw, 44px)", color: "var(--text)", marginTop: 48, lineHeight: 1.2 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>Last updated: April 22, 2026</p>

          <div style={{ marginTop: 20, padding: "16px 20px", backgroundColor: "var(--pale-sage)", borderRadius: 10, fontSize: 14, color: "var(--text)", lineHeight: 1.8 }}>
            <strong>Clarifer Corp</strong><br />
            Delaware corporation, incorporated April 22, 2026<br />
            EIN: 42-2321700<br />
            Los Angeles, CA<br />
            clarifer.com<br />
            <a href="mailto:legal@clarifer.com" style={{ color: "var(--primary)" }}>legal@clarifer.com</a>
          </div>

          <div className="space-y-6 leading-relaxed" style={{ marginTop: 32, color: "var(--text)", fontSize: 16, lineHeight: 1.75 }}>
            <section>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "var(--primary)", marginBottom: 8 }}>1. Introduction</h2>
              <p>
                Clarifer (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is operated by Clarifer Corp, a Delaware corporation (EIN: 42-2321700). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application and related services (collectively, the &quot;Service&quot;).
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "var(--primary)", marginBottom: 8 }}>2. Information We Collect</h2>
              <p>We may collect the following types of information:</p>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li><strong>Account Information:</strong> name, email address, and authentication credentials.</li>
                <li><strong>Health Information:</strong> symptoms, medications, vitals, and other health data you choose to enter.</li>
                <li><strong>Usage Data:</strong> how you interact with the Service, including pages viewed and features used.</li>
                <li><strong>Device Information:</strong> browser type, operating system, and device identifiers.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "var(--primary)", marginBottom: 8 }}>3. How We Use Your Information</h2>
              <ul className="ml-6 list-disc space-y-1">
                <li>To provide, maintain, and improve the Service.</li>
                <li>To personalize your experience and deliver AI-powered health insights.</li>
                <li>To communicate with you about updates, support, and service-related notices.</li>
                <li>To ensure the security and integrity of the Service.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "var(--primary)", marginBottom: 8 }}>4. Data Sharing and Disclosure</h2>
              <p>
                We do not sell your personal information. We may share data with trusted service providers who assist in operating the Service, or when required by law. All third-party providers are bound by confidentiality obligations.
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "var(--primary)", marginBottom: 8 }}>5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information, including encryption in transit and at rest. However, no method of electronic transmission or storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "var(--primary)", marginBottom: 8 }}>6. Your Rights</h2>
              <p>
                You may request access to, correction of, or deletion of your personal data at any time by contacting us. Where applicable, you may also have the right to data portability and to withdraw consent.
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "var(--primary)", marginBottom: 8 }}>7. CCPA: California Privacy Rights</h2>
              <p>If you are a California resident, you have the right to:</p>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li><strong>Know</strong> what personal information we collect and how it is used.</li>
                <li><strong>Delete</strong> your personal information (available in your profile settings or by contacting us).</li>
                <li><strong>Opt out</strong> of the sale of personal information. We do not sell your data.</li>
                <li><strong>Non-discrimination</strong> for exercising your privacy rights.</li>
              </ul>
              <p className="mt-2">
                To exercise any of these rights, use the account deletion feature in your profile or contact us at{" "}
                <a href="mailto:privacy@clarifer.com" style={{ color: "var(--primary)" }}>privacy@clarifer.com</a>.
                We respond within 45 days as required by the CCPA.
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "var(--primary)", marginBottom: 8 }}>8. GDPR: European Privacy Rights</h2>
              <p>If you are located in the European Economic Area (EEA) or United Kingdom, you have the following rights under the General Data Protection Regulation:</p>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal data (use the &quot;Download my data&quot; feature in your profile).</li>
                <li><strong>Rectification:</strong> Correct inaccurate personal data via your profile settings.</li>
                <li><strong>Erasure:</strong> Request deletion of your data (use the &quot;Delete my account&quot; feature in your profile).</li>
                <li><strong>Data portability:</strong> Export your data in a machine-readable format (JSON).</li>
                <li><strong>Restriction:</strong> Request that we limit processing of your data.</li>
                <li><strong>Objection:</strong> Object to processing of your data for specific purposes.</li>
              </ul>
              <p className="mt-2">
                <strong>Legal basis for processing:</strong> We process your data based on your consent (account creation) and legitimate interest (providing the Service). You may withdraw consent at any time by deleting your account.
              </p>
              <p className="mt-2">
                <strong>Data controller:</strong> Clarifer Corp, Los Angeles, CA. Contact:{" "}
                <a href="mailto:privacy@clarifer.com" style={{ color: "var(--primary)" }}>privacy@clarifer.com</a>.
                We respond to all GDPR requests within 30 days.
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "var(--primary)", marginBottom: 8 }}>9. Cookie Policy</h2>
              <p>
                Clarifer uses only essential cookies required for authentication and session management. We do not use tracking cookies, advertising cookies, or third-party analytics cookies. No consent is required for essential cookies under GDPR, but we inform you of their use via a banner on first visit.
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "var(--primary)", marginBottom: 8 }}>10. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:privacy@clarifer.com" style={{ color: "var(--primary)" }}>
                  privacy@clarifer.com
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 24px", backgroundColor: "var(--background)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>© 2026 Clarifer Corp. Los Angeles, CA.</span>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <a href="/privacy" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Privacy</a>
            <a href="/privacy-notice" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Notice of Privacy Practices</a>
            <a href="/terms" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Terms</a>
            <a href="/disclaimer" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Medical Disclaimer</a>
            <a href="/security" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
