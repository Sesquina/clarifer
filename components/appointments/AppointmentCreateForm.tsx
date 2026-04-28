/**
 * components/appointments/AppointmentCreateForm.tsx
 * Create-appointment form for the appointments page (web).
 * Tables: POSTs /api/appointments; no direct Supabase
 * Auth: caregiver (server-enforced)
 * Sprint: Sprint 11 -- Appointment Tracker
 *
 * HIPAA: No PHI logged; errors surface only generic messages from the
 * server. Pre-visit checklist auto-populates server-side from the
 * patient's condition_template_id when omitted.
 */
"use client";
import { useState } from "react";

interface AppointmentCreateFormProps {
  patientId: string;
  onCreated?: (appointmentId: string) => void;
  onCancel?: () => void;
}

type Status = "idle" | "saving" | "error";

const APPOINTMENT_TYPES = [
  { value: "", label: "General visit" },
  { value: "oncology", label: "Oncology" },
  { value: "neurology", label: "Neurology" },
  { value: "primary_care", label: "Primary care" },
  { value: "imaging", label: "Imaging" },
  { value: "lab", label: "Lab work" },
  { value: "telehealth", label: "Telehealth" },
];

export function AppointmentCreateForm({
  patientId,
  onCreated,
  onCancel,
}: AppointmentCreateFormProps) {
  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");
  const [providerName, setProviderName] = useState("");
  const [providerSpecialty, setProviderSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          title: title.trim(),
          datetime: datetime ? new Date(datetime).toISOString() : null,
          provider_name: providerName.trim() || null,
          provider_specialty: providerSpecialty.trim() || null,
          location: location.trim() || null,
          appointment_type: appointmentType || null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setStatus("error");
        setErrorMsg(err.error || "We could not save this appointment.");
        return;
      }
      const body = (await res.json()) as { appointment?: { id: string } };
      onCreated?.(body.appointment?.id ?? "");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm text-foreground">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Oncology follow-up"
          required
          style={{ minHeight: 48 }}
          className="w-full rounded-xl border border-border bg-card px-4 text-base text-foreground"
        />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-foreground">When</span>
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            style={{ minHeight: 48 }}
            className="w-full rounded-xl border border-border bg-card px-4 text-base text-foreground"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-foreground">Type</span>
          <select
            value={appointmentType}
            onChange={(e) => setAppointmentType(e.target.value)}
            style={{ minHeight: 48 }}
            className="w-full rounded-xl border border-border bg-card px-4 text-base text-foreground"
          >
            {APPOINTMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-foreground">Provider name</span>
          <input
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            style={{ minHeight: 48 }}
            className="w-full rounded-xl border border-border bg-card px-4 text-base text-foreground"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-foreground">Specialty</span>
          <input
            value={providerSpecialty}
            onChange={(e) => setProviderSpecialty(e.target.value)}
            style={{ minHeight: 48 }}
            className="w-full rounded-xl border border-border bg-card px-4 text-base text-foreground"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm text-foreground">Location</span>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ minHeight: 48 }}
          className="w-full rounded-xl border border-border bg-card px-4 text-base text-foreground"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-foreground">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
        />
      </label>

      {status === "error" && (
        <p className="text-sm text-accent" role="alert">
          {errorMsg}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={status === "saving" || !title.trim()}
          style={{ minHeight: 48 }}
          className="rounded-full bg-primary px-6 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "saving" ? "Saving..." : "Save appointment"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{ minHeight: 48 }}
            className="rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground"
          >
            Cancel
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        A pre-visit checklist will be added automatically based on this patient&apos;s condition.
        Reminders are coming in a future update.
      </p>
    </form>
  );
}
