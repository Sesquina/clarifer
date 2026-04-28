/**
 * app/(app)/patients/[id]/care-team/page.tsx
 * Care team directory web screen.
 * Tables: reads /api/care-team and /api/care-team/[id]/message-templates;
 *         no direct Supabase reads.
 * Auth: caregiver, patient, provider, admin (server enforces).
 * Sprint: Sprint 10 -- Care Team Directory
 *
 * HIPAA: Renders provider contact info on screen. No PHI written to logs
 * from this file.
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

interface Member {
  id: string;
  name: string;
  role: string | null;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  fax: string | null;
  address: string | null;
  notes: string | null;
  is_primary: boolean | null;
  patient_id: string | null;
}

interface Template {
  id: string;
  label: string;
  body: string;
}

const COPY = {
  title: "Care Team",
  empty:
    "Your care team will appear here. Add your first provider to get started.",
  add: "Add Member",
  primary: "Primary",
  templates: "Quick messages",
  copy: "Copy",
  copied: "Copied",
  notesLabel: "Notes",
  loadError: "We could not load your care team. Try again in a moment.",
} as const;

interface UserProfile {
  role: string | null;
}

export default function CareTeamPage() {
  const params = useParams<{ id: string }>();
  const patientId = params?.id ?? "";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templatesByMember, setTemplatesByMember] = useState<Record<string, Template[]>>({});
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const canEdit = useMemo(
    () => profile?.role === "caregiver" || profile?.role === "admin",
    [profile?.role]
  );

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const [meRes, listRes] = await Promise.all([
        fetch("/api/auth/session", { credentials: "include" }).catch(() => null),
        fetch(`/api/care-team?patient_id=${encodeURIComponent(patientId)}`, {
          credentials: "include",
        }),
      ]);
      if (meRes && meRes.ok) {
        const me = (await meRes.json().catch(() => ({}))) as { role?: string | null };
        setProfile({ role: me.role ?? null });
      }
      if (!listRes.ok) {
        setError(COPY.loadError);
        setMembers([]);
      } else {
        const json = (await listRes.json()) as { members: Member[] };
        setMembers(json.members ?? []);
      }
    } catch {
      setError(COPY.loadError);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadTemplates(memberId: string) {
    if (templatesByMember[memberId]) return;
    const res = await fetch(`/api/care-team/${memberId}/message-templates`, {
      credentials: "include",
    });
    if (res.ok) {
      const json = (await res.json()) as { templates: Template[] };
      setTemplatesByMember((prev) => ({ ...prev, [memberId]: json.templates ?? [] }));
    }
  }

  function toggleTemplates(memberId: string) {
    if (openMemberId === memberId) {
      setOpenMemberId(null);
      return;
    }
    setOpenMemberId(memberId);
    loadTemplates(memberId);
  }

  async function copyTemplate(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast(COPY.copied);
      setTimeout(() => setToast(null), 1800);
    } catch {
      // Clipboard blocked: silently no-op; user can long-press to copy manually.
    }
  }

  return (
    <main style={{ ...BODY, padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <div className="flex items-center" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <h1 style={{ ...HEADING, fontSize: 28, color: "var(--primary)", fontWeight: 700 }}>
          {COPY.title}
        </h1>
        {canEdit && (
          <button
            type="button"
            aria-label={COPY.add}
            data-action="add-member"
            style={{
              ...BODY,
              height: 48,
              padding: "0 20px",
              borderRadius: 24,
              border: "none",
              backgroundColor: "var(--accent)",
              color: "var(--white)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {COPY.add}
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            ...BODY,
            backgroundColor: "var(--pale-terra)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px 16px",
            color: "var(--accent)",
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col" style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 20,
                height: 140,
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div
          data-testid="care-team-empty"
          style={{
            ...BODY,
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 32,
            textAlign: "center",
            color: "var(--muted)",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          {COPY.empty}
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 16 }}>
          {members.map((m) => (
            <article
              key={m.id}
              data-testid="care-team-card"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 20,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap" }}>
                <div style={{ ...BODY, fontSize: 18, fontWeight: 600, color: "var(--text)" }}>
                  {m.name}
                </div>
                {m.is_primary && (
                  <span
                    style={{
                      ...BODY,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 10px",
                      borderRadius: 12,
                      backgroundColor: "var(--pale-sage)",
                      color: "var(--primary)",
                    }}
                  >
                    {COPY.primary}
                  </span>
                )}
              </div>
              {(m.role || m.specialty) && (
                <div style={{ ...BODY, fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                  {[m.role, m.specialty].filter(Boolean).join(" -- ")}
                </div>
              )}

              <div className="flex flex-wrap" style={{ gap: 8, marginTop: 14 }}>
                {m.phone && (
                  <a
                    href={`tel:${m.phone}`}
                    data-action="phone"
                    style={contactLink("primary")}
                  >
                    {m.phone}
                  </a>
                )}
                {m.email && (
                  <a
                    href={`mailto:${m.email}`}
                    data-action="email"
                    style={contactLink("ghost")}
                  >
                    {m.email}
                  </a>
                )}
              </div>

              {m.notes && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      ...BODY,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                      marginBottom: 4,
                    }}
                  >
                    {COPY.notesLabel}
                  </div>
                  <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{m.notes}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => toggleTemplates(m.id)}
                aria-expanded={openMemberId === m.id}
                aria-label={COPY.templates}
                data-action="toggle-templates"
                style={{
                  ...BODY,
                  marginTop: 14,
                  height: 48,
                  padding: "0 20px",
                  borderRadius: 24,
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                  color: "var(--primary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {COPY.templates}
              </button>

              {openMemberId === m.id && (
                <div className="flex flex-wrap" style={{ gap: 8, marginTop: 12 }}>
                  {(templatesByMember[m.id] ?? []).map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => copyTemplate(tpl.body)}
                      data-action="copy-template"
                      aria-label={`${COPY.copy} ${tpl.label}`}
                      style={{
                        ...BODY,
                        height: 48,
                        padding: "0 16px",
                        borderRadius: 24,
                        border: "1px solid var(--primary)",
                        backgroundColor: "var(--card)",
                        color: "var(--primary)",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {tpl.label}
                    </button>
                  ))}
                  {(templatesByMember[m.id] ?? []).length === 0 && (
                    <span style={{ ...BODY, fontSize: 13, color: "var(--muted)" }}>
                      No templates yet.
                    </span>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {toast && (
        <div
          role="status"
          style={{
            ...BODY,
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--text)",
            color: "var(--white)",
            padding: "10px 18px",
            borderRadius: 24,
            fontSize: 14,
            zIndex: 100,
          }}
        >
          {toast}
        </div>
      )}
    </main>
  );
}

function contactLink(variant: "primary" | "ghost"): React.CSSProperties {
  const base: React.CSSProperties = {
    ...BODY,
    display: "inline-flex",
    alignItems: "center",
    height: 48,
    padding: "0 20px",
    borderRadius: 24,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
  };
  if (variant === "primary") {
    return { ...base, backgroundColor: "var(--primary)", color: "var(--white)" };
  }
  return {
    ...base,
    border: "1px solid var(--border)",
    backgroundColor: "var(--card)",
    color: "var(--text)",
  };
}
