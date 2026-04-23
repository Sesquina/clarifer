import Link from "next/link";

export const metadata = {
  title: "Privacy Policy – Clarifer",
  description: "Clarifer privacy policy — how we collect, use, and protect your data.",
};

const AnchorIcon = ({ size = 48, color = "#2C5F4A" }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" width={size} height={size}>
    <circle cx="12" cy="5" r="3" />
    <line x1="12" y1="8" x2="12" y2="22" />
    <path d="M5 15l7 7 7-7" />
    <path d="M5 12h4M15 12h4" />
  </svg>
);

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", color: "#1A1A1A" }}>
    <main style={{ backgroundColor: "#FAF7F2", minHeight: "100vh", padding: "80px 24px 60px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link
          href="/"
          style={{ fontSize: 14, color: "#2C5F4A", textDecoration: "underline" }}
        >
          &larr; Back to home
        </Link>

        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(32px, 5vw, 44px)", color: "#1A1A1A", marginTop: 48, lineHeight: 1.2 }}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: "#6B6B6B", marginTop: 8 }}>Last updated: March 28, 2026</p>

        <div className="space-y-6 leading-relaxed" style={{ marginTop: 32, color: "#1A1A1A", fontSize: 16, lineHeight: 1.75 }}>
          <section>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "#2C5F4A", marginBottom: 8 }}>1. Introduction</h2>
            <p>
              Clarifer (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is operated by Cassini Design Group. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application and related services (collectively, the &quot;Service&quot;).
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "#2C5F4A", marginBottom: 8 }}>2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li><strong>Account Information:</strong> name, email address, and authentication credentials.</li>
              <li><strong>Health Information:</strong> symptoms, medications, vitals, and other health data you choose to enter.</li>
              <li><strong>Usage Data:</strong> how you interact with the Service, including pages viewed and features used.</li>
              <li><strong>Device Information:</strong> browser type, operating system, and device identifiers.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "#2C5F4A", marginBottom: 8 }}>3. How We Use Your Information</h2>
            <ul className="ml-6 list-disc space-y-1">
              <li>To provide, maintain, and improve the Service.</li>
              <li>To personalize your experience and deliver AI-powered health insights.</li>
              <li>To communicate with you about updates, support, and service-related notices.</li>
              <li>To ensure the security and integrity of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "#2C5F4A", marginBottom: 8 }}>4. Data Sharing &amp; Disclosure</h2>
            <p>
              We do not sell your personal information. We may share data with trusted service providers who assist in operating the Service, or when required by law. All third-party providers are bound by confidentiality obligations.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "#2C5F4A", marginBottom: 8 }}>5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information, including encryption in transit and at rest. However, no method of electronic transmission or storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "#2C5F4A", marginBottom: 8 }}>6. Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data at any time by contacting us. Where applicable, you may also have the right to data portability and to withdraw consent.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "#2C5F4A", marginBottom: 8 }}>7. CCPA — California Privacy Rights</h2>
            <p>If you are a California resident, you have the right to:</p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li><strong>Know</strong> what personal information we collect and how it is used.</li>
              <li><strong>Delete</strong> your personal information (available in your profile settings or by contacting us).</li>
              <li><strong>Opt out</strong> of the sale of personal information. We do not sell your data.</li>
              <li><strong>Non-discrimination</strong> for exercising your privacy rights.</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, use the account deletion feature in your profile or contact us at{" "}
              <a href="mailto:samira@cassinidesigngroup.com" className="text-[#2C5F4A] hover:underline">samira@cassinidesigngroup.com</a>.
              We respond within 45 days as required by the CCPA.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "#2C5F4A", marginBottom: 8 }}>8. GDPR — European Privacy Rights</h2>
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
              <strong>Data controller:</strong> Cassini Design Group LLC, contact:{" "}
              <a href="mailto:samira@cassinidesigngroup.com" className="text-[#2C5F4A] hover:underline">samira@cassinidesigngroup.com</a>.
              We respond to all GDPR requests within 30 days.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "#2C5F4A", marginBottom: 8 }}>9. Cookie Policy</h2>
            <p>
              Clarifer uses only essential cookies required for authentication and session management. We do not use tracking cookies, advertising cookies, or third-party analytics cookies. No consent is required for essential cookies under GDPR, but we inform you of their use via a banner on first visit.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "#2C5F4A", marginBottom: 8 }}>10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:samira@cassinidesigngroup.com" className="text-[#2C5F4A] hover:underline">
                samira@cassinidesigngroup.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>

    {/* Footer */}
    <footer style={{ backgroundColor: "#1A1A1A", padding: "40px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <AnchorIcon size={24} color="#FFFFFF" />
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Clarifer by Cassini Design Group</span>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <a href="/about" style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", textDecoration: "underline" }}>About</a>
        <a href="/security" style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", textDecoration: "underline" }}>Security</a>
        <a href="/privacy" style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", textDecoration: "underline" }}>Privacy Policy</a>
        <a href="/terms" style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", textDecoration: "underline" }}>Terms</a>
      </div>
    </footer>
    </div>
  );
}
