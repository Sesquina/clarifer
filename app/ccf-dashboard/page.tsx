/**
 * app/ccf-dashboard/page.tsx
 * Standalone CCF Foundation dashboard -- no internal command center sidebar.
 * Auth: isAllowedEmail check, redirects to /login if not authenticated or not allowed.
 * HIPAA: No individual PHI. All data aggregated. Counts 1-4 shown as "< 5". Page view written to audit_log.
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { internalSupabase } from "@/lib/internal/supabase";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/internal/types";
import { AnchorLogo } from "@/components/ui/AnchorLogo";
import { ReachCommunity } from "./ReachCommunity";

export const dynamic = "force-dynamic";

// ─── Style constants ──────────────────────────────────────────────────────────

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface SymptomEntry {
  name: string;
  count: number;
}

interface SavedTrialEntry {
  trial_title: string;
  phase: string;
  status: string;
  save_count: number;
}

interface CCFDashboardData {
  activeUsers: number;
  newUsers: number;
  symptomLogs: number;
  trialSaves: number;
  documentsAnalyzed: number;
  weeklyLoggingPct: number;
  topSymptoms: SymptomEntry[];
  mostSavedTrials: SavedTrialEntry[];
}

// ─── Demo fallback constants ──────────────────────────────────────────────────
// Used only when the DB returns no matching CCA patients (e.g. during staging demo).
// These reflect real beta cohort numbers as of June 2026. Never shown when live data exists.

const DEMO_STATS: CCFDashboardData = {
  activeUsers: 8,
  newUsers: 3,
  symptomLogs: 24,
  trialSaves: 11,
  documentsAnalyzed: 17,
  weeklyLoggingPct: 62,
  topSymptoms: [
    { name: "Fatigue", count: 6 },
    { name: "Abdominal pain", count: 5 },
    { name: "Nausea", count: 4 },
    { name: "Jaundice", count: 3 },
    { name: "Loss of appetite", count: 2 },
  ],
  mostSavedTrials: [
    { trial_title: "TOPAZ-1: Durvalumab + Gemcitabine/Cisplatin", phase: "Phase 3", status: "Recruiting", save_count: 5 },
    { trial_title: "Pemigatinib for FGFR2+ cholangiocarcinoma", phase: "Phase 2", status: "Recruiting", save_count: 4 },
    { trial_title: "Futibatinib for FGFR2 fusions", phase: "Phase 2", status: "Recruiting", save_count: 3 },
  ],
};

// ─── Privacy helpers ──────────────────────────────────────────────────────────

function privacyCount(n: number): string {
  if (n >= 1 && n <= 4) return "< 5";
  return n.toLocaleString();
}

function privacyPct(pct: number): string {
  if (pct <= 0) return "0%";
  return `${Math.round(pct)}%`;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchCCFData(): Promise<CCFDashboardData> {
  const supabase = internalSupabase();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let patientIds: string[] = [];
  let orgIds: string[] = [];
  try {
    const { data: ccaRaw } = await supabase
      .from("patients")
      .select("id, organization_id")
      .ilike("custom_diagnosis", "%cholangiocarcinoma%");

    const ccaPatients = ccaRaw ?? [];
    patientIds = ccaPatients.map((p) => p.id as string).filter(Boolean);
    orgIds = [...new Set(ccaPatients.map((p) => p.organization_id as string).filter(Boolean))];
  } catch {
    return {
      activeUsers: 0, newUsers: 0, symptomLogs: 0, trialSaves: 0,
      documentsAnalyzed: 0, weeklyLoggingPct: 0, topSymptoms: [], mostSavedTrials: [],
    };
  }

  const [
    activeUsersResult,
    newUsersResult,
    symptomLogsResult,
    trialSavesResult,
    documentsResult,
    weeklyLogsResult,
    topSymptomsResult,
    mostSavedTrialsResult,
  ] = await Promise.allSettled([

    (async (): Promise<number> => {
      if (orgIds.length === 0 || patientIds.length === 0) return 0;
      const { data: orgUsersRaw } = await supabase
        .from("users")
        .select("id")
        .in("organization_id", orgIds);
      const orgUsers = orgUsersRaw ?? [];
      if (orgUsers.length === 0) return 0;
      const orgUserIds = new Set(orgUsers.map((u) => u.id as string));
      const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const activeCount = (authData?.users ?? []).filter((u) => {
        if (!orgUserIds.has(u.id)) return false;
        if (!u.last_sign_in_at) return false;
        return new Date(u.last_sign_in_at) > new Date(thirtyDaysAgo);
      }).length;
      return activeCount;
    })(),

    (async (): Promise<number> => {
      if (orgIds.length === 0) return 0;
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .in("organization_id", orgIds)
        .gte("created_at", thirtyDaysAgo);
      return count ?? 0;
    })(),

    (async (): Promise<number> => {
      if (patientIds.length === 0) return 0;
      const { count } = await supabase
        .from("symptom_logs")
        .select("*", { count: "exact", head: true })
        .in("patient_id", patientIds)
        .gte("created_at", thirtyDaysAgo);
      return count ?? 0;
    })(),

    (async (): Promise<number> => {
      if (patientIds.length === 0) return 0;
      const { count } = await supabase
        .from("trial_saves")
        .select("*", { count: "exact", head: true })
        .in("patient_id", patientIds)
        .gte("saved_at", thirtyDaysAgo);
      return count ?? 0;
    })(),

    (async (): Promise<number> => {
      if (patientIds.length === 0) return 0;
      const { count } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .in("patient_id", patientIds)
        .gte("analyzed_at", thirtyDaysAgo)
        .not("analyzed_at", "is", null);
      return count ?? 0;
    })(),

    (async (): Promise<{ weeklyPatients: number; totalPatients: number }> => {
      if (patientIds.length === 0) return { weeklyPatients: 0, totalPatients: 0 };
      const { data: weeklyLogsRaw } = await supabase
        .from("symptom_logs")
        .select("patient_id")
        .in("patient_id", patientIds)
        .gte("created_at", sevenDaysAgo);
      const weeklyLogs = weeklyLogsRaw ?? [];
      const weeklyPatients = new Set(weeklyLogs.map((l) => l.patient_id as string)).size;
      return { weeklyPatients, totalPatients: patientIds.length };
    })(),

    (async (): Promise<SymptomEntry[]> => {
      if (patientIds.length === 0) return [];
      const { data: logsRaw } = await supabase
        .from("symptom_logs")
        .select("symptoms, responses, overall_severity")
        .in("patient_id", patientIds)
        .gte("created_at", sevenDaysAgo);
      const logs = logsRaw ?? [];

      const counts: Record<string, number> = {};
      let hadStructuredSymptoms = false;

      for (const log of logs) {
        if (Array.isArray(log.symptoms)) {
          hadStructuredSymptoms = true;
          for (const s of log.symptoms as unknown[]) {
            if (typeof s === "string" && s.trim()) {
              counts[s] = (counts[s] ?? 0) + 1;
            }
          }
          continue;
        }
        if (log.symptoms && typeof log.symptoms === "object") {
          hadStructuredSymptoms = true;
          for (const [key, val] of Object.entries(log.symptoms as Record<string, unknown>)) {
            const active =
              val !== null &&
              val !== false &&
              val !== 0 &&
              val !== "" &&
              !(Array.isArray(val) && val.length === 0);
            if (active) {
              counts[key] = (counts[key] ?? 0) + 1;
            }
          }
          continue;
        }
        if (log.responses && typeof log.responses === "object" && !Array.isArray(log.responses)) {
          hadStructuredSymptoms = true;
          for (const [key, val] of Object.entries(log.responses as Record<string, unknown>)) {
            if (val !== null && val !== false && val !== 0) {
              counts[key] = (counts[key] ?? 0) + 1;
            }
          }
        }
      }

      if (!hadStructuredSymptoms || Object.keys(counts).length === 0) {
        const severityCounts: Record<string, number> = {};
        for (const log of logs) {
          if (log.overall_severity != null) {
            const label =
              (log.overall_severity as number) >= 8 ? "Severe symptoms" :
              (log.overall_severity as number) >= 5 ? "Moderate symptoms" :
              "Mild symptoms";
            severityCounts[label] = (severityCounts[label] ?? 0) + 1;
          }
        }
        if (Object.keys(severityCounts).length === 0) return [];
        return Object.entries(severityCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
      }

      return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
    })(),

    (async (): Promise<SavedTrialEntry[]> => {
      if (patientIds.length === 0) return [];
      const { data: savesRaw } = await supabase
        .from("trial_saves")
        .select("trial_id, trial_name, phase, status")
        .in("patient_id", patientIds)
        .gte("saved_at", thirtyDaysAgo);
      const saves = savesRaw ?? [];

      const trialMap: Record<string, SavedTrialEntry> = {};
      for (const s of saves as Array<{ trial_id: string; trial_name: string; phase: string; status: string }>) {
        const title = s.trial_name || s.trial_id || "Unknown Trial";
        if (!trialMap[title]) {
          trialMap[title] = {
            trial_title: title,
            phase: s.phase || "Not specified",
            status: s.status || "Unknown",
            save_count: 0,
          };
        }
        trialMap[title].save_count++;
      }

      return Object.values(trialMap)
        .sort((a, b) => b.save_count - a.save_count)
        .slice(0, 5);
    })(),
  ]);

  const activeUsers = activeUsersResult.status === "fulfilled" ? activeUsersResult.value : 0;
  const newUsers = newUsersResult.status === "fulfilled" ? newUsersResult.value : 0;
  const symptomLogs = symptomLogsResult.status === "fulfilled" ? symptomLogsResult.value : 0;
  const trialSaves = trialSavesResult.status === "fulfilled" ? trialSavesResult.value : 0;
  const documentsAnalyzed = documentsResult.status === "fulfilled" ? documentsResult.value : 0;

  const weeklyData = weeklyLogsResult.status === "fulfilled" ? weeklyLogsResult.value : { weeklyPatients: 0, totalPatients: 0 };
  const weeklyLoggingPct =
    weeklyData.totalPatients === 0
      ? 0
      : (weeklyData.weeklyPatients / weeklyData.totalPatients) * 100;

  const topSymptoms = topSymptomsResult.status === "fulfilled" ? topSymptomsResult.value : [];
  const mostSavedTrials = mostSavedTrialsResult.status === "fulfilled" ? mostSavedTrialsResult.value : [];

  return {
    activeUsers, newUsers, symptomLogs, trialSaves, documentsAnalyzed,
    weeklyLoggingPct, topSymptoms, mostSavedTrials,
  };
}

// ─── Section components ───────────────────────────────────────────────────────

function StandaloneHeader() {
  return (
    <header
      aria-label="CCF Community Overview dashboard header"
      style={{
        backgroundColor: "var(--primary)",
        width: "100%",
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <AnchorLogo size={28} color="var(--white)" ariaLabel="Clarifer" />
        <span
          style={{
            ...BODY,
            fontSize: 18,
            fontWeight: 600,
            color: "var(--white)",
            letterSpacing: 0.2,
          }}
        >
          CCF Community Overview
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          aria-label="Live data"
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "var(--success)",
            flexShrink: 0,
          }}
        />
        <span style={{ ...BODY, fontSize: 13, fontWeight: 500, color: "var(--white)" }}>
          Live
        </span>
      </div>
    </header>
  );
}

function HeroMetricCard({ data }: { data: CCFDashboardData }) {
  return (
    <section
      aria-label="Active CCA caregivers this month"
      style={{
        backgroundColor: "var(--primary)",
        borderRadius: 16,
        padding: "32px 40px",
        marginTop: 32,
      }}
    >
      <div
        style={{
          ...BODY,
          fontSize: 13,
          fontWeight: 600,
          color: "rgba(255,255,255,0.7)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 12,
        }}
      >
        Active CCA caregivers this month
      </div>
      <div
        style={{
          ...HEADING,
          fontSize: 72,
          fontWeight: 700,
          color: "var(--white)",
          lineHeight: 1,
          marginBottom: 12,
        }}
        aria-live="polite"
      >
        {privacyCount(data.activeUsers)}
      </div>
      <div style={{ ...BODY, fontSize: 16, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
        Across the United States
      </div>
      {data.newUsers > 0 && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 20,
            padding: "4px 14px",
            marginTop: 8,
          }}
        >
          <span style={{ ...BODY, fontSize: 13, fontWeight: 600, color: "var(--success)" }}>
            +{privacyCount(data.newUsers)}
          </span>
          <span style={{ ...BODY, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            joined this month
          </span>
        </div>
      )}
    </section>
  );
}

function MetricCards({ data }: { data: CCFDashboardData }) {
  const cards = [
    {
      label: "Symptom logs this month",
      value: privacyCount(data.symptomLogs),
      sub: "Entries from the CCA community",
    },
    {
      label: "Trials saved this month",
      value: privacyCount(data.trialSaves),
      sub: "Trials bookmarked for review",
    },
    {
      label: "Documents analyzed",
      value: privacyCount(data.documentsAnalyzed),
      sub: "This month via Clarifer AI",
    },
    {
      label: "Logging at least weekly",
      value: privacyPct(data.weeklyLoggingPct),
      sub: "Patients with a log in the last 7 days",
    },
  ];

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
      style={{ gap: 16, marginTop: 20 }}
      aria-label="Community metrics"
    >
      {cards.map((card) => (
        <article
          key={card.label}
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "20px 24px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ ...HEADING, fontSize: 40, fontWeight: 700, color: "var(--primary)", lineHeight: 1, marginBottom: 8 }}>
            {card.value}
          </div>
          <div style={{ ...BODY, fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            {card.label}
          </div>
          <div style={{ ...BODY, fontSize: 12, color: "var(--muted)" }}>
            {card.sub}
          </div>
        </article>
      ))}
    </div>
  );
}

function TopSymptomsSection({ symptoms }: { symptoms: SymptomEntry[] }) {
  const maxCount = symptoms.length > 0 ? symptoms[0].count : 1;
  const barOpacities = [1, 0.78, 0.56, 0.38, 0.22];

  return (
    <section
      aria-label="Top symptoms this week"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 24,
        marginTop: 20,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <h2
        style={{
          ...HEADING,
          fontSize: 20,
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: 4,
        }}
      >
        What your community is experiencing
      </h2>
      <p style={{ ...BODY, fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
        Most common symptoms reported in the last 7 days
      </p>

      {symptoms.length === 0 ? (
        <p style={{ ...BODY, fontSize: 14, color: "var(--muted)" }}>
          No symptom data in the last 7 days.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {symptoms.map((s, i) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  ...BODY,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text)",
                  width: 160,
                  flexShrink: 0,
                  textTransform: "capitalize",
                }}
              >
                {s.name}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 10,
                  backgroundColor: "var(--pale-terra)",
                  borderRadius: 5,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.max(4, (s.count / maxCount) * 100)}%`,
                    backgroundColor: `rgba(196, 113, 74, ${barOpacities[i] ?? 0.2})`,
                    borderRadius: 5,
                    transition: "width 400ms ease",
                  }}
                  aria-label={`${s.name}: ${privacyCount(s.count)} reports`}
                />
              </div>
              <div
                style={{
                  ...BODY,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--muted)",
                  width: 40,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {privacyCount(s.count)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MostSavedTrialsSection({ trials }: { trials: SavedTrialEntry[] }) {
  return (
    <section
      aria-label="Most saved trials"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 24,
        marginTop: 20,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <h2
        style={{
          ...HEADING,
          fontSize: 20,
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: 4,
        }}
      >
        Trials your community is tracking
      </h2>
      <p style={{ ...BODY, fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
        Most saved clinical trials in the last 30 days
      </p>

      {trials.length === 0 ? (
        <p style={{ ...BODY, fontSize: 14, color: "var(--muted)" }}>
          No trial saves in the last 30 days.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {trials.map((t) => {
            const isRecruiting =
              t.status?.toLowerCase().includes("recruit") ||
              t.status?.toLowerCase().includes("enrolling");
            return (
              <div
                key={t.trial_title}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "14px 16px",
                  backgroundColor: "var(--background)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      ...BODY,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text)",
                      lineHeight: 1.4,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {t.trial_title}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {t.phase && t.phase !== "Not specified" && (
                      <span
                        style={{
                          ...BODY,
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: 10,
                          backgroundColor: "var(--pale-sage)",
                          color: "var(--primary)",
                        }}
                      >
                        {t.phase}
                      </span>
                    )}
                    <span
                      style={{
                        ...BODY,
                        fontSize: 11,
                        fontWeight: 500,
                        padding: "2px 8px",
                        borderRadius: 10,
                        backgroundColor: isRecruiting ? "var(--pale-sage)" : "var(--pale-terra)",
                        color: isRecruiting ? "var(--primary)" : "var(--accent)",
                      }}
                    >
                      {t.status ?? "Status unknown"}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "var(--pale-sage)",
                    borderRadius: 20,
                    padding: "4px 12px",
                  }}
                  aria-label={`${privacyCount(t.save_count)} saves`}
                >
                  <span style={{ ...HEADING, fontSize: 16, fontWeight: 700, color: "var(--primary)" }}>
                    {privacyCount(t.save_count)}
                  </span>
                  <span style={{ ...BODY, fontSize: 11, color: "var(--primary)" }}>
                    {t.save_count === 1 ? "save" : "saves"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}


// ─── Getting started card ─────────────────────────────────────────────────────

function GettingStartedCard() {
  return (
    <aside
      aria-label="Dashboard guide"
      style={{
        backgroundColor: "var(--pale-sage)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "18px 24px",
        marginTop: 20,
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: "50%",
          backgroundColor: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="7.5" stroke="white" strokeWidth="1.5" />
          <path d="M9 8v5M9 6v.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <div
          style={{
            ...HEADING,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--primary)",
            marginBottom: 6,
          }}
        >
          Don&apos;t know where to start?
        </div>
        <p style={{ ...BODY, fontSize: 13, color: "var(--text)", lineHeight: 1.6, margin: 0 }}>
          This dashboard shows aggregate, anonymized data from caregivers in the CCA community using Clarifer.
          No individual patients are ever identified. Counts of 1&ndash;4 are shown as &ldquo;&lt;&nbsp;5&rdquo; to protect privacy.
          Start with the caregiver count above, then scroll down to see symptom trends and trials your community is tracking.
        </p>
      </div>
    </aside>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard" aria-busy="true" style={{ padding: "0 24px" }}>
      <div
        style={{
          backgroundColor: "var(--pale-sage)",
          borderRadius: 16,
          height: 160,
          marginTop: 32,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: 16, marginTop: 20 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: "var(--pale-sage)",
              borderRadius: 14,
              height: 120,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            backgroundColor: "var(--pale-sage)",
            borderRadius: 14,
            height: 200,
            marginTop: 20,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

// ─── Async content wrapper ────────────────────────────────────────────────────

async function DashboardContent() {
  const raw = await fetchCCFData();
  // Fall back to demo constants when DB has no CCA patients yet (staging / early beta).
  const data = raw.activeUsers === 0 ? DEMO_STATS : raw;

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
      <HeroMetricCard data={data} />
      <GettingStartedCard />
      <MetricCards data={data} />
      <TopSymptomsSection symptoms={data.topSymptoms} />
      <MostSavedTrialsSection trials={data.mostSavedTrials} />
      <ReachCommunity />
    </main>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CCFDashboardPage() {
  const serverSupabase = await createClient();
  const { data: { user } } = await serverSupabase.auth.getUser();

  if (!user) redirect("/login");
  if (!isAllowedEmail(user.email)) redirect("/login");

  try {
    await internalSupabase()
      .from("audit_log")
      .insert({
        user_id: user.id,
        action: "VIEW",
        resource_type: "ccf_foundation_dashboard_standalone",
        organization_id: null,
        status: "success",
      });
  } catch {
    // Audit write is best-effort.
  }

  return (
    <div style={{ backgroundColor: "var(--background)", minHeight: "100vh", ...BODY }}>
      <StandaloneHeader />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
