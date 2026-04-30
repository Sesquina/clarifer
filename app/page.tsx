import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { CookieBanner } from "@/components/cookie-banner";

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

      {/* HERO */}
      <section
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
            <Image src="/clarifer-logo.png" alt="Clarifer" width={72} height={72} />
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
          <div
            className="flex flex-wrap justify-center"
            style={{ gap: 14 }}
          >
            <Link
              href="/download"
              className="inline-flex items-center justify-center"
              style={{
                height: 52,
                padding: "0 28px",
                borderRadius: 26,
                backgroundColor: "var(--primary)",
                color: "var(--white)",
                fontSize: 16,
                fontWeight: 600,
                ...BODY_FONT,
              }}
            >
              Download the App
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center"
              style={{
                height: 52,
                padding: "0 28px",
                borderRadius: 26,
                border: "1.5px solid var(--primary)",
                color: "var(--primary)",
                backgroundColor: "transparent",
                fontSize: 16,
                fontWeight: 600,
                ...BODY_FONT,
              }}
            >
              Sign In
            </Link>
          </div>
          <p
            className="text-center"
            style={{
              ...BODY_FONT,
              fontSize: 13,
              color: "var(--muted)",
              marginTop: 20,
            }}
          >
            Free for caregivers. HIPAA compliant. iOS, Android and Web.
          </p>
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
            From the first diagnosis to the daily routine of care.
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
                <div style={{ fontSize: 32, marginBottom: 16 }} aria-hidden="true">
                  {card.icon}
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
                title: "Cancer caregivers",
                body:
                  "AI document analysis, biomarker tracking, clinical trial finder with international coverage, and automatic alerts for critical drug interactions.",
              },
              {
                title: "Dementia and Alzheimer's caregivers",
                body:
                  "Condition-aware symptom logging, medication management, care coordination tools, and family updates for the long journey ahead.",
              },
              {
                title: "All conditions",
                body:
                  "Clarifer adapts to any diagnosis. Whatever your family is navigating, the tools work the same way. Organized, private, and free.",
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

      {/* CTA */}
      <section
        style={{
          backgroundColor: "var(--primary)",
          padding: "80px 24px",
          textAlign: "center",
          color: "var(--white)",
        }}
      >
        <h2
          style={{
            ...SECTION_HEADING,
            fontSize: 38,
            color: "var(--white)",
            marginBottom: 16,
            fontWeight: 700,
          }}
        >
          Start organizing care today
        </h2>
        <p
          style={{
            ...BODY_FONT,
            fontSize: 18,
            color: "rgba(255,255,255,0.75)",
            marginBottom: 36,
          }}
        >
          Free for caregivers. Available on iOS, Android, and web.
        </p>
        <div
          className="flex flex-wrap justify-center"
          style={{ gap: 16 }}
        >
          <Link
            href="/download"
            className="inline-flex items-center justify-center"
            style={{
              height: 52,
              padding: "0 28px",
              borderRadius: 26,
              backgroundColor: "var(--white)",
              color: "var(--primary)",
              fontSize: 16,
              fontWeight: 600,
              ...BODY_FONT,
            }}
          >
            Download on App Store
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center"
            style={{
              height: 52,
              padding: "0 28px",
              borderRadius: 26,
              backgroundColor: "var(--white)",
              color: "var(--primary)",
              fontSize: 16,
              fontWeight: 600,
              ...BODY_FONT,
            }}
          >
            Open Web App
          </Link>
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
              <Image src="/clarifer-logo.png" alt="Clarifer" width={24} height={24} />
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
                { label: "Support", href: "/support" },
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
            © 2026 Clarifer Corp. All rights reserved. support@clarifer.com
          </p>
        </div>
      </footer>

      <CookieBanner />
    </div>
  );
}
