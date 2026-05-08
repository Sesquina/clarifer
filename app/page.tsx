import Link from "next/link";
import { Header } from "@/components/layout/header";
import { CookieBanner } from "@/components/cookie-banner";
import { WaitlistForm } from "@/components/waitlist-form";

export const metadata = {
  title: "Clarifer. Care coordination for caregivers.",
  description:
    "Clarifer helps caregivers coordinate medical care, understand documents, track symptoms, and keep family informed.",
};

const SECTION_HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

const BODY_FONT: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "var(--background)", color: "var(--text)", ...BODY_FONT }}>
      <Header />

      {/* HERO + WAITLIST */}
      <section
        id="waitlist"
        className="flex flex-col items-center justify-center text-center"
        style={{
          backgroundColor: "var(--background)",
          minHeight: "90vh",
          padding: "40px 24px",
        }}
      >
        <div
          className="flex flex-col items-center"
          style={{ maxWidth: 720, margin: "0 auto" }}
        >
          <div style={{ marginBottom: 28 }}>
            <img src="/clarifer-logo.png" alt="Clarifer" width={48} height={48} style={{ objectFit: "contain" }} />
          </div>
          <h1
            className="text-[36px] md:text-[52px] text-center"
            style={{
              ...SECTION_HEADING,
              color: "var(--primary)",
              marginBottom: 20,
              lineHeight: 1.15,
              fontWeight: 700,
            }}
          >
            Care is hard enough.
            <br />
            We will help you organize it.
          </h1>
          <p
            className="text-center"
            style={{
              ...BODY_FONT,
              fontSize: 19,
              color: "var(--muted)",
              maxWidth: 540,
              margin: "0 auto 36px",
              lineHeight: 1.6,
            }}
          >
            Clarifer helps caregivers coordinate medical care, understand
            documents, track symptoms, and keep family informed. All in one
            place.
          </p>
          <WaitlistForm />
        </div>
      </section>

      {/* MISSION */}
      <section
        id="mission"
        style={{ backgroundColor: "var(--pale-sage)", padding: "80px 24px" }}
      >
        <div
          className="grid md:grid-cols-2"
          style={{ maxWidth: 900, margin: "0 auto", gap: 60 }}
        >
          <div>
            <h2
              style={{
                ...SECTION_HEADING,
                fontSize: 36,
                color: "var(--primary)",
                marginBottom: 16,
                fontWeight: 700,
              }}
            >
              Built for the hardest moments.
            </h2>
            <p
              style={{
                ...BODY_FONT,
                fontSize: 17,
                color: "var(--text)",
                lineHeight: 1.75,
                marginBottom: 16,
              }}
            >
              When someone you love is seriously ill, you become a coordinator,
              an advocate, an interpreter, and a communicator, all at once. Most
              caregivers do this with a folder of papers, a notes app, and
              sheer determination.
            </p>
            <p
              style={{
                ...BODY_FONT,
                fontSize: 17,
                color: "var(--muted)",
                lineHeight: 1.75,
              }}
            >
              Clarifer was built to change that. Not to replace the care you
              give, but to make the coordination easier so you can focus on
              what actually matters.
            </p>
          </div>
          <div className="flex flex-col" style={{ gap: 16 }}>
            {[
              {
                number: "70M+",
                color: "var(--primary)",
                label: "family caregivers in the United States alone",
              },
              {
                number: "45%",
                color: "var(--accent)",
                label: "increase in family caregivers over the last decade",
              },
              {
                number: "$0",
                color: "var(--primary)",
                label: "cost to caregivers. Free forever.",
              },
            ].map((stat) => (
              <div
                key={stat.number}
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "20px 24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    ...SECTION_HEADING,
                    fontSize: 40,
                    color: stat.color,
                    lineHeight: 1.1,
                    fontWeight: 700,
                  }}
                >
                  {stat.number}
                </div>
                <div
                  style={{
                    ...BODY_FONT,
                    fontSize: 14,
                    color: "var(--muted)",
                    marginTop: 6,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        style={{ backgroundColor: "var(--background)", padding: "80px 24px" }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2
            className="text-center"
            style={{
              ...SECTION_HEADING,
              fontSize: 38,
              marginBottom: 12,
              color: "var(--text)",
              fontWeight: 700,
            }}
          >
            Everything you need to coordinate care
          </h2>
          <p
            className="text-center"
            style={{
              ...BODY_FONT,
              fontSize: 17,
              color: "var(--muted)",
              maxWidth: 480,
              margin: "0 auto 48px",
            }}
          >
            From the first appointment to the daily routine of care.
          </p>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={{ gap: 20 }}
          >
            {[
              {
                icon: "📄",
                title: "AI Document Analysis",
                body:
                  "Upload any hospital document and receive a plain-language summary in seconds. Lab reports, discharge summaries, pathology reports, explained clearly.",
              },
              {
                icon: "📊",
                title: "Symptom Tracking",
                body:
                  "Log how your patient is feeling in under 60 seconds. View 30-day trend charts. Share directly with the care team.",
              },
              {
                icon: "🆘",
                title: "Emergency Information Card",
                body:
                  "One tap. Works offline. Diagnosis, medications, and care team contact, ready for any nurse at 2am.",
              },
              {
                icon: "🔬",
                title: "Clinical Trial Finder",
                body:
                  "Trials filtered for the specific diagnosis and location, explained in plain language. Includes international trials for Mexico and Panama.",
              },
              {
                icon: "💬",
                title: "Family Updates",
                body:
                  "Generate a clear care update in English or Spanish. Copy to WhatsApp in one tap. Keep everyone in the loop without the emotional labor.",
              },
              {
                icon: "💊",
                title: "Medications and Care Team",
                body:
                  "All providers, medications, and appointments organized in one place. Drug interactions flagged automatically.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="flex flex-col"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: "28px 24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    marginBottom: 16,
                    backgroundColor: "var(--pale-sage)",
                  }}
                  aria-hidden="true"
                >
                  <span style={{ fontSize: 24 }}>{card.icon}</span>
                </div>
                <h3
                  style={{
                    ...BODY_FONT,
                    fontSize: 17,
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: 8,
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    ...BODY_FONT,
                    fontSize: 15,
                    color: "var(--muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACL GRANT */}
      <section style={{ backgroundColor: "var(--background)", padding: "48px 24px 0" }}>
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            textAlign: "center",
            borderTop: "1px solid var(--border)",
            paddingTop: 48,
          }}
        >
          <p
            style={{
              ...BODY_FONT,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            Built with support from
          </p>
          <p
            style={{
              ...BODY_FONT,
              fontSize: 15,
              color: "var(--muted)",
              lineHeight: 1.7,
            }}
          >
            Clarifer has applied for the Administration for Community Living
            Caregiver AI Challenge grant to expand access to AI-powered caregiver
            support for families across the United States.
          </p>
        </div>
      </section>

      {/* COMMITMENT */}
      <section
        id="commitment"
        style={{ backgroundColor: "var(--pale-sage)", padding: "80px 24px" }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p
            style={{
              ...BODY_FONT,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            Our Mission
          </p>
          <h2
            className="text-[32px] md:text-[40px] text-center"
            style={{
              ...SECTION_HEADING,
              color: "var(--primary)",
              fontWeight: 700,
              lineHeight: 1.25,
              maxWidth: 680,
              margin: "0 auto 48px",
            }}
          >
            Care is hard enough.
            <br />
            The information that helps families navigate it should be free.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 20 }}>
            <div
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 28,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "var(--pale-sage)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
                aria-hidden="true"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <h3
                style={{
                  ...BODY_FONT,
                  fontSize: 17,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 10,
                }}
              >
                Free for caregivers. Always.
              </h3>
              <p
                style={{
                  ...BODY_FONT,
                  fontSize: 15,
                  color: "var(--muted)",
                  lineHeight: 1.7,
                }}
              >
                Clarifer is free for every family navigating a caregiving journey. It will
                never cost caregivers anything to use. We generate revenue through hospital
                licensing and research partnerships. Never from the people who need this most.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 28,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "var(--pale-sage)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
                aria-hidden="true"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3
                style={{
                  ...BODY_FONT,
                  fontSize: 17,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 10,
                }}
              >
                Your data belongs to you.
              </h3>
              <p
                style={{
                  ...BODY_FONT,
                  fontSize: 15,
                  color: "var(--muted)",
                  lineHeight: 1.7,
                }}
              >
                Everything you store in Clarifer is yours. We never sell individual data.
                You can export or delete your information at any time. Period.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 28,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "var(--pale-sage)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
                aria-hidden="true"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3
                style={{
                  ...BODY_FONT,
                  fontSize: 17,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 10,
                }}
              >
                The Caregiver Support Fund.
              </h3>
              <p
                style={{
                  ...BODY_FONT,
                  fontSize: 15,
                  color: "var(--muted)",
                  lineHeight: 1.7,
                }}
              >
                Families who choose to contribute anonymized data to medical research benefit
                directly. A minimum of 5% of all research licensing revenue goes into the
                Caregiver Support Fund, covering transportation costs, respite care, and
                direct assistance for caregiving families. Opt-in only. Governed by
                caregivers themselves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT IS FOR */}
      <section
        id="hospitals"
        style={{ backgroundColor: "var(--pale-terra)", padding: "80px 24px" }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2
            className="text-center"
            style={{
              ...SECTION_HEADING,
              fontSize: 38,
              marginBottom: 48,
              color: "var(--text)",
              fontWeight: 700,
            }}
          >
            Built for every caregiver
          </h2>
          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ gap: 20 }}
          >
            {[
              {
                title: "Families navigating cancer",
                body:
                  "Upload lab results and get plain-language explanations. Find clinical trials matched to your loved one's biomarker profile. Prepare for every oncology appointment with specific questions generated from what has changed since the last visit.",
              },
              {
                title: "Families navigating dementia and Alzheimer's",
                body:
                  "Track how your loved one is doing day by day. Coordinate medications, care team visits, and family communication. Build a shared record that every family member can see, no matter where they are.",
              },
              {
                title: "Every caregiving journey",
                body:
                  "Clarifer adapts to any diagnosis. The tools work the same way whether you are navigating a new diagnosis or years into the journey. Organized, private, and free. Always.",
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: "28px 24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <h3
                  style={{
                    ...BODY_FONT,
                    fontSize: 17,
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: 8,
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    ...BODY_FONT,
                    fontSize: 15,
                    color: "var(--muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section style={{ backgroundColor: "var(--background)", padding: "64px 24px" }}>
        <div
          className="grid md:grid-cols-2"
          style={{ maxWidth: 900, margin: "0 auto", gap: 48 }}
        >
          <div>
            <h3
              style={{
                ...SECTION_HEADING,
                fontSize: 26,
                color: "var(--primary)",
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              Free for caregivers. Always.
            </h3>
            <p
              style={{
                ...BODY_FONT,
                fontSize: 15,
                color: "var(--muted)",
                lineHeight: 1.7,
              }}
            >
              Clarifer&apos;s revenue comes from hospital licensing and research
              partnerships, not from the people who need this most. Caregivers
              will never pay for Clarifer.
            </p>
          </div>
          <div>
            <h3
              style={{
                ...SECTION_HEADING,
                fontSize: 26,
                color: "var(--primary)",
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              HIPAA compliant. Built for privacy.
            </h3>
            <p
              style={{
                ...BODY_FONT,
                fontSize: 15,
                color: "var(--muted)",
                lineHeight: 1.7,
              }}
            >
              All data is encrypted at rest and in transit. Every access to
              health information is logged. Your data belongs to you and your
              care team. No one else.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          backgroundColor: "var(--background)",
          borderTop: "1px solid var(--border)",
          padding: "40px 24px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            className="flex flex-wrap items-center"
            style={{ justifyContent: "space-between", gap: 16 }}
          >
            <Link
              href="/"
              className="flex items-center no-underline"
              style={{ gap: 10 }}
              aria-label="Clarifer home"
            >
              <img src="/clarifer-logo.png" alt="Clarifer" width={24} height={24} style={{ objectFit: "contain" }} />
              <span
                style={{
                  ...BODY_FONT,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--primary)",
                }}
              >
                Clarifer
              </span>
            </Link>
            <div
              className="flex flex-wrap"
              style={{ gap: 24 }}
            >
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
                { label: "Medical Disclaimer", href: "/disclaimer" },
                { label: "Support", href: "mailto:team@clarifer.com" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    ...BODY_FONT,
                    fontSize: 13,
                    color: "var(--muted)",
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <p
            className="text-center"
            style={{
              ...BODY_FONT,
              fontSize: 12,
              color: "var(--muted)",
              marginTop: 20,
              maxWidth: 720,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Clarifer is a care coordination tool, not a medical device. It does
            not diagnose, prescribe, or replace professional medical advice.
          </p>
          <p
            className="text-center"
            style={{
              ...BODY_FONT,
              fontSize: 12,
              color: "var(--muted)",
              marginTop: 8,
            }}
          >
            © 2026 Clarifer Corp. Los Angeles, CA. All rights reserved.
          </p>
        </div>
      </footer>

      <CookieBanner />
    </div>
  );
}
