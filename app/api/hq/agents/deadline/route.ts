import { NextRequest, NextResponse } from "next/server";
import { internalSupabase } from "@/lib/internal/supabase";
import { sendDigestEmail } from "@/lib/email/digest-template";
import type { TeamTask } from "@/lib/internal/types";

export const dynamic = "force-dynamic";

function cronAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron") === "1") return true;
  const auth = req.headers.get("authorization");
  if (!auth) return false;
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) return false;
  return auth === `Bearer ${expected}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET(req: NextRequest) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = internalSupabase();
  const { data, error } = await supabase
    .from("team_tasks")
    .select("*")
    .eq("status", "active")
    .not("due_date", "is", null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const today = new Date();
  const tasks = (data ?? []) as unknown as TeamTask[];
  const urgent = tasks
    .map((t) => ({ task: t, days: daysBetween(today, new Date(t.due_date!)) }))
    .filter((x) => x.days <= 3)
    .sort((a, b) => a.days - b.days);

  const alertCount = urgent.length;
  let emailSent = false;

  if (alertCount > 0) {
    const lines = urgent
      .map((x) => {
        const overdue = x.days < 0 ? "OVERDUE" : `${x.days} days`;
        return `<li style="margin-bottom:8px;"><strong>${x.task.title}</strong> (${x.task.assigned_to ?? "unassigned"}) &mdash; ${overdue}</li>`;
      })
      .join("");
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:24px;">
      <h2 style="color:#C4714A;">Clarifer deadline alert</h2>
      <p>${alertCount} task(s) due within 3 days or overdue:</p>
      <ul style="font-size:14px;">${lines}</ul>
    </body></html>`;
    const r = await sendDigestEmail({
      to: "samira.esquina@clarifer.com",
      subject: `Clarifer: ${alertCount} urgent deadline(s)`,
      html,
    });
    emailSent = r.ok;
  }

  await supabase.from("agent_runs").insert({
    agent_name: "deadline-tracker",
    status: alertCount === 0 ? "success" : emailSent ? "warning" : "error",
    summary: `${alertCount} urgent deadlines${emailSent ? " (email sent)" : ""}`,
    details: { urgent: urgent.map((x) => ({ title: x.task.title, days: x.days })) },
  });

  return NextResponse.json({
    ok: true,
    alertCount,
    emailSent,
    urgent: urgent.map((x) => ({ id: x.task.id, title: x.task.title, days: x.days })),
  });
}
