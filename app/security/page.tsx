import Link from "next/link";

export const metadata = {
  title: "Security -- Clarifer",
  description: "How Clarifer protects your data: encryption, access controls, and your rights.",
};

const sections = [
  {
    heading: "What we collect",
    body: "Your name, email address, and the medical information you choose to enter about the person you are caring for. We also collect uploaded documents such as lab results, discharge summaries, and imaging reports.",
  },
  {
    heading: "Where it lives",
    body: "All data is stored on Supabase, a secure cloud database platform. Data is encrypted at rest using AES-256 encryption and encrypted in transit using TLS. Your uploaded files are stored in a private storage bucket accessible only by your authenticated account.",
  },
  {
    heading: "Who can see it",
    body: "Only you. Supabase Row Level Security ensures that every query is restricted to your own data at the database level. No Clarifer employee can access your records without your explicit permission.",
  },
  {
    heading: "How AI processing works",
    body: "When you upload a document or send a message, the content is sent to Anthropic’s Claude API to generate a response. Anthropic does not use your data to train AI models. Your data is processed and discarded. Anthropic’s full data handling policy is available at anthropic.com/privacy.",
  },
  {
    heading: "What we will never do",
    body: "We will never sell your data. We will never share your data with advertisers. We will never use your medical information for any purpose other than providing the service to you.",
  },
  {
    heading: "Research opt-in",
    body: "Clarifer has an optional research program where anonymized, de-identified data can be shared with IRB-approved researchers. This is always opt-in, never automatic, and you can withdraw at any time.",
  },
  {
    heading: "Your rights",
    body: "You can export all your data at any time from the app. You can delete your account and all associated data permanently from your profile settings. We respond to all privacy requests within 30 days.",
  },
  {
    heading: "Disclaimer",
    body: "Clarifer is not a HIPAA covered entity. We apply security practices consistent with HIPAA standards but have not signed a Business Associate Agreement with our infrastructure providers. If you require formal HIPAA compliance please contact team@clarifer.com.",
  },
  {
    heading: "Questions",
    body: "Reach us at team@clarifer.com. We respond within 24 hours.",
  },
];

export default function SecurityPage() {
  return (
    <div style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", color: "var(--text)" }}>
      <main style={{ backgroundColor: "var(--background)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px 60px" }}>
          <Link
            href="/"
            style={{ fontSize: 14, color: "var(--primary)", textDecoration: "underline" }}
          >
            &larr; Back to home
          </Link>

          <p
            style={{
              fontSize: 13,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 48,
            }}
          >
            How we protect your data
          </p>

          <h1
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "clamp(32px, 5vw, 44px)",
              color: "var(--text)",
              marginTop: 12,
              lineHeight: 1.2,
            }}
          >
            Your data is yours.
          </h1>

          <div style={{ marginTop: 40 }}>
            {sections.map((section) => (
              <div key={section.heading} style={{ marginBottom: 32 }}>
                <h2
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontSize: 22,
                    color: "var(--primary)",
                    marginBottom: 8,
                  }}
                >
                  {section.heading}
                </h2>
                <p style={{ fontSize: 16, color: "var(--text)", lineHeight: 1.75 }}>
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 24px", backgroundColor: "var(--background)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>© 2026 Clarifer Corp. Los Angeles, CA.</span>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <a href="/privacy" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Privacy</a>
            <a href="/terms" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Terms</a>
            <a href="/disclaimer" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Medical Disclaimer</a>
            <a href="/security" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
