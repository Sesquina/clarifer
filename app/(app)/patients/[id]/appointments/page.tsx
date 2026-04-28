/**
 * app/(app)/patients/[id]/appointments/page.tsx
 * Web appointments screen: list, calendar (month/week), create.
 * Tables: GET /api/appointments?patient_id=...; POST /api/appointments
 *         (no direct Supabase reads from this client)
 * Auth: server enforces caregiver/patient/provider/admin
 * Sprint: Sprint 11 -- Appointment Tracker
 *
 * HIPAA: All data fetched via server route which writes audit_log on
 * SELECT and INSERT and enforces org isolation. No PHI logged client-
 * side.
 */
"use client";
import { use, useCallback, useEffect, useState } from "react";
import {
  AppointmentCalendar,
  type CalendarAppointment,
} from "@/components/appointments/AppointmentCalendar";
import { AppointmentCreateForm } from "@/components/appointments/AppointmentCreateForm";

interface ApptRow extends CalendarAppointment {
  provider_name: string | null;
  provider_specialty: string | null;
  location: string | null;
  appointment_type: string | null;
  completed: boolean | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AppointmentsPage({ params }: PageProps) {
  const { id: patientId } = use(params);
  const [appointments, setAppointments] = useState<ApptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments?patient_id=${encodeURIComponent(patientId)}`);
      if (!res.ok) {
        setError("We could not load this patient's appointments. Please refresh in a moment.");
        return;
      }
      const body = (await res.json()) as { appointments: ApptRow[] };
      setAppointments(body.appointments ?? []);
    } catch {
      setError("Something went wrong loading appointments.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const upcoming = appointments
    .filter((a) => {
      if (!a.datetime) return false;
      const t = new Date(a.datetime).getTime();
      return Number.isFinite(t) && t >= Date.now();
    })
    .slice(0, 5);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl text-primary">Appointments</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          style={{ minHeight: 48 }}
          className="rounded-full bg-primary px-5 text-sm font-medium text-white"
        >
          {showForm ? "Close" : "Add appointment"}
        </button>
      </header>

      {showForm && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 font-heading text-lg text-primary">New appointment</h2>
          <AppointmentCreateForm
            patientId={patientId}
            onCreated={() => {
              setShowForm(false);
              void load();
            }}
            onCancel={() => setShowForm(false)}
          />
        </section>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-accent bg-pale-terra p-3 text-sm text-foreground">
          {error}
        </div>
      )}

      <section aria-labelledby="upcoming-heading" className="rounded-2xl border border-border bg-card p-4">
        <h2 id="upcoming-heading" className="mb-3 font-heading text-lg text-primary">
          Upcoming
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading appointments...</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming appointments yet. Add one when you have the next visit on the calendar.
          </p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((a) => {
              const dt = a.datetime ? new Date(a.datetime) : null;
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background p-3"
                >
                  <div>
                    <div className="font-medium text-foreground">{a.title ?? "Untitled"}</div>
                    <div className="text-xs text-muted-foreground">
                      {dt
                        ? dt.toLocaleString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "Date to be confirmed"}
                      {a.provider_name ? ` -- ${a.provider_name}` : ""}
                      {a.location ? ` -- ${a.location}` : ""}
                    </div>
                  </div>
                  {a.appointment_type && (
                    <span className="rounded-full bg-pale-sage px-3 py-1 text-xs text-primary">
                      {a.appointment_type}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AppointmentCalendar appointments={appointments} />
    </main>
  );
}
