import { NextRequest, NextResponse } from "next/server";
import { internalSupabase, checkInternalRequest } from "@/lib/internal/supabase";
import type { Database } from "@/lib/supabase/types";

type TeamTaskUpdate = Database["public"]["Tables"]["team_tasks"]["Update"];

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await checkInternalRequest(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }
  const allowed = [
    "status",
    "lane",
    "priority",
    "completed_at",
    "title",
    "description",
    "due_date",
    "category",
    "assigned_to",
  ] as const;
  const patch: TeamTaskUpdate = { updated_at: new Date().toISOString() };
  for (const k of allowed) {
    if (k in body) (patch as Record<string, unknown>)[k] = body[k];
  }
  if (body.status === "done" && !patch.completed_at) {
    patch.completed_at = new Date().toISOString();
  }

  const supabase = internalSupabase();
  const { data, error } = await supabase
    .from("team_tasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ task: data });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await checkInternalRequest(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const supabase = internalSupabase();
  const { error } = await supabase
    .from("team_tasks")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
