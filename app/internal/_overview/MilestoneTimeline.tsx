import { MILESTONES_TIMELINE, daysUntil, urgencyColor } from "./helpers";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

function ProgressRing({ percent, color }: { percent: number; color: string }) {
  const size = 36;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export default function MilestoneTimeline() {
  return (
    <section
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 20,
      }}
      data-testid="milestone-timeline"
    >
      <h2 style={{ ...HEADING, fontSize: 18, color: "var(--primary)", fontWeight: 600, marginBottom: 16 }}>
        Milestones
      </h2>
      <div style={{ position: "relative", paddingLeft: 24 }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 5,
            top: 6,
            bottom: 6,
            width: 2,
            backgroundColor: "var(--border)",
          }}
        />
        <div className="flex flex-col" style={{ gap: 18 }}>
          {MILESTONES_TIMELINE.map((m) => {
            const days = daysUntil(m.date);
            const active = days < 14;
            const color = urgencyColor(days);
            const fontWeight = days <= 14 ? 700 : 400;
            return (
              <div
                key={m.key}
                data-milestone={m.key}
                className="flex items-center"
                style={{ gap: 16, position: "relative" }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: -23,
                    top: 12,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: active ? "var(--primary)" : "var(--card)",
                    border: `2px solid var(--primary)`,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ ...BODY, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                    {m.label}
                  </div>
                  <div style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {m.display}
                  </div>
                  <div
                    style={{
                      ...BODY,
                      fontSize: 12,
                      color: days <= 14 ? color : "var(--muted)",
                      fontWeight,
                      marginTop: 2,
                    }}
                  >
                    {days < 0 ? `${Math.abs(days)} days past` : `${days} days`}
                  </div>
                </div>
                <ProgressRing percent={m.percent} color={color} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
