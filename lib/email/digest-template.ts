import type { TeamTask, SprintUpdate, AccessLevel } from "@/lib/internal/types";
import { MILESTONES } from "@/lib/internal/types";

interface DigestInput {
  accessLevel: AccessLevel;
  tasks: TeamTask[];
  lastSprint: SprintUpdate | null;
  nextSprint: string | null;
  counts: {
    testsPassing: number;
    sprintsComplete: number;
    openBlockers: number;
  };
  today?: Date;
}

const BG = "#F7F2EA";
const PRIMARY = "#2C5F4A";
const ACCENT = "#C4714A";
const CARD = "#FFFFFF";
const TEXT = "#1A1A1A";
const MUTED = "#6B6B6B";
const BORDER = "#E8E2D9";

function daysUntil(dateIso: string, today: Date): number {
  const t = new Date(dateIso).getTime();
  const n = today.getTime();
  return Math.ceil((t - n) / (1000 * 60 * 60 * 24));
}

function priorityDot(p: string): string {
  const colors: Record<string, string> = { high: "#C4714A", medium: "#E8A464", low: "#2C5F4A" };
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors[p] || MUTED};margin-right:8px;"></span>`;
}

function anchorSvg(): string {
  return `<svg width="28" height="28" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="16" r="6" fill="none" stroke="${PRIMARY}" stroke-width="3"/><line x1="32" y1="22" x2="32" y2="52" stroke="${PRIMARY}" stroke-width="3" stroke-linecap="round"/><path d="M16 36 Q10 44 16 52 Q24 58 32 52 Q40 58 48 52 Q54 44 48 36" fill="none" stroke="${PRIMARY}" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="32" x2="44" y2="32" stroke="${PRIMARY}" stroke-width="3" stroke-linecap="round"/></svg>`;
}

function taskLine(t: TeamTask, today: Date): string {
  const overdue =
    t.due_date && daysUntil(t.due_date, today) < 0 ? ` <span style="color:${ACCENT};">(OVERDUE)</span>` : "";
  const due = t.due_date
    ? ` <span style="color:${MUTED};font-size:12px;">Due ${t.due_date}${overdue}</span>`
    : "";
  const desc = t.description
    ? `<div style="color:${MUTED};font-size:13px;margin-top:4px;">${t.description}</div>`
    : "";
  return `<div style="padding:12px 0;border-bottom:1px solid ${BORDER};">
    <div style="font-weight:600;font-size:14px;color:${TEXT};">${priorityDot(t.priority)}${t.title}${due}</div>
    ${desc}
  </div>`;
}

export function generateDigestEmail(input: DigestInput): {
  subject: string;
  html: string;
  recipient: "samira" | "michael";
} {
  const today = input.today ?? new Date();
  const ccfDays = daysUntil("2026-05-08", today);
  const appStoreDays = daysUntil("2026-05-15", today);
  const aclDays = daysUntil("2026-07-31", today);

  const isFull = input.accessLevel === "full";
  const recipient = isFull ? "samira" : "michael";

  const visibleLanes = isFull
    ? ["samira", "michael", "blocked", "build"]
    : ["michael", "blocked"];
  const visibleTasks = input.tasks
    .filter((t) => visibleLanes.includes(t.lane) && t.status === "active")
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 } as const;
      return rank[a.priority] - rank[b.priority];
    });

  const subject = isFull
    ? `Clarifer Daily. ${ccfDays} days to CCF demo.`
    : `Clarifer Update. Your action items.`;

  const sprintSection =
    isFull && input.lastSprint
      ? `<div style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="font-family:'Playfair Display',serif;font-size:18px;color:${PRIMARY};margin-bottom:6px;">Last sprint: ${input.lastSprint.sprint_name}</div>
          <div style="color:${TEXT};font-size:14px;line-height:1.6;">${input.lastSprint.summary}</div>
        </div>`
      : "";

  const tasksHtml = visibleTasks.length
    ? visibleTasks.map((t) => taskLine(t, today)).join("")
    : `<div style="color:${MUTED};padding:16px 0;">No open action items.</div>`;

  const nextSprintSection =
    isFull && input.nextSprint
      ? `<div style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="font-family:'Playfair Display',serif;font-size:16px;color:${PRIMARY};margin-bottom:4px;">Next sprint</div>
          <div style="color:${TEXT};font-size:14px;">${input.nextSprint}</div>
        </div>`
      : "";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:'DM Sans',Arial,sans-serif;color:${TEXT};">
  <div style="max-width:600px;margin:0 auto;padding:24px;">

    <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
      ${anchorSvg()}
      <div style="font-weight:700;font-size:18px;color:${PRIMARY};">Clarifer</div>
      <div style="margin-left:auto;color:${MUTED};font-size:13px;">${today.toISOString().slice(0, 10)}</div>
    </div>

    <div style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:16px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;"><tr>
        <td style="text-align:center;padding:8px;"><div style="font-family:'Playfair Display',serif;font-size:24px;color:${PRIMARY};">${input.counts.testsPassing}</div><div style="font-size:11px;color:${MUTED};">tests passing</div></td>
        <td style="text-align:center;padding:8px;"><div style="font-family:'Playfair Display',serif;font-size:24px;color:${ACCENT};">${ccfDays}</div><div style="font-size:11px;color:${MUTED};">days to CCF</div></td>
        <td style="text-align:center;padding:8px;"><div style="font-family:'Playfair Display',serif;font-size:24px;color:${PRIMARY};">${input.counts.sprintsComplete}</div><div style="font-size:11px;color:${MUTED};">sprints done</div></td>
        <td style="text-align:center;padding:8px;"><div style="font-family:'Playfair Display',serif;font-size:24px;color:${ACCENT};">${input.counts.openBlockers}</div><div style="font-size:11px;color:${MUTED};">blockers</div></td>
      </tr></table>
    </div>

    ${sprintSection}

    <div style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-family:'Playfair Display',serif;font-size:18px;color:${PRIMARY};margin-bottom:12px;">Your action items</div>
      ${tasksHtml}
    </div>

    ${nextSprintSection}

    <div style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-family:'Playfair Display',serif;font-size:18px;color:${PRIMARY};margin-bottom:12px;">Milestone countdown</div>
      <div style="color:${TEXT};font-size:14px;line-height:1.8;">
        <div>CCF Demo: <strong>${ccfDays}</strong> days (${MILESTONES[0].date})</div>
        <div>App Store: <strong>${appStoreDays}</strong> days (${MILESTONES[1].date})</div>
        <div>ACL Grant: <strong>${aclDays}</strong> days (${MILESTONES[3].date})</div>
      </div>
    </div>

    <div style="color:${MUTED};font-size:12px;text-align:center;padding:16px 0;">
      Clarifer Corp. clarifer.com/internal for full dashboard.
    </div>
  </div>
</body>
</html>`;

  return { subject, html, recipient };
}

export async function sendDigestEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY missing" };
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Clarifer Command Center", email: "cc@clarifer.com" },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Brevo ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}
