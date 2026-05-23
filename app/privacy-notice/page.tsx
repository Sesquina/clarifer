import Link from "next/link";

export const metadata = {
  title: "Notice of Privacy Practices -- Clarifer",
  description: "Clarifer Notice of Privacy Practices: how we handle your health information under HIPAA.",
};

const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};

const SECTION_HEAD: React.CSSProperties = {
  ...HEADING,
  fontSize: 20,
  color: "var(--primary)",
  fontWeight: 600,
  marginBottom: 10,
  marginTop: 0,
};

const BODY_TEXT: React.CSSProperties = {
  ...BODY,
  fontSize: 16,
  color: "var(--text)",
  lineHeight: 1.75,
  marginBottom: 0,
};

const ITEM: React.CSSProperties = {
  ...BODY,
  fontSize: 16,
  color: "var(--text)",
  lineHeight: 1.75,
  marginBottom: 6,
};

export default function PrivacyNoticePage() {
  return (
    <div style={{ ...BODY, color: "var(--text)", backgroundColor: "var(--background)", minHeight: "100vh" }}>
      <main style={{ backgroundColor: "var(--background)", padding: "80px 24px 60px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>

          <Link
            href="/"
            style={{ ...BODY, fontSize: 14, color: "var(--primary)", textDecoration: "underline" }}
          >
            &larr; Back to home
          </Link>

          <h1
            style={{
              ...HEADING,
              fontSize: "clamp(30px, 5vw, 42px)",
              color: "var(--text)",
              marginTop: 48,
              marginBottom: 8,
              lineHeight: 1.2,
              fontWeight: 700,
            }}
          >
            Notice of Privacy Practices
          </h1>
          <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", marginBottom: 32 }}>
            Effective date: May 22, 2026
          </p>

          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "var(--pale-sage)",
              borderRadius: 10,
              ...BODY,
              fontSize: 14,
              color: "var(--text)",
              lineHeight: 1.8,
              marginBottom: 40,
            }}
          >
            <strong>THIS NOTICE DESCRIBES HOW HEALTH INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.</strong>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>

            {/* Section 1 */}
            <section>
              <h2 style={SECTION_HEAD}>Who we are</h2>
              <p style={BODY_TEXT}>
                Clarifer Corp is a Delaware corporation and the operator of the Clarifer platform at clarifer.com. We provide care coordination tools for family caregivers and the people they care for.
              </p>
              <p style={{ ...BODY_TEXT, marginTop: 12 }}>
                Contact:{" "}
                <a href="mailto:samira.esquina@clarifer.com" style={{ color: "var(--primary)" }}>
                  samira.esquina@clarifer.com
                </a>
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 style={SECTION_HEAD}>What health information we collect</h2>
              <p style={{ ...BODY_TEXT, marginBottom: 12 }}>
                We collect and maintain health information that you provide to us in the course of using the platform. This includes:
              </p>
              <ul style={{ margin: "0 0 0 24px", padding: 0 }}>
                {[
                  "Documents you upload, including discharge summaries, lab results, and clinical notes",
                  "Medications, including names, dosages, and prescribing providers",
                  "Symptoms you log, including date, severity, and description",
                  "Appointments, including dates, providers, and locations",
                  "Care team information, including provider names, roles, and contact details",
                  "Information you provide about the person you are caring for, including name, date of birth, diagnosis, and medical history",
                ].map((item) => (
                  <li key={item} style={ITEM}>{item}</li>
                ))}
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 style={SECTION_HEAD}>How we use and share your information</h2>
              <p style={{ ...BODY_TEXT, marginBottom: 12 }}>
                We use your health information to provide the Clarifer platform, including:
              </p>
              <ul style={{ margin: "0 0 16px 24px", padding: 0 }}>
                {[
                  "To operate and maintain your account and care records",
                  "To coordinate care by making information accessible to the care team members you invite",
                  "To generate AI-assisted summaries and insights from the documents and information you provide",
                ].map((item) => (
                  <li key={item} style={ITEM}>{item}</li>
                ))}
              </ul>
              <p style={{ ...BODY_TEXT, marginBottom: 12 }}>
                We do not sell your information. We do not share your health information except as required to operate the service (for example, with our cloud infrastructure and AI processing providers under appropriate agreements) or as required by law.
              </p>
              <p style={BODY_TEXT}>
                Any third-party service providers who process your health information do so under written agreements that require them to protect the information and use it only for the purposes for which it was shared.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 style={SECTION_HEAD}>Your rights</h2>
              <p style={{ ...BODY_TEXT, marginBottom: 12 }}>
                You have the following rights with respect to your health information:
              </p>
              <ul style={{ margin: "0 0 0 24px", padding: 0 }}>
                {[
                  "Right to access your information -- you may request a copy of your health information at any time",
                  "Right to request correction -- if you believe your information is incorrect or incomplete, you may ask us to correct it",
                  "Right to request restriction of use -- you may ask us to limit how we use or share your information",
                  "Right to request an accounting of disclosures -- you may ask for a list of how your information has been shared",
                  "Right to receive a paper copy of this notice -- contact us at any time and we will provide one",
                  "Right to file a complaint -- see the section below for how to do this",
                ].map((item) => (
                  <li key={item} style={ITEM}>{item}</li>
                ))}
              </ul>
              <p style={{ ...BODY_TEXT, marginTop: 12 }}>
                To exercise any of these rights, contact us at{" "}
                <a href="mailto:samira.esquina@clarifer.com" style={{ color: "var(--primary)" }}>
                  samira.esquina@clarifer.com
                </a>.
                You may also use the account settings in the app to access, export, or delete your information.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 style={SECTION_HEAD}>Our responsibilities</h2>
              <p style={{ ...BODY_TEXT, marginBottom: 12 }}>
                We are required by law to:
              </p>
              <ul style={{ margin: "0 0 0 24px", padding: 0 }}>
                {[
                  "Maintain the privacy of your health information",
                  "Provide you with this notice describing our legal duties and privacy practices",
                  "Follow the terms of the notice currently in effect",
                  "Notify you if there is a breach of your unsecured health information",
                ].map((item) => (
                  <li key={item} style={ITEM}>{item}</li>
                ))}
              </ul>
              <p style={{ ...BODY_TEXT, marginTop: 12 }}>
                We reserve the right to change the terms of this notice. We will provide you with a revised notice before making any material changes. The current notice is always available at clarifer.com/privacy-notice.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 style={SECTION_HEAD}>How to file a complaint</h2>
              <p style={{ ...BODY_TEXT, marginBottom: 12 }}>
                If you believe your privacy rights have been violated, you may file a complaint with us or with the federal government. We will not retaliate against you for filing a complaint.
              </p>
              <p style={{ ...BODY_TEXT, marginBottom: 12 }}>
                To file a complaint with us, contact:{" "}
                <a href="mailto:samira.esquina@clarifer.com" style={{ color: "var(--primary)" }}>
                  samira.esquina@clarifer.com
                </a>
              </p>
              <p style={BODY_TEXT}>
                You may also file a complaint with the U.S. Department of Health and Human Services, Office for Civil Rights at{" "}
                <a
                  href="https://www.hhs.gov/ocr/privacy/hipaa/complaints"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--primary)" }}
                >
                  hhs.gov/ocr/privacy/hipaa/complaints
                </a>.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 style={SECTION_HEAD}>Effective date</h2>
              <p style={BODY_TEXT}>
                This Notice of Privacy Practices is effective May 22, 2026.
              </p>
            </section>

          </div>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 24px", backgroundColor: "var(--background)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ ...BODY, fontSize: 13, color: "var(--muted)" }}>© 2026 Clarifer Corp. Los Angeles, CA.</span>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <a href="/privacy" style={{ ...BODY, fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Privacy</a>
            <a href="/privacy-notice" style={{ ...BODY, fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Notice of Privacy Practices</a>
            <a href="/terms" style={{ ...BODY, fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Terms</a>
            <a href="/disclaimer" style={{ ...BODY, fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>Medical Disclaimer</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
