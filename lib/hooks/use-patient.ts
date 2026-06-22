/**
 * lib/hooks/use-patient.ts
 * React hook that fetches the current patient on mount.
 * Use this in every page that needs patientId.
 * Returns { patientId, firstName, loading, error }
 */
"use client";
import { useState, useEffect } from "react";

interface Patient {
  id: string;
  firstName: string;
  organization_id: string;
}

export function usePatient() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/patients/me")
      .then((r) => {
        if (!r.ok) throw new Error("No patient found");
        return r.json();
      })
      .then((data) => setPatient(data))
      .catch(() => setError("Could not load patient"))
      .finally(() => setLoading(false));
  }, []);

  return {
    patientId: patient?.id ?? null,
    firstName: patient?.firstName ?? null,
    loading,
    error,
  };
}
