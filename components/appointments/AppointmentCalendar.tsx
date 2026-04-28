/**
 * components/appointments/AppointmentCalendar.tsx
 * Month + week calendar views for the appointments page (web).
 * Tables: none -- pure client renderer over an appointment[] prop
 * Auth: not applicable -- caller's data already org-scoped via API
 * Sprint: Sprint 11 -- Appointment Tracker
 *
 * HIPAA: No PHI in this file. Renders titles + datetimes only.
 * Empty cells render warm, never-judging copy ("No appointments
 * scheduled this week").
 */
"use client";
import { useMemo, useState } from "react";

export interface CalendarAppointment {
  id: string;
  title: string | null;
  datetime: string | null;
  appointment_type: string | null;
}

type View = "month" | "week";

interface AppointmentCalendarProps {
  appointments: CalendarAppointment[];
  initialDate?: Date;
  onSelectAppointment?: (id: string) => void;
}

const DAY_LABELS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - out.getDay());
  return out;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function sameYMD(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function weekRangeLabel(start: Date): string {
  const end = addDays(start, 6);
  const startStr = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${startStr} -- ${endStr}`;
}

export function AppointmentCalendar({
  appointments,
  initialDate,
  onSelectAppointment,
}: AppointmentCalendarProps) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState<Date>(initialDate ?? new Date());

  const apptsByDay = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    for (const a of appointments) {
      if (!a.datetime) continue;
      const d = new Date(a.datetime);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [appointments]);

  function dayKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function shift(direction: -1 | 1) {
    const next = new Date(cursor);
    if (view === "month") next.setMonth(next.getMonth() + direction);
    else next.setDate(next.getDate() + direction * 7);
    setCursor(next);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2" role="group" aria-label="Calendar view">
          <button
            type="button"
            onClick={() => setView("month")}
            aria-pressed={view === "month"}
            style={{ minHeight: 48 }}
            className={`rounded-full px-4 text-sm font-medium ${
              view === "month"
                ? "bg-primary text-white"
                : "border border-border bg-card text-foreground"
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setView("week")}
            aria-pressed={view === "week"}
            style={{ minHeight: 48 }}
            className={`rounded-full px-4 text-sm font-medium ${
              view === "week"
                ? "bg-primary text-white"
                : "border border-border bg-card text-foreground"
            }`}
          >
            Week
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label={view === "month" ? "Previous month" : "Previous week"}
            style={{ minHeight: 48, minWidth: 48 }}
            className="rounded-full border border-border bg-card px-3 text-sm"
          >
            &larr;
          </button>
          <span className="font-heading text-lg text-primary">
            {view === "month" ? monthLabel(cursor) : weekRangeLabel(startOfWeek(cursor))}
          </span>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label={view === "month" ? "Next month" : "Next week"}
            style={{ minHeight: 48, minWidth: 48 }}
            className="rounded-full border border-border bg-card px-3 text-sm"
          >
            &rarr;
          </button>
        </div>
      </div>

      {view === "month" ? (
        <MonthGrid
          cursor={cursor}
          apptsByDay={apptsByDay}
          dayKey={dayKey}
          onSelectAppointment={onSelectAppointment}
        />
      ) : (
        <WeekGrid
          cursor={cursor}
          apptsByDay={apptsByDay}
          dayKey={dayKey}
          onSelectAppointment={onSelectAppointment}
        />
      )}
    </div>
  );
}

interface GridProps {
  cursor: Date;
  apptsByDay: Map<string, CalendarAppointment[]>;
  dayKey: (d: Date) => string;
  onSelectAppointment?: (id: string) => void;
}

function MonthGrid({ cursor, apptsByDay, dayKey, onSelectAppointment }: GridProps) {
  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const today = new Date();

  const cells: Date[] = [];
  for (let i = 0; i < 42; i += 1) cells.push(addDays(gridStart, i));

  return (
    <div role="grid" aria-label="Month calendar">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {DAY_LABELS_SHORT.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = sameYMD(d, today);
          const items = apptsByDay.get(dayKey(d)) ?? [];
          return (
            <div
              key={d.toISOString()}
              role="gridcell"
              aria-label={d.toDateString()}
              className={`min-h-24 rounded-lg border border-border p-2 text-left ${
                inMonth ? "bg-card" : "bg-background"
              } ${isToday ? "ring-2 ring-primary" : ""}`}
            >
              <div className={`mb-1 text-xs ${inMonth ? "text-foreground" : "text-muted-foreground"}`}>
                {d.getDate()}
              </div>
              <ul className="space-y-1">
                {items.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => onSelectAppointment?.(a.id)}
                      className="w-full truncate rounded bg-pale-sage px-2 py-1 text-left text-xs text-primary hover:bg-primary hover:text-white"
                    >
                      {a.title ?? "Untitled"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({ cursor, apptsByDay, dayKey, onSelectAppointment }: GridProps) {
  const weekStart = startOfWeek(cursor);
  const today = new Date();
  const days: Date[] = [];
  for (let i = 0; i < 7; i += 1) days.push(addDays(weekStart, i));

  return (
    <div role="grid" aria-label="Week calendar" className="grid grid-cols-1 gap-2 md:grid-cols-7">
      {days.map((d) => {
        const items = apptsByDay.get(dayKey(d)) ?? [];
        const isToday = sameYMD(d, today);
        return (
          <div
            key={d.toISOString()}
            role="gridcell"
            aria-label={d.toDateString()}
            className={`rounded-xl border border-border bg-card p-3 ${
              isToday ? "ring-2 ring-primary" : ""
            }`}
          >
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
              <span className="font-heading text-lg text-primary">{d.getDate()}</span>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground">No appointments scheduled.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((a) => {
                  const dt = a.datetime ? new Date(a.datetime) : null;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => onSelectAppointment?.(a.id)}
                        style={{ minHeight: 48 }}
                        className="w-full rounded-lg bg-pale-terra px-3 py-2 text-left hover:bg-accent hover:text-white"
                      >
                        <div className="text-sm font-medium">{a.title ?? "Untitled"}</div>
                        {dt && (
                          <div className="text-xs text-muted-foreground">
                            {dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
