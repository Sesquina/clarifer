"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SymptomChart, SymptomPoint } from "@/components/symptoms/SymptomChart";

interface DashboardResponse {
  patient: { id: string; name: string; custom_diagnosis: string | null };
  documents: Array<{ id: string; title: string | null; analysis_status: string | null; uploaded_at: string | null }>;
  symptoms: Array<{ id: string; overall_severity: number | null; ai_summary: string | null; created_at: string | null }>;
  medications: Array<{ id: string; name: string; dose: string | null; unit: string | null; frequency: string | null }>;
  appointments: Array<{ id: string; title: string | null; datetime: string | null; provider_name: string | null }>;
  care_team: Array<{ id: string; relationship_type: string | null }>;
}

function Skeleton({ height = 80 }: { height?: number }) {
  return (
    <div
      aria-busy="true"
      className="animate-pulse rounded-2xl border border-border bg-muted"
      style={{ height }}
    />
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <p className="font-heading text-lg text-primary">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export default function PatientDashboard() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [symptomPoints, setSymptomPoints] = useState<SymptomPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [dash, series] = await Promise.all([
        fetch(`/api/patients/${id}`),
        fetch(`/api/symptoms/${id}?days=7`),
      ]);
      if (!dash.ok) {
        if (dash.status === 404) setError("We could not find this patient.");
        else setError("Something went wrong on our end. Please refresh.");
        return;
      }
      setData(await dash.json());
      if (series.ok) {
        const body = await series.json();
        setSymptomPoints(body.points ?? []);
      }
    } catch {
      setError("Having trouble connecting. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p role="alert" className="rounded-xl border border-border bg-card p-6 text-foreground">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        {loading || !data ? (
          <Skeleton height={56} />
        ) : (
          <div>
            <h1 className="font-heading text-3xl text-foreground">{data.patient.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.patient.custom_diagnosis ?? "Diagnosis not recorded"}
            </p>
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section aria-labelledby="docs-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="docs-heading" className="font-heading text-lg text-primary">Documents</h2>
              <Link
                href="/documents/upload"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                style={{ minHeight: 48, display: "inline-flex", alignItems: "center" }}
              >
                Upload
              </Link>
            </div>
            {loading ? <Skeleton height={120} /> : data!.documents.length === 0 ? (
              <EmptyState title="No documents yet" body="Upload your first one — it takes less than a minute." />
            ) : (
              <ul className="space-y-2" role="list">
                {data!.documents.map((d) => (
                  <li key={d.id} className="rounded-xl border border-border bg-card p-4">
                    <p className="font-medium text-foreground">{d.title ?? "Untitled document"}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.analysis_status ?? "Pending"} · {d.uploaded_at?.slice(0, 10) ?? ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="symptoms-heading">
            <h2 id="symptoms-heading" className="mb-3 font-heading text-lg text-primary">Symptoms (last 7 days)</h2>
            {loading ? <Skeleton height={220} /> : <SymptomChart points={symptomPoints} days={7} />}
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-2">
          <section aria-labelledby="meds-heading">
            <h2 id="meds-heading" className="mb-3 font-heading text-lg text-primary">Medications</h2>
            {loading ? <Skeleton /> : data!.medications.length === 0 ? (
              <EmptyState title="No medications added yet" body="Add medications to keep track of the schedule." />
            ) : (
              <ul className="space-y-2" role="list">
                {data!.medications.map((m) => (
                  <li key={m.id} className="rounded-xl border border-border bg-card p-4">
                    <p className="font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[m.dose, m.unit].filter(Boolean).join(" ")} · {m.frequency ?? "Schedule not set"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="appts-heading">
            <h2 id="appts-heading" className="mb-3 font-heading text-lg text-primary">Upcoming appointments</h2>
            {loading ? <Skeleton /> : data!.appointments.length === 0 ? (
              <EmptyState title="No upcoming appointments" body="Schedule one to stay on top of care." />
            ) : (
              <ul className="space-y-2" role="list">
                {data!.appointments.map((a) => (
                  <li key={a.id} className="rounded-xl border border-border bg-card p-4">
                    <p className="font-medium text-foreground">{a.title ?? "Appointment"}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.datetime ? new Date(a.datetime).toLocaleString() : "Time to be confirmed"}
                      {a.provider_name ? ` · ${a.provider_name}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="care-team-heading">
            <h2 id="care-team-heading" className="mb-3 font-heading text-lg text-primary">Care team</h2>
            {loading ? <Skeleton /> : data!.care_team.length === 0 ? (
              <EmptyState title="No care team yet" body="Add your care team so you can reach them when it matters." />
            ) : (
              <ul className="space-y-2" role="list">
                {data!.care_team.map((c) => (
                  <li key={c.id} className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm text-foreground">{c.relationship_type ?? "Team member"}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
