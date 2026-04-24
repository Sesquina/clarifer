"use client";
import { useEffect, useRef, useState } from "react";

const UNITS = ["mg", "ml", "mcg", "units", "tablets"];
const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "As needed",
  "Other",
];

interface MedicationFormProps {
  patientId: string;
  onSubmit: (values: {
    patient_id: string;
    drug_name: string;
    dosage: string;
    dosage_unit: string;
    frequency: string;
    start_date: string;
    notes: string;
  }) => Promise<void>;
  submitting?: boolean;
  error?: string | null;
}

interface OpenFdaResult {
  openfda?: { brand_name?: string[] };
}

export function MedicationForm({ patientId, onSubmit, submitting, error }: MedicationFormProps) {
  const [drugName, setDrugName] = useState("");
  const [dosage, setDosage] = useState("");
  const [dosageUnit, setDosageUnit] = useState(UNITS[0]);
  const [frequency, setFrequency] = useState(FREQUENCIES[0]);
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = drugName.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSuggestLoading(true);

    const timer = setTimeout(async () => {
      try {
        const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:%22${encodeURIComponent(q)}%22&limit=10`;
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const data = (await res.json()) as { results?: OpenFdaResult[] };
        const names = new Set<string>();
        for (const r of data.results ?? []) {
          for (const n of r.openfda?.brand_name ?? []) names.add(n);
        }
        setSuggestions(Array.from(names).slice(0, 6));
      } catch {
        // ignore network / abort errors — suggestion UI is non-critical
      } finally {
        setSuggestLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [drugName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      patient_id: patientId,
      drug_name: drugName.trim(),
      dosage: dosage.trim(),
      dosage_unit: dosageUnit,
      frequency,
      start_date: startDate,
      notes: notes.trim(),
    });
  }

  const canSubmit = drugName.trim().length > 0 && !submitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium text-foreground">Medication name</span>
        <div className="relative">
          <input
            type="text"
            value={drugName}
            onChange={(e) => setDrugName(e.target.value)}
            autoComplete="off"
            className="mt-1 w-full min-h-12 rounded-lg border border-border bg-card px-4 py-3 text-base"
            aria-label="Medication name"
            aria-autocomplete="list"
          />
          {suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm"
            >
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      setDrugName(s);
                      setSuggestions([]);
                    }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-muted"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {suggestLoading && (
            <span className="absolute right-3 top-3 text-xs text-muted-foreground">Looking up…</span>
          )}
        </div>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium text-foreground">Dose</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="mt-1 w-full min-h-12 rounded-lg border border-border bg-card px-4 py-3 text-base"
            aria-label="Dosage amount"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-foreground">Unit</span>
          <select
            value={dosageUnit}
            onChange={(e) => setDosageUnit(e.target.value)}
            className="mt-1 w-full min-h-12 rounded-lg border border-border bg-card px-4 py-3 text-base"
            aria-label="Dosage unit"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="block text-sm font-medium text-foreground">Frequency</span>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="mt-1 w-full min-h-12 rounded-lg border border-border bg-card px-4 py-3 text-base"
          aria-label="Frequency"
        >
          {FREQUENCIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-foreground">Start date</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mt-1 w-full min-h-12 rounded-lg border border-border bg-card px-4 py-3 text-base"
          aria-label="Start date"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-foreground">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Anything else worth remembering?"
          className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-3 text-base"
          aria-label="Notes"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-terracotta">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        aria-label="Save medication"
        className="w-full min-h-12 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save medication"}
      </button>
    </form>
  );
}
