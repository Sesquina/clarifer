"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/layout/page-container";
import { Input } from "@/components/ui/input";
import { Search, Loader2, MapPin, ArrowLeft, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Trial {
  nctId: string;
  title: string;
  status: string;
  phase: string;
  location: string;
  distance?: string;
  summary: string;
}

const PHASE_FILTERS = ["All", "Phase 1", "Phase 2", "Phase 3", "Recruiting"];

export default function TrialsPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [patientId, setPatientId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: patient } = await supabase.from("patients").select("id").eq("created_by", user.id).limit(1).single();
      if (!patient) return;
      setPatientId(patient.id);
      const { data: saved } = await supabase.from("trial_saves").select("trial_id").eq("patient_id", patient.id);
      if (saved) setSavedIds(new Set(saved.map((s) => s.trial_id).filter((id): id is string => id !== null)));
    }
    load();
  }, [supabase]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, location }),
      });
      const data = await res.json();
      setTrials(data.trials || []);
    } catch {
      setTrials([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(trial: Trial) {
    if (!patientId) return;
    if (savedIds.has(trial.nctId)) return;
    await supabase.from("trial_saves").upsert({
      patient_id: patientId,
      trial_id: trial.nctId,
      trial_name: trial.title,
      phase: trial.phase,
      status: trial.status,
      location: trial.location,
    }, { onConflict: "patient_id,trial_id" });
    setSavedIds((prev) => new Set([...prev, trial.nctId]));
  }

  const PHASE_MAP: Record<string, string> = {
    "Phase 1": "PHASE1", "Phase 2": "PHASE2", "Phase 3": "PHASE3",
  };

  const filtered = activeFilter === "All"
    ? trials
    : activeFilter === "Recruiting"
      ? trials.filter((t) => t.status.toUpperCase() === "RECRUITING")
      : trials.filter((t) => {
          const target = PHASE_MAP[activeFilter];
          return target ? t.phase.toUpperCase().includes(target) : t.phase === activeFilter;
        });

  return (
    <PageContainer>
      <div className="space-y-4">
        <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Tools
        </Link>

        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Clinical Trials</h1>

        <form onSubmit={handleSearch} className="space-y-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search condition or keyword..." />
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or ZIP code (optional)" />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            style={{
              width: "100%", height: 48, borderRadius: 24, backgroundColor: "#2C5F4A", color: "#FFFFFF",
              border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer",
              opacity: loading || !query.trim() ? 0.5 : 1, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, fontFamily: "var(--font-dm-sans)",
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            Search trials
          </button>
        </form>

        {searched && trials.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PHASE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
                  borderColor: activeFilter === f ? "#2C5F4A" : "#E8E2D9",
                  backgroundColor: activeFilter === f ? "#2C5F4A" : "transparent",
                  color: activeFilter === f ? "#FFFFFF" : "#1A1A1A",
                  fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-dm-sans)",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {searched && !loading && filtered.length === 0 && (
          <p style={{ fontSize: 14, color: "#6B6B6B", textAlign: "center", padding: "32px 0" }}>
            No trials found. Try different search terms.
          </p>
        )}

        <div className="space-y-3">
          {filtered.map((trial) => (
            <div key={trial.nctId} style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <a href={`https://clinicaltrials.gov/study/${trial.nctId}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", textDecoration: "none", lineHeight: 1.4, flex: 1 }}>
                  {trial.title}
                  <ExternalLink size={12} style={{ display: "inline", marginLeft: 6, verticalAlign: "middle", opacity: 0.4 }} />
                </a>
                <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 10, backgroundColor: "#F0F5F2", color: "#2C5F4A", whiteSpace: "nowrap" }}>
                  {trial.phase}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 6, lineHeight: 1.5 }}>{trial.summary}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#6B6B6B" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 8,
                    backgroundColor: trial.status === "Recruiting" ? "#F0FDF4" : "#F4F4F5",
                    color: trial.status === "Recruiting" ? "#16a34a" : "#6B6B6B", fontWeight: 500,
                  }}>
                    {trial.status}
                  </span>
                  {trial.location && (
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <MapPin size={11} /> {trial.location}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleSave(trial)}
                  disabled={savedIds.has(trial.nctId)}
                  style={{ background: "none", border: "none", cursor: savedIds.has(trial.nctId) ? "default" : "pointer", padding: 4, color: savedIds.has(trial.nctId) ? "#2C5F4A" : "#6B6B6B" }}
                  title={savedIds.has(trial.nctId) ? "Saved" : "Save trial"}
                >
                  {savedIds.has(trial.nctId) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
