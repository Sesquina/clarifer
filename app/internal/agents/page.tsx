"use client";

import { useEffect, useState } from "react";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

interface AgentCard {
  key: string;
  name: string;
  description: string;
  triggerPath: string | null;
}

const AGENTS: AgentCard[] = [
  {
    key: "sprint-reporter",
    name: "Sprint Reporter",
    description: "Claude Code posts a sprint_update after every sprint. Tracks tests, files changed, blockers, and migrations.",
    triggerPath: null,
  },
  {
    key: "github-ci",
    name: "Test Monitor",
    description: "GitHub Actions webhook writes each CI workflow run. Failures open a high-priority task in the build lane.",
    triggerPath: null,
  },
  {
    key: "deadline-tracker",
    name: "Deadline Tracker",
    description: "Runs Mondays at 08:00. Alerts when any task is overdue or due within 3 days.",
    triggerPath: "/api/internal/agents/deadline",
  },
  {
    key: "daily-digest",
    name: "Daily Digest",
    description: "Runs daily at 08:00. Sends personalized email to Samira (full) and Michael (growth).",
    triggerPath: "/api/internal/agents/digest",
  },
];

interface LatestRun {
  status: "success" | "error" | "warning";
  summary: string | null;
  ran_at: string;
}

export default function AgentsPage() {
  const [runs, setRuns] = useState<Record<string, LatestRun | null>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadRuns() {
    try {
      const res = await fetch("/api/internal/tasks", { credentials: "include" });
      if (!res.ok) return;
      // Derive agent runs via dedicated endpoint (skipped); use sprints endpoint below as health check.
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadRuns();
  }, []);

  async function runNow(key: string, path: string) {
    setBusy(key);
    setMessage(null);
    try {
      const res = await fetch(path, { credentials: "include" });
      const body = await res.json().catch(() => ({}));
      setMessage(
        res.ok
          ? `${key} ran successfully.`
          : `${key} failed: ${body.error ?? res.status}`
      );
      setRuns((prev) => ({
        ...prev,
        [key]: {
          status: res.ok ? "success" : "error",
          summary: body.summary ?? (res.ok ? "ran" : "error"),
          ran_at: new Date().toISOString(),
        },
      }));
    } catch (err) {
      setMessage(`${key} failed: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={BODY}>
      <h1 style={{ ...HEADING, fontSize: 30, color: "var(--primary)", fontWeight: 700, marginBottom: 6 }}>
        Agents
      </h1>
      <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
        Automated workers. Manual Run Now is available for cron-driven agents.
      </p>

      {message && (
        <div
          role="status"
          style={{
            ...BODY,
            fontSize: 14,
            backgroundColor: "var(--pale-sage)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            color: "var(--primary)",
          }}
        >
          {message}
        </div>
      )}

      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ gap: 16 }}
      >
        {AGENTS.map((a) => {
          const last = runs[a.key] ?? null;
          const statusColor =
            last?.status === "error"
              ? "var(--accent)"
              : last?.status === "warning"
              ? "#E8A464"
              : "var(--primary)";
          return (
            <article
              key={a.key}
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 20,
              }}
            >
              <div className="flex items-center" style={{ gap: 10, marginBottom: 6 }}>
                <div style={{ ...HEADING, fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>
                  {a.name}
                </div>
                <span
                  style={{
                    ...BODY,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--white)",
                    backgroundColor: statusColor,
                    padding: "2px 8px",
                    borderRadius: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginLeft: "auto",
                  }}
                >
                  {last?.status ?? "ready"}
                </span>
              </div>
              <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 12 }}>
                {a.description}
              </p>
              {last && (
                <div style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
                  Last run: {new Date(last.ran_at).toLocaleString()}
                  {last.summary ? ` · ${last.summary}` : ""}
                </div>
              )}
              {a.triggerPath ? (
                <button
                  type="button"
                  onClick={() => a.triggerPath && runNow(a.key, a.triggerPath)}
                  disabled={busy === a.key}
                  style={{
                    ...BODY,
                    padding: "8px 16px",
                    borderRadius: 8,
                    backgroundColor: "var(--primary)",
                    color: "var(--white)",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "none",
                    cursor: busy === a.key ? "not-allowed" : "pointer",
                    opacity: busy === a.key ? 0.7 : 1,
                  }}
                >
                  {busy === a.key ? "Running..." : "Run now"}
                </button>
              ) : (
                <span style={{ ...BODY, fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                  Triggered externally (webhook / Claude CLI).
                </span>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
