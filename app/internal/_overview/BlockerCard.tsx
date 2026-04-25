import Link from "next/link";
import type { TeamTask } from "@/lib/internal/types";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};

export default function BlockerCard({ blockers }: { blockers: TeamTask[] }) {
  const count = blockers.length;
  const titleColor = count > 0 ? "var(--accent)" : "var(--text)";
  return (
    <section
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 20,
        height: "100%",
      }}
      data-testid="blocker-card"
    >
      <div className="flex items-center" style={{ marginBottom: 12 }}>
        <h3 style={{ ...BODY, fontSize: 14, fontWeight: 600, color: titleColor }}>
          Open Blockers
        </h3>
        <span
          data-testid="blocker-count"
          style={{
            ...BODY,
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--white)",
            backgroundColor: count > 0 ? "var(--accent)" : "var(--muted)",
            padding: "2px 10px",
            borderRadius: 12,
          }}
        >
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p style={{ ...BODY, fontSize: 13, color: "var(--muted)" }}>
          Nothing blocked. Everything is moving.
        </p>
      ) : (
        <>
          <ul style={{ ...BODY, fontSize: 13, color: "var(--text)", margin: 0, padding: 0, listStyle: "none" }}>
            {blockers.slice(0, 3).map((b) => (
              <li
                key={b.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                  padding: "8px 0",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "var(--accent)",
                    marginTop: 6,
                  }}
                />
                <span>{b.title}</span>
              </li>
            ))}
          </ul>
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
            View all →
          </Link>
        </>
      )}
    </section>
  );
}
