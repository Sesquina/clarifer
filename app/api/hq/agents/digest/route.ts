import { NextRequest, NextResponse } from "next/server";
import { internalSupabase } from "@/lib/internal/supabase";
import { generateDigestEmail, sendDigestEmail } from "@/lib/email/digest-template";
import type { TeamTask, SprintUpdate, AccessLevel } from "@/lib/internal/types";

export const dynamic = "force-dynamic";

function cronAuthorized(req: NextRequest): boolean {
  // Vercel Cron requests include this header with the project cron secret.
  if (req.headers.get("x-vercel-cron") === "1") return true;
  const auth = req.headers.get("authorization");
  if (!auth) return false;
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) return false;
  return auth === `Bearer ${expected}`;
}

export async function GET(req: NextRequest) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = internalSupabase();
  const [tasksRes, sprintsRes, blockersRes] = await Promise.all([
    supabase.from("team_tasks").select("*").eq("status", "active"),
    supabase
      .from("sprint_updates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.from("team_tasks").select("*", { count: "exact", head: true }).eq("lane", "blocked").eq("status", "active"),
  ]);
  if (tasksRes.error) {
    return NextResponse.json({ error: tasksRes.error.message }, { status: 500 });
  }

  const tasks = (tasksRes.data ?? []) as unknown as TeamTask[];
  const lastSprint = (sprintsRes.data?.[0] as unknown as SprintUpdate) ?? null;
  const allSprints = await supabase
    .from("sprint_updates")
    .select("*", { count: "exact", head: true });

  const counts = {
    testsPassing: lastSprint?.tests_after ?? 0,
    sprintsComplete: allSprints.count ?? 0,
    openBlockers: blockersRes.count ?? 0,
  };

  const recipients: Array<{ email: string; level: AccessLevel }> = [
    { email: "samira.esquina@clarifer.com", level: "full" },
    { email: "michael.barbara@clarifer.com", level: "growth" },
  ];

  const results: Array<{ to: string; ok: boolean; error?: string }> = [];
  for (const r of recipients) {
    const digest = generateDigestEmail({
      accessLevel: r.level,
      tasks,
      lastSprint,
      nextSprint: tasks.find((t) => t.lane === "build" && t.priority === "high")?.title ?? null,
      counts,
    });
    const send = await sendDigestEmail({
      to: r.email,
      subject: digest.subject,
      html: digest.html,
    });
    results.push({ to: r.email, ...send });
  }

  const allOk = results.every((r) => r.ok);
  await supabase.from("agent_runs").insert({
    agent_name: "daily-digest",
    status: allOk ? "success" : "error",
    summary: `Sent ${results.filter((r) => r.ok).length}/${results.length} digests`,
    details: { results },
  });

  return NextResponse.json({ ok: allOk, results });
}
