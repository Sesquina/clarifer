/**
 * app/api/export/pdf/route.ts
 * Caregiver-facing hospital-grade PDF export endpoint.
 * Tables: reads via fetchExportData (patients, medications,
 *         symptom_logs, documents, appointments, care_team,
 *         provider_notes, organizations, users); audit_log (write)
 * Auth: caregiver or admin (403 for patient/provider). Providers
 *       export via /api/provider/patients/[id]/export.
 * Sprint: Sprint 13 -- Hospital-Grade PDF Export
 *
 * HIPAA: Full PHI export. Org-scoped. audit_log written with
 * action CAREGIVER_EXPORT. PDF is streamed directly; never written
 * to disk and never cached. Filename includes a sanitized patient
 * label so callers can identify the file in Downloads.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import { fetchExportData } from "@/lib/pdf/fetch-export-data";
import { renderHospitalGradePdf } from "@/lib/pdf/hospital-grade-export";

export const runtime = "nodejs";
// PDF rendering is CPU-bound; bump the route timeout window so the
// 3-second budget the test asserts has headroom.
export const maxDuration = 30;

const ALLOWED_ROLES = ["caregiver", "admin"];

function forensicColumns(request: Request) {
  return {
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  };
}

function safeFilename(name: string | null | undefined): string {
  const trimmed = (name ?? "patient").trim().toLowerCase();
  return trimmed.replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "patient";
}

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();
  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgId = userRecord.organization_id;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const patientId =
    body && (typeof body.patient_id === "string" ? body.patient_id : null);
  if (!patientId) {
    return NextResponse.json({ error: "patient_id required" }, { status: 400 });
  }
  const dateRangeDays =
    body && typeof body.date_range_days === "number" && body.date_range_days > 0
      ? Math.floor(body.date_range_days)
      : 30;

  const data = await fetchExportData({
    supabase,
    patientId,
    orgId,
    callerId: user.id,
    callerRole: userRecord.role ?? "caregiver",
    dateRangeDays,
  });
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfBytes = await renderHospitalGradePdf(data);

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      action: "CAREGIVER_EXPORT",
      resource_type: "patient_pdf",
      resource_id: patientId,
      patient_id: patientId,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  const filename = `clarifer-${safeFilename(data.patient.name)}-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  return new Response(new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
