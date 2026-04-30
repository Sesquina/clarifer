"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/layout/page-container";
import { Input } from "@/components/ui/input";
import { Search, Loader2, MapPin, ArrowLeft, Bookmark, BookmarkCheck, ExternalLink, Mail } from "lucide-react";
import Link from "next/link";

interface Trial {
  nct_id: string;
  title: string;
  status: string;
  phase: string;
  location: string;
  brief_summary: string;
  contact: string | null;
  external_url: string;
}

const PHASE_FILTERS = ["All", "Phase 1", "Phase 2", "Phase 3", "Recruiting"];

const TUMOR_LOCATION_OPTIONS = ["Not sure", "Intrahepatic", "Perihilar", "Distal"];
const CA19_9_OPTIONS = ["Not tested", "Below 100", "100-1,000", "1,000-10,000", "Above 10,000", "Above 100,000"];
const TREATMENT_HISTORY_OPTIONS = ["Not yet started", "On first treatment", "First stopped working", "Two or more tried"];
const BIOMARKER_OPTIONS = ["Not tested", "Positive", "Negative"];

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 14px",
        minHeight: 36,
        borderRadius: 20,
        border: `1.5px solid ${active ? "var(--primary)" : "var(--border)"}`,
        backgroundColor: active ? "var(--pale-sage)" : "transparent",
        color: active ? "var(--primary)" : "var(--text)",
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export default function TrialsPage() {
  const [keywords, setKeywords] = useState("");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [patientId, setPatientId] = useState<string | null>(null);
  const [oncologistEmail, setOncologistEmail] = useState<string | null>(null);

  // CCA biomarker filters
  const [tumorLocation, setTumorLocation] = useState("");
  const [ca19_9, setCa19_9] = useState("");
  const [treatmentHistory, setTreatmentHistory] = useState("");
  const [fgfr2Status, setFgfr2Status] = useState("");
  const [idh1Status, setIdh1Status] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("created_by", user.id)
        .limit(1)
        .single();
      if (!patient) return;
      setPatientId(patient.id);

      const { data: saved } = await supabase
        .from("trial_saves")
        .select("trial_id")
        .eq("patient_id", patient.id);

      if (saved) {
        setSavedIds(
          new Set(
            (saved as Array<{ trial_id: string | null }>)
              .map((s) => s.trial_id)
              .filter((id): id is string => id !== null)
          )
        );
      }

      try {
        const { data: teamMembers } = await supabase
          .from("care_team")
          .select("email, role")
          .eq("patient_id", patient.id);
        if (teamMembers) {
          const onco = (teamMembers as Array<{ role: string | null; email: string | null }>).find(
            (m) => m.role?.toLowerCase().includes("oncolog")
          );
          if (onco?.email) setOncologistEmail(onco.email);
        }
      } catch {
        // care_team table may not exist in all environments
      }
    }
    load();
  }, [supabase]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/trials/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          tumor_location: tumorLocation || null,
          ca19_9_level: ca19_9 || null,
          treatment_history: treatmentHistory || null,
          fgfr2_status: fgfr2Status || null,
          idh1_status: idh1Status || null,
          extra_keywords: keywords.trim() || null,
        }),
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
    if (savedIds.has(trial.nct_id)) return;
    await supabase.from("trial_saves").upsert(
      {
        patient_id: patientId,
        trial_id: trial.nct_id,
        trial_name: trial.title,
        phase: trial.phase,
        status: trial.status,
        location: trial.location,
      },
      { onConflict: "patient_id,trial_id" }
    );
    setSavedIds((prev) => new Set([...prev, trial.nct_id]));
  }

  function buildMailto(trial: Trial): string {
    const subject = `Trial inquiry: ${trial.title}`;
    const profileLines = [
      tumorLocation && `Tumor location: ${tumorLocation}`,
      ca19_9 && `CA 19-9 level: ${ca19_9}`,
      treatmentHistory && `Treatment history: ${treatmentHistory}`,
      fgfr2Status && `FGFR2 fusion: ${fgfr2Status}`,
      idh1Status && `IDH1 mutation: ${idh1Status}`,
    ].filter(Boolean);

    const body = [
      "Hello,",
      "",
      "I would like to ask about this clinical trial for my care recipient.",
      "",
      `Trial: ${trial.title}`,
      `NCT ID: ${trial.nct_id}`,
      `Status: ${trial.status} | Phase: ${trial.phase}`,
      trial.contact ? `Trial contact: ${trial.contact}` : "",
      `More info: ${trial.external_url || `https://clinicaltrials.gov/study/${trial.nct_id}`}`,
      "",
      ...(profileLines.length > 0 ? ["Patient profile:", ...profileLines.map((l) => `- ${l}`), ""] : []),
      "Is this trial worth looking into? Any guidance on eligibility or next steps would be helpful.",
      "",
      "Thank you",
    ]
      .filter((l) => l !== undefined)
      .join("\n");

    const cc = oncologistEmail ? `&cc=${encodeURIComponent(oncologistEmail)}` : "";
    return `mailto:?subject=${encodeURIComponent(subject)}${cc}&body=${encodeURIComponent(body)}`;
  }

  const PHASE_MAP: Record<string, string> = {
    "Phase 1": "PHASE1",
    "Phase 2": "PHASE2",
    "Phase 3": "PHASE3",
  };

  const filtered =
    activeFilter === "All"
      ? trials
      : activeFilter === "Recruiting"
      ? trials.filter((t) => t.status.toUpperCase() === "RECRUITING")
      : trials.filter((t) => {
          const target = PHASE_MAP[activeFilter];
          return target ? t.phase.toUpperCase().includes(target) : t.phase === activeFilter;
        });

  const filterGroupStyle: React.CSSProperties = {
    marginBottom: 12,
  };

  const filterLabelStyle: React.CSSProperties = {
    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text)",
    marginBottom: 6,
    display: "block",
  };

  const filterHelperStyle: React.CSSProperties = {
    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--muted)",
    marginBottom: 6,
  };

  const chipRowStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  };

  return (
    <PageContainer>
      <div className="space-y-4">
        <Link
          href="/tools"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tools
        </Link>

        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
          Clinical Trials
        </h1>

        <form onSubmit={handleSearch} className="space-y-3">
          <Input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Additional keywords (optional)"
          />

          {/* Biomarker filters */}
          <div
            style={{
              backgroundColor: "var(--card)",
              borderRadius: 12,
              border: "1px solid var(--border)",
              padding: "16px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--muted)",
                marginBottom: 14,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Refine by biomarkers (optional)
            </p>

            <div style={filterGroupStyle}>
              <span style={filterLabelStyle}>Tumor location</span>
              <div style={chipRowStyle}>
                {TUMOR_LOCATION_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt}
                    label={opt}
                    active={tumorLocation === opt}
                    onClick={() => setTumorLocation(tumorLocation === opt ? "" : opt)}
                  />
                ))}
              </div>
            </div>

            <div style={filterGroupStyle}>
              <span style={filterLabelStyle}>CA 19-9 level (U/mL)</span>
              <div style={chipRowStyle}>
                {CA19_9_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt}
                    label={opt}
                    active={ca19_9 === opt}
                    onClick={() => setCa19_9(ca19_9 === opt ? "" : opt)}
                  />
                ))}
              </div>
            </div>

            <div style={filterGroupStyle}>
              <span style={filterLabelStyle}>Treatment history</span>
              <div style={chipRowStyle}>
                {TREATMENT_HISTORY_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt}
                    label={opt}
                    active={treatmentHistory === opt}
                    onClick={() => setTreatmentHistory(treatmentHistory === opt ? "" : opt)}
                  />
                ))}
              </div>
            </div>

            <div style={filterGroupStyle}>
              <span style={filterLabelStyle}>FGFR2 fusion</span>
              <p style={filterHelperStyle}>
                Found in about 15% of cholangiocarcinoma cases. Ordered by your oncologist.
              </p>
              <div style={chipRowStyle}>
                {BIOMARKER_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt}
                    label={opt}
                    active={fgfr2Status === opt}
                    onClick={() => setFgfr2Status(fgfr2Status === opt ? "" : opt)}
                  />
                ))}
              </div>
            </div>

            <div style={{ ...filterGroupStyle, marginBottom: 0 }}>
              <span style={filterLabelStyle}>IDH1 mutation</span>
              <p style={filterHelperStyle}>
                More common in intrahepatic cases. Guides eligibility for ivosidenib trials.
              </p>
              <div style={chipRowStyle}>
                {BIOMARKER_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt}
                    label={opt}
                    active={idh1Status === opt}
                    onClick={() => setIdh1Status(idh1Status === opt ? "" : opt)}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !patientId}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 24,
              backgroundColor: "var(--primary)",
              color: "#FFFFFF",
              border: "none",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading || !patientId ? "not-allowed" : "pointer",
              opacity: loading || !patientId ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
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
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: "1.5px solid",
                  borderColor: activeFilter === f ? "var(--primary)" : "var(--border)",
                  backgroundColor: activeFilter === f ? "var(--primary)" : "transparent",
                  color: activeFilter === f ? "#FFFFFF" : "var(--text)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {searched && !loading && filtered.length === 0 && (
          <p
            style={{
              fontSize: 14,
              color: "var(--muted)",
              textAlign: "center",
              padding: "32px 0",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            }}
          >
            No trials found. Try adjusting your filters.
          </p>
        )}

        <div className="space-y-3">
          {filtered.map((trial) => (
            <div
              key={trial.nct_id}
              style={{
                backgroundColor: "var(--card)",
                borderRadius: 14,
                padding: "16px 18px",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <a
                  href={trial.external_url || `https://clinicaltrials.gov/study/${trial.nct_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text)",
                    textDecoration: "none",
                    lineHeight: 1.4,
                    flex: 1,
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  }}
                >
                  {trial.title}
                  <ExternalLink
                    size={12}
                    style={{ display: "inline", marginLeft: 6, verticalAlign: "middle", opacity: 0.4 }}
                  />
                </a>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "3px 8px",
                    borderRadius: 10,
                    backgroundColor: "var(--pale-sage)",
                    color: "var(--primary)",
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  }}
                >
                  {trial.phase}
                </span>
              </div>

              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  marginTop: 6,
                  lineHeight: 1.5,
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
              >
                {trial.brief_summary?.slice(0, 200)}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 12,
                    color: "var(--muted)",
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  }}
                >
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 8,
                      backgroundColor:
                        trial.status === "Recruiting" ? "#F0FDF4" : "var(--background)",
                      color: trial.status === "Recruiting" ? "#16a34a" : "var(--muted)",
                      fontWeight: 500,
                    }}
                  >
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
                  disabled={savedIds.has(trial.nct_id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: savedIds.has(trial.nct_id) ? "default" : "pointer",
                    padding: 4,
                    color: savedIds.has(trial.nct_id) ? "var(--primary)" : "var(--muted)",
                  }}
                  title={savedIds.has(trial.nct_id) ? "Saved" : "Save trial"}
                >
                  {savedIds.has(trial.nct_id) ? (
                    <BookmarkCheck size={18} />
                  ) : (
                    <Bookmark size={18} />
                  )}
                </button>
              </div>

              {/* One-click inquiry */}
              <a
                href={buildMailto(trial)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--primary)",
                  textDecoration: "none",
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
              >
                <Mail size={14} />
                Send inquiry to trial team
              </a>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
