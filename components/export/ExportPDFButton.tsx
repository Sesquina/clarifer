/**
 * components/export/ExportPDFButton.tsx
 * Reusable PDF export button for caregiver and provider views (web).
 * Tables: none (calls /api/export/pdf for caregivers,
 *         /api/provider/patients/[id]/export for providers).
 * Auth: client passes session cookie automatically; server enforces
 *       role.
 * Sprint: Sprint 13 -- Hospital-Grade PDF Export
 *
 * HIPAA: No PHI logged; the PDF blob is consumed by the browser via
 * an object URL and revoked immediately. Errors surface only generic
 * messages so server-side details never reach the client log.
 */
"use client";
import { useState } from "react";

interface ExportPDFButtonProps {
  patientId: string;
  callerRole: "caregiver" | "provider";
  dateRangeDays?: number;
  label?: string;
}

type Status = "idle" | "loading" | "success" | "error";

export function ExportPDFButton({
  patientId,
  callerRole,
  dateRangeDays = 30,
  label = "Export PDF report",
}: ExportPDFButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setStatus("loading");
    setError(null);
    try {
      const url =
        callerRole === "provider"
          ? `/api/provider/patients/${encodeURIComponent(patientId)}/export`
          : "/api/export/pdf";
      const init: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:
          callerRole === "provider"
            ? undefined
            : JSON.stringify({ patient_id: patientId, date_range_days: dateRangeDays }),
      };
      const res = await fetch(url, init);
      if (!res.ok) {
        setStatus("error");
        setError("Export failed. Please try again.");
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filenameFromResponse(res, patientId);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      setStatus("success");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setError("Export failed. Please try again.");
    }
  }

  const buttonLabel =
    status === "loading"
      ? "Generating report..."
      : status === "success"
      ? "Downloaded"
      : label;

  const buttonClass =
    status === "error"
      ? "rounded-full bg-accent px-6 text-sm font-medium text-white"
      : "rounded-full bg-primary px-6 text-sm font-medium text-white disabled:opacity-50";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        aria-busy={status === "loading"}
        style={{ minHeight: 48 }}
        className={buttonClass}
      >
        {buttonLabel}
      </button>
      {status === "error" && error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}

function filenameFromResponse(res: Response, fallback: string): string {
  const dispo = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="?([^";]+)"?/.exec(dispo);
  if (match) return match[1];
  return `clarifer-${fallback}.pdf`;
}
