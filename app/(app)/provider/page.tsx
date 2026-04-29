/**
 * app/(app)/provider/page.tsx
 * Provider portal home: list of patients assigned to this provider.
 * Tables: reads via /api/provider/patients (no direct Supabase)
 * Auth: provider role only -- redirect to /dashboard if other role
 *       (server enforces 403 regardless; client redirect is courtesy)
 * Sprint: Sprint 12 -- Provider Portal
 *
 * HIPAA: Renders patient names + diagnoses + activity counts. The API
 * route writes audit_log on every load. No PHI logged client-side.
 */
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface PatientCard {
  id: string;
  name: string | null;
  custom_diagnosis: string | null;
  condition_template_id: string | null;
  last_symptom_log_at: string | null;
  next_appointment_at: string | null;
  medication_count: number;
  active_alert_count: number;
}

const COPY = {
  title: "My Patients",
  searchPlaceholder: "Search patients by name",
  loading: "Loading your patients...",
  empty:
    "No patients assigned yet. Contact your administrator to be assigned to patient care teams.",
  loadError: "We could not load your patients. Try again in a moment.",
  view: "View patient",
  alertsLabel: "active alerts",
  noActivity: "No symptom activity yet",
  noAppt: "No upcoming appointment",
};

export default function ProviderHome() {
  const [patients, setPatients] = useState<PatientCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/provider/patients");
      if (!res.ok) {
        setError(COPY.loadError);
        return;
      }
      const json = (await res.json()) as { patients: PatientCard[] };
      setPatients(json.patients ?? []);
    } catch {
      setError(COPY.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!query.trim()) return patients;
    const q = query.toLowerCase();
    return patients.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  }, [patients, query]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <h1 className="font-heading text-3xl text-primary">{COPY.title}</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={COPY.searchPlaceholder}
        aria-label={COPY.searchPlaceholder}
        style={{ minHeight: 48 }}
        className="w-full rounded-xl border border-border bg-card px-4 text-base text-foreground"
      />

      {error && (
        <div role="alert" className="rounded-xl border border-accent bg-pale-terra p-3 text-sm text-foreground">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">{COPY.loading}</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center" aria-label="empty-state">
          <p className="text-sm text-muted-foreground">{COPY.empty}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => (
            <li key={p.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading text-lg text-foreground">{p.name ?? "Unnamed patient"}</span>
                    {p.active_alert_count > 0 && (
                      <span
                        className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white"
                        aria-label={`${p.active_alert_count} ${COPY.alertsLabel}`}
                      >
                        {p.active_alert_count} {COPY.alertsLabel}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.custom_diagnosis ?? p.condition_template_id ?? "No diagnosis recorded"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {p.last_symptom_log_at
                      ? `Last log: ${formatRelative(p.last_symptom_log_at)}`
                      : COPY.noActivity}
                    {" · "}
                    {p.next_appointment_at
                      ? `Next visit: ${new Date(p.next_appointment_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}`
                      : COPY.noAppt}
                    {" · "}
                    {p.medication_count} medication{p.medication_count === 1 ? "" : "s"}
                  </p>
                </div>
                <Link
                  href={`/provider/patients/${p.id}`}
                  style={{ minHeight: 48 }}
                  className="inline-flex items-center rounded-full bg-primary px-5 text-sm font-medium text-white"
                >
                  {COPY.view}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const days = Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
