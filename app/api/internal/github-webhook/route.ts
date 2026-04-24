import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { internalSupabase } from "@/lib/internal/supabase";

export const dynamic = "force-dynamic";

function verifyGithubSignature(
  signatureHeader: string | null,
  rawBody: string
): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = `sha256=${createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-hub-signature-256");
  if (!verifyGithubSignature(sig, raw)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const event = req.headers.get("x-github-event");
  if (event !== "workflow_run") {
    return NextResponse.json({ ok: true, skipped: "non-workflow-run event" });
  }

  const run = payload.workflow_run as Record<string, unknown> | undefined;
  const conclusion = (run?.conclusion as string) ?? "unknown";
  const name = (run?.name as string) ?? "unknown";
  const htmlUrl = (run?.html_url as string) ?? null;
  const headBranch = (run?.head_branch as string) ?? null;
  const headSha = (run?.head_sha as string) ?? null;

  const supabase = internalSupabase();

  const status: "success" | "error" | "warning" =
    conclusion === "success" ? "success" : conclusion === "failure" ? "error" : "warning";

  await supabase.from("agent_runs").insert({
    agent_name: "github-ci",
    status,
    summary: `${name} on ${headBranch || "unknown"}: ${conclusion}`,
    details: { htmlUrl, headSha, conclusion, name, headBranch },
  });

  if (conclusion === "failure") {
    await supabase.from("team_tasks").insert({
      title: `CI failure on ${headBranch || "unknown"}`,
      description: `${name} failed. Investigate: ${htmlUrl ?? "(no url)"}`,
      lane: "build",
      priority: "high",
      category: "development",
      created_by: "github-webhook",
    });
  }

  return NextResponse.json({ ok: true, recorded: conclusion });
}
