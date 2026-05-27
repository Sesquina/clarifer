import { Phone, Mail, Trash2 } from "lucide-react";

export interface Member {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

interface CareTeamMemberProps {
  member: Member;
  onDelete: (id: string) => void;
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  Doctor: { bg: "var(--pale-sage)", text: "var(--primary)" },
  Nurse: { bg: "var(--pale-sage)", text: "var(--primary)" },
  "Social Worker": { bg: "var(--pale-terra)", text: "var(--accent)" },
  Family: { bg: "#FEF3C7", text: "#B45309" },
  Other: { bg: "#F4F4F5", text: "var(--muted)" },
};

export function CareTeamMember({ member, onDelete }: CareTeamMemberProps) {
  const badge = ROLE_COLORS[member.role || "Other"] || ROLE_COLORS.Other;

  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        borderRadius: 14,
        padding: "16px 18px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{member.name}</p>
          {member.role && (
            <span
              style={{
                display: "inline-block",
                marginTop: 4,
                fontSize: 11,
                fontWeight: 500,
                padding: "2px 10px",
                borderRadius: 8,
                backgroundColor: badge.bg,
                color: badge.text,
              }}
            >
              {member.role}
            </span>
          )}
        </div>
        <button
          onClick={() => onDelete(member.id)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--accent)" }}
          aria-label="Delete member"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
        {member.phone && (
          <a
            href={`tel:${member.phone}`}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--primary)", textDecoration: "none" }}
          >
            <Phone size={14} />
            {member.phone}
          </a>
        )}
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--primary)", textDecoration: "none" }}
          >
            <Mail size={14} />
            {member.email}
          </a>
        )}
      </div>

      {member.notes && (
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
          {member.notes}
        </p>
      )}
    </div>
  );
}
