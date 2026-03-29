"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/layout/page-container";
import { Plus, X, Phone, Mail, Users, Trash2 } from "lucide-react";

const ROLES = ["Doctor", "Nurse", "Social Worker", "Family", "Other"];

interface Member {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

export default function CareTeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: patient } = await supabase.from("patients").select("id").eq("created_by", user.id).limit(1).single();
      if (!patient) return;
      setPatientId(patient.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from("care_team").select("*").eq("patient_id", patient.id).order("created_at", { ascending: true });
      if (data) setMembers(data as Member[]);
    }
    load();
  }, [supabase]);

  async function handleAdd() {
    if (!patientId || !name.trim()) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from("care_team").insert({
      patient_id: patientId,
      name: name.trim(),
      role: role || null,
      phone: phone || null,
      email: email || null,
      notes: notes || null,
    }).select().single();
    if (data) setMembers((prev) => [...prev, data as Member]);
    setSaving(false);
    setShowAdd(false);
    setName(""); setRole(""); setPhone(""); setEmail(""); setNotes("");
  }

  async function handleDelete(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("care_team").delete().eq("id", id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  const inputStyle: React.CSSProperties = {
    height: 48, borderRadius: 12, border: "1.5px solid #E8E2D9", padding: "0 16px",
    fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#1A1A1A",
    backgroundColor: "#FFFFFF", width: "100%", boxSizing: "border-box", outline: "none",
  };

  const roleBadgeColor: Record<string, { bg: string; text: string }> = {
    Doctor: { bg: "#F0F5F2", text: "#2C5F4A" },
    Nurse: { bg: "#F0F5F2", text: "#2C5F4A" },
    "Social Worker": { bg: "#FDF3EE", text: "#C4714A" },
    Family: { bg: "#FEF3C7", text: "#B45309" },
    Other: { bg: "#F4F4F5", text: "#6B6B6B" },
  };

  return (
    <PageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "#1A1A1A" }}>Care Team</h1>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", borderRadius: 20,
              backgroundColor: "#2C5F4A", color: "#FFFFFF", border: "none", fontSize: 13,
              fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-dm-sans)",
            }}
          >
            <Plus size={16} /> Add member
          </button>
        </div>

        {members.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <Users size={40} color="#E8E2D9" style={{ margin: "0 auto" }} />
            <p style={{ fontSize: 15, color: "#6B6B6B", marginTop: 16, lineHeight: 1.6 }}>
              No care team members yet. Add your doctors, nurses, and support contacts.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {members.map((m) => {
              const badge = roleBadgeColor[m.role || "Other"] || roleBadgeColor.Other;
              return (
                <div
                  key={m.id}
                  style={{
                    backgroundColor: "#FFFFFF", borderRadius: 14, padding: "16px 18px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{m.name}</p>
                      {m.role && (
                        <span style={{
                          display: "inline-block", marginTop: 4, fontSize: 11, fontWeight: 500,
                          padding: "2px 10px", borderRadius: 8, backgroundColor: badge.bg, color: badge.text,
                        }}>
                          {m.role}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(m.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#C4714A" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                    {m.phone && (
                      <a href={`tel:${m.phone}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#2C5F4A", textDecoration: "none" }}>
                        <Phone size={14} /> {m.phone}
                      </a>
                    )}
                    {m.email && (
                      <a href={`mailto:${m.email}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#2C5F4A", textDecoration: "none" }}>
                        <Mail size={14} /> {m.email}
                      </a>
                    )}
                  </div>
                  {m.notes && (
                    <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 8, lineHeight: 1.5 }}>{m.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add member modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setShowAdd(false)} />
          <div style={{ position: "relative", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 20 }}>Add team member</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color="#6B6B6B" />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={inputStyle} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
                      borderColor: role === r ? "#2C5F4A" : "#E8E2D9",
                      backgroundColor: role === r ? "#2C5F4A" : "transparent",
                      color: role === r ? "#FFFFFF" : "#1A1A1A",
                      fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" type="tel" style={inputStyle} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" style={inputStyle} />
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" style={inputStyle} />
              <button
                onClick={handleAdd}
                disabled={saving || !name.trim()}
                style={{
                  height: 48, borderRadius: 24, backgroundColor: "#2C5F4A", color: "#FFFFFF",
                  border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer",
                  opacity: saving || !name.trim() ? 0.5 : 1, fontFamily: "var(--font-dm-sans)",
                }}
              >
                {saving ? "Saving..." : "Add member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
