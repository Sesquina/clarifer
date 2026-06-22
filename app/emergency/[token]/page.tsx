/**
 * app/emergency/[token]/page.tsx
 * Public emergency card — no login required. Accessible by anyone with the link.
 * Tables: patients (read via API), medications (read via API), care_team (read via API)
 * Auth: Public (token-gated)
 * HIPAA: Displays first name only, active medications, and care team contacts.
 *        No diagnosis, DOB, or full name. Intentionally minimal for emergency use.
 */
import { notFound } from "next/navigation";
import Image from "next/image";

interface Medication {
  name: string;
  dose: string | null;
  unit: string | null;
  frequency: string | null;
  route: string | null;
}

interface CareTeamMember {
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
}

interface EmergencyCardData {
  firstName: string;
  medications: Medication[];
  careTeam: CareTeamMember[];
  generatedAt: string;
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  color: "#6B6B6B",
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  marginTop: 24,
  marginBottom: 8,
  fontFamily: "DM Sans, sans-serif",
};

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 10,
  border: "0.5px solid #E8E2D9",
  padding: "12px 14px",
  marginBottom: 6,
};

export default async function EmergencyCardPage({
  params,
}: {
  params: { token: string };
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const res = await fetch(`${siteUrl}/api/emergency/${params.token}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) notFound();
  const data = (await res.json()) as EmergencyCardData;

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: 20,
        background: "#F7F2EA",
        minHeight: "100vh",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Image
          src="/images/logos/clarifer-icon.png"
          alt="Clarifer"
          width={28}
          height={28}
          style={{ objectFit: "contain" }}
        />
        <span
          style={{
            color: "#2C5F4A",
            fontSize: 14,
            marginLeft: 8,
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Clarifer
        </span>
      </div>

      <div style={{ height: 12 }} />

      <div
        style={{
          background: "#E24B4A",
          color: "white",
          padding: "8px 16px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.5px",
        }}
      >
        EMERGENCY MEDICAL INFORMATION
      </div>

      <div style={{ height: 12 }} />

      <h1
        style={{
          fontFamily: "Playfair Display, serif",
          fontSize: 24,
          color: "#1A1A1A",
          margin: 0,
        }}
      >
        For: {data.firstName}
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "#6B6B6B",
          marginTop: 4,
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        Show this card to emergency responders.
      </p>

      {/* Medications */}
      <p style={sectionLabel}>CURRENT MEDICATIONS</p>

      {data.medications.length === 0 ? (
        <p style={{ fontSize: 13, color: "#6B6B6B" }}>
          No active medications on file.
        </p>
      ) : (
        data.medications.map((med, i) => (
          <div key={i} style={card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#1A1A1A",
                }}
              >
                {med.name}
              </span>
              <span style={{ fontSize: 12, color: "#6B6B6B" }}>
                {[med.dose, med.unit].filter(Boolean).join(" ")}
                {med.frequency ? ` · ${med.frequency}` : ""}
              </span>
            </div>
            {med.route && (
              <p
                style={{
                  fontSize: 11,
                  color: "#6B6B6B",
                  fontStyle: "italic",
                  marginTop: 4,
                }}
              >
                {med.route}
              </p>
            )}
          </div>
        ))
      )}

      {/* Care Team */}
      <p style={{ ...sectionLabel, marginTop: 20 }}>CARE TEAM CONTACTS</p>

      {data.careTeam.length === 0 ? (
        <p style={{ fontSize: 13, color: "#6B6B6B" }}>
          No care team contacts on file.
        </p>
      ) : (
        data.careTeam.map((member, i) => (
          <div key={i} style={card}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>
              {member.name}
            </p>
            {member.role && (
              <p style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>
                {member.role}
              </p>
            )}
            {member.phone && (
              <a
                href={`tel:${member.phone}`}
                style={{
                  color: "#2C5F4A",
                  fontSize: 13,
                  display: "block",
                  marginTop: 4,
                  textDecoration: "none",
                }}
              >
                📞 {member.phone}
              </a>
            )}
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                style={{
                  color: "#6B6B6B",
                  fontSize: 12,
                  display: "block",
                  marginTop: 2,
                  textDecoration: "none",
                }}
              >
                ✉ {member.email}
              </a>
            )}
          </div>
        ))
      )}

      {/* Footer */}
      <hr style={{ borderColor: "#E8E2D9", margin: "24px 0" }} />
      <p
        style={{
          fontSize: 11,
          color: "#6B6B6B",
          textAlign: "center",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        This card was prepared by a family caregiver using Clarifer.
      </p>
      <a
        href="https://clarifer.com"
        style={{
          fontSize: 11,
          color: "#2C5F4A",
          textAlign: "center",
          display: "block",
          marginTop: 4,
          textDecoration: "none",
        }}
      >
        clarifer.com
      </a>
    </main>
  );
}
