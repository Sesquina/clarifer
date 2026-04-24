import "server-only";
import { internalSupabase } from "@/lib/internal/supabase";
import type { TeamTask, SprintUpdate, AgentRun, TaskLane } from "@/lib/internal/types";

export async function fetchTasksGrouped(): Promise<{
  tasks: TeamTask[];
  byLane: Record<TaskLane, TeamTask[]>;
  counts: { open: number; blocked: number; done: number };
}> {
  const supabase = internalSupabase();
  const { data, error } = await supabase
    .from("team_tasks")
    .select("*")
    .neq("status", "archived")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const tasks = (data ?? []) as unknown as TeamTask[];
  const byLane: Record<TaskLane, TeamTask[]> = {
    build: [],
    samira: [],
    michael: [],
    blocked: [],
  };
  for (const t of tasks) byLane[t.lane].push(t);
  const counts = {
    open: tasks.filter((t) => t.status === "active").length,
    blocked: byLane.blocked.filter((t) => t.status === "active").length,
    done: tasks.filter((t) => t.status === "done").length,
  };
  return { tasks, byLane, counts };
}

export async function fetchSprints(): Promise<SprintUpdate[]> {
  const supabase = internalSupabase();
  const { data, error } = await supabase
    .from("sprint_updates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SprintUpdate[];
}

export async function fetchLatestSprint(): Promise<SprintUpdate | null> {
  const sprints = await fetchSprints();
  return sprints[0] ?? null;
}

export async function fetchAgentRuns(): Promise<Record<string, AgentRun | null>> {
  const supabase = internalSupabase();
  const names = ["daily-digest", "deadline-tracker", "github-ci", "sprint-reporter"];
  const out: Record<string, AgentRun | null> = {};
  for (const name of names) {
    const { data } = await supabase
      .from("agent_runs")
      .select("*")
      .eq("agent_name", name)
      .order("ran_at", { ascending: false })
      .limit(1);
    out[name] = ((data?.[0] as unknown) as AgentRun) ?? null;
  }
  return out;
}
