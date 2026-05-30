import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Caregiver Promise | Clarifer",
  description: "Clarifer's commitment to caregivers. Free forever, data never sold, research only with consent.",
};

export default function PromisePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ marginBottom: 48 }}>
          <img
            src="/logo-mark.png"
            alt="Clarifer"
            width={40}
            height={40}
            style={{ objectFit: "contain", marginBottom: 24 }}
          />
          <h1
            style={{
              fontFamily: "var(--font-playfair), 'Playfair Display', serif",
              fontSize: 36,
              fontWeight: 700,
              color: "var(--primary)",
              marginBottom: 16,
              lineHeight: 1.2,
            }}
          >
            Our Caregiver Promise
          </h1>
          <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
            Clarifer was built by a caregiver, for caregivers. These are the commitments we make to every family who uses this platform.
          </p>
        </div>

        {[
          {
            title: "Free for caregivers. Always.",
            body: "Clarifer will never charge caregivers to use this platform. That is not a promotional offer. It is a founding principle. Caregivers already give everything. We will not ask for money on top of that.",
          },
          {
            title: "Your data is yours.",
            body: "We will never sell your personal information, your medical documents, or your care history to advertisers, data brokers, or third parties. Your data exists to help you, not to generate revenue at your expense.",
          },
          {
            title: "Research only with your consent.",
            body: "If you choose to contribute anonymized data to medical research, that choice is yours alone. You can opt in, you can opt out, and you can change your mind at any time. We will never share data without explicit, informed consent.",
          },
          {
            title: "Revenue flows back to caregivers.",
            body: "Clarifer generates revenue through hospital licensing and research partnerships. A minimum of 5% of gross research licensing revenue is committed to our Caregiver Support Fund, which provides direct financial assistance to caregivers for transportation, medications, and respite care.",
          },
          {
            title: "You can leave anytime.",
            body: "You can export all of your data and delete your account at any time. We will delete everything within 30 days and send you confirmation. No dark patterns, no friction, no guilt.",
          },
        ].map((item) => (
          <div
            key={item.title}
            style={{
              borderLeft: "3px solid var(--primary)",
              paddingLeft: 24,
              marginBottom: 40,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-playfair), 'Playfair Display', serif",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--primary)",
                marginBottom: 8,
              }}
            >
              {item.title}
            </h2>
            <p style={{ fontSize: 16, color: "var(--text)", lineHeight: 1.7, margin: 0 }}>
              {item.body}
            </p>
          </div>
        ))}

        <div
          style={{
            backgroundColor: "var(--pale-sage)",
            borderRadius: 12,
            padding: "24px 28px",
            marginTop: 48,
          }}
        >
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
            This promise is a living document. If we ever need to update it, we will notify every caregiver by email before any change takes effect. Questions?{" "}
            <a
              href="mailto:team@clarifer.com"
              style={{ color: "var(--primary)", fontWeight: 500 }}
            >
              Email us at team@clarifer.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
