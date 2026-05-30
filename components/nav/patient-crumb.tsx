/**
 * components/nav/patient-crumb.tsx
 * Desktop header center: "Caring for • [patient first name]".
 * Reads the patient ID from the current pathname, fetches the name client-side.
 * Renders nothing when not on a /patients/[id] route.
 * Tables: patients (via GET /api/patients/[id])
 * Auth: API route enforces auth
 * HIPAA: Renders first name only; no diagnosis or other PHI
 */
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function PatientCrumb() {
  const pathname = usePathname();
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    const match = pathname.match(/\/patients\/([^/]+)/);
    const patientId = match?.[1];

    if (!patientId || patientId === "new") {
      setFirstName(null);
      return;
    }

    let cancelled = false;

    fetch(`/api/patients/${patientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { name?: string; full_name?: string } | null) => {
        if (cancelled) return;
        const raw = data?.name ?? data?.full_name ?? null;
        setFirstName(raw ? raw.split(" ")[0] : null);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!firstName) return <span />;

  return (
    <span
      style={{
        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        fontSize: 14,
        color: "var(--muted)",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      Caring for &bull; {firstName}
    </span>
  );
}
