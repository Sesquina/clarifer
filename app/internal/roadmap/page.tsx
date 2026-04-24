"use client";

import { useState } from "react";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

interface Phase {
  key: string;
  name: string;
  range: string;
  color: string;
  current?: boolean;
  sprints: Array<{ slug: string; label: string; description: string }>;
}

const PHASES: Phase[] = [
  {
    key: "ccf",
    name: "Phase 1. CCF Demo",
    range: "Apr 24 to May 8",
    color: "var(--accent)",
    current: true,
    sprints: [
      { slug: "sprint-infra-website", label: "Website Rebrand", description: "Landing page, login, download page, about, platform layout, anchor logo everywhere." },
      { slug: "sprint-cc-command-center", label: "Command Center", description: "Internal dashboard: board, history, roadmap, agents, daily digest, deadline tracker." },
      { slug: "sprint-9", label: "Clinical Trials + Family Updates", description: "ClinicalTrials.gov filter, WHO ICTRP for MX/PA, EN+ES updates, WhatsApp copy." },
      { slug: "sprint-demo-polish", label: "Demo Polish", description: "18-step demo script, rehearsals, environment sanity, fallback screenshots." },
    ],
  },
  {
    key: "app_store",
    name: "Phase 2. App Store",
    range: "May 8 to May 20",
    color: "var(--primary)",
    sprints: [
      { slug: "sprint-apple-submit", label: "Apple Submission", description: "Screenshots, metadata, privacy declarations, TestFlight, review response." },
      { slug: "sprint-android-submit", label: "Google Play Submission", description: "DUNS verification, aab bundle, Play Console listing, review." },
    ],
  },
  {
    key: "enterprise",
    name: "Phase 3. Enterprise",
    range: "May 8 to June",
    color: "var(--primary)",
    sprints: [
      { slug: "sprint-hospital-admin", label: "Hospital Admin Portal", description: "Organization dashboard, patient rosters, analytics, audit exports." },
      { slug: "sprint-enterprise-sso", label: "Enterprise SSO + BAA", description: "SAML/OIDC, Supabase + Anthropic BAAs live, contractual terms." },
    ],
  },
  {
    key: "series_a",
    name: "Phase 4. Series A",
    range: "June to September 2026",
    color: "#E8A464",
    sprints: [
      { slug: "sprint-metrics-dash", label: "Metrics Dashboard", description: "DAU, retention, conversion funnels, cohort views for investor decks." },
      { slug: "sprint-fundraise-site", label: "Fundraise Site", description: "Investor-facing landing, deck, data room links, term sheet tracker." },
    ],
  },
  {
    key: "scale",
    name: "Phase 5. Scale",
    range: "September 2026 to 2027",
    color: "var(--primary)",
    sprints: [
      { slug: "sprint-international", label: "International Expansion", description: "Full ES localization, Mexico and Panama hospital pilots." },
      { slug: "sprint-platform-partners", label: "Platform Partners", description: "Integrations with Epic, Cerner, caregiver networks." },
    ],
  },
  {
    key: "ipo",
    name: "Phase 6. IPO Ready",
    range: "2028+",
    color: "var(--accent)",
    sprints: [
      { slug: "sprint-soc2", label: "SOC 2 Type II", description: "Formal audit, continuous evidence collection." },
      { slug: "sprint-ipo-filings", label: "S-1 Prep", description: "Financial audit, governance, legal readiness." },
    ],
  },
];

export default function RoadmapPage() {
  const [open, setOpen] = useState<{ phase: string; sprint: number } | null>(null);

  const selected = open
    ? PHASES.find((p) => p.key === open.phase)?.sprints[open.sprint]
    : null;

  return (
    <div style={BODY}>
      <h1 style={{ ...HEADING, fontSize: 30, color: "var(--primary)", fontWeight: 700, marginBottom: 6 }}>
        Roadmap
      </h1>
      <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
        Six phases from CCF demo to IPO. Sprint chips inside each phase.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${PHASES.length}, minmax(260px, 1fr))`,
          gap: 16,
          overflowX: "auto",
          paddingBottom: 16,
        }}
      >
        {PHASES.map((p) => (
          <article
            key={p.key}
            style={{
              backgroundColor: p.current ? "var(--pale-terra)" : "var(--card)",
              border: `1px solid ${p.current ? p.color : "var(--border)"}`,
              borderTop: `4px solid ${p.color}`,
              borderRadius: 14,
              padding: 20,
              minHeight: 280,
            }}
          >
            <div style={{ ...HEADING, fontSize: 18, fontWeight: 700, color: "var(--primary)", marginBottom: 2 }}>
              {p.name}
            </div>
            <div style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
              {p.range}
              {p.current && (
                <span
                  style={{
                    marginLeft: 8,
                    fontWeight: 600,
                    color: "var(--accent)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontSize: 11,
                  }}
                >
                  current
                </span>
              )}
            </div>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {p.sprints.map((s, i) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setOpen({ phase: p.key, sprint: i })}
                  style={{
                    ...BODY,
                    textAlign: "left",
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--white)",
                    color: "var(--text)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <h2 style={{ ...HEADING, fontSize: 20, color: "var(--primary)", fontWeight: 600, marginBottom: 12 }}>
          Milestones
        </h2>
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: 12 }}
        >
          {[
            { label: "CCF Demo", date: "2026-05-08", status: "on track" },
            { label: "App Store", date: "2026-05-15", status: "on track" },
            { label: "Enterprise", date: "2026-05-08", status: "at risk" },
            { label: "ACL Grant", date: "2026-07-31", status: "on track" },
            { label: "Series A", date: "2026-09-01", status: "planning" },
            { label: "IPO Readiness", date: "2028+", status: "future" },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ ...BODY, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
                {m.label}
              </div>
              <div style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                {m.date}
              </div>
              <div
                style={{
                  ...BODY,
                  fontSize: 11,
                  fontWeight: 600,
                  color: m.status === "at risk" ? "var(--accent)" : "var(--primary)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginTop: 8,
                }}
              >
                {m.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {open && selected && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(26,26,26,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 200,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--card)",
              borderRadius: 16,
              padding: 32,
              maxWidth: 520,
              width: "100%",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
              {selected.slug}
            </div>
            <div style={{ ...HEADING, fontSize: 22, fontWeight: 700, color: "var(--primary)", marginBottom: 12 }}>
              {selected.label}
            </div>
            <p style={{ ...BODY, fontSize: 15, color: "var(--text)", lineHeight: 1.6 }}>
              {selected.description}
            </p>
            <button
              type="button"
              onClick={() => setOpen(null)}
              style={{
                ...BODY,
                marginTop: 20,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                backgroundColor: "transparent",
                color: "var(--text)",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
