/**
 * app/(app)/patients/[id]/trials/page.tsx
 * Web page that lists matched clinical trials for a patient and lets the caregiver save them.
 * Tables: reads from /api/trials/search and /api/trials/saved; no direct Supabase reads.
 * Auth: caregiver, patient, or provider role (server enforces); page assumes authenticated session.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: Displays patient diagnosis and trial matches. No PHI written to logs from this file.
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

type Source = "all" | "us" | "international";
type Phase = "1" | "2" | "3" | "4";

interface PlainLanguage {
  five_things_to_know: string[];
  possible_disqualifiers: string[];
  next_step: string;
}

interface Trial {
  source: "clinicaltrials.gov" | "who_ictrp";
  nct_id: string;
  title: string;
  phase: string;
  status: string;
  location: string;
  brief_summary: string;
  external_url: string;
  plain_language: PlainLanguage | null;
  saved: boolean;
}

interface SearchResponse {
  trials: Trial[];
  condition: string;
  country: string;
  source: Source;
}

export default function TrialsPage() {
  const params = useParams<{ id: string }>();
  const patientId = params?.id;
  const [tab, setTab] = useState<"all" | "saved">("all");
  const [phases, setPhases] = useState<Set<Phase>>(new Set());
  const [source, setSource] = useState<Source>("all");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [savedTrials, setSavedTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const search = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trials/search", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          filters: { phases: Array.from(phases), source },
        }),
      });
      if (!res.ok) {
        setError(
          "We couldn't reach the trials database. Try again in a moment, or save these settings and we'll alert you when it's back."
        );
        setData(null);
      } else {
        const json = (await res.json()) as SearchResponse;
        setData(json);
        setUpdatedAt(new Date());
      }
    } catch {
      setError(
        "We couldn't reach the trials database. Try again in a moment, or save these settings and we'll alert you when it's back."
      );
    } finally {
      setLoading(false);
    }
  }, [patientId, phases, source]);

  const loadSaved = useCallback(async () => {
    if (!patientId) return;
    const res = await fetch(`/api/trials/saved?patient_id=${patientId}`, { credentials: "include" });
    if (res.ok) {
      const json = (await res.json()) as { saves: Array<{ trial_id: string; trial_name: string; phase: string; location: string }> };
      setSavedTrials(
        json.saves.map((s) => ({
          source: "clinicaltrials.gov",
          nct_id: s.trial_id,
          title: s.trial_name ?? s.trial_id,
          phase: s.phase ?? "Not specified",
          status: "Saved",
          location: s.location ?? "",
          brief_summary: "",
          external_url: `https://clinicaltrials.gov/study/${s.trial_id}`,
          plain_language: null,
          saved: true,
        }))
      );
    }
  }, [patientId]);

  useEffect(() => {
    search();
    loadSaved();
  }, [search, loadSaved]);

  async function toggleSave(trial: Trial) {
    if (trial.saved) return; // Saved trials managed in saved tab
    await fetch("/api/trials/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: patientId,
        nct_id: trial.nct_id,
        trial_name: trial.title,
        phase: trial.phase,
        location: trial.location,
      }),
    });
    if (data) {
      setData({
        ...data,
        trials: data.trials.map((t) => (t.nct_id === trial.nct_id ? { ...t, saved: true } : t)),
      });
    }
    loadSaved();
  }

  function togglePhase(p: Phase) {
    const next = new Set(phases);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    setPhases(next);
  }

  const visibleTrials = tab === "saved" ? savedTrials : data?.trials ?? [];
  const subhead = useMemo(() => {
    if (loading) return "Loading...";
    if (!data) return "Pull together the trials matched to this diagnosis.";
    const ago = updatedAt
      ? Math.max(1, Math.round((Date.now() - updatedAt.getTime()) / 60000))
      : 0;
    return `${data.trials.length} trials found near ${data.country}. Updated ${ago} minute${ago === 1 ? "" : "s"} ago.`;
  }, [loading, data, updatedAt]);

  return (
    <main style={{ ...BODY, padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ ...HEADING, fontSize: 28, color: "var(--primary)", fontWeight: 700, marginBottom: 6 }}>
        Clinical trials
      </h1>
      <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", marginBottom: 20 }}>{subhead}</p>

      <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 12 }}>
        <Tabs value={tab} onChange={setTab} savedCount={savedTrials.length} />
      </div>

      {tab === "all" && (
        <>
          <div className="flex flex-wrap items-center" style={{ gap: 8, marginBottom: 12 }}>
            <span style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginRight: 4 }}>Phase:</span>
            {(["1", "2", "3", "4"] as const).map((p) => (
              <Pill key={p} active={phases.has(p)} onClick={() => togglePhase(p)}>
                Phase {p}
              </Pill>
            ))}
          </div>
          <div className="flex flex-wrap items-center" style={{ gap: 8, marginBottom: 24 }}>
            <span style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginRight: 4 }}>Source:</span>
            <Pill active={source === "all"} onClick={() => setSource("all")}>All</Pill>
            <Pill active={source === "us"} onClick={() => setSource("us")}>US (ClinicalTrials.gov)</Pill>
            <Pill active={source === "international"} onClick={() => setSource("international")}>International (WHO)</Pill>
          </div>
        </>
      )}

      {error && (
        <div
          style={{
            backgroundColor: "var(--pale-terra)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            color: "var(--accent)",
            fontSize: 14,
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
                borderRadius: 14,
                padding: 24,
                height: 160,
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      ) : visibleTrials.length === 0 ? (
        <div
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 32,
            color: "var(--muted)",
            fontSize: 14,
            textAlign: "center",
          }}
        >
          No trials match these filters yet. Try removing a filter, or check back next week. New trials are added daily.
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 16 }}>
          {visibleTrials.map((t) => (
            <TrialCard key={t.nct_id} trial={t} onSave={() => toggleSave(t)} />
          ))}
        </div>
      )}
    </main>
  );
}

function Tabs({
  value,
  onChange,
  savedCount,
}: {
  value: "all" | "saved";
  onChange: (v: "all" | "saved") => void;
  savedCount: number;
}) {
  return (
    <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
      {(
        [
          { key: "all" as const, label: "All trials" },
          { key: "saved" as const, label: `Saved (${savedCount})` },
        ]
      ).map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          style={{
            ...BODY,
            background: "transparent",
            border: "none",
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 600,
            color: value === t.key ? "var(--primary)" : "var(--muted)",
            borderBottom: value === t.key ? "2px solid var(--primary)" : "2px solid transparent",
            cursor: "pointer",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Pill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...BODY,
        padding: "6px 14px",
        height: 32,
        borderRadius: 16,
        border: "1px solid var(--border)",
        backgroundColor: active ? "var(--primary)" : "var(--card)",
        color: active ? "var(--white)" : "var(--text)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function TrialCard({ trial, onSave }: { trial: Trial; onSave: () => void }) {
  return (
    <article
      data-testid="trial-card"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 20,
      }}
    >
      <div style={{ ...HEADING, fontSize: 18, color: "var(--text)", fontWeight: 600 }}>
        {trial.title}
      </div>
      <div className="flex flex-wrap items-center" style={{ gap: 8, marginTop: 8, marginBottom: 12 }}>
        <Tag>{trial.phase}</Tag>
        <Tag>{trial.status}</Tag>
        {trial.location && <Tag muted>{trial.location}</Tag>}
        {trial.source === "who_ictrp" && <Tag muted>WHO</Tag>}
      </div>
      {trial.plain_language ? (
        <>
          <SectionHeading>5 things to know</SectionHeading>
          <ul style={{ ...BODY, fontSize: 14, lineHeight: 1.6, color: "var(--text)", paddingLeft: 18, margin: 0 }}>
            {trial.plain_language.five_things_to_know.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          {trial.plain_language.possible_disqualifiers.length > 0 && (
            <>
              <SectionHeading>Possible disqualifiers</SectionHeading>
              <ul style={{ ...BODY, fontSize: 14, lineHeight: 1.6, color: "var(--accent)", paddingLeft: 18, margin: 0 }}>
                {trial.plain_language.possible_disqualifiers.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
          <SectionHeading>Next step</SectionHeading>
          <p style={{ ...BODY, fontSize: 14, color: "var(--text)" }}>{trial.plain_language.next_step}</p>
        </>
      ) : trial.brief_summary ? (
        <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
          {trial.brief_summary}
        </p>
      ) : null}
      <div className="flex flex-wrap" style={{ gap: 8, marginTop: 16 }}>
        <button
          type="button"
          onClick={onSave}
          aria-label={trial.saved ? "Saved" : `Save ${trial.title}`}
          disabled={trial.saved}
          data-action="save"
          style={{
            ...BODY,
            height: 40,
            padding: "0 18px",
            borderRadius: 20,
            border: "1px solid var(--primary)",
            backgroundColor: trial.saved ? "var(--pale-sage)" : "var(--card)",
            color: "var(--primary)",
            fontSize: 13,
            fontWeight: 600,
            cursor: trial.saved ? "default" : "pointer",
          }}
        >
          {trial.saved ? "Saved" : "Save trial"}
        </button>
        <Link
          href={trial.external_url}
          target="_blank"
          rel="noopener noreferrer"
          data-action="external"
          style={{
            ...BODY,
            display: "inline-flex",
            alignItems: "center",
            height: 40,
            padding: "0 18px",
            borderRadius: 20,
            backgroundColor: "var(--primary)",
            color: "var(--white)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Open full record
        </Link>
      </div>
    </article>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        ...BODY,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--muted)",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginTop: 14,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function Tag({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      style={{
        ...BODY,
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 10px",
        borderRadius: 12,
        backgroundColor: muted ? "var(--pale-sage)" : "var(--pale-terra)",
        color: muted ? "var(--primary)" : "var(--accent)",
      }}
    >
      {children}
    </span>
  );
}
