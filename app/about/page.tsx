import Link from "next/link";

export const metadata = {
  title: "About – Clarifer",
  description: "The story behind Clarifer — built by a caregiver, for caregivers.",
};

const AnchorIcon = ({ size = 48, color = "#2C5F4A" }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" width={size} height={size}>
    <circle cx="12" cy="5" r="3" />
    <line x1="12" y1="8" x2="12" y2="22" />
    <path d="M5 15l7 7 7-7" />
    <path d="M5 12h4M15 12h4" />
  </svg>
);

export default function AboutPage() {
  return (
    <div style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", color: "#1A1A1A" }}>
      <main style={{ backgroundColor: "#FAF7F2", minHeight: "100vh" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px 60px" }}>
          <Link
            href="/"
            style={{ fontSize: 14, color: "#2C5F4A", textDecoration: "underline" }}
          >
            &larr; Back to home
          </Link>

          <p
            style={{
              fontSize: 13,
              color: "#6B6B6B",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 48,
            }}
          >
            Our story
          </p>

          <h1
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "clamp(32px, 5vw, 44px)",
              color: "#1A1A1A",
              marginTop: 12,
              lineHeight: 1.2,
            }}
          >
            My father had cholangiocarcinoma.
          </h1>

          <div
            style={{
              marginTop: 32,
              fontSize: 17,
              color: "#1A1A1A",
              lineHeight: 1.85,
            }}
          >
            <p>
              In 2024 my father was diagnosed with bile duct cancer. For the next year I was his
              caregiver, his advocate, and the person trying to make sense of a system that was not
              built for families like ours.
            </p>
            <p style={{ marginTop: 20 }}>
              I am a software developer. So I built something.
            </p>
            <p style={{ marginTop: 20 }}>
              I built it while sitting in waiting rooms. While trying to understand lab results at
              midnight. While figuring out how to explain what was happening to twenty family members
              across two languages.
            </p>
            <p style={{ marginTop: 20 }}>
              It was the only thing that helped me feel less lost.
            </p>
            <p style={{ marginTop: 20 }}>
              He passed in October 2025.
            </p>
            <p style={{ marginTop: 20 }}>
              I finished building Clarifer after he was gone, because I knew other families were
              sitting where I sat. I wanted to give them something I wished I had.
            </p>
            <p style={{ marginTop: 20 }}>
              Clarifer is free. It is not a medical provider. It will not replace your doctor. But it
              will help you understand what your doctor is telling you, track what is happening, find
              clinical trials, and keep the people who love your family informed.
            </p>
            <p style={{ marginTop: 20 }}>
              It was built by a caregiver, for caregivers and patients. That is all it has ever been.
            </p>
            <p style={{ marginTop: 32 }}>
              My name is <strong>Samira Esquina</strong>. I am the founder of Clarifer and Cassini
              Design Group LLC. If you have questions, feedback, or just need to talk to someone who
              gets it, you can reach me at{" "}
              <a href="mailto:samira@cassinidesigngroup.com" style={{ color: "#2C5F4A", textDecoration: "underline" }}>
                samira@cassinidesigngroup.com
              </a>.
            </p>
            <p style={{ marginTop: 8 }}>I read every message.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#1A1A1A",
          padding: "40px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <AnchorIcon size={24} color="#FFFFFF" />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Clarifer by Cassini Design Group
          </span>
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
