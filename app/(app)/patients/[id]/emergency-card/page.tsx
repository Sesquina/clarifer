"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface EmergencyPatient {
  id: string;
  name: string;
  dob: string | null;
  sex: string | null;
  custom_diagnosis: string | null;
  blood_type: string | null;
  allergies: string[] | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_notes: string | null;
  dpd_deficiency_screened: boolean | null;
  dpd_deficiency_status: string | null;
}
interface EmergencyCardData {
  patient: EmergencyPatient;
  medications: Array<{ name: string; dose: string | null; unit: string | null; route: string | null; frequency: string | null }>;
  biomarkers: Array<{ biomarker_type: string; status: string; value: string | null }>;
  generated_at: string;
}

const CACHE_KEY = (id: string) => `clarifer:emergency-card:${id}`;

function ageFromDob(dob: string | null): string {
  if (!dob) return "";
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return String(age);
}

function formatDob(dob: string | null): string {
  if (!dob) return "Not recorded";
  return new Date(dob).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function EmergencyCardPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const [data, setData] = useState<EmergencyCardData | null>(null);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    // Hydrate from cache first so the card is visible instantly even offline.
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem(CACHE_KEY(id));
      if (cached) {
        try { setData(JSON.parse(cached)); } catch { /* ignore */ }
      }
    }
    try {
      const res = await fetch(`/api/patients/${id}/emergency-card`);
      if (!res.ok) {
        if (res.status === 404) setError("We could not find this patient.");
        return;
      }
      const body = (await res.json()) as EmergencyCardData;
      setData(body);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CACHE_KEY(id), JSON.stringify(body));
      }
    } catch {
      setOffline(true);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <p role="alert" className="rounded-xl border bg-card p-6">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12" aria-busy="true">
        <div className="animate-pulse rounded-2xl border bg-muted" style={{ height: 640 }} />
      </main>
    );
  }

  const p = data.patient;
  const oncologyBiomarkers = data.biomarkers.filter(b => b.status === "positive");
  const phoneHref = p.emergency_contact_phone ? `tel:${p.emergency_contact_phone.replace(/[^0-9+]/g, "")}` : undefined;

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      {offline && (
        <p className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--pale-terra, #FDF3EE)", color: "var(--terracotta)" }}>
          Showing cached emergency card. Data last refreshed {new Date(data.generated_at).toLocaleString()}.
        </p>
      )}
      <article
        className="overflow-hidden rounded-2xl border"
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
      >
        <header
          className="flex items-center justify-between px-5 py-4"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          <div>
            <p className="text-xs uppercase tracking-wider opacity-90">Emergency Medical Card</p>
            <p className="font-heading text-xl">Clarifer</p>
          </div>
          <span
            aria-hidden="true"
            className="rounded-full px-3 py-1 text-sm font-semibold"
            style={{ background: "var(--terracotta)", color: "#FFFFFF" }}
          >
            URGENT
          </span>
        </header>

        <section className="border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <p className="font-heading text-3xl uppercase" style={{ color: "var(--foreground)" }}>{p.name}</p>
          <p className="mt-1 text-base" style={{ color: "var(--muted-foreground)" }}>
            DOB: {formatDob(p.dob)}{p.dob ? ` · Age: ${ageFromDob(p.dob)}` : ""}
          </p>
        </section>

        <section className="border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Diagnosis</p>
          <p className="mt-1 text-lg font-medium">{p.custom_diagnosis ?? "Not recorded"}</p>
          {oncologyBiomarkers.length > 0 && (
            <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
              Biomarkers: {oncologyBiomarkers.map(b => `${b.biomarker_type}${b.value ? ` (${b.value})` : ""}`).join(", ")}
            </p>
          )}
        </section>

        <section className="border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Current Medications</p>
          {data.medications.length === 0 ? (
            <p className="mt-1 text-base">No active medications on file.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-base">
              {data.medications.map((m, idx) => (
                <li key={idx}>• {m.name} {[m.dose, m.unit].filter(Boolean).join(" ")}{m.route ? ` ${m.route}` : ""}</li>
              ))}
            </ul>
          )}
        </section>

        {(p.blood_type || (p.allergies && p.allergies.length > 0)) && (
          <section className="border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
            {p.blood_type && (
              <p className="text-base"><span className="font-semibold">Blood type: </span>{p.blood_type}</p>
            )}
            {p.allergies && p.allergies.length > 0 && (
              <p className="mt-1 text-base"><span className="font-semibold">Allergies: </span>{p.allergies.join(", ")}</p>
            )}
          </section>
        )}

        <section
          className="border-b px-5 py-4"
          style={{ borderColor: "var(--terracotta)", background: "var(--pale-terra, #FDF3EE)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--terracotta)" }}>
            Critical Alerts
          </p>
          <p className="mt-1 text-base font-semibold" style={{ color: "var(--foreground)" }}>
            DPD screening status: {p.dpd_deficiency_status || (p.dpd_deficiency_screened ? "Completed" : "Unknown")}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--foreground)" }}>
            Do not administer 5-FU or Capecitabine without DPD test.
          </p>
          {p.emergency_notes && (
            <p className="mt-2 text-sm" style={{ color: "var(--foreground)" }}>{p.emergency_notes}</p>
          )}
        </section>

        <section className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Emergency Contact</p>
          <p className="mt-1 text-lg font-medium">{p.emergency_contact_name ?? "Not recorded"}</p>
          {phoneHref ? (
            <a
              href={phoneHref}
              className="mt-2 inline-flex items-center justify-center rounded-lg px-4 py-3 text-base font-semibold"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)", minHeight: 48 }}
            >
              Tap to call {p.emergency_contact_phone}
            </a>
          ) : (
            <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>No phone number on file.</p>
          )}
        </section>
      </article>

      <p className="mt-4 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
        Clarifer is a care-coordination tool, not a medical record. For medical decisions consult the care team.
      </p>
    </main>
  );
}
