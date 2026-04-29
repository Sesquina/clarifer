/**
 * app/api/provider/patients/[id]/export/route.ts
 * Provider-facing hospital-grade PDF export endpoint.
 * Tables: reads via fetchExportData (patients, medications,
 *         symptom_logs, documents, appointments, care_team,
 *         provider_notes, organizations, users) +
 *         care_relationships (auth gate); audit_log (write)
 * Auth: provider role only (caregiver/patient/admin -> 403). Provider
 *       must have a care_relationships row for this patient or the
 *       request returns 404.
 * Sprint: Sprint 12 (initial) / Sprint 13 (refactored to shared
 *         hospital-grade PDF lib)
 *
 * HIPAA: Full PHI export. Org-scoped. Provider notes are included
 * for the requesting provider only (filtered inside fetchExportData
 * by callerRole = provider). audit_log written with action
 * PROVIDER_EXPORT. PDF streamed directly; never written to disk.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import { fetchExportData } from "@/lib/pdf/fetch-export-data";
import { renderHospitalGradePdf } from "@/lib/pdf/hospital-grade-export";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_ROLES = ["provider"];

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id: patientId } = await params;
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

  // Provider authorization gate: must have a care_relationships row
  // for this patient. Cross-tenant returns 404 (do not leak).
  const { data: relationship } = await supabase
    .from("care_relationships")
    .select("patient_id")
    .eq("user_id", user.id)
    .eq("patient_id", patientId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!relationship) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = await fetchExportData({
    supabase,
    patientId,
    orgId,
    callerId: user.id,
    callerRole: "provider",
    dateRangeDays: 30,
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
      action: "PROVIDER_EXPORT",
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
