"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PatientForm } from "@/components/patients/PatientForm";

type ConditionOption = { id: string; slug: string | null; name: string };

export default function NewPatientPage() {
  const router = useRouter();
  const [conditions, setConditions] = useState<ConditionOption[]>([]);
  const [loadingConditions, setLoadingConditions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/condition-templates");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.templates)) setConditions(data.templates);
          else if (Array.isArray(data)) setConditions(data);
        }
      } catch {
        // non-critical; form still usable with whatever options are present
      } finally {
        setLoadingConditions(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(values: {
    full_name: string;
    date_of_birth: string;
    diagnosis: string;
    condition_template_id: string;
  }) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/patients/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong on our end. Please try again.");
        return;
      }
      const body = await res.json();
      router.push(`/patients/${body.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="font-heading text-3xl text-primary">Let&apos;s set up your first patient</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tell us who you&apos;re caring for. You can change these details later.
      </p>
      <div className="mt-8">
        {loadingConditions ? (
          <div
            aria-busy="true"
            className="h-96 animate-pulse rounded-2xl border border-border bg-muted"
          />
        ) : (
          <PatientForm
            conditions={conditions}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
          />
        )}
      </div>
    </main>
  );
}
