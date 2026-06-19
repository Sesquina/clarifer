/**
 * app/log/page.tsx
 * Two-mode symptom log: Quick Capture (Mode 1) and Add More Detail (Mode 2).
 * Tables: symptom_logs (via API), patients (read via Supabase client)
 * Auth: caregiver (Supabase session)
 * HIPAA: PHI writes routed through /api/log/create (POST) and /api/log/[id] (PATCH).
 *        Reads use Supabase RLS. No PHI in console logs.
 *
 * DISCOVERED ISSUE: Scale colors (#E1F5EE, #0F6E56, #085041, #FAEEDA, etc.) are not
 * in the CSS variable system. These should become design tokens in a future sprint.
 * See SPRINT_LOG.md. Pre-existing hex usage in COLOR_CHIPS also noted there.
 *
 * DISCOVERED ISSUE: Recent log rows are non-tappable because /log/[id] detail page
 * does not exist. RULE 2 forbids redirect to non-existent page.
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/layout/page-container";

// ─── Five-level severity scale ────────────────────────────────────────────────
// Hex values per Figma node symptom-log/quick-capture. No CSS vars exist for
// the green/amber ends of this palette yet -- tracked as DISCOVERED ISSUE above.
const SCALE = [
  { value: 1, word: "Great", bg: "#E1F5EE", border: "#0F6E56", color: "#085041" },
  { value: 2, word: "Good",  bg: "#F0F5F2", border: "#2C5F4A", color: "#2C5F4A" },
  { value: 3, word: "OK",    bg: "#FAEEDA", border: "#BA7517", color: "#633806" },
  { value: 4, word: "Hard",  bg: "#FDF3EE", border: "#C4714A", color: "#7A3B00" },
  { value: 5, word: "Rough", bg: "#FCEBEB", border: "#E24B4A", color: "#791F1F" },
] as const;

// ─── Detail-mode option lists ─────────────────────────────────────────────────
const FUNCTIONAL_OPTIONS = [
  "Active as usual",
  "Slowing down a bit",
  "Limited but managing",
  "Needs help to stand or walk",
  "Spent most of the day in bed",
];

const APPETITE_OPTIONS = [
  "Eating normally",
  "Eating less than usual",
  "Small bites only",
  "Very little",
  "Couldn't eat",
];

const SENSATION_CHIPS = [
  "Pressure", "Burning", "Sharp", "Throbbing",
  "Deep inside", "Achy", "Tingling", "Cramping",
];

const TIMING_CHIPS = ["All day", "Morning", "After eating", "At night", "Comes and goes"];

const INFECTION_CHIPS = [
  "Fever or chills", "Swelling", "New cough", "Discharge", "Painful urination",
];

const LOW_APPETITE = new Set(["Very little", "Couldn't eat"]);

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = "quick" | "detail";

interface RecentLog {
  id: string;
  overall_severity: number;
  created_at: string;
  responses?: Record<string, unknown> | null;
}

// ─── Utility functions (exported for tests) ───────────────────────────────────
export function formatLogDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / 86400000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function computeInsight(logs: RecentLog[]): string | null {
  if (logs.length < 3) {
    return "Keep going -- patterns show up after a few entries.";
  }
  const elevated = logs.filter((l) => l.overall_severity >= 3);
  if (elevated.length >= 2) {
    const minLevel = Math.min(...elevated.map((l) => l.overall_severity));
    return `${elevated.length} days at level ${minLevel} or above. Worth flagging at the next visit.`;
  }
  return null;
}

function scaleEntry(sev: number) {
  return SCALE.find((s) => s.value === sev) ?? SCALE[2];
}

function firstName(fullName: string | null): string {
  if (!fullName) return "";
  return fullName.split(" ")[0];
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function QLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 8 }}>
      <span
        style={{
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          fontSize: 12,
          fontWeight: 500,
          color: "var(--text)",
        }}
      >
        {label}
      </span>
      {optional && (
        <span
          style={{
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: 11,
            color: "var(--muted)",
          }}
        >
          optional
        </span>
      )}
    </div>
  );
}

function RadioRow({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "9px 11px",
        border: `0.5px solid ${selected ? "#2C5F4A" : "var(--border)"}`,
        borderRadius: 10,
        backgroundColor: selected ? "var(--pale-sage)" : "#FDFCFA",
        cursor: "pointer",
        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        fontSize: 11,
        fontWeight: selected ? 500 : 400,
        color: selected ? "#2C5F4A" : "var(--text)",
        textAlign: "left",
        minHeight: 48,
      }}
    >
      {label}
      <span
        style={{
          width: 15,
          height: 15,
          borderRadius: "50%",
          border: `1.5px solid ${selected ? "#2C5F4A" : "var(--border)"}`,
          backgroundColor: selected ? "#2C5F4A" : "transparent",
          flexShrink: 0,
        }}
      />
    </button>
  );
}

function SelectionChip({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        padding: "4px 10px",
        borderRadius: 20,
        border: `0.5px solid ${active ? "#2C5F4A" : "var(--border)"}`,
        backgroundColor: active ? "#2C5F4A" : "#FDFCFA",
        color: active ? "var(--card)" : "var(--muted)",
        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        fontSize: 10,
        cursor: "pointer",
        minHeight: 28,
      }}
    >
      {label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LogPage() {
  const [mode, setMode] = useState<Mode>("quick");

  // Quick capture state
  const [scale, setScale] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveConfirmed, setSaveConfirmed] = useState(false);
  const [savedLogId, setSavedLogId] = useState<string | null>(null);

  // Detail mode state
  const [functionalStatus, setFunctionalStatus] = useState<string | null>(null);
  const [appetite, setAppetite] = useState<string | null>(null);
  const [sensationTypes, setSensationTypes] = useState<string[]>([]);
  const [timingTags, setTimingTags] = useState<string[]>([]);
  const [infectionSigns, setInfectionSigns] = useState<string[]>([]);
  const [detailNotes, setDetailNotes] = useState("");
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailSaveConfirmed, setDetailSaveConfirmed] = useState(false);

  // Patient + history data
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientFullName, setPatientFullName] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [lastAppetite, setLastAppetite] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: patient } = await supabase
        .from("patients")
        .select("id, name")
        .eq("created_by", user.id)
        .limit(1)
        .single();

      if (!patient) return;
      setPatientId(patient.id);
      setPatientFullName(patient.name ?? null);

      const { data: logs } = await supabase
        .from("symptom_logs")
        .select("id, overall_severity, created_at, responses")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (logs) {
        setRecentLogs(logs as RecentLog[]);
        const lastR = logs[0]?.responses as Record<string, unknown> | null | undefined;
        if (lastR && typeof lastR.appetite === "string") {
          setLastAppetite(lastR.appetite);
        }
      }
    }
    init();
  }, []);

  function refreshLogs() {
    if (!patientId) return;
    const supabase = createClient();
    supabase
      .from("symptom_logs")
      .select("id, overall_severity, created_at, responses")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setRecentLogs(data as RecentLog[]);
      });
  }

  function toggleMulti(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  async function postQuickLog(): Promise<string | null> {
    if (!scale || !patientId) return null;
    setSaving(true);
    try {
      const res = await fetch("/api/log/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          patient_id: patientId,
          overall_severity: scale,
          symptoms: [],
          responses: { notes: note.trim() || null },
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { id: string };
      setSavedLogId(data.id);
      return data.id;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const logId = await postQuickLog();
    if (!logId) return;
    setSaveConfirmed(true);
    setTimeout(() => {
      setSaveConfirmed(false);
      setScale(null);
      setNote("");
      setSavedLogId(null);
      refreshLogs();
    }, 1500);
  }

  async function handleAddDetail() {
    if (!scale) return;
    let logId = savedLogId;
    if (!logId) {
      logId = await postQuickLog();
    }
    if (!logId) return;
    setMode("detail");
  }

  async function handleDetailSave() {
    if (!savedLogId) return;
    setDetailSaving(true);
    try {
      await fetch(`/api/log/${savedLogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          functional_status: functionalStatus,
          appetite,
          sensation_types: sensationTypes,
          timing: timingTags,
          infection_signs: infectionSigns,
          detail_notes: detailNotes.trim() || null,
        }),
      });
      setDetailSaveConfirmed(true);
      setTimeout(() => {
        setDetailSaveConfirmed(false);
        setMode("quick");
        setScale(null);
        setNote("");
        setSavedLogId(null);
        setFunctionalStatus(null);
        setAppetite(null);
        setSensationTypes([]);
        setTimingTags([]);
        setInfectionSigns([]);
        setDetailNotes("");
        refreshLogs();
      }, 1500);
    } finally {
      setDetailSaving(false);
    }
  }

  const canQuickSave = scale !== null && !saving;
  const fname = firstName(patientFullName);
  const insight = computeInsight(recentLogs);

  const showAppetiteNudge =
    appetite !== null &&
    LOW_APPETITE.has(appetite) &&
    lastAppetite !== null &&
    LOW_APPETITE.has(lastAppetite);

  // ── MODE 1: QUICK CAPTURE ──────────────────────────────────────────────────
  if (mode === "quick") {
    return (
      <PageContainer>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px 40px" }}>

          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <button
              type="button"
              onClick={() => router.push("/home")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--primary)",
                padding: 0,
                minHeight: 48,
                display: "flex",
                alignItems: "center",
              }}
            >
              ‹ Log
            </button>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 11,
                color: "var(--muted)",
              }}
            >
              Auto-saves
            </span>
          </div>

          {/* Hero question */}
          <h1
            style={{
              fontFamily: "var(--font-playfair), 'Playfair Display', serif",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: "115%",
              marginBottom: 4,
            }}
          >
            {fname
              ? `How is ${fname} doing today?`
              : "How are they doing today?"}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: 13,
              color: "var(--muted)",
              marginBottom: 24,
            }}
          >
            Tap a number. One tap saves.
          </p>

          {/* 1-5 scale */}
          <div style={{ display: "flex", gap: 6 }}>
            {SCALE.map((s) => {
              const selected = scale === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setScale(s.value)}
                  style={{
                    flex: 1,
                    height: 72,
                    borderRadius: 16,
                    border: selected
                      ? `2px solid ${s.border}`
                      : `0.5px solid ${s.border}`,
                    backgroundColor: s.bg,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: 0,
                    transition: "border-width 0.1s",
                  }}
                  aria-pressed={selected}
                  aria-label={`${s.value} - ${s.word}`}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                      fontSize: 22,
                      fontWeight: 600,
                      color: s.color,
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                      fontSize: 9,
                      fontWeight: 500,
                      color: s.color,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    {s.word}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Scale hint */}
          <p
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: 11,
              color: "var(--muted)",
              textAlign: "center",
              marginTop: 8,
              marginBottom: 24,
            }}
          >
            1 is a great day · 5 is a hard one
          </p>

          {/* Optional note */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 5,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text)",
                }}
              >
                Anything worth noting?
              </span>
              <span
                style={{
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  fontSize: 11,
                  color: "var(--muted)",
                }}
              >
                optional
              </span>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What they ate, how they slept, anything that stood out..."
              style={{
                width: "100%",
                height: 72,
                borderRadius: 12,
                border: "0.5px solid var(--border)",
                padding: "10px 12px",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 12,
                fontStyle: "italic",
                color: "var(--text)",
                backgroundColor: "#FDFCFA",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Button row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={handleSave}
              disabled={!canQuickSave}
              style={{
                width: 160,
                height: 44,
                borderRadius: 22,
                backgroundColor: "var(--primary)",
                color: "var(--card)",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: canQuickSave ? "pointer" : "not-allowed",
                opacity: canQuickSave ? 1 : 0.4,
                transition: "opacity 0.15s",
              }}
            >
              {saveConfirmed ? "Saved" : saving ? "Saving..." : "Save →"}
            </button>
            <button
              type="button"
              onClick={handleAddDetail}
              disabled={!canQuickSave}
              style={{
                width: 160,
                height: 44,
                borderRadius: 22,
                backgroundColor: "transparent",
                border: "1px solid var(--border)",
                color: "var(--muted)",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 13,
                cursor: canQuickSave ? "pointer" : "not-allowed",
                opacity: canQuickSave ? 1 : 0.4,
              }}
            >
              Add more detail
            </button>
          </div>

          {/* This week divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 20,
              marginBottom: 16,
            }}
          >
            <div
              style={{ flex: 1, height: "0.5px", backgroundColor: "var(--border)" }}
            />
            <span
              style={{
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 11,
                color: "var(--muted)",
              }}
            >
              This week
            </span>
            <div
              style={{ flex: 1, height: "0.5px", backgroundColor: "var(--border)" }}
            />
          </div>

          {/* AI insight card */}
          {insight && (
            <div
              style={{
                backgroundColor: "var(--pale-sage)",
                borderRadius: 12,
                padding: "10px 12px",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#0F6E56",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize: 8,
                    fontWeight: 600,
                    color: "#085041",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Clarifer noticed
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  fontSize: 11,
                  color: "var(--text)",
                  lineHeight: "150%",
                  margin: 0,
                }}
              >
                {insight}
              </p>
            </div>
          )}

          {/* Recent log rows */}
          <p
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: 9,
              fontWeight: 600,
              color: "var(--muted)",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            This week
          </p>

          {recentLogs.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 13,
                color: "var(--muted)",
                textAlign: "center",
                padding: 20,
                margin: 0,
              }}
            >
              {fname
                ? `${fname} is lucky to have someone paying this much attention.`
                : "You're building something valuable. Keep going."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentLogs.map((log) => {
                const sev = scaleEntry(log.overall_severity);
                const logResponses = log.responses as Record<string, unknown> | null;
                const logNote =
                  typeof logResponses?.notes === "string" ? logResponses.notes : null;
                return (
                  <div
                    key={log.id}
                    style={{
                      backgroundColor: "var(--card)",
                      borderRadius: 10,
                      border: "0.5px solid var(--border)",
                      borderLeft: `3px solid ${sev.border}`,
                      padding: "8px 10px 8px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                          fontSize: 11,
                          color: "var(--muted)",
                          margin: 0,
                        }}
                      >
                        {formatLogDate(log.created_at)}
                      </p>
                      {logNote && (
                        <p
                          style={{
                            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                            fontSize: 10,
                            fontStyle: "italic",
                            color: "var(--muted)",
                            margin: "2px 0 0",
                          }}
                        >
                          {logNote}
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        width: 28,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: sev.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                          fontSize: 13,
                          fontWeight: 600,
                          color: sev.color,
                        }}
                      >
                        {log.overall_severity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PageContainer>
    );
  }

  // ── MODE 2: ADD MORE DETAIL ────────────────────────────────────────────────
  const selectedScale = SCALE.find((s) => s.value === scale) ?? SCALE[0];

  return (
    <PageContainer>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px 40px" }}>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
          }}
        >
          <button
            type="button"
            onClick={() => setMode("quick")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--primary)",
              padding: 0,
              minHeight: 48,
              display: "flex",
              alignItems: "center",
            }}
          >
            ‹ Log
          </button>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 2,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 11,
                color: "var(--muted)",
              }}
            >
              Auto-saves
            </span>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 9,
                color: "var(--muted)",
              }}
            >
              Step 3 of 7
            </span>
          </div>
        </div>

        {/* Progress dots */}
        <div
          style={{ display: "flex", gap: 4, marginBottom: 20, alignItems: "center" }}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((i) => {
            const done = i <= 2;
            const active = i === 3;
            return (
              <div
                key={i}
                style={{
                  height: 3,
                  width: active ? 26 : 8,
                  borderRadius: 2,
                  backgroundColor: done || active ? "#2C5F4A" : "var(--border)",
                }}
              />
            );
          })}
        </div>

        {/* Hero */}
        <h1
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 4,
          }}
        >
          Add a bit more, if you have it.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: 12,
            color: "var(--muted)",
            marginBottom: 24,
          }}
        >
          Already saved. This helps Clarifer spot patterns.
        </p>

        <div style={{ display: "flex", flexDirection: "column" }}>

          {/* Q1 -- Overall level confirmation (non-editable) */}
          <div style={{ marginBottom: 16 }}>
            <QLabel label="Overall, how was today?" />
            <div
              style={{
                height: 44,
                borderRadius: 10,
                border: `2px solid ${selectedScale.border}`,
                backgroundColor: selectedScale.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 12px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: selectedScale.color,
                }}
              >
                {selectedScale.value} - {selectedScale.word}
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: selectedScale.color,
                }}
              >
                ✓
              </span>
            </div>
          </div>

          {/* Q2 -- Movement */}
          <div style={{ marginBottom: 16 }}>
            <QLabel label="How were they moving around?" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {FUNCTIONAL_OPTIONS.map((opt) => (
                <RadioRow
                  key={opt}
                  label={opt}
                  selected={functionalStatus === opt}
                  onSelect={() =>
                    setFunctionalStatus(functionalStatus === opt ? null : opt)
                  }
                />
              ))}
            </div>
          </div>

          {/* Q3 -- Appetite */}
          <div style={{ marginBottom: 16 }}>
            <QLabel label="How was eating today?" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {APPETITE_OPTIONS.map((opt) => (
                <RadioRow
                  key={opt}
                  label={opt}
                  selected={appetite === opt}
                  onSelect={() => setAppetite(appetite === opt ? null : opt)}
                />
              ))}
            </div>
            {showAppetiteNudge && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                  backgroundColor: "#E1F5EE",
                  borderRadius: 8,
                  padding: "6px 9px",
                  marginTop: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#0F6E56",
                    flexShrink: 0,
                    marginTop: 4,
                    display: "inline-block",
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize: 11,
                    color: "#085041",
                    margin: 0,
                  }}
                >
                  Second day in a row. Worth mentioning to the care team.
                </p>
              </div>
            )}
          </div>

          {/* Q4 -- Sensation (optional) */}
          <div style={{ marginBottom: 16 }}>
            <QLabel label="Anything specific you noticed?" optional />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SENSATION_CHIPS.map((s) => (
                <SelectionChip
                  key={s}
                  label={s}
                  active={sensationTypes.includes(s)}
                  onToggle={() => toggleMulti(sensationTypes, setSensationTypes, s)}
                />
              ))}
            </div>
          </div>

          {/* Q5 -- Timing (optional) */}
          <div style={{ marginBottom: 16 }}>
            <QLabel label="When did it tend to show up?" optional />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TIMING_CHIPS.map((t) => (
                <SelectionChip
                  key={t}
                  label={t}
                  active={timingTags.includes(t)}
                  onToggle={() => toggleMulti(timingTags, setTimingTags, t)}
                />
              ))}
            </div>
          </div>

          {/* Q6 -- Infection signs (optional) */}
          <div style={{ marginBottom: 16 }}>
            <QLabel label="Did you notice any of these?" optional />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {INFECTION_CHIPS.map((c) => (
                <SelectionChip
                  key={c}
                  label={c}
                  active={infectionSigns.includes(c)}
                  onToggle={() => toggleMulti(infectionSigns, setInfectionSigns, c)}
                />
              ))}
            </div>
            {infectionSigns.length > 0 && (
              <div
                style={{
                  borderLeft: "2px solid #E24B4A",
                  borderRadius: "0 7px 7px 0",
                  backgroundColor: "#FCEBEB",
                  padding: "6px 9px",
                  marginTop: 6,
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#791F1F",
                    margin: 0,
                  }}
                >
                  Call 911 or go to the emergency room immediately.
                </p>
              </div>
            )}
          </div>

          {/* Q7 -- Notes (optional) */}
          <div style={{ marginBottom: 24 }}>
            <QLabel label="Anything else worth sharing?" optional />
            <textarea
              value={detailNotes}
              onChange={(e) => setDetailNotes(e.target.value)}
              placeholder="What they ate, how they slept, anything that seemed connected..."
              style={{
                width: "100%",
                height: 52,
                borderRadius: 10,
                border: "0.5px solid var(--border)",
                padding: "10px 12px",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 11,
                fontStyle: "italic",
                color: "var(--text)",
                backgroundColor: "#FDFCFA",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Done button */}
          <button
            type="button"
            onClick={handleDetailSave}
            disabled={detailSaving}
            style={{
              width: 140,
              height: 44,
              borderRadius: 22,
              backgroundColor: "var(--primary)",
              color: "var(--card)",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              cursor: detailSaving ? "not-allowed" : "pointer",
              opacity: detailSaving ? 0.7 : 1,
            }}
          >
            {detailSaveConfirmed ? "Saved" : detailSaving ? "Saving..." : "Done"}
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
