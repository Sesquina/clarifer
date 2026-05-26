export function daysUntil(iso: string, now: Date = new Date()): number {
  const target = new Date(iso).getTime();
  return Math.ceil((target - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function urgencyColor(days: number): string {
  if (days < 7) return "var(--accent)";
  if (days <= 14) return "rgb(239, 159, 39)";
  return "var(--primary)";
}

export interface MilestoneEntry {
  key: string;
  label: string;
  date: string;
  display: string;
  percent: number;
}

export const MILESTONES_TIMELINE: MilestoneEntry[] = [
  { key: "ccf",        label: "CCF Demo",         date: "2026-05-08", display: "May 8",     percent: 72 },
  { key: "app_store",  label: "App Store",        date: "2026-05-15", display: "May 15",    percent: 45 },
  { key: "enterprise", label: "Enterprise Ready", date: "2026-05-08", display: "May 8",     percent: 38 },
  { key: "acl_grant",  label: "ACL Grant",        date: "2026-07-31", display: "July 31",   percent: 20 },
  { key: "series_a",   label: "Series A",         date: "2026-09-01", display: "Sept 2026", percent:  8 },
];

export function truncate(s: string | null | undefined, n: number): string {
  if (!s) return "";
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1)}…`;
}
