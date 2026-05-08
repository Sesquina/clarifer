/**
 * app/data/page.tsx
 * Public data transparency page explaining how Clarifer collects, stores, and uses data.
 * Tables: none (static content, no Supabase access).
 * Auth: public route -- no authentication required.
 * Sprint: fix/mission-and-trust
 * HIPAA: No PHI in this file. Static informational page only.
 */
import Link from "next/link";

export const metadata = {
  title: "How Your Data Works -- Clarifer",
  description:
    "How Clarifer collects, stores, and uses your data. Plain language. No fine print.",
};

const BODY_FONT: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
};

const HEADING_FONT: React.CSSProperties = {
  fontFamily: "var(--font-playfair), serif",
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h2
        style={{
          ...HEADING_FONT,
          fontSize: 22,
          fontWeight: 600,
          color: "var(--primary)",
          marginBottom: 16,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          ...BODY_FONT,
          fontSize: 16,
          color: "var(--text)",
          lineHeight: 1.8,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function DataPage() {
  return (
    <div style={{ ...BODY_FONT, color: "var(--text)" }}>
      <main
        style={{
          backgroundColor: "var(--background)",
          minHeight: "100vh",
          padding: "80px 24px 60px",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Link
            href="/"
            style={{
              ...BODY_FONT,
              fontSize: 14,
              color: "var(--primary)",
              textDecoration: "underline",
            }}
          >
            &larr; Back to home
          </Link>

          <h1
            style={{
              ...HEADING_FONT,
              fontSize: "clamp(32px, 5vw, 44px)",
              color: "var(--text)",
              marginTop: 48,
              marginBottom: 8,
              lineHeight: 1.2,
              fontWeight: 700,
            }}
          >
            How your data works
          </h1>
          <p
            style={{
              ...BODY_FONT,
              fontSize: 18,
              color: "var(--muted)",
              marginBottom: 56,
              lineHeight: 1.6,
            }}
          >
            Plain language. No fine print.
          </p>

          <Section title="What we collect and why">
            <p style={{ marginBottom: 16 }}>
              When you use Clarifer, we store the information you give us: documents you
              upload, symptoms you log, appointments you track, and messages you send to
              the AI. We store this so the platform works and so your history is available
              when you need it.
            </p>
            <p style={{ marginBottom: 16 }}>
              We do not sell this data. We do not share it with advertisers. We do not use
              it to target you with anything.
            </p>
            <p>
              All data is encrypted at rest and in transit. Every access to your
              information is logged. You can request a complete export or deletion of your
              data at any time by emailing{" "}
              <a
                href="mailto:privacy@clarifer.com"
                style={{ color: "var(--primary)", textDecoration: "underline" }}
              >
                privacy@clarifer.com
              </a>
              .
            </p>
          </Section>

          <Section title="Research data: opt in only">
            <p style={{ marginBottom: 16 }}>
              Clarifer has a research data program. It is entirely optional. If you choose
              to participate, your data is anonymized before it is ever shared with any
              research partner.
            </p>
            <p
              style={{
                ...BODY_FONT,
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              What anonymized means in practice:
            </p>
            <ul
              style={{
                paddingLeft: 20,
                marginBottom: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <li>
                Your name, date of birth, and any identifying information is removed.
              </li>
              <li>Data is aggregated with other participants.</li>
              <li>No research partner ever sees individual records.</li>
              <li>
                A minimum of 5 participants must contribute data on any given topic before
                it is included in a research dataset.
              </li>
            </ul>
            <p>
              You can opt in or out at any time. Opting out removes your data from future
              research datasets immediately.
            </p>
          </Section>

          <Section title="The Caregiver Support Fund">
            <p style={{ marginBottom: 16 }}>
              If you opt into the research program, you become eligible for the Caregiver
              Support Fund.
            </p>
            <p style={{ marginBottom: 16 }}>
              The Fund receives a minimum of 5 percent of all revenue Clarifer generates
              from research data licensing. The Fund is used exclusively for caregiving
              families: transportation to appointments, respite care, medication costs, and
              direct financial assistance.
            </p>
            <p style={{ marginBottom: 16 }}>
              The Fund is governed by a Caregiver Advisory Committee drawn from Clarifer
              users, not Clarifer employees. Applications are reviewed by that committee.
              Clarifer&apos;s administrative costs for running the Fund are capped at 10
              percent. Annual reports are published publicly.
            </p>
            <p>
              We designed this because consent without benefit is just a legal checkbox.
              If your data helps researchers understand cancer better, you should benefit
              from that.
            </p>
          </Section>

          <Section title="HIPAA and security">
            <p style={{ marginBottom: 16 }}>
              Clarifer is built HIPAA-aware from day one. Every data access event is
              logged with who accessed what and when. All health information is encrypted.
              Role-based access controls mean only authorized people see patient data.
            </p>
            <p style={{ marginBottom: 16 }}>
              We execute Business Associate Agreements with our infrastructure partners
              before any real patient health information enters the system. The demo
              environment uses fictional data.
            </p>
            <p>
              If you have security questions, contact{" "}
              <a
                href="mailto:team@clarifer.com"
                style={{ color: "var(--primary)", textDecoration: "underline" }}
              >
                team@clarifer.com
              </a>
              .
            </p>
          </Section>

          <Section title="Questions">
            <p style={{ marginBottom: 16 }}>
              We believe you should be able to understand exactly how your information is
              used without reading a 40-page privacy policy.
            </p>
            <p>
              If something on this page is unclear, email{" "}
              <a
                href="mailto:privacy@clarifer.com"
                style={{ color: "var(--primary)", textDecoration: "underline" }}
              >
                privacy@clarifer.com
              </a>{" "}
              and we will answer in plain language.
            </p>
          </Section>

          <div
            style={{
              marginTop: 48,
              paddingTop: 32,
              borderTop: "1px solid var(--border)",
              ...BODY_FONT,
              fontSize: 15,
              color: "var(--muted)",
              lineHeight: 1.8,
            }}
          >
            <p>
              <strong style={{ color: "var(--text)" }}>Clarifer Corp</strong>
              <br />
              Los Angeles, CA
              <br />
              <a
                href="mailto:privacy@clarifer.com"
                style={{ color: "var(--primary)", textDecoration: "underline" }}
              >
                privacy@clarifer.com
              </a>
              <br />
              <a
                href="mailto:legal@clarifer.com"
                style={{ color: "var(--primary)", textDecoration: "underline" }}
              >
                legal@clarifer.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "32px 24px",
          backgroundColor: "var(--background)",
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <span style={{ ...BODY_FONT, fontSize: 13, color: "var(--muted)" }}>
            &copy; 2026 Clarifer Corp. Los Angeles, CA.
          </span>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Medical Disclaimer", href: "/disclaimer" },
              { label: "Security", href: "/security" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  ...BODY_FONT,
                  fontSize: 13,
                  color: "var(--muted)",
                  textDecoration: "underline",
                }}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
