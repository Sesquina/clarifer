"use client";
import { useEffect, useState } from "react";

type ConditionOption = { id: string; slug: string | null; name: string };

interface PatientFormProps {
  onSubmit: (values: {
    full_name: string;
    date_of_birth: string;
    diagnosis: string;
    condition_template_id: string;
  }) => Promise<void>;
  conditions?: ConditionOption[];
  submitting?: boolean;
  error?: string | null;
}

export function PatientForm({
  onSubmit,
  conditions = [],
  submitting = false,
  error,
}: PatientFormProps) {
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [conditionTemplateId, setConditionTemplateId] = useState("");

  useEffect(() => {
    if (!conditionTemplateId && conditions.length > 0) {
      setConditionTemplateId(conditions[0].id);
    }
  }, [conditions, conditionTemplateId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      full_name: fullName.trim(),
      date_of_birth: dateOfBirth,
      diagnosis: diagnosis.trim(),
      condition_template_id: conditionTemplateId,
    });
  }

  const canSubmit = fullName.trim().length > 0 && !submitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium text-foreground">Full name</span>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Carlos Rivera"
          className="mt-1 w-full min-h-12 rounded-lg border border-border bg-card px-4 py-3 text-base"
          aria-label="Patient full name"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-foreground">Date of birth</span>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="mt-1 w-full min-h-12 rounded-lg border border-border bg-card px-4 py-3 text-base"
          aria-label="Patient date of birth"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-foreground">Primary diagnosis</span>
        <input
          type="text"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="e.g. Cholangiocarcinoma, stage 4"
          className="mt-1 w-full min-h-12 rounded-lg border border-border bg-card px-4 py-3 text-base"
          aria-label="Primary diagnosis"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-foreground">Condition</span>
        <select
          value={conditionTemplateId}
          onChange={(e) => setConditionTemplateId(e.target.value)}
          className="mt-1 w-full min-h-12 rounded-lg border border-border bg-card px-4 py-3 text-base"
          aria-label="Condition template"
        >
          {conditions.length === 0 ? (
            <option value="">Loading options…</option>
          ) : (
            conditions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))
          )}
        </select>
      </label>

      {error && (
        <p role="alert" className="text-sm text-terracotta">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        aria-label="Add patient"
        className="w-full min-h-12 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Add patient"}
      </button>
    </form>
  );
}
