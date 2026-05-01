/**
 * app/ccf/page.tsx
 * Public co-branded landing page for the Cholangiocarcinoma Foundation partnership.
 * Tables: none (public, no auth required)
 * Auth: none
 * Sprint: sprint-ccf-3-foundation-dashboard
 * HIPAA: No PHI in this file. Public marketing page only.
 */

import Link from "next/link";

export const metadata = {
  title: "Clarifer for Cholangiocarcinoma Families",
  description:
    "Clarifer helps families navigating bile duct cancer understand what is happening, prepare for every appointment, and be the advocate their loved one needs.",
};

export default function CCFLandingPage() {
  return (
    <div
      style={{
        backgroundColor: "var(--background, #F7F2EA)",
        minHeight: "100vh",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      }}
    >
      {/* ── HEADER ── */}
      <header
        style={{
          backgroundColor: "var(--card, #FFFFFF)",
          borderBottom: "1px solid var(--border, #C8C2B9)",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/clarifer-logo.png"
            alt="Clarifer"
            width={40}
            height={40}
            style={{ objectFit: "contain" }}
          />
          <span
            style={{
              fontFamily: "var(--font-playfair), 'Playfair Display', serif",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--primary, #2C5F4A)",
            }}
          >
            Clarifer
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "var(--muted, #4A4A4A)",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            }}
          >
            In partnership with
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text, #1A1A1A)",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            }}
          >
            Cholangiocarcinoma Foundation
          </span>
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "64px 24px 48px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontSize: "clamp(28px, 5vw, 36px)",
            fontWeight: 700,
            color: "var(--text, #1A1A1A)",
            lineHeight: 1.3,
            marginBottom: 20,
          }}
        >
          For families navigating bile duct cancer
        </h1>

        <p
          style={{
            fontSize: 16,
            color: "var(--muted, #4A4A4A)",
            lineHeight: 1.6,
            marginBottom: 36,
            maxWidth: 560,
            margin: "0 auto 36px",
          }}
        >
          Clarifer helps you understand what is happening, prepare for every
          appointment, and be the advocate your loved one needs.
        </p>

        <Link
          href="/signup?condition=cholangiocarcinoma"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 52,
            padding: "0 32px",
            borderRadius: 26,
            backgroundColor: "var(--primary, #2C5F4A)",
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            minWidth: 240,
          }}
        >
          Create your free account
        </Link>
      </section>

      {/* ── FOUNDING NOTE ── */}
      <section
        style={{
          maxWidth: 680,
          margin: "0 auto 64px",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--card, #FFFFFF)",
            border: "1px solid var(--border, #C8C2B9)",
            borderRadius: 14,
            padding: "24px 28px",
            borderLeft: "4px solid var(--primary, #2C5F4A)",
          }}
        >
          <p
            style={{
              fontSize: 16,
              color: "var(--text, #1A1A1A)",
              lineHeight: 1.7,
              fontStyle: "italic",
              margin: 0,
            }}
          >
            Clarifer was built by a founder who cared for her father through
            cholangiocarcinoma. She had the documents, the medications, and no
            tool. She built one. This is for your family.
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--muted, #4A4A4A)",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            Samira Esquina, Founder
          </p>
        </div>
      </section>

      {/* ── VALUE PROPS ── */}
      <section
        style={{
          maxWidth: 1040,
          margin: "0 auto 80px",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              backgroundColor: "var(--card, #FFFFFF)",
              border: "1px solid var(--border, #C8C2B9)",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "var(--pale-sage, #D4EBD8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--primary, #2C5F4A)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <circle cx="11" cy="14" r="3" />
                <line x1="15" y1="18" x2="13.2" y2="16.2" />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-playfair), 'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text, #1A1A1A)",
                marginBottom: 10,
              }}
            >
              Understand your labs
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "var(--muted, #4A4A4A)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Upload a CA 19-9 result or liver panel and get a plain-language
              explanation of every value, what it means for bile duct cancer,
              and one question to bring to your oncologist.
            </p>
          </div>

          {/* Card 2 */}
          <div
            style={{
              backgroundColor: "var(--card, #FFFFFF)",
              border: "1px solid var(--border, #C8C2B9)",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "var(--pale-sage, #D4EBD8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--primary, #2C5F4A)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-playfair), 'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text, #1A1A1A)",
                marginBottom: 10,
              }}
            >
              Find clinical trials
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "var(--muted, #4A4A4A)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Search trials matched to your loved one's tumor location,
              biomarker status, and treatment history. One click sends an
              inquiry to the trial coordinator.
            </p>
          </div>

          {/* Card 3 */}
          <div
            style={{
              backgroundColor: "var(--card, #FFFFFF)",
              border: "1px solid var(--border, #C8C2B9)",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "var(--pale-sage, #D4EBD8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--primary, #2C5F4A)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-playfair), 'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text, #1A1A1A)",
                marginBottom: 10,
              }}
            >
              Never walk in unprepared
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "var(--muted, #4A4A4A)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Clarifer prepares specific questions for every oncology,
              palliative care, and hospice appointment based on what has changed
              since the last visit.
            </p>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section
        style={{
          backgroundColor: "var(--card, #FFFFFF)",
          borderTop: "1px solid var(--border, #C8C2B9)",
          padding: "56px 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontSize: "clamp(22px, 4vw, 28px)",
            fontWeight: 700,
            color: "var(--text, #1A1A1A)",
            marginBottom: 24,
          }}
        >
          Join the families using Clarifer
        </h2>

        <Link
          href="/signup?condition=cholangiocarcinoma"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 52,
            padding: "0 36px",
            borderRadius: 26,
            backgroundColor: "var(--primary, #2C5F4A)",
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            minWidth: 240,
          }}
        >
          Create your free account
        </Link>

        <p
          style={{
            marginTop: 16,
            fontSize: 14,
            color: "var(--muted, #4A4A4A)",
          }}
        >
          Free for caregivers and patients. Always.
        </p>
      </section>
    </div>
  );
}
