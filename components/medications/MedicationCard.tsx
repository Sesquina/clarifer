"use client";

export interface MedicationRow {
  id: string;
  name: string;
  dose: string | null;
  unit: string | null;
  frequency: string | null;
}

interface MedicationCardProps {
  medication: MedicationRow;
  adherencePercent?: number;
  onMarkMissed?: () => void;
}

export function MedicationCard({
  medication,
  adherencePercent,
  onMarkMissed,
}: MedicationCardProps) {
  const doseLine = [medication.dose, medication.unit].filter(Boolean).join(" ");
  const hasAdherence = typeof adherencePercent === "number";
  const adherenceGood = hasAdherence && (adherencePercent as number) >= 80;

  return (
    <article
      className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4"
      aria-label={`Medication ${medication.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-lg text-foreground">{medication.name}</h3>
        {hasAdherence && (
          <span
            className={
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium " +
              (adherenceGood ? "bg-primary/10 text-primary" : "bg-terracotta/10 text-terracotta")
            }
            aria-label={`Adherence ${adherencePercent} percent`}
          >
            {adherencePercent}%
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {doseLine || "No dose recorded"} · {medication.frequency ?? "Schedule not set"}
      </p>
      {onMarkMissed && (
        <button
          type="button"
          onClick={onMarkMissed}
          aria-label="Mark missed dose"
          className="mt-1 self-start rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
          style={{ minHeight: 48 }}
        >
          Mark missed dose
        </button>
      )}
    </article>
  );
}
