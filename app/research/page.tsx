/**
 * app/research/page.tsx
 * Public CCF research partnership page for academic medical center and foundation partners.
 * Tables: None
 * Auth: Public
 * HIPAA: No PHI in this file. Public partnership page only.
 */

export const metadata = {
  title: "Research Partnership | Clarifer",
  description:
    "Clarifer captures longitudinal, caregiver-reported, consented data from family caregivers. Partner with Clarifer to access the caregiver dataset that clinical research has been missing.",
};

export default function ResearchPage() {
  return (
    <div
      style={{
        backgroundColor: "var(--background)",
        minHeight: "100vh",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      }}
    >
      {/* SECTION 1: Hero */}
      <section
        style={{
          backgroundColor: "var(--primary)",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h1
            style={{
              fontFamily: "var(--font-playfair), 'Playfair Display', serif",
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 700,
              color: "var(--primary-foreground)",
              lineHeight: 1.25,
              marginBottom: 20,
            }}
          >
            The caregiver dataset that clinical research has been missing.
          </h1>
          <p
            style={{
              fontSize: "clamp(16px, 2.5vw, 20px)",
              color: "var(--primary-foreground)",
              opacity: 0.9,
              lineHeight: 1.6,
              maxWidth: 600,
              margin: "0 auto 40px",
            }}
          >
            Clarifer captures what happens between hospital visits.
            Longitudinal, caregiver-reported, consented.
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                color: "var(--primary-foreground)",
                padding: "10px 20px",
                borderRadius: 26,
                fontSize: 14,
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              70M+ family caregivers in the US
            </span>
            <span
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                color: "var(--primary-foreground)",
                padding: "10px 20px",
                borderRadius: 26,
                fontSize: 14,
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              Built for the CCA community first
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: The problem */}
      <section
        style={{
          backgroundColor: "var(--background)",
          padding: "72px 24px",
        }}
      >
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-playfair), 'Playfair Display', serif",
              fontSize: "clamp(24px, 4vw, 34px)",
              fontWeight: 700,
              color: "var(--text)",
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            What clinical research cannot see
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            <div
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border, #E8E2D9)",
                borderRadius: 14,
                padding: "24px 28px",
                borderTop: "4px solid var(--accent)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 12,
                }}
              >
                The post-discharge gap
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--muted, #4A4A4A)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                70% of adverse events happen at home, after discharge. EHR
                systems go dark the moment the patient leaves.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border, #E8E2D9)",
                borderRadius: 14,
                padding: "24px 28px",
                borderTop: "4px solid var(--accent)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 12,
                }}
              >
                Caregiver-reported outcomes
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--muted, #4A4A4A)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                Caregivers observe daily: medication adherence, symptom
                patterns, functional decline. None of it enters the medical
                record.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border, #E8E2D9)",
                borderRadius: 14,
                padding: "24px 28px",
                borderTop: "4px solid var(--accent)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 12,
                }}
              >
                The missing dataset
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--muted, #4A4A4A)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                No longitudinal, consented, caregiver-reported dataset exists at
                scale. Clarifer is building it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: What Clarifer captures */}
      <section
        style={{
          backgroundColor: "var(--pale-sage)",
          padding: "72px 24px",
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-playfair), 'Playfair Display', serif",
              fontSize: "clamp(24px, 4vw, 34px)",
              fontWeight: 700,
              color: "var(--text)",
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            What we collect, with consent
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {(
              [
                {
                  title: "Symptom logs",
                  body: "Severity, frequency, and functional impact",
                },
                {
                  title: "Medication adherence",
                  body: "Taken, missed, and timing",
                },
                {
                  title: "Document uploads",
                  body: "Lab reports, imaging, and clinical notes",
                },
                {
                  title: "Care team interactions",
                  body: "Questions asked and information gaps",
                },
                {
                  title: "Trial interest and eligibility",
                  body: "Which trials, which barriers",
                },
                {
                  title: "Caregiver burden indicators",
                  body: "Time, stress, and coordination load",
                },
              ] as const
            ).map((item) => (
              <div
                key={item.title}
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border, #E8E2D9)",
                  borderRadius: 14,
                  padding: "20px 24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <h3
                  style={{
                    fontFamily:
                      "var(--font-playfair), 'Playfair Display', serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--primary)",
                    marginBottom: 8,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--muted, #4A4A4A)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: Research partnership model */}
      <section
        style={{
          backgroundColor: "var(--background)",
          padding: "72px 24px",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-playfair), 'Playfair Display', serif",
              fontSize: "clamp(24px, 4vw, 34px)",
              fontWeight: 700,
              color: "var(--text)",
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            How research access works
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {(
              [
                {
                  step: "1",
                  title: "Caregiver consent",
                  body: "Caregivers opt in to anonymized data sharing. They see exactly what is shared. They can withdraw anytime.",
                },
                {
                  step: "2",
                  title: "Anonymized dataset",
                  body: "All identifiers removed. Data structured for research use. IRB-compatible data sharing agreements.",
                },
                {
                  step: "3",
                  title: "Revenue returns to caregivers",
                  body: "Minimum 5% of research licensing revenue flows directly to the Caregiver Support Fund.",
                },
              ] as const
            ).map((item) => (
              <div
                key={item.step}
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border, #E8E2D9)",
                  borderRadius: 14,
                  padding: "24px 28px",
                  display: "flex",
                  gap: 20,
                  alignItems: "flex-start",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {item.step}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily:
                        "var(--font-playfair), 'Playfair Display', serif",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "var(--text)",
                      marginBottom: 8,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 15,
                      color: "var(--muted, #4A4A4A)",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: CCF specific */}
      <section
        style={{
          backgroundColor: "var(--pale-terra)",
          padding: "72px 24px",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "var(--font-playfair), 'Playfair Display', serif",
              fontSize: "clamp(24px, 4vw, 34px)",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 24,
            }}
          >
            Built with the CCA community
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "var(--text)",
              lineHeight: 1.75,
              marginBottom: 32,
            }}
          >
            Clarifer&apos;s founding use case is cholangiocarcinoma caregivers.
            The platform was built by a founder who was a CCA caregiver. The CCF
            community is not a pilot. It is the foundation.
          </p>
          <div
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border, #E8E2D9)",
              borderRadius: 14,
              padding: "24px 32px",
              borderLeft: "4px solid var(--accent)",
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontSize: 15,
                color: "var(--muted, #4A4A4A)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              The CCF partnership gives Clarifer access to one of the most
              engaged, medically sophisticated caregiver communities in rare
              cancer.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: CTA */}
      <section
        style={{
          backgroundColor: "var(--primary)",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-playfair), 'Playfair Display', serif",
              fontSize: "clamp(24px, 4vw, 34px)",
              fontWeight: 700,
              color: "var(--primary-foreground)",
              marginBottom: 20,
            }}
          >
            Partner with Clarifer on research
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "var(--primary-foreground)",
              opacity: 0.9,
              lineHeight: 1.65,
              maxWidth: 520,
              margin: "0 auto 36px",
            }}
          >
            We are seeking academic medical center and foundation research
            partners. First research licensing deals are priced to establish the
            model, not to maximize revenue.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <a
              href="mailto:samira.esquina@clarifer.com"
              style={{
                color: "var(--primary-foreground)",
                fontSize: 16,
                fontWeight: 600,
                textDecoration: "underline",
                opacity: 0.95,
              }}
            >
              samira.esquina@clarifer.com
            </a>
            <a
              href="https://clarifer.com"
              style={{
                color: "var(--primary-foreground)",
                fontSize: 15,
                textDecoration: "underline",
                opacity: 0.85,
              }}
            >
              clarifer.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
