"use client";
import { useMemo } from "react";
import { BiomarkerAlert, BiomarkerStatus } from "./BiomarkerAlert";

export interface BiomarkerRow extends BiomarkerStatus {
  id: string;
  tested_date?: string | null;
  notes?: string | null;
}

interface BiomarkerTrackerProps {
  biomarkers: BiomarkerRow[];
  oncologistName?: string;
  onEdit?: (id: string) => void;
}

const STATUS_STYLES: Record<string, { background: string; color: string; icon: string; label: string }> = {
  positive: { background: "var(--pale-terra, #FDF3EE)", color: "var(--terracotta)", icon: "⚠", label: "Positive" },
  negative: { background: "var(--pale-sage, #F0F5F2)", color: "var(--primary)", icon: "✓", label: "Negative" },
  not_tested: { background: "var(--muted)", color: "var(--muted-foreground)", icon: "?", label: "Not tested" },
  pending: { background: "var(--pale-sage, #F0F5F2)", color: "var(--primary)", icon: "⏳", label: "Pending" },
  inconclusive: { background: "var(--muted)", color: "var(--muted-foreground)", icon: "–", label: "Inconclusive" },
};

export function BiomarkerTracker({ biomarkers, oncologistName, onEdit }: BiomarkerTrackerProps) {
  const sorted = useMemo(() => {
    const order = ["positive", "pending", "inconclusive", "negative", "not_tested"];
    return [...biomarkers].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  }, [biomarkers]);

  return (
    <section className="space-y-4" aria-labelledby="biomarker-heading">
      <div className="flex items-center justify-between">
        <h2 id="biomarker-heading" className="font-heading text-lg text-primary">Biomarkers</h2>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{biomarkers.length} tracked</p>
      </div>

      <BiomarkerAlert biomarkers={biomarkers} oncologistName={oncologistName} />

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="font-heading text-lg text-primary">No biomarkers recorded yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Comprehensive molecular testing can unlock targeted treatment options. Ask your oncologist about it.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {sorted.map((m) => {
            const style = STATUS_STYLES[m.status] ?? STATUS_STYLES.not_tested;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onEdit?.(m.id)}
                  className="w-full rounded-2xl border border-border bg-card p-4 text-left"
                  style={{ minHeight: 48 }}
                  aria-label={`Edit ${m.biomarker_type}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-foreground">{m.biomarker_type}</p>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                      style={{ background: style.background, color: style.color }}
                    >
                      <span aria-hidden="true">{style.icon}</span>
                      {style.label}
                    </span>
                  </div>
                  {m.value && <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>{m.value}</p>}
                  {m.tested_date && (
                    <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      Tested {new Date(m.tested_date).toLocaleDateString()}
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
