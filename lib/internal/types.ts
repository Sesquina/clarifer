export type TaskLane = "build" | "samira" | "michael" | "blocked";
export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "active" | "done" | "archived";
export type TaskCategory =
  | "development"
  | "organizational"
  | "partnerships"
  | "sales"
  | "content"
  | "legal"
  | "infrastructure";

export interface TeamTask {
  id: string;
  title: string;
  description: string | null;
  lane: TaskLane;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  category: TaskCategory | null;
  assigned_to: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SprintUpdate {
  id: string;
  sprint_name: string;
  sprint_number: string | null;
  branch: string | null;
  summary: string;
  tests_before: number | null;
  tests_after: number | null;
  files_changed: number | null;
  migrations_pending: string[];
  manual_actions: string[];
  blockers: string[];
  next_sprint: string | null;
  commit_hash: string | null;
  built_by: string | null;
  created_at: string;
}

export interface AgentRun {
  id: string;
  agent_name: string;
  status: "success" | "error" | "warning";
  summary: string | null;
  details: Record<string, unknown> | null;
  ran_at: string;
}

export const MILESTONES = [
  { key: "ccf_demo", label: "CCF Demo", date: "2026-05-08" },
  { key: "app_store", label: "App Store", date: "2026-05-15" },
  { key: "enterprise", label: "Enterprise", date: "2026-05-08" },
  { key: "acl_grant", label: "ACL Grant", date: "2026-07-31" },
  { key: "series_a", label: "Series A", date: "2026-09-01" },
] as const;

export type AccessLevel = "full" | "growth";

export const ALLOWED_EMAILS = [
  "samira.esquina@clarifer.com",
  "michael.barbara@clarifer.com",
] as const;

export const ACCESS_LEVELS: Record<string, AccessLevel> = {
  "samira.esquina@clarifer.com": "full",
  "michael.barbara@clarifer.com": "growth",
};

export function accessLevelFor(email: string | null | undefined): AccessLevel | null {
  if (!email) return null;
  return ACCESS_LEVELS[email] ?? null;
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (ALLOWED_EMAILS as readonly string[]).includes(email);
}
