import Link from "next/link";

export const metadata = {
  title: "Terms of Service – Clarifer",
  description: "Clarifer terms of service — rules and guidelines for using our platform.",
};

const AnchorIcon = ({ size = 48, color = "#2C5F4A" }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" width={size} height={size}>
    <circle cx="12" cy="5" r="3" />
    <line x1="12" y1="8" x2="12" y2="22" />
    <path d="M5 15l7 7 7-7" />
    <path d="M5 12h4M15 12h4" />
  </svg>
);

const sections = [
  {
    heading: "1. Acceptance of Terms",
    body: 'By accessing or using Clarifer (the "Service"), operated by Cassini Design Group, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.',
  },
  {
    heading: "2. Description of Service",
    body: "Clarifer is an AI-powered health companion designed to help users manage chronic conditions. The Service provides tools for symptom tracking, medication management, health logging, and AI-generated insights.",
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
    body: "All content, features, and functionality of the Service are owned by Cassini Design Group and are protected by copyright, trademark, and other intellectual property laws.",
  },
  {
    heading: "7. Limitation of Liability",
    body: "To the fullest extent permitted by law, Cassini Design Group shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.",
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
    <div style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", color: "#1A1A1A" }}>
      <main style={{ backgroundColor: "#FAF7F2", minHeight: "100vh", padding: "80px 24px 60px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Link
            href="/"
            style={{ fontSize: 14, color: "#2C5F4A", textDecoration: "underline" }}
          >
            &larr; Back to home
          </Link>

          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(32px, 5vw, 44px)", color: "#1A1A1A", marginTop: 48, lineHeight: 1.2 }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 14, color: "#6B6B6B", marginTop: 8 }}>Last updated: March 28, 2026</p>

          <div style={{ marginTop: 40 }}>
            {sections.map((section) => (
              <div key={section.heading} style={{ marginBottom: 32 }}>
                <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "#2C5F4A", marginBottom: 8 }}>
                  {section.heading}
                </h2>
                {section.body && (
                  <p style={{ fontSize: 16, color: "#1A1A1A", lineHeight: 1.75, fontWeight: section.bold ? 600 : 400 }}>
                    {section.body}
                  </p>
                )}
                {section.preface && (
                  <p style={{ fontSize: 16, color: "#1A1A1A", lineHeight: 1.75 }}>{section.preface}</p>
                )}
                {section.items && (
                  <ul style={{ marginLeft: 24, marginTop: 8, listStyleType: "disc" }}>
                    {section.items.map((item) => (
                      <li key={item} style={{ fontSize: 16, color: "#1A1A1A", lineHeight: 1.75, marginBottom: 4 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, color: "#2C5F4A", marginBottom: 8 }}>
                10. Contact Us
              </h2>
              <p style={{ fontSize: 16, color: "#1A1A1A", lineHeight: 1.75 }}>
                Questions about these Terms? Contact us at{" "}
                <a href="mailto:samira@cassinidesigngroup.com" style={{ color: "#2C5F4A", textDecoration: "underline" }}>
                  samira@cassinidesigngroup.com
                </a>.
              </p>
            </div>
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
