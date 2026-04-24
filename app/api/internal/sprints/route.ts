import { NextRequest, NextResponse } from "next/server";
import { internalSupabase, checkInternalRequest } from "@/lib/internal/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await checkInternalRequest(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = internalSupabase();
  const { data, error } = await supabase
    .from("sprint_updates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ sprints: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await checkInternalRequest(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.sprint_name !== "string" || !body.sprint_name.trim()) {
    return NextResponse.json({ error: "sprint_name required" }, { status: 400 });
  }
  if (typeof body.summary !== "string" || !body.summary.trim()) {
    return NextResponse.json({ error: "summary required" }, { status: 400 });
  }
  const supabase = internalSupabase();
  const { data, error } = await supabase
    .from("sprint_updates")
    .insert({
      sprint_name: body.sprint_name,
      sprint_number: body.sprint_number ?? null,
      branch: body.branch ?? null,
      summary: body.summary,
      tests_before: body.tests_before ?? null,
      tests_after: body.tests_after ?? null,
      files_changed: body.files_changed ?? null,
      migrations_pending: body.migrations_pending ?? [],
      manual_actions: body.manual_actions ?? [],
      blockers: body.blockers ?? [],
      next_sprint: body.next_sprint ?? null,
      commit_hash: body.commit_hash ?? null,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ sprint: data }, { status: 201 });
}
