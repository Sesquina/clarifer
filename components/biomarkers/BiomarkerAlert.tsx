"use client";

export interface BiomarkerStatus {
  biomarker_type: string;
  status: string;
  value?: string | null;
}

interface BiomarkerAlertProps {
  biomarkers: BiomarkerStatus[];
  oncologistName?: string;
}

function alertsFor(markers: BiomarkerStatus[], oncologistName?: string): Array<{ id: string; text: string }> {
  const out: Array<{ id: string; text: string }> = [];
  const onc = oncologistName ? `Dr. ${oncologistName.replace(/^Dr\.?\s*/i, "")}` : "your oncologist";

  const fgfr = markers.find((m) => m.biomarker_type.toLowerCase().includes("fgfr2") && m.status === "positive");
  if (fgfr) {
    out.push({
      id: "fgfr2",
      text: `FGFR2 fusion detected. Pemigatinib (Pemazyre) is FDA-approved for this profile. Ask ${onc} about eligibility.`,
    });
  }

  const idh1 = markers.find((m) => m.biomarker_type.toLowerCase().includes("idh1") && m.status === "positive");
  if (idh1) {
    out.push({
      id: "idh1",
      text: `IDH1 mutation detected. Ivosidenib is FDA-approved for this profile. Ask ${onc} about eligibility.`,
    });
  }

  const allNotTested = markers.length === 0 || markers.every((m) => m.status === "not_tested");
  if (allNotTested) {
    out.push({
      id: "not-tested",
      text: "Biomarker testing not recorded. Ask your oncologist about comprehensive molecular profiling -- it can identify targeted treatment options.",
    });
  }

  return out;
}

export function BiomarkerAlert({ biomarkers, oncologistName }: BiomarkerAlertProps) {
  const alerts = alertsFor(biomarkers, oncologistName);
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2" data-testid="biomarker-alerts">
      {alerts.map((a) => (
        <div
          key={a.id}
          role="alert"
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--terracotta)",
            background: "var(--pale-terra, #FDF3EE)",
            color: "var(--foreground)",
          }}
        >
          {a.text}
        </div>
      ))}
    </div>
  );
}
