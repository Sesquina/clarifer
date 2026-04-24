"use client";
import { useState } from "react";

export interface DPDAlertMedication {
  name: string;
}

interface DPDAlertProps {
  patientName: string;
  medications: DPDAlertMedication[];
  oncologistName?: string;
  initialDiscussed?: boolean;
  initialCompleted?: boolean;
  onChange?: (state: { discussed: boolean; completed: boolean; result?: string }) => void;
}

const FLUOROPYRIMIDINES = ["fluorouracil", "5-fu", "5 fu", "capecitabine", "xeloda", "tegafur", "flucytosine"];

export function isFluoropyrimidine(name: string): boolean {
  const lowered = name.toLowerCase();
  return FLUOROPYRIMIDINES.some((drug) => lowered.includes(drug));
}

export function DPDAlert({
  patientName,
  medications,
  oncologistName,
  initialDiscussed = false,
  initialCompleted = false,
  onChange,
}: DPDAlertProps) {
  const flagged = medications.find((m) => isFluoropyrimidine(m.name));
  const [discussed, setDiscussed] = useState(initialDiscussed);
  const [completed, setCompleted] = useState(initialCompleted);
  const [result, setResult] = useState("");

  if (!flagged) return null;

  const onc = oncologistName ? `Dr. ${oncologistName.replace(/^Dr\.?\s*/i, "")}` : "your oncologist";
  const resolved = discussed && completed;

  const update = (next: { discussed: boolean; completed: boolean; result?: string }) => {
    onChange?.(next);
  };

  if (resolved) {
    return (
      <div
        role="status"
        className="rounded-xl border px-4 py-3 text-sm"
        style={{ borderColor: "var(--primary)", background: "var(--pale-sage, #F0F5F2)", color: "var(--foreground)" }}
      >
        DPD screening confirmed. {result ? `Result: ${result}.` : ""} No further action required.
      </div>
    );
  }

  return (
    <section
      role="alert"
      aria-label="DPD deficiency alert"
      className="space-y-3 rounded-2xl border px-4 py-4 text-sm"
      style={{ borderColor: "var(--terracotta)", background: "var(--pale-terra, #FDF3EE)", color: "var(--foreground)" }}
    >
      <p className="font-heading text-base" style={{ color: "var(--terracotta)" }}>
        ⚠ Important Safety Information
      </p>
      <p>
        {patientName} has been prescribed {flagged.name}, which contains fluoropyrimidine.
      </p>
      <p>
        The Cholangiocarcinoma Foundation recommends all patients be screened for DPD
        (dihydropyrimidine dehydrogenase) enzyme deficiency before starting this medication.
      </p>
      <p>
        Patients with DPD deficiency who take fluoropyrimidines can experience life-threatening side effects.
      </p>
      <p className="font-medium">Action required: Ask {onc} about DPD screening before the first dose.</p>

      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={discussed}
          onChange={(e) => {
            setDiscussed(e.target.checked);
            update({ discussed: e.target.checked, completed, result });
          }}
          aria-label="DPD screening discussed with oncologist"
          style={{ minHeight: 24, minWidth: 24 }}
        />
        <span>DPD screening discussed with oncologist</span>
      </label>

      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={completed}
          onChange={(e) => {
            setCompleted(e.target.checked);
            update({ discussed, completed: e.target.checked, result });
          }}
          aria-label="DPD screening completed"
          style={{ minHeight: 24, minWidth: 24 }}
        />
        <span className="flex-1">
          DPD screening completed -- result:
          <input
            type="text"
            value={result}
            onChange={(e) => {
              setResult(e.target.value);
              update({ discussed, completed, result: e.target.value });
            }}
            placeholder="e.g. normal, partial deficiency"
            className="ml-2 rounded-md border px-2 py-1 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--card)", minHeight: 32 }}
          />
        </span>
      </label>
    </section>
  );
}
