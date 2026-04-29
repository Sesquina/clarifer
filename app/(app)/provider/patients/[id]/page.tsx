/**
 * app/(app)/provider/patients/[id]/page.tsx
 * Provider patient detail page (tabbed: Overview, Symptoms, Documents,
 * Notes, Export).
 * Tables: reads via /api/provider/patients/[id]; notes CRUD via
 *         /api/provider/patients/[id]/notes; PDF via /export
 * Auth: provider role only (server enforces 403)
 * Sprint: Sprint 12 -- Provider Portal
 *
 * HIPAA: Renders full clinical PHI for one patient. Server writes
 * audit_log on every fetch and on every notes / export operation.
 * No PHI logged client-side.
 */
"use client";
import { use, useCallback, useEffect, useState } from "react";

interface Patient {
  id: string;
  name: string | null;
  custom_diagnosis: string | null;
  condition_template_id: string | null;
  diagnosis_date: string | null;
  dob: string | null;
}
interface SymptomLog {
  id: string;
  created_at: string | null;
  overall_severity: number | null;
}
interface Medication {
  id: string;
  name: string | null;
  dose: string | null;
  unit: string | null;
  frequency: string | null;
}
interface Appointment {
  id: string;
  title: string | null;
  datetime: string | null;
  appointment_type: string | null;
}
interface DocumentRow {
  id: string;
  title: string | null;
  summary: string | null;
  created_at: string | null;
}
interface Alert {
  id: string;
  alert_type: string | null;
  message: string | null;
  severity: string | null;
  triggered_at: string | null;
}
interface Note {
  id: string;
  note_text: string;
  note_type: string | null;
  created_at: string | null;
  updated_at: string | null;
}
interface DetailResponse {
  patient: Patient;
  symptom_logs: SymptomLog[];
  medications: Medication[];
  upcoming_appointments: Appointment[];
  recent_documents: DocumentRow[];
  active_alerts: Alert[];
  provider_notes: Note[];
}

type Tab = "overview" | "symptoms" | "documents" | "notes" | "export";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "symptoms", label: "Symptom trends" },
  { id: "documents", label: "Documents" },
  { id: "notes", label: "Notes" },
  { id: "export", label: "Export" },
];

const NOTE_TYPES = [
  { value: "general", label: "General" },
  { value: "visit", label: "Visit" },
  { value: "alert", label: "Alert" },
  { value: "follow_up", label: "Follow up" },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProviderPatientDetail({ params }: PageProps) {
  const { id: patientId } = use(params);
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/provider/patients/${encodeURIComponent(patientId)}`);
      if (!res.ok) {
        setError("We could not load this patient. Please refresh.");
        return;
      }
      setData((await res.json()) as DetailResponse);
    } catch {
      setError("Something went wrong loading the patient.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-sm text-muted-foreground">Loading patient...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div role="alert" className="rounded-xl border border-accent bg-pale-terra p-3 text-sm text-foreground">
          {error ?? "Patient not found."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl text-primary">{data.patient.name ?? "Patient"}</h1>
        <p className="text-sm text-muted-foreground">
          {data.patient.custom_diagnosis ?? data.patient.condition_template_id ?? "No diagnosis recorded"}
          {data.patient.dob ? ` · DOB ${data.patient.dob}` : ""}
          {data.patient.diagnosis_date ? ` · Diagnosed ${data.patient.diagnosis_date}` : ""}
        </p>
      </header>

      <nav role="tablist" aria-label="Patient detail tabs" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            style={{ minHeight: 48 }}
            className={`rounded-full px-4 text-sm font-medium ${
              tab === t.id
                ? "bg-primary text-white"
                : "border border-border bg-card text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && <OverviewTab data={data} />}
      {tab === "symptoms" && <SymptomsTab logs={data.symptom_logs} />}
      {tab === "documents" && <DocumentsTab documents={data.recent_documents} />}
      {tab === "notes" && <NotesTab patientId={patientId} initialNotes={data.provider_notes} />}
      {tab === "export" && <ExportTab patientId={patientId} />}
    </main>
  );
}

function OverviewTab({ data }: { data: DetailResponse }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-heading text-lg text-primary">Active medications</h2>
        {data.medications.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No active medications on file.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm text-foreground">
            {data.medications.map((m) => (
              <li key={m.id}>
                <span className="font-medium">{m.name ?? "Unnamed"}</span>
                {m.dose ? ` · ${m.dose}${m.unit ?? ""}` : ""}
                {m.frequency ? ` · ${m.frequency}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-heading text-lg text-primary">Active alerts</h2>
        {data.active_alerts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No active alerts.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {data.active_alerts.map((a) => (
              <li key={a.id} className="rounded-lg border border-accent bg-pale-terra p-2 text-sm text-foreground">
                <span className="font-medium">{a.alert_type ?? "Alert"}</span>
                {a.message ? ` -- ${a.message}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 md:col-span-2">
        <h2 className="font-heading text-lg text-primary">Upcoming appointments</h2>
        {data.upcoming_appointments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No upcoming appointments scheduled.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm text-foreground">
            {data.upcoming_appointments.map((a) => (
              <li key={a.id}>
                <span className="font-medium">{a.title ?? "Appointment"}</span>
                {a.datetime ? ` -- ${new Date(a.datetime).toLocaleString()}` : ""}
                {a.appointment_type ? ` (${a.appointment_type})` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function SymptomsTab({ logs }: { logs: SymptomLog[] }) {
  if (logs.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">No symptom logs in the last 30 days.</p>
      </section>
    );
  }
  // Lightweight inline chart -- no chart library dependency, parity
  // with the Sprint 7 SymptomChart approach (pure data viz).
  const max = Math.max(10, ...logs.map((l) => l.overall_severity ?? 0));
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="font-heading text-lg text-primary">Severity (last 30 days)</h2>
      <div className="mt-3 flex h-32 items-end gap-1 overflow-x-auto" role="img" aria-label="symptom severity chart">
        {logs.map((l) => {
          const height = ((l.overall_severity ?? 0) / max) * 100;
          return (
            <div
              key={l.id}
              title={`${l.created_at ?? ""}: ${l.overall_severity ?? 0}`}
              style={{ height: `${height}%`, minWidth: 4 }}
              className="w-2 rounded-t bg-primary"
            />
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Each bar is one logged check-in. Tap or hover to see severity and date.
      </p>
    </section>
  );
}

function DocumentsTab({ documents }: { documents: DocumentRow[] }) {
  if (documents.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">No documents uploaded for this patient.</p>
      </section>
    );
  }
  return (
    <section className="space-y-3">
      {documents.map((d) => (
        <article key={d.id} className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-heading text-base text-primary">{d.title ?? "Document"}</h3>
          <p className="text-xs text-muted-foreground">
            {d.created_at ? new Date(d.created_at).toLocaleDateString() : ""}
          </p>
          {d.summary && <p className="mt-2 text-sm text-foreground">{d.summary}</p>}
        </article>
      ))}
    </section>
  );
}

function NotesTab({
  patientId,
  initialNotes,
}: {
  patientId: string;
  initialNotes: Note[];
}) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [text, setText] = useState("");
  const [type, setType] = useState("general");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/provider/patients/${patientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_text: text.trim(), note_type: type }),
      });
      if (!res.ok) {
        setErr("We could not save the note. Please try again.");
        return;
      }
      const body = (await res.json()) as { note: Note };
      setNotes((prev) => [body.note, ...prev]);
      setText("");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/provider/patients/${patientId}/notes/${id}`, {
      method: "DELETE",
    });
    if (res.ok) setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <section className="space-y-4">
      <form onSubmit={add} className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-heading text-lg text-primary">Add note</h2>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Note type"
          style={{ minHeight: 48 }}
          className="w-full rounded-xl border border-border bg-card px-4 text-base text-foreground"
        >
          {NOTE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Private clinical note for your records"
          aria-label="Note text"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
        />
        {err && <p className="text-sm text-accent" role="alert">{err}</p>}
        <button
          type="submit"
          disabled={saving || !text.trim()}
          style={{ minHeight: 48 }}
          className="rounded-full bg-primary px-5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save note"}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet for this patient.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-pale-sage px-2 py-1 text-xs text-primary">
                    {n.note_type ?? "general"}
                  </span>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{n.note_text}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  style={{ minHeight: 48 }}
                  className="rounded-full border border-border bg-card px-3 text-sm text-foreground"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ExportTab({ patientId }: { patientId: string }) {
  const [generating, setGenerating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setErr(null);
    try {
      const res = await fetch(`/api/provider/patients/${patientId}/export`, { method: "POST" });
      if (!res.ok) {
        setErr("We could not generate the report. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `patient-${patientId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setErr("Something went wrong generating the report.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="font-heading text-lg text-primary">Generate clinical PDF report</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Includes patient demographics, active medications, last 30 days of symptom severity,
        recent documents, upcoming appointments, and biomarkers. Care coordination tool, not
        a medical record.
      </p>
      {err && <p className="mt-3 text-sm text-accent" role="alert">{err}</p>}
      <button
        type="button"
        onClick={generate}
        disabled={generating}
        style={{ minHeight: 48 }}
        className="mt-4 rounded-full bg-accent px-5 text-sm font-medium text-white disabled:opacity-50"
      >
        {generating ? "Generating..." : "Generate PDF report"}
      </button>
    </section>
  );
}
