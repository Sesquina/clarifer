"use client";
import { MedicationCard, MedicationRow } from "./MedicationCard";

interface MedicationListProps {
  medications: MedicationRow[];
  loading?: boolean;
  error?: string | null;
  adherenceByMedicationId?: Record<string, number>;
  onMarkMissed?: (id: string) => void;
}

export function MedicationList({
  medications,
  loading,
  error,
  adherenceByMedicationId,
  onMarkMissed,
}: MedicationListProps) {
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading medications">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-border bg-muted"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-foreground">
          Having trouble loading medications. Check your connection and try again.
        </p>
      </div>
    );
  }

  if (medications.length === 0) {
    return (
      <div
        className="rounded-xl border border-border bg-card p-8 text-center"
        aria-label="No medications yet"
      >
        <p className="font-heading text-lg text-primary">No medications added yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Add medications to keep track of the schedule.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3" role="list">
      {medications.map((m) => (
        <li key={m.id}>
          <MedicationCard
            medication={m}
            adherencePercent={adherenceByMedicationId?.[m.id]}
            onMarkMissed={onMarkMissed ? () => onMarkMissed(m.id) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
