"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/layout/page-container";
import { Search, Pill, FileDown, Users, ExternalLink, Trash2, Bookmark } from "lucide-react";
import Link from "next/link";

interface SavedTrial {
  id: string;
  trial_id: string | null;
  trial_name: string | null;
  phase: string | null;
  status: string | null;
}

const linkTools = [
  { href: "/tools/trials", icon: Search, label: "Clinical Trials", description: "Find relevant trials based on your condition", bg: "var(--pale-terra)", color: "var(--accent)" },
  { href: "/tools/medications", icon: Pill, label: "Medications", description: "Track and manage current medications", bg: "var(--pale-sage)", color: "var(--primary)" },
  { href: "/care-team", icon: Users, label: "Care Team", description: "Manage your care relationships", bg: "var(--pale-sage)", color: "var(--primary)" },
];

export default function ToolsPage() {
  const [savedTrials, setSavedTrials] = useState<SavedTrial[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: patient } = await supabase.from("patients").select("id").eq("created_by", user.id).limit(1).single();
      if (!patient) return;
      setPatientId(patient.id);
      const { data } = await supabase.from("trial_saves").select("id, trial_id, trial_name, phase, status").eq("patient_id", patient.id).order("saved_at", { ascending: false });
      if (data) setSavedTrials(data);
    }
    load();
  }, [supabase]);

  async function handleExport() {
    if (!patientId || exporting) return;
    setExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clarifer-export-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent fail
    } finally {
      setExporting(false);
    }
  }

  async function handleUnsave(id: string) {
    // PHI write routed server-side: auth check + role check +
    // org_id filter + audit_log are enforced in DELETE /api/trial-saves/delete.
    const res = await fetch("/api/trial-saves/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setSavedTrials((prev) => prev.filter((t) => t.id !== id));
    }
  }

  return (
    <PageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Tools</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {linkTools.map((tool) => (
            <Link key={tool.label} href={tool.href} style={{ textDecoration: "none", color: "var(--text)" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 16, backgroundColor: "var(--card)",
                borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, backgroundColor: tool.bg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <tool.icon size={24} color={tool.color} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600 }}>{tool.label}</p>
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>{tool.description}</p>
                </div>
              </div>
            </Link>
          ))}
          {/* Export Data: triggers download directly */}
          <button
            onClick={handleExport}
            disabled={exporting || !patientId}
            style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0, opacity: exporting ? 0.5 : 1 }}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 16, backgroundColor: "var(--card)",
              borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, backgroundColor: "var(--pale-terra)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <FileDown size={24} color="var(--accent)" />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{exporting ? "Exporting..." : "Export Data"}</p>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Download health records as text file</p>
              </div>
            </div>
          </button>
        </div>

        {/* Saved Trials */}
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Saved Trials
          </h2>
          {savedTrials.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--muted)", padding: "8px 0" }}>
              No saved trials yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {savedTrials.map((trial) => (
                <div
                  key={trial.id}
                  style={{
                    backgroundColor: "var(--card)", borderRadius: 12, padding: "14px 16px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      {trial.trial_id ? (
                        <a
                          href={`https://clinicaltrials.gov/study/${trial.trial_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", textDecoration: "none", lineHeight: 1.4 }}
                        >
                          {trial.trial_name || trial.trial_id}
                          <ExternalLink size={11} style={{ display: "inline", marginLeft: 6, verticalAlign: "middle", opacity: 0.4 }} />
                        </a>
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{trial.trial_name || "Untitled"}</span>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                        {trial.phase && (
                          <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 8, backgroundColor: "var(--pale-sage)", color: "var(--primary)" }}>
                            {trial.phase}
                          </span>
                        )}
                        {trial.status && (
                          <span style={{
                            fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 8,
                            backgroundColor: trial.status.toUpperCase() === "RECRUITING" ? "#F0FDF4" : "#F4F4F5",
                            color: trial.status.toUpperCase() === "RECRUITING" ? "#16a34a" : "var(--muted)",
                          }}>
                            {trial.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnsave(trial.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--accent)", flexShrink: 0 }}
                      title="Remove saved trial"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
