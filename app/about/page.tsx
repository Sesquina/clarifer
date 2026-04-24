import { Header } from "@/components/layout/header";

export const metadata = {
  title: "About Clarifer",
  description:
    "Clarifer exists because coordinating care for someone you love should not be a second full-time job.",
};

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: "var(--background)", ...BODY }}>
      <Header />

      {/* HERO */}
      <section
        className="text-center"
        style={{ padding: "80px 24px", maxWidth: 700, margin: "0 auto" }}
      >
        <h1
          style={{
            ...HEADING,
            fontSize: 48,
            color: "var(--primary)",
            marginBottom: 16,
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          Built for the families who need it most
        </h1>
        <p
          style={{
            ...BODY,
            fontSize: 19,
            color: "var(--muted)",
            lineHeight: 1.7,
          }}
        >
          Clarifer exists because coordinating care for someone you love should
          not be a second full-time job.
        </p>
      </section>

      {/* MISSION */}
      <section
        style={{ backgroundColor: "var(--pale-sage)", padding: "80px 24px" }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2
            style={{
              ...HEADING,
              fontSize: 34,
              color: "var(--primary)",
              marginBottom: 24,
              fontWeight: 700,
            }}
          >
            Our mission
          </h2>
          <p
            style={{
              ...BODY,
              fontSize: 17,
              color: "var(--text)",
              lineHeight: 1.8,
              marginBottom: 16,
            }}
          >
            We believe every caregiver deserves tools that make the
            coordination of care easier, so they can spend their energy on what
            actually matters: the person they are caring for.
          </p>
          <p
            style={{
              ...BODY,
              fontSize: 17,
              color: "var(--muted)",
              lineHeight: 1.8,
            }}
          >
            Clarifer was built from direct experience with serious illness.
            That experience drives every product decision we make. Every
            screen, every feature, and every word is written for the caregiver
            sitting in a hospital parking lot at 2am.
          </p>
        </div>
      </section>

      {/* FOUNDER NOTE */}
      <section style={{ backgroundColor: "var(--background)", padding: "64px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <blockquote
            style={{
              borderLeft: "3px solid var(--accent)",
              paddingLeft: 24,
              margin: 0,
            }}
          >
            <p
              style={{
                ...HEADING,
                fontStyle: "italic",
                fontSize: 22,
                color: "var(--primary)",
                lineHeight: 1.6,
              }}
            >
              My father was in the ER, about to go into surgery. The doctors
              were busy. It was late. I was sitting there scared, overwhelmed,
              and completely alone, trying to piece together his care plan from
              memory, from papers, from nothing.
            </p>
            <p
              style={{
                ...HEADING,
                fontStyle: "italic",
                fontSize: 22,
                color: "var(--primary)",
                lineHeight: 1.6,
                marginTop: 20,
              }}
            >
              The signs had been there for months. The labs told a story nobody
              read out loud. I learned that medical gaslighting is real, and
              that the people who love a patient are often the last ones anyone
              listens to.
            </p>
            <p
              style={{
                ...HEADING,
                fontStyle: "italic",
                fontSize: 22,
                color: "var(--primary)",
                lineHeight: 1.6,
                marginTop: 20,
              }}
            >
              I built Clarifer because caregivers deserve better than that. You
              deserve peace. You deserve dignity. You deserve to walk into that
              hospital room feeling like you have everything you need, because
              you do.
            </p>
            <p
              style={{
                ...HEADING,
                fontStyle: "italic",
                fontSize: 22,
                color: "var(--primary)",
                lineHeight: 1.6,
                marginTop: 20,
              }}
            >
              This is what caregiving should feel like.
            </p>
            <p
              style={{
                ...BODY,
                fontSize: 14,
                color: "var(--muted)",
                marginTop: 20,
              }}
            >
              Founder, Clarifer
            </p>
          </blockquote>
        </div>
      </section>

      {/* VALUES */}
      <section
        style={{ backgroundColor: "var(--pale-terra)", padding: "80px 24px" }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2
            className="text-center"
            style={{
              ...HEADING,
              fontSize: 34,
              marginBottom: 48,
              color: "var(--text)",
              fontWeight: 700,
            }}
          >
            What we believe
          </h2>
          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ gap: 20 }}
          >
            {[
              {
                title: "Private by design",
                body:
                  "Your health data belongs to you. HIPAA compliant. Encrypted. Audit logged. Never sold. Never shared without your explicit consent.",
              },
              {
                title: "Free for caregivers",
                body:
                  "Revenue comes from hospital licensing and research partnerships. Caregivers should never have to pay for tools that help them provide care.",
              },
              {
                title: "Built for real conditions",
                body:
                  "Not designed for ideal circumstances. Built for the caregiver who is exhausted, overwhelmed, and doing their best. Clarifer works for real life.",
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
                    ...BODY,
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
                    ...BODY,
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

      {/* CONTACT */}
      <section
        className="text-center"
        style={{ backgroundColor: "var(--background)", padding: "64px 24px" }}
      >
        <h2
          style={{
            ...HEADING,
            fontSize: 28,
            marginBottom: 16,
            color: "var(--text)",
            fontWeight: 600,
          }}
        >
          Get in touch
        </h2>
        <p
          style={{
            ...BODY,
            fontSize: 16,
            color: "var(--muted)",
            marginBottom: 24,
          }}
        >
          For partnerships, press, or questions:
        </p>
        <a
          href="mailto:support@clarifer.com"
          style={{
            ...BODY,
            fontSize: 16,
            color: "var(--primary)",
            fontWeight: 500,
          }}
        >
          support@clarifer.com
        </a>
      </section>
    </div>
  );
}
