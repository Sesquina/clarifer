import { NextRequest, NextResponse } from "next/server";
import { internalSupabase, checkInternalRequest } from "@/lib/internal/supabase";
import type { TeamTask, TaskLane } from "@/lib/internal/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await checkInternalRequest(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = internalSupabase();
  const { data, error } = await supabase
    .from("team_tasks")
    .select("*")
    .neq("status", "archived")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const tasks = (data ?? []) as unknown as TeamTask[];
  const byLane: Record<TaskLane, TeamTask[]> = {
    build: [],
    samira: [],
    michael: [],
    blocked: [],
  };
  for (const t of tasks) byLane[t.lane].push(t);
  return NextResponse.json({ tasks, byLane });
}

export async function POST(req: NextRequest) {
  const auth = await checkInternalRequest(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  if (!["build", "samira", "michael", "blocked"].includes(body.lane)) {
    return NextResponse.json({ error: "invalid lane" }, { status: 400 });
  }
  const supabase = internalSupabase();
  const { data, error } = await supabase
    .from("team_tasks")
    .insert({
      title: body.title,
      description: body.description ?? null,
      lane: body.lane,
      priority: body.priority ?? "medium",
      category: body.category ?? null,
      assigned_to: body.assigned_to ?? null,
      due_date: body.due_date ?? null,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ task: data }, { status: 201 });
}
