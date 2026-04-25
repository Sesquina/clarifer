"use client";

import { useState } from "react";
import Link from "next/link";
import type { TeamTask } from "@/lib/internal/types";
import { truncate } from "./helpers";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

interface SectionConfig {
  key: "samira" | "michael" | "build";
  title: string;
  topBorder: string;
  showViewAll?: boolean;
}

const SECTIONS: SectionConfig[] = [
  { key: "samira",  title: "Your action items",  topBorder: "var(--accent)" },
  { key: "michael", title: "Michael",            topBorder: "rgb(64, 113, 196)" },
  { key: "build",   title: "Build",              topBorder: "var(--primary)", showViewAll: true },
];

function priorityColor(p: string): string {
  if (p === "high") return "var(--accent)";
  if (p === "medium") return "rgb(239, 159, 39)";
  return "var(--primary)";
}

export default function PriorityActionsClient({ initial }: { initial: TeamTask[] }) {
  const [tasks, setTasks] = useState<TeamTask[]>(initial);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  async function markDone(id: string) {
    const before = tasks;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "done" as const, completed_at: new Date().toISOString() } : t
      )
    );
    try {
      const res = await fetch(`/api/internal/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "done" }),
      });
      if (!res.ok) setTasks(before);
    } catch {
      setTasks(before);
    }
  }

  function topThree(lane: SectionConfig["key"]): TeamTask[] {
    return tasks
      .filter((t) => t.lane === lane && t.status === "active")
      .sort((a, b) => {
        const rank = { high: 0, medium: 1, low: 2 } as const;
        return rank[a.priority] - rank[b.priority];
      })
      .slice(0, 3);
  }

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      <h2 style={{ ...HEADING, fontSize: 20, color: "var(--primary)", fontWeight: 600 }}>
        Priority actions
      </h2>
      {SECTIONS.map((section) => {
        const items = topThree(section.key);
        return (
          <section
            key={section.key}
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderTop: `3px solid ${section.topBorder}`,
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div className="flex items-center" style={{ marginBottom: 12 }}>
              <h3 style={{ ...BODY, fontSize: 13, fontWeight: 600, color: "var(--text)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {section.title}
              </h3>
              <span style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>
                {items.length} item{items.length === 1 ? "" : "s"}
              </span>
            </div>
            {items.length === 0 ? (
              <p style={{ ...BODY, fontSize: 13, color: "var(--muted)" }}>
                Nothing urgent.
              </p>
            ) : (
              <div className="flex flex-col" style={{ gap: 0 }}>
                {items.map((t) => (
                  <div
                    key={t.id}
                    onMouseEnter={() => setHoveredId(t.id)}
                    onMouseLeave={() => setHoveredId((h) => (h === t.id ? null : h))}
                    data-task-id={t.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      padding: "10px 0",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: priorityColor(t.priority),
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...BODY, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                        {t.title}
                      </div>
                      {t.description && (
                        <div style={{ ...BODY, fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                          {truncate(t.description, 60)}
                        </div>
                      )}
                      {t.due_date && (
                        <div style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                          Due {t.due_date}
                        </div>
                      )}
                    </div>
                    {hoveredId === t.id && (
                      <button
                        type="button"
                        aria-label={`Mark ${t.title} as done`}
                        onClick={() => markDone(t.id)}
                        style={{
                          ...BODY,
                          height: 32,
                          padding: "0 12px",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--white)",
                          color: "var(--primary)",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        Mark done
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {section.showViewAll && (
              <Link
                href="/internal/board"
                style={{
                  ...BODY,
                  display: "inline-block",
                  marginTop: 12,
                  fontSize: 13,
                  color: "var(--primary)",
                  fontWeight: 500,
                }}
              >
                View full board →
              </Link>
            )}
          </section>
        );
      })}
    </div>
  );
}
