"use client";

import { useState, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Input } from "@/components/ui/input";
import {
  Search,
  Loader2,
  MapPin,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Mail,
  Copy,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

interface PlainLanguage {
  five_things_to_know: string[];
  possible_disqualifiers: string[];
  next_step: string;
}

interface Trial {
  nct_id: string;
  title: string;
  status: string;
  phase: string;
  location: string;
  city: string | null;
  state: string | null;
  country: string | null;
  brief_summary: string;
  eligibility: string;
  contact: string | null;
  external_url: string;
  plain_language: PlainLanguage | null;
  saved: boolean;
}

interface PatientContext {
  patient_id: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  condition: string | null;
  oncologist_email: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PHASE_FILTERS = ["All", "Phase 1", "Phase 2", "Phase 3", "Recruiting"];
const PHASE_MAP: Record<string, string> = {
  "Phase 1": "PHASE1",
  "Phase 2": "PHASE2",
  "Phase 3": "PHASE3",
};

const TUMOR_LOCATION_OPTIONS = ["Not sure", "Intrahepatic", "Perihilar", "Distal"];
const CA19_9_OPTIONS = ["Not tested", "Below 100", "100-1,000", "1,000-10,000", "Above 10,000", "Above 100,000"];
const TREATMENT_HISTORY_OPTIONS = ["Not yet started", "On first treatment", "First stopped working", "Two or more tried"];
const BIOMARKER_OPTIONS = ["Not tested", "Positive", "Negative"];

// ── Sub-components ────────────────────────────────────────────────────────────

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

function StatusBadge({ status }: { status: string }) {
  const isRecruiting = status.toUpperCase() === "RECRUITING";
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 8,
        backgroundColor: isRecruiting ? "#F0FDF4" : "var(--background)",
        color: isRecruiting ? "#16a34a" : "var(--muted)",
        fontWeight: 500,
        fontSize: 12,
        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
      }}
    >
      {status}
    </span>
  );
}

// ── Coordinator message modal ─────────────────────────────────────────────────

function CoordinatorModal({
  trial,
  profile,
  patientId,
  onClose,
}: {
  trial: Trial;
  profile: {
    tumorLocation: string;
    ca19_9: string;
    treatmentHistory: string;
    fgfr2Status: string;
    idh1Status: string;
  };
  patientId: string;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      try {
        const res = await fetch("/api/trials/coordinator-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: patientId,
            trial: {
              nct_id: trial.nct_id,
              title: trial.title,
              phase: trial.phase,
              status: trial.status,
              location: trial.location,
              contact: trial.contact,
              external_url: trial.external_url,
            },
            profile: {
              tumor_location: profile.tumorLocation || null,
              ca19_9_level: profile.ca19_9 || null,
              treatment_history: profile.treatmentHistory || null,
              fgfr2_status: profile.fgfr2Status || null,
              idh1_status: profile.idh1Status || null,
            },
          }),
        });
        const data = await res.json();
        if (!cancelled) setMessage(data.message ?? "");
      } catch {
        if (!cancelled) setMessage("Could not generate message. Copy the trial link and write your own.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    generate();
    return () => {
      cancelled = true;
    };
  }, [trial, profile, patientId]);

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "var(--card)",
          borderRadius: "20px 20px 0 0",
          width: "100%",
          maxWidth: 640,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          padding: "20px 20px 32px",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              color: "var(--text)",
            }}
          >
            Message to trial coordinator
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        <p
          style={{
            fontSize: 13,
            color: "var(--muted)",
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Review and edit before sending. No patient name is included.
        </p>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--primary)" }} />
          </div>
        ) : (
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              width: "100%",
              minHeight: 220,
              padding: "12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 13,
              lineHeight: 1.6,
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              color: "var(--text)",
              backgroundColor: "var(--background)",
              resize: "vertical",
            }}
          />
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleCopy}
            disabled={loading || !message}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 22,
              border: "1.5px solid var(--border)",
              backgroundColor: "transparent",
              color: "var(--text)",
              fontSize: 14,
              fontWeight: 500,
              cursor: loading || !message ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Copied" : "Copy"}
          </button>

          {trial.contact && (
            <a
              href={`mailto:?subject=${encodeURIComponent(`Inquiry: ${trial.title}`)}&body=${encodeURIComponent(message)}`}
              style={{
                flex: 2,
                height: 44,
                borderRadius: 22,
                backgroundColor: "var(--primary)",
                color: "var(--card)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                textDecoration: "none",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              }}
            >
              <Mail size={15} />
              Open in email
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Location prompt ───────────────────────────────────────────────────────────

function LocationPrompt({ onSubmit }: { onSubmit: (city: string) => void }) {
  const [city, setCity] = useState("");

  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        padding: "20px 18px",
      }}
    >
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: 6,
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        }}
      >
        Where is the patient located?
      </p>
      <p
        style={{
          fontSize: 13,
          color: "var(--muted)",
          marginBottom: 12,
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          lineHeight: 1.5,
        }}
      >
        Adding a city helps surface trials closest to you.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Cleveland, OH"
          onKeyDown={(e) => {
            if (e.key === "Enter" && city.trim()) onSubmit(city.trim());
          }}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          onClick={() => {
            if (city.trim()) onSubmit(city.trim());
          }}
          disabled={!city.trim()}
          style={{
            height: 40,
            paddingLeft: 16,
            paddingRight: 16,
            borderRadius: 20,
            backgroundColor: city.trim() ? "var(--primary)" : "var(--border)",
            color: city.trim() ? "var(--card)" : "var(--muted)",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor: city.trim() ? "pointer" : "not-allowed",
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          Use this city
        </button>
      </div>
    </div>
  );
}

// ── Trial card ────────────────────────────────────────────────────────────────

function TrialCard({
  trial,
  saved,
  onSave,
  onMessage,
  patientCity,
}: {
  trial: Trial;
  saved: boolean;
  onSave: () => void;
  onMessage: () => void;
  patientCity: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const isNearby =
    patientCity && trial.city
      ? trial.city.toLowerCase().includes(patientCity.toLowerCase()) ||
        patientCity.toLowerCase().includes(trial.city.toLowerCase())
      : false;

  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        borderRadius: 14,
        padding: "16px 18px",
        border: `1px solid ${isNearby ? "var(--primary)" : "var(--border)"}`,
      }}
    >
      {/* Title row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
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

      {/* Summary */}
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

      {/* Status + location */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <StatusBadge status={trial.status} />
          {trial.location && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 12,
                color: isNearby ? "var(--primary)" : "var(--muted)",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontWeight: isNearby ? 600 : 400,
              }}
            >
              <MapPin size={11} />
              {trial.location}
              {isNearby && " · Near you"}
            </span>
          )}
        </div>
        <button
          onClick={onSave}
          disabled={saved}
          style={{
            background: "none",
            border: "none",
            cursor: saved ? "default" : "pointer",
            padding: 4,
            color: saved ? "var(--primary)" : "var(--muted)",
          }}
          title={saved ? "Saved" : "Save trial"}
        >
          {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>

      {/* Plain-language expandable */}
      {trial.plain_language && (
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--primary)",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            }}
          >
            {expanded ? "Hide plain-language summary ▴" : "Show plain-language summary ▾"}
          </button>

          {expanded && (
            <div
              style={{
                marginTop: 10,
                backgroundColor: "var(--pale-sage)",
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              {trial.plain_language.five_things_to_know.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--primary)",
                      marginBottom: 4,
                      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    5 things to know
                  </p>
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {trial.plain_language.five_things_to_know.map((item, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: 13,
                          color: "var(--text)",
                          lineHeight: 1.5,
                          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                          marginBottom: 3,
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {trial.plain_language.possible_disqualifiers.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#dc2626",
                      marginBottom: 4,
                      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Possible disqualifiers
                  </p>
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {trial.plain_language.possible_disqualifiers.map((item, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: 13,
                          color: "var(--text)",
                          lineHeight: 1.5,
                          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                          marginBottom: 3,
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  lineHeight: 1.5,
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  margin: 0,
                }}
              >
                <strong style={{ color: "var(--text)" }}>Next step:</strong>{" "}
                {trial.plain_language.next_step}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Draft message CTA */}
      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={onMessage}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          }}
        >
          <Mail size={14} />
          Draft message to trial team
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TrialsPage() {
  const [keywords, setKeywords] = useState("");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Patient context loaded from server on mount.
  const [patientCtx, setPatientCtx] = useState<PatientContext>({
    patient_id: null,
    city: null,
    state: null,
    country: null,
    condition: null,
    oncologist_email: null,
  });
  // cityOverride is set when the user fills in the location prompt.
  const [cityOverride, setCityOverride] = useState<string | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Biomarker filter state.
  const [tumorLocation, setTumorLocation] = useState("");
  const [ca19_9, setCa19_9] = useState("");
  const [treatmentHistory, setTreatmentHistory] = useState("");
  const [fgfr2Status, setFgfr2Status] = useState("");
  const [idh1Status, setIdh1Status] = useState("");

  // Coordinator message modal.
  const [modalTrial, setModalTrial] = useState<Trial | null>(null);

  // Load patient context once on mount.
  useEffect(() => {
    async function loadContext() {
      try {
        const res = await fetch("/api/trials/context");
        if (!res.ok) return;
        const data: PatientContext = await res.json();
        setPatientCtx(data);
        if (data.patient_id && !data.city) {
          setShowLocationPrompt(true);
        }
      } catch {
        // context unavailable — search button stays disabled
      } finally {
        setContextLoading(false);
      }
    }
    loadContext();
  }, []);

  const effectiveCity = cityOverride ?? patientCtx.city;

  const runSearch = useCallback(
    async (cityArg?: string) => {
      const pid = patientCtx.patient_id;
      if (!pid) return;
      setLoading(true);
      setSearched(true);
      const city = cityArg ?? effectiveCity;
      try {
        const res = await fetch("/api/trials/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: pid,
            tumor_location: tumorLocation || null,
            ca19_9_level: ca19_9 || null,
            treatment_history: treatmentHistory || null,
            fgfr2_status: fgfr2Status || null,
            idh1_status: idh1Status || null,
            extra_keywords: keywords.trim() || null,
          }),
        });
        const data = await res.json();
        const raw: Trial[] = data.trials ?? [];

        // Sort: Recruiting first → has contact → near patient city.
        const sorted = [...raw].sort((a, b) => {
          const aRec = a.status.toUpperCase() === "RECRUITING" ? 0 : 1;
          const bRec = b.status.toUpperCase() === "RECRUITING" ? 0 : 1;
          if (aRec !== bRec) return aRec - bRec;

          const aContact = a.contact ? 0 : 1;
          const bContact = b.contact ? 0 : 1;
          if (aContact !== bContact) return aContact - bContact;

          if (city) {
            const aClose =
              a.city?.toLowerCase().includes(city.toLowerCase()) ? 0 : 1;
            const bClose =
              b.city?.toLowerCase().includes(city.toLowerCase()) ? 0 : 1;
            if (aClose !== bClose) return aClose - bClose;
          }
          return 0;
        });

        setTrials(sorted);

        // Sync saved state from search response.
        setSavedIds((prev) => {
          const next = new Set(prev);
          sorted.forEach((t) => { if (t.saved) next.add(t.nct_id); });
          return next;
        });
      } catch {
        setTrials([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patientCtx.patient_id, tumorLocation, ca19_9, treatmentHistory, fgfr2Status, idh1Status, keywords, effectiveCity]
  );

  // Auto-search as soon as patient context is available.
  useEffect(() => {
    if (!contextLoading && patientCtx.patient_id) {
      runSearch();
    }
    // Only fire once when context first loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading, patientCtx.patient_id]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!patientCtx.patient_id) return;
    runSearch();
  }

  function handleLocationSubmit(city: string) {
    setCityOverride(city);
    setShowLocationPrompt(false);
    runSearch(city);
  }

  async function handleSave(trial: Trial) {
    const pid = patientCtx.patient_id;
    if (!pid || savedIds.has(trial.nct_id)) return;
    const res = await fetch("/api/trial-saves/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: pid,
        trial_id: trial.nct_id,
        trial_name: trial.title,
        phase: trial.phase,
        status: trial.status,
        location: trial.location,
      }),
    });
    if (res.ok) {
      setSavedIds((prev) => new Set([...prev, trial.nct_id]));
    }
  }

  const filtered =
    activeFilter === "All"
      ? trials
      : activeFilter === "Recruiting"
      ? trials.filter((t) => t.status.toUpperCase() === "RECRUITING")
      : trials.filter((t) => {
          const target = PHASE_MAP[activeFilter];
          return target ? t.phase.toUpperCase().includes(target) : t.phase === activeFilter;
        });

  const isReady = !contextLoading && !!patientCtx.patient_id;

  // Shared style objects.
  const filterGroupStyle: React.CSSProperties = { marginBottom: 12 };
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
  const chipRowStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 6 };

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

        {showLocationPrompt && (
          <LocationPrompt onSubmit={handleLocationSubmit} />
        )}

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
            disabled={loading || !isReady}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 24,
              backgroundColor: "var(--primary)",
              color: "var(--card)",
              border: "none",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading || !isReady ? "not-allowed" : "pointer",
              opacity: loading || !isReady ? 0.5 : 1,
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

        {/* Phase/status filter chips */}
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
                  color: activeFilter === f ? "var(--card)" : "var(--text)",
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

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <div style={{ textAlign: "center" }}>
              <Loader2
                size={24}
                className="animate-spin"
                style={{ color: "var(--primary)", marginBottom: 8 }}
              />
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
              >
                Searching ClinicalTrials.gov…
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {!loading &&
            filtered.map((trial) => (
              <TrialCard
                key={trial.nct_id}
                trial={trial}
                saved={savedIds.has(trial.nct_id)}
                onSave={() => handleSave(trial)}
                onMessage={() => setModalTrial(trial)}
                patientCity={effectiveCity}
              />
            ))}
        </div>
      </div>

      {modalTrial && patientCtx.patient_id && (
        <CoordinatorModal
          trial={modalTrial}
          profile={{
            tumorLocation,
            ca19_9,
            treatmentHistory,
            fgfr2Status,
            idh1Status,
          }}
          patientId={patientCtx.patient_id}
          onClose={() => setModalTrial(null)}
        />
      )}
    </PageContainer>
  );
}
