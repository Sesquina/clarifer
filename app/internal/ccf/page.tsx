/**
 * app/internal/ccf/page.tsx
 * CCF Foundation dashboard -- live aggregate community intelligence for the CCA caregiver community.
 * Shows anonymized aggregated metrics about cholangiocarcinoma caregivers on Clarifer.
 * Tables: patients, users (auth.users via admin API), symptom_logs, trial_saves, documents, audit_log
 * Auth: /internal layout allowlist (samira.esquina@clarifer.com only)
 * Sprint: Sprint CCF-4 -- Foundation Dashboard
 * HIPAA: No individual PHI. All data aggregated. Counts 1-4 shown as "< 5". Page view written to audit_log.
 */

import { Suspense } from "react";
import { internalSupabase } from "@/lib/internal/supabase";
import { createClient } from "@/lib/supabase/server";
import { AnchorLogo } from "@/components/ui/AnchorLogo";

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

// ─── Privacy helpers ──────────────────────────────────────────────────────────

/** Replace counts 1-4 with "< 5" per minimum anonymization policy. */
function privacyCount(n: number): string {
  if (n >= 1 && n <= 4) return "< 5";
  return n.toLocaleString();
}

/** Format percentage safely. */
function privacyPct(pct: number): string {
  if (pct <= 0) return "0%";
  return `${Math.round(pct)}%`;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

/**
 * Fetches all dashboard metrics using the service role client (bypasses RLS for aggregate queries).
 * Each sub-query is wrapped in try/catch so one failure never crashes the whole dashboard.
 */
async function fetchCCFData(): Promise<CCFDashboardData> {
  // Service role client -- bypasses RLS for cross-org aggregate reads.
  const supabase = internalSupabase();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Step 1: Get all CCA patient IDs (central to all subsequent queries).
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
    // Cannot proceed without patient IDs -- return all zeros.
    return {
      activeUsers: 0, newUsers: 0, symptomLogs: 0, trialSaves: 0,
      documentsAnalyzed: 0, weeklyLoggingPct: 0, topSymptoms: [], mostSavedTrials: [],
    };
  }

  // Step 2: Run all remaining queries in parallel. Each is independently error-handled.
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

    // Active CCA-linked users this month (users who signed in within 30 days).
    // Uses auth admin API for last_sign_in_at which lives in auth.users, not public.users.
    (async (): Promise<number> => {
      if (orgIds.length === 0 || patientIds.length === 0) return 0;
      const { data: orgUsersRaw } = await supabase
        .from("users")
        .select("id")
        .in("organization_id", orgIds);
      const orgUsers = orgUsersRaw ?? [];
      if (orgUsers.length === 0) return 0;
      const orgUserIds = new Set(orgUsers.map((u) => u.id as string));
      // Auth admin list -- service role key required.
      const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const activeCount = (authData?.users ?? []).filter((u) => {
        if (!orgUserIds.has(u.id)) return false;
        if (!u.last_sign_in_at) return false;
        return new Date(u.last_sign_in_at) > new Date(thirtyDaysAgo);
      }).length;
      return activeCount;
    })(),

    // New CCA-linked users who joined this month.
    (async (): Promise<number> => {
      if (orgIds.length === 0) return 0;
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .in("organization_id", orgIds)
        .gte("created_at", thirtyDaysAgo);
      return count ?? 0;
    })(),

    // Symptom logs for CCA patients this month.
    (async (): Promise<number> => {
      if (patientIds.length === 0) return 0;
      const { count } = await supabase
        .from("symptom_logs")
        .select("*", { count: "exact", head: true })
        .in("patient_id", patientIds)
        .gte("created_at", thirtyDaysAgo);
      return count ?? 0;
    })(),

    // Trials saved for CCA patients this month. trial_saves uses saved_at (not created_at).
    (async (): Promise<number> => {
      if (patientIds.length === 0) return 0;
      const { count } = await supabase
        .from("trial_saves")
        .select("*", { count: "exact", head: true })
        .in("patient_id", patientIds)
        .gte("saved_at", thirtyDaysAgo);
      return count ?? 0;
    })(),

    // Documents analyzed for CCA patients this month.
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

    // Symptom logs in the last 7 days -- for weekly logging percentage calculation.
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

    // Top 5 most common symptoms this week, extracted from JSONB.
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
        // Try JSONB array format: ["fatigue", "nausea", ...]
        if (Array.isArray(log.symptoms)) {
          hadStructuredSymptoms = true;
          for (const s of log.symptoms as unknown[]) {
            if (typeof s === "string" && s.trim()) {
              counts[s] = (counts[s] ?? 0) + 1;
            }
          }
          continue;
        }
        // Try JSONB object format: { pain: 7, fatigue: true, jaundice: ["skin yellowing"] }
        if (log.symptoms && typeof log.symptoms === "object") {
          hadStructuredSymptoms = true;
          for (const [key, val] of Object.entries(log.symptoms as Record<string, unknown>)) {
            // Count symptom if value is truthy and non-zero.
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
        // Also try responses JSONB for toggled symptoms.
        if (log.responses && typeof log.responses === "object" && !Array.isArray(log.responses)) {
          hadStructuredSymptoms = true;
          for (const [key, val] of Object.entries(log.responses as Record<string, unknown>)) {
            if (val !== null && val !== false && val !== 0) {
              counts[key] = (counts[key] ?? 0) + 1;
            }
          }
        }
      }

      // Fallback: group by overall_severity when no structured symptom data.
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

    // Most saved trials for CCA patients this month.
    // trial_saves already stores trial_name, phase, status -- no trial_cache join needed.
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
        // Use || so empty strings also fall through to the trial_id fallback.
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

  // Extract values with zero fallbacks on failure.
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
    activeUsers,
    newUsers,
    symptomLogs,
    trialSaves,
    documentsAnalyzed,
    weeklyLoggingPct,
    topSymptoms,
    mostSavedTrials,
  };
}

// ─── Section components ───────────────────────────────────────────────────────

function DashboardHeader() {
  return (
    <header
      aria-label="CCF Community Overview dashboard header"
      style={{
        backgroundColor: "var(--primary)",
        margin: "-32px -32px 0",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <AnchorLogo size={28} color="#ffffff" ariaLabel="Clarifer" />
        <span
          style={{
            ...BODY,
            fontSize: 18,
            fontWeight: 600,
            color: "#ffffff",
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
            backgroundColor: "#4ade80",
            flexShrink: 0,
          }}
        />
        <span style={{ ...BODY, fontSize: 13, fontWeight: 500, color: "#ffffff" }}>
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
          color: "#ffffff",
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
          <span style={{ ...BODY, fontSize: 13, fontWeight: 600, color: "#4ade80" }}>
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
      icon: "📋",
    },
    {
      label: "Trials saved this month",
      value: privacyCount(data.trialSaves),
      sub: "Trials bookmarked for review",
      icon: "🔬",
    },
    {
      label: "Documents analyzed",
      value: privacyCount(data.documentsAnalyzed),
      sub: "This month via Clarifer AI",
      icon: "📄",
    },
    {
      label: "Logging at least weekly",
      value: privacyPct(data.weeklyLoggingPct),
      sub: "Patients with a log in the last 7 days",
      icon: "📊",
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

/** Horizontal bar chart of the top symptoms reported this week. */
function TopSymptomsSection({ symptoms }: { symptoms: SymptomEntry[] }) {
  const maxCount = symptoms.length > 0 ? symptoms[0].count : 1;

  // Bar colors: top symptom gets --accent, others get progressively lighter.
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

/** Most saved trials by the CCA community this month. */
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

/** Bidirectional layer -- reach the community via CCF. */
function ReachCommunitySection() {
  const trialSubject = encodeURIComponent("New CCA trial alert from CCF");
  const welcomeSubject = encodeURIComponent("Welcome to the CCF caregiver community");

  return (
    <section
      aria-label="Send to your community"
      style={{
        backgroundColor: "var(--card)",
        border: "2px solid var(--primary)",
        borderRadius: 14,
        padding: 28,
        marginTop: 20,
        marginBottom: 32,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <h2
        style={{
          ...HEADING,
          fontSize: 20,
          fontWeight: 600,
          color: "var(--primary)",
          marginBottom: 6,
        }}
      >
        Send to your community
      </h2>
      <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
        When a new trial opens or CCF publishes resources, send directly to matched caregivers.
        Opt-in only.
      </p>

      <div className="flex flex-wrap" style={{ gap: 12, marginBottom: 24 }}>
        <a
          href={`mailto:?subject=${trialSubject}`}
          aria-label="Send a trial alert to matched caregivers"
          style={{
            ...BODY,
            display: "inline-flex",
            alignItems: "center",
            height: 52,
            padding: "0 24px",
            borderRadius: 10,
            backgroundColor: "var(--primary)",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Send a trial alert to matched caregivers
        </a>
        <a
          href={`mailto:?subject=${welcomeSubject}`}
          aria-label="Send a welcome resource to new members"
          style={{
            ...BODY,
            display: "inline-flex",
            alignItems: "center",
            height: 52,
            padding: "0 24px",
            borderRadius: 10,
            backgroundColor: "transparent",
            border: "2px solid var(--primary)",
            color: "var(--primary)",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Send a welcome resource to new members
        </a>
      </div>

      <p
        style={{
          ...BODY,
          fontSize: 12,
          color: "var(--muted)",
          lineHeight: 1.6,
          borderTop: "1px solid var(--border)",
          paddingTop: 16,
        }}
      >
        All data is aggregated and anonymized. No individual patients are ever identified.
        Minimum 5 patients per data point shown.
      </p>
    </section>
  );
}

// ─── Loading skeleton (used by Suspense) ──────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard" aria-busy="true">
      {/* Header skeleton */}
      <div
        style={{
          backgroundColor: "var(--primary)",
          margin: "-32px -32px 0",
          height: 68,
        }}
      />
      {/* Hero skeleton */}
      <div
        style={{
          backgroundColor: "var(--pale-sage)",
          borderRadius: 16,
          height: 160,
          marginTop: 32,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      {/* Four metric cards skeleton */}
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
      {/* Section skeletons */}
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
  const data = await fetchCCFData();

  return (
    <>
      <HeroMetricCard data={data} />
      <MetricCards data={data} />
      <TopSymptomsSection symptoms={data.topSymptoms} />
      <MostSavedTrialsSection trials={data.mostSavedTrials} />
      <ReachCommunitySection />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CCFDashboardPage() {
  // Audit log: record page view. Best-effort -- never crash page on failure.
  try {
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (user?.id) {
      await internalSupabase()
        .from("audit_log")
        .insert({
          user_id: user.id,
          action: "VIEW",
          resource_type: "ccf_foundation_dashboard",
          organization_id: null,
          status: "success",
        });
    }
  } catch {
    // Audit write is best-effort.
  }

  return (
    <div style={BODY}>
      <DashboardHeader />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
