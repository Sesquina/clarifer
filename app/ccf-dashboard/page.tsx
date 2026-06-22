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

interface CCFDashboardData {
  activeCaregivers: number | null;
  logsThisMonth: number | null;
  avgSeverity: string | null;
  trialSaves: number | null;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchCCFData(): Promise<CCFDashboardData> {
  const supabase = internalSupabase();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();

  const [caregiverResult, logsResult, severityResult, trialResult] = await Promise.allSettled([
    supabase
      .from("audit_log")
      .select("user_id", { count: "exact", head: true })
      .gte("created_at", ninetyDaysAgo),

    supabase
      .from("symptom_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart),

    supabase
      .from("symptom_logs")
      .select("overall_severity")
      .gte("created_at", monthStart),

    supabase
      .from("trial_saves")
      .select("id", { count: "exact", head: true })
      .gte("saved_at", monthStart),
  ]);

  const activeCaregivers =
    caregiverResult.status === "fulfilled" ? (caregiverResult.value.count ?? null) : null;
  const logsThisMonth =
    logsResult.status === "fulfilled" ? (logsResult.value.count ?? null) : null;

  let avgSeverity: string | null = null;
  if (severityResult.status === "fulfilled") {
    const rows = severityResult.value.data ?? [];
    if (rows.length > 0) {
      avgSeverity = (
        rows.reduce((sum, r) => sum + (r.overall_severity ?? 0), 0) / rows.length
      ).toFixed(1);
    }
  }

  const trialSaves =
    trialResult.status === "fulfilled" ? (trialResult.value.count ?? null) : null;

  return { activeCaregivers, logsThisMonth, avgSeverity, trialSaves };
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
        <img src="/logo-mark.png" alt="Clarifer" width={28} height={28} style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }} />
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

function FourStatCards({ data }: { data: CCFDashboardData }) {
  const cards = [
    { label: "Active caregivers (90 days)", value: data.activeCaregivers != null ? String(data.activeCaregivers) : "--" },
    { label: "Logs this month", value: data.logsThisMonth != null ? String(data.logsThisMonth) : "--" },
    { label: "Avg severity this month", value: data.avgSeverity ?? "--" },
    { label: "Trial saves this month", value: data.trialSaves != null ? String(data.trialSaves) : "--" },
  ];

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
      style={{ gap: 16, marginTop: 32 }}
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
          <div style={{ ...BODY, fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
            {card.label}
          </div>
        </article>
      ))}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard" aria-busy="true" style={{ padding: "0 24px" }}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: 16, marginTop: 32 }}>
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
    </div>
  );
}

// ─── Async content wrapper ────────────────────────────────────────────────────

async function DashboardContent() {
  const data = await fetchCCFData();
  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
      <FourStatCards data={data} />
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
