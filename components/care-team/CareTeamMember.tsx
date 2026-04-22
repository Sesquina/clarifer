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
  Doctor: { bg: "#F0F5F2", text: "#2C5F4A" },
  Nurse: { bg: "#F0F5F2", text: "#2C5F4A" },
  "Social Worker": { bg: "#FDF3EE", text: "#C4714A" },
  Family: { bg: "#FEF3C7", text: "#B45309" },
  Other: { bg: "#F4F4F5", text: "#6B6B6B" },
};

export function CareTeamMember({ member, onDelete }: CareTeamMemberProps) {
  const badge = ROLE_COLORS[member.role || "Other"] || ROLE_COLORS.Other;

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: "16px 18px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{member.name}</p>
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
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#C4714A" }}
          aria-label="Delete member"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
        {member.phone && (
          <a
            href={`tel:${member.phone}`}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#2C5F4A", textDecoration: "none" }}
          >
            <Phone size={14} />
            {member.phone}
          </a>
        )}
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#2C5F4A", textDecoration: "none" }}
          >
            <Mail size={14} />
            {member.email}
          </a>
        )}
      </div>

      {member.notes && (
        <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 8, lineHeight: 1.5 }}>
          {member.notes}
        </p>
      )}
    </div>
  );
}
