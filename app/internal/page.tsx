import Link from "next/link";
import { fetchTasksGrouped, fetchLatestSprint, fetchSprints } from "./_data";
import type { TeamTask, TaskLane } from "@/lib/internal/types";
import { MILESTONES } from "@/lib/internal/types";

export const dynamic = "force-dynamic";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

const LANE_META: Record<TaskLane, { label: string; emoji: string; color: string }> = {
  build: { label: "Build", emoji: "🛠", color: "var(--primary)" },
  samira: { label: "Samira", emoji: "🔴", color: "var(--accent)" },
  michael: { label: "Michael", emoji: "🔵", color: "var(--primary)" },
  blocked: { label: "Blocked", emoji: "⏳", color: "var(--muted)" },
};

function daysUntil(iso: string, now = new Date()): number {
  const t = new Date(iso).getTime();
  return Math.ceil((t - now.getTime()) / (1000 * 60 * 60 * 24));
}

function StatCard({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "20px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          ...HEADING,
          fontSize: 36,
          fontWeight: 700,
          color: accent ? "var(--accent)" : "var(--primary)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ ...BODY, fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{label}</div>
    </div>
  );
}

function PriorityDot({ p }: { p: string }) {
  const c = p === "high" ? "var(--accent)" : p === "medium" ? "#E8A464" : "var(--primary)";
  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: c, marginRight: 10, flexShrink: 0 }}
    />
  );
}

function TaskRow({ t }: { t: TeamTask }) {
  const overdue = t.due_date && daysUntil(t.due_date) < 0;
  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "12px 0",
      }}
    >
      <div className="flex items-start" style={{ gap: 0 }}>
        <PriorityDot p={t.priority} />
        <div style={{ flex: 1 }}>
          <div style={{ ...BODY, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
            {t.title}
          </div>
          {t.description && (
            <div
              style={{
                ...BODY,
                fontSize: 13,
                color: "var(--muted)",
                marginTop: 4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {t.description}
            </div>
          )}
          <div
            className="flex items-center flex-wrap"
            style={{ gap: 8, marginTop: 6 }}
          >
            {t.category && (
              <span
                style={{
                  ...BODY,
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--primary)",
                  backgroundColor: "var(--pale-sage)",
                  padding: "2px 8px",
                  borderRadius: 10,
                }}
              >
                {t.category}
              </span>
            )}
            {t.due_date && (
              <span
                style={{
                  ...BODY,
                  fontSize: 12,
                  color: overdue ? "var(--accent)" : "var(--muted)",
                  fontWeight: overdue ? 600 : 400,
                }}
              >
                {overdue ? "OVERDUE " : "Due "}
                {t.due_date}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestoneBar({ label, date }: { label: string; date: string }) {
  const days = daysUntil(date);
  const color =
    days < 7 ? "var(--accent)" : days <= 14 ? "#E8A464" : "var(--primary)";
  const pct = Math.max(0, Math.min(100, 100 - (days / 120) * 100));
  return (
    <div>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 4 }}>
        <div style={{ ...BODY, fontSize: 14, fontWeight: 500, color: "var(--text)", flex: 1 }}>
          {label}
        </div>
        <div style={{ ...BODY, fontSize: 12, color: "var(--muted)" }}>{date}</div>
      </div>
      <div
        style={{
          height: 8,
          backgroundColor: "var(--border)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: color,
            transition: "width 0.3s",
          }}
        />
      </div>
      <div style={{ ...BODY, fontSize: 12, color, marginTop: 4, fontWeight: 500 }}>
        {days < 0 ? `${Math.abs(days)} days past` : `${days} days remaining`}
      </div>
    </div>
  );
}

export default async function OverviewPage() {
  const [grouped, latestSprint, allSprints] = await Promise.all([
    fetchTasksGrouped(),
    fetchLatestSprint(),
    fetchSprints(),
  ]);

  const ccfDays = daysUntil("2026-05-08");
  const activeTasks = grouped.tasks.filter((t) => t.status === "active");
  const samiraUrgent = activeTasks.filter((t) => t.lane === "samira" && t.priority === "high");
  const michaelUrgent = activeTasks.filter((t) => t.lane === "michael" && t.priority === "high");
  const blocked = activeTasks.filter((t) => t.lane === "blocked");

  return (
    <div style={BODY}>
      <h1 style={{ ...HEADING, fontSize: 30, color: "var(--primary)", fontWeight: 700, marginBottom: 6 }}>
        Overview
      </h1>
      <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
        Command center for Clarifer.
      </p>

      <div
        className="grid grid-cols-2 md:grid-cols-4"
        style={{ gap: 16, marginBottom: 28 }}
      >
        <StatCard label="Tests passing" value={latestSprint?.tests_after ?? 0} />
        <StatCard label="Days to CCF demo" value={ccfDays} accent={ccfDays <= 14} />
        <StatCard label="Sprints complete" value={allSprints.length} />
        <StatCard label="Open blockers" value={blocked.length} accent={blocked.length > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5" style={{ gap: 20 }}>
        {/* LEFT: Priority actions */}
        <div style={{ gridColumn: "span 3" }}>
          <h2 style={{ ...HEADING, fontSize: 20, color: "var(--primary)", fontWeight: 600, marginBottom: 12 }}>
            Priority actions
          </h2>

          {[
            { lane: "samira" as const, items: samiraUrgent },
            { lane: "michael" as const, items: michaelUrgent },
            { lane: "blocked" as const, items: blocked },
          ].map((group) => (
            <div
              key={group.lane}
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <div
                className="flex items-center"
                style={{
                  gap: 8,
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span aria-hidden="true">{LANE_META[group.lane].emoji}</span>
                <span style={{ ...BODY, fontSize: 15, fontWeight: 600, color: LANE_META[group.lane].color }}>
                  {LANE_META[group.lane].label}
                </span>
                <span style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>
                  {group.items.length} item{group.items.length === 1 ? "" : "s"}
                </span>
              </div>
              {group.items.length === 0 ? (
                <p style={{ ...BODY, fontSize: 13, color: "var(--muted)" }}>
                  No open items.
                </p>
              ) : (
                group.items.map((t) => <TaskRow key={t.id} t={t} />)
              )}
            </div>
          ))}
        </div>

        {/* RIGHT: Milestones + last sprint */}
        <div style={{ gridColumn: "span 2" }}>
          <h2 style={{ ...HEADING, fontSize: 20, color: "var(--primary)", fontWeight: 600, marginBottom: 12 }}>
            Milestones
          </h2>
          <div
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {MILESTONES.map((m) => (
              <MilestoneBar key={m.key} label={m.label} date={m.date} />
            ))}
          </div>

          <h2 style={{ ...HEADING, fontSize: 20, color: "var(--primary)", fontWeight: 600, marginBottom: 12 }}>
            Last sprint
          </h2>
          {latestSprint ? (
            <div
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 20,
              }}
            >
              <div style={{ ...HEADING, fontSize: 17, color: "var(--primary)", fontWeight: 600, marginBottom: 4 }}>
                {latestSprint.sprint_name}
              </div>
              <div style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
                {latestSprint.created_at.slice(0, 10)}
              </div>
              <p style={{ ...BODY, fontSize: 14, color: "var(--text)", lineHeight: 1.6, marginBottom: 12 }}>
                {latestSprint.summary}
              </p>
              <div style={{ ...BODY, fontSize: 13, color: "var(--muted)" }}>
                Tests {latestSprint.tests_before ?? 0} → {latestSprint.tests_after ?? 0} ·{" "}
                {latestSprint.files_changed ?? 0} files changed
              </div>
              {latestSprint.commit_hash && (
                <div style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginTop: 8, fontFamily: "monospace" }}>
                  {latestSprint.commit_hash.slice(0, 7)}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 20,
                color: "var(--muted)",
                fontSize: 14,
              }}
            >
              No sprints recorded yet. Once Claude Code posts to /api/internal/sprints, history will appear here.{" "}
              <Link href="/internal/board" style={{ color: "var(--primary)" }}>
                Open the board
              </Link>
              .
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
