import Link from "next/link";

export const metadata = {
  title: "Terms of Service -- Clarifer",
  description: "Clarifer terms of service: rules and guidelines for using our platform.",
};

const sections = [
  {
    heading: "1. Acceptance of Terms",
    body: 'By accessing or using Clarifer (the "Service"), operated by Clarifer Corp, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.',
  },
  {
    heading: "2. Description of Service",
    body: "Clarifer is an AI-powered care coordination platform designed to help families manage and coordinate care for their loved ones. The Service provides tools for symptom tracking, medication management, health logging, document analysis, and AI-generated insights.",
  },
  {
    heading: "3. Medical Disclaimer",
    body: "Clarifer is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions regarding a medical condition. Never disregard professional medical advice or delay seeking it because of information provided by the Service.",
    bold: true,
  },
  {
    heading: "4. User Accounts",
    items: [
      "You are responsible for maintaining the confidentiality of your account credentials.",
      "You must provide accurate and complete information when creating an account.",
      "You are responsible for all activity that occurs under your account.",
    ],
  },
  {
    heading: "5. Acceptable Use",
    preface: "You agree not to:",
    items: [
      "Use the Service for any unlawful purpose.",
      "Attempt to gain unauthorized access to any part of the Service.",
      "Interfere with or disrupt the Service or its infrastructure.",
      "Upload malicious code or content.",
    ],
  },
  {
    heading: "6. Intellectual Property",
    body: "All content, features, and functionality of the Service are owned by Clarifer Corp and are protected by copyright, trademark, and other intellectual property laws.",
  },
  {
    heading: "7. Limitation of Liability",
    body: "To the fullest extent permitted by law, Clarifer Corp shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.",
  },
  {
    heading: "8. Termination",
    body: "We reserve the right to suspend or terminate your access to the Service at any time, with or without cause or notice.",
  },
  {
    heading: "9. Changes to These Terms",
    body: "We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the revised Terms.",
  },
];

export default function TermsPage() {
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
            Terms of Service
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

          <div style={{ marginTop: 40 }}>
            {sections.map((section) => (
              <div key={section.heading} style={{ marginBottom: 32 }}>
                <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "var(--primary)", marginBottom: 8 }}>
                  {section.heading}
                </h2>
                {section.body && (
                  <p style={{ fontSize: 16, color: "var(--text)", lineHeight: 1.75, fontWeight: section.bold ? 600 : 400 }}>
                    {section.body}
                  </p>
                )}
                {section.preface && (
                  <p style={{ fontSize: 16, color: "var(--text)", lineHeight: 1.75 }}>{section.preface}</p>
                )}
                {section.items && (
                  <ul style={{ marginLeft: 24, marginTop: 8, listStyleType: "disc" }}>
                    {section.items.map((item) => (
                      <li key={item} style={{ fontSize: 16, color: "var(--text)", lineHeight: 1.75, marginBottom: 4 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "var(--primary)", marginBottom: 8 }}>
                10. Contact Us
              </h2>
              <p style={{ fontSize: 16, color: "var(--text)", lineHeight: 1.75 }}>
                Questions about these Terms? Contact us at{" "}
                <a href="mailto:legal@clarifer.com" style={{ color: "var(--primary)", textDecoration: "underline" }}>
                  legal@clarifer.com
                </a>.
              </p>
            </div>
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
