import { fetchTasksGrouped, fetchLatestSprint } from "./_data";
import { daysUntil, urgencyColor } from "./_overview/helpers";
import PriorityActionsClient from "./_overview/PriorityActionsClient";
import MilestoneTimeline from "./_overview/MilestoneTimeline";
import BlockerCard from "./_overview/BlockerCard";

export const dynamic = "force-dynamic";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

const TESTS_PASSING = 154;

interface StatCardProps {
  number: string;
  numberColor: string;
  label: string;
  sub: string;
  progressPercent?: number;
  progressColor?: string;
}

function StatCard(props: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 24,
        minHeight: 140,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          ...HEADING,
          fontSize: 56,
          fontWeight: 700,
          color: props.numberColor,
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {props.number}
      </div>
      <div style={{ ...BODY, fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
        {props.label}
      </div>
      <div style={{ ...BODY, fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
        {props.sub}
      </div>
      {typeof props.progressPercent === "number" && (
        <div
          style={{
            marginTop: "auto",
            paddingTop: 12,
            height: 6,
            backgroundColor: "var(--border)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${props.progressPercent}%`,
              height: "100%",
              backgroundColor: props.progressColor ?? "var(--accent)",
              transition: "width 200ms ease",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default async function OverviewPage() {
  const [grouped, latestSprint] = await Promise.all([
    fetchTasksGrouped(),
    fetchLatestSprint(),
  ]);

  const ccfDays = daysUntil("2026-05-08");
  const aclDays = daysUntil("2026-07-31");
  const ccfColor = urgencyColor(ccfDays);
  const aclColor = urgencyColor(aclDays);

  const blockers = grouped.byLane.blocked.filter((t) => t.status === "active");
  const activeTasks = grouped.tasks.filter((t) => t.status === "active");

  return (
    <div style={BODY}>
      <h1 style={{ ...HEADING, fontSize: 30, color: "var(--primary)", fontWeight: 700, marginBottom: 6 }}>
        Overview
      </h1>
      <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
        Command center for Clarifer.
      </p>

      {/* SECTION 1: 4 STAT CARDS */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
        style={{ gap: 16, marginBottom: 20 }}
      >
        <StatCard
          number={String(ccfDays)}
          numberColor={ccfColor}
          label="days to CCF demo"
          sub="May 8, 2026"
        />
        <StatCard
          number="0 / 10"
          numberColor="var(--accent)"
          label="caregivers recruited"
          sub="needed for ACL grant by July 15"
          progressPercent={0}
          progressColor="var(--accent)"
        />
        <StatCard
          number={String(aclDays)}
          numberColor={aclColor}
          label="days to ACL deadline"
          sub="July 31, 2026. Up to $150,000."
        />
        <StatCard
          number={String(TESTS_PASSING)}
          numberColor="var(--primary)"
          label="tests passing"
          sub="0 failures"
        />
      </div>

      {/* SECTION 2: 3 STATUS CARDS */}
      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ gap: 16, marginBottom: 28 }}
      >
        <section
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 20,
            height: "100%",
          }}
        >
          <div className="flex items-center" style={{ marginBottom: 8 }}>
            <h3 style={{ ...BODY, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
              Current Sprint
            </h3>
            <span
              style={{
                ...BODY,
                marginLeft: "auto",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--white)",
                backgroundColor: "rgb(64, 113, 196)",
                padding: "2px 10px",
                borderRadius: 12,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              building
            </span>
          </div>
          <div style={{ ...HEADING, fontSize: 18, color: "var(--primary)", fontWeight: 600, marginBottom: 6 }}>
            sprint-cc-fixes
          </div>
          <p style={{ ...BODY, fontSize: 13, color: "var(--muted)" }}>
            Command center UI plus login auth fix.
          </p>
        </section>

        <section
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 20,
            height: "100%",
          }}
        >
          <h3 style={{ ...BODY, fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
            Platform Status
          </h3>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {[
              { label: "clarifer.com", value: "Live" },
              { label: "Database", value: "25 migrations applied" },
              { label: "Tests", value: `${TESTS_PASSING} passing` },
            ].map((row) => (
              <div key={row.label} className="flex items-center" style={{ gap: 8 }}>
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "var(--primary)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ ...BODY, fontSize: 13, color: "var(--text)" }}>{row.label}</span>
                <span style={{ ...BODY, fontSize: 13, color: "var(--muted)", marginLeft: "auto" }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <BlockerCard blockers={blockers} />
      </div>

      {/* SECTION 3: TWO COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-5" style={{ gap: 20, marginBottom: 28 }}>
        <div style={{ gridColumn: "span 3" }}>
          <PriorityActionsClient initial={activeTasks} />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <MilestoneTimeline />
        </div>
      </div>

      {/* SECTION 4: LAST SPRINT */}
      <section
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 24,
        }}
        data-testid="last-sprint"
      >
        <h2 style={{ ...HEADING, fontSize: 18, color: "var(--primary)", fontWeight: 600, marginBottom: 16 }}>
          Last Sprint
        </h2>
        {latestSprint ? (
          <>
            <div
              className="grid grid-cols-1 md:grid-cols-3"
              style={{ gap: 24, marginBottom: 16 }}
            >
              <div>
                <div style={{ ...HEADING, fontSize: 20, color: "var(--text)", fontWeight: 600 }}>
                  {latestSprint.sprint_name}
                </div>
                <div style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                  {latestSprint.created_at.slice(0, 10)}
                </div>
                {latestSprint.branch && (
                  <div style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {latestSprint.branch}
                  </div>
                )}
              </div>
              <div>
                <div style={{ ...HEADING, fontSize: 28, fontWeight: 700, color: "var(--primary)" }}>
                  {latestSprint.tests_before ?? "?"} → {latestSprint.tests_after ?? "?"}
                </div>
                <div style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                  tests before → after
                </div>
              </div>
              <div>
                <div style={{ ...BODY, fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
                  {latestSprint.files_changed ?? 0} file{(latestSprint.files_changed ?? 0) === 1 ? "" : "s"} changed
                </div>
                {latestSprint.commit_hash && (
                  <div
                    style={{
                      fontFamily: "ui-monospace, SFMono-Regular, monospace",
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 4,
                    }}
                  >
                    {latestSprint.commit_hash.slice(0, 7)}
                  </div>
                )}
              </div>
            </div>
            <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
              {latestSprint.summary}
            </p>
          </>
        ) : (
          <p style={{ ...BODY, fontSize: 14, color: "var(--muted)" }}>
            No sprint data yet. Claude Code updates this after each sprint.
          </p>
        )}
      </section>
    </div>
  );
}
