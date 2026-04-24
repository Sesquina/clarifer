"use client";
import { useEffect, useState } from "react";

export interface ChecklistItem {
  text: string;
  checked: boolean;
}

export interface AppointmentDetailData {
  id: string;
  title: string | null;
  datetime: string | null;
  provider_name: string | null;
  provider_specialty: string | null;
  location: string | null;
  appointment_type: string | null;
  pre_visit_checklist: ChecklistItem[];
  post_visit_notes: string | null;
}

interface AppointmentDetailProps {
  appointment: AppointmentDetailData;
  onChecklistChange: (next: ChecklistItem[]) => Promise<void>;
  onNotesBlur: (notes: string) => Promise<void>;
}

export function AppointmentDetail({
  appointment,
  onChecklistChange,
  onNotesBlur,
}: AppointmentDetailProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(appointment.pre_visit_checklist ?? []);
  const [notes, setNotes] = useState(appointment.post_visit_notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setChecklist(appointment.pre_visit_checklist ?? []);
    setNotes(appointment.post_visit_notes ?? "");
  }, [appointment]);

  async function toggle(idx: number) {
    const next = checklist.map((item, i) =>
      i === idx ? { ...item, checked: !item.checked } : item
    );
    setChecklist(next);
    setSaving(true);
    try {
      await onChecklistChange(next);
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    if (notes === (appointment.post_visit_notes ?? "")) return;
    setSaving(true);
    try {
      await onNotesBlur(notes);
    } finally {
      setSaving(false);
    }
  }

  const when = appointment.datetime ? new Date(appointment.datetime) : null;
  const whenLabel = when
    ? when.toLocaleString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Date to be confirmed";

  return (
    <div className="space-y-6" aria-live={saving ? "polite" : undefined}>
      <header className="space-y-2">
        {appointment.appointment_type && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {appointment.appointment_type}
          </span>
        )}
        <h1 className="font-heading text-2xl text-foreground">
          {appointment.title ?? "Appointment"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {whenLabel} · {appointment.provider_name ?? "Provider to be confirmed"}
          {appointment.provider_specialty ? ` (${appointment.provider_specialty})` : ""}
        </p>
        {appointment.location && (
          <p className="text-sm text-muted-foreground">{appointment.location}</p>
        )}
      </header>

      <section aria-labelledby="checklist-heading">
        <h2 id="checklist-heading" className="font-heading text-lg text-primary">
          Before the visit
        </h2>
        {checklist.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No checklist items. Add questions you want to raise with the care team.
          </p>
        ) : (
          <ul className="mt-3 space-y-2" role="list">
            {checklist.map((item, i) => (
              <li key={`${item.text}-${i}`}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggle(i)}
                    aria-label={item.text}
                    className="mt-1 h-5 w-5"
                  />
                  <span className="text-sm text-foreground">{item.text}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="notes-heading">
        <h2 id="notes-heading" className="font-heading text-lg text-primary">
          After the visit
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={5}
          placeholder="Notes from the visit, questions you want to follow up on, anything worth remembering."
          className="mt-3 w-full rounded-lg border border-border bg-card px-4 py-3 text-base"
          aria-label="Post visit notes"
        />
      </section>
    </div>
  );
}

export const CHOLANGIOCARCINOMA_ONCOLOGY_CHECKLIST: ChecklistItem[] = [
  { text: "Ask about CA 19-9 and CEA tumor marker levels", checked: false },
  { text: "Ask about FGFR2 fusion/rearrangement status", checked: false },
  { text: "Ask about next imaging schedule (CT or MRI)", checked: false },
  { text: "Ask about clinical trial eligibility", checked: false },
  { text: "Review current medication side effects", checked: false },
  { text: "Ask about pain management options", checked: false },
  { text: "Ask about nutrition and weight management support", checked: false },
];
