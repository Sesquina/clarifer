import { fetchSprints } from "../_data";

export const dynamic = "force-dynamic";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

export default async function SprintsPage() {
  const sprints = await fetchSprints();

  return (
    <div style={BODY}>
      <h1 style={{ ...HEADING, fontSize: 30, color: "var(--primary)", fontWeight: 700, marginBottom: 6 }}>
        Sprint History
      </h1>
      <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
        Every sprint recorded in the command center.
      </p>

      {sprints.length === 0 ? (
        <div
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 32,
            color: "var(--muted)",
            fontSize: 14,
          }}
        >
          No sprints recorded yet. Once Claude Code begins posting to /api/internal/sprints after each sprint, entries will appear here.
        </div>
      ) : (
        <>
          <div className="flex flex-col" style={{ gap: 16, marginBottom: 32 }}>
            {sprints.map((s) => (
              <article
                key={s.id}
                id={`sprint-${s.id}`}
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: 24,
                }}
              >
                <div className="flex items-center flex-wrap" style={{ gap: 12, marginBottom: 8 }}>
                  <div style={{ ...HEADING, fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>
                    {s.sprint_name}
                  </div>
                  <div style={{ ...BODY, fontSize: 12, color: "var(--muted)" }}>
                    {s.created_at.slice(0, 10)}
                  </div>
                </div>
                <p style={{ ...BODY, fontSize: 14, color: "var(--text)", lineHeight: 1.7, marginBottom: 12 }}>
                  {s.summary}
                </p>
                <div style={{ ...BODY, fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                  Tests {s.tests_before ?? "?"} → <strong>{s.tests_after ?? "?"}</strong>
                  {" · "}
                  {s.files_changed ?? 0} file{(s.files_changed ?? 0) === 1 ? "" : "s"} changed
                  {s.branch ? `  ·  branch: ${s.branch}` : ""}
                </div>

                {(s.migrations_pending ?? []).length > 0 && (
                  <div
                    style={{
                      backgroundColor: "var(--pale-terra)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ ...BODY, fontSize: 12, fontWeight: 600, color: "var(--accent)", marginBottom: 4 }}>
                      Migrations pending ({(s.migrations_pending ?? []).length})
                    </div>
                    <ul style={{ ...BODY, fontSize: 13, color: "var(--text)", margin: 0, paddingLeft: 18 }}>
                      {(s.migrations_pending ?? []).map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(s.manual_actions ?? []).length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ ...BODY, fontSize: 12, fontWeight: 600, color: "var(--primary)", marginBottom: 4 }}>
                      Manual actions
                    </div>
                    <ul style={{ ...BODY, fontSize: 13, color: "var(--text)", margin: 0, paddingLeft: 18 }}>
                      {(s.manual_actions ?? []).map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(s.blockers ?? []).length > 0 && (
                  <div>
                    <div style={{ ...BODY, fontSize: 12, fontWeight: 600, color: "var(--accent)", marginBottom: 4 }}>
                      Blockers at time of sprint
                    </div>
                    <ul style={{ ...BODY, fontSize: 13, color: "var(--text)", margin: 0, paddingLeft: 18 }}>
                      {(s.blockers ?? []).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {s.commit_hash && (
                  <a
                    href={`https://github.com/Sesquina/clarifer/commit/${s.commit_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...BODY,
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "var(--primary)",
                      marginTop: 12,
                      display: "inline-block",
                    }}
                  >
                    {s.commit_hash.slice(0, 7)}
                  </a>
                )}
              </article>
            ))}
          </div>

          <div
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 20,
              overflowX: "auto",
            }}
          >
            <div style={{ ...BODY, fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 12 }}>
              Timeline
            </div>
            <div className="flex items-center" style={{ gap: 12 }}>
              {[...sprints].reverse().map((s) => (
                <a
                  key={s.id}
                  href={`#sprint-${s.id}`}
                  style={{
                    ...BODY,
                    fontSize: 12,
                    padding: "6px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    color: "var(--primary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.sprint_name.replace(/^sprint[- ]?/i, "")}{" "}
                  <span style={{ color: "var(--muted)" }}>{s.created_at.slice(5, 10)}</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
