import Link from "next/link";

export const metadata = {
  title: "Medical Disclaimer -- Clarifer",
  description: "Clarifer is a care coordination tool, not a medical device. Read our full medical disclaimer.",
};

export default function DisclaimerPage() {
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

          <h1
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "clamp(32px, 5vw, 44px)",
              color: "var(--text)",
              marginTop: 48,
              lineHeight: 1.2,
            }}
          >
            Medical Disclaimer
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>Effective: April 22, 2026</p>

          <div style={{ marginTop: 40, fontSize: 16, color: "var(--text)", lineHeight: 1.75 }}>
            <div style={{ marginBottom: 32 }}>
              <p>
                Clarifer is a care coordination tool, not a medical device. It does not diagnose,
                prescribe, or replace professional medical advice, diagnosis, or treatment.
              </p>
            </div>

            <div style={{ marginBottom: 32 }}>
              <p>
                Always seek the advice of your physician or other qualified health provider with any
                questions you may have regarding a medical condition. Never disregard professional
                medical advice or delay in seeking it because of something you have read or seen on
                Clarifer.
              </p>
            </div>

            <div style={{ marginBottom: 32 }}>
              <p>
                If you think you may have a medical emergency, call your doctor, go to the emergency
                room, or call 911 immediately.
              </p>
            </div>

            <div style={{ marginBottom: 32 }}>
              <p>
                The AI features in Clarifer are designed to help families understand information and
                coordinate care. They are not a substitute for clinical judgment. Every AI response
                includes a recommendation to share information with your care team.
              </p>
            </div>

            <div
              style={{
                marginTop: 48,
                paddingTop: 32,
                borderTop: "1px solid var(--border)",
                fontSize: 15,
                color: "var(--muted)",
                lineHeight: 1.8,
              }}
            >
              <p>
                <strong style={{ color: "var(--text)" }}>Clarifer Corp</strong><br />
                Los Angeles, CA<br />
                clarifer.com<br />
                <a href="mailto:legal@clarifer.com" style={{ color: "var(--primary)" }}>
                  legal@clarifer.com
                </a><br />
                Incorporated in Delaware, April 22, 2026
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
            <a href="/terms" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Terms</a>
            <a href="/disclaimer" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Medical Disclaimer</a>
            <a href="/security" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
