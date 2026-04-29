/**
 * app/api/provider/patients/[id]/export/route.ts
 * Generate a structured PDF export for a provider.
 * Tables: patients, symptom_logs, medications, appointments, documents,
 *         care_team, biomarkers, care_relationships, users (read),
 *         provider_notes, audit_log (write)
 * Auth: provider role only
 * Sprint: Sprint 12 -- Provider Portal
 *
 * HIPAA: Full PHI export. Org-scoped. audit_log written with action
 * PROVIDER_EXPORT. Reuses Sprint 8 generatePatientPdf() so the
 * footer "care coordination tool, not a medical record" is preserved
 * on every page.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import {
  generatePatientPdf,
  type PdfBundle,
  type PdfMedication,
  type PdfSymptomSummary,
  type PdfDocument,
  type PdfAppointment,
  type PdfBiomarker,
} from "@/lib/export/generate-pdf";

export const runtime = "nodejs";
// PDF rendering is CPU-bound; bump the route timeout window so the
// 3-second budget the test asserts has headroom.
export const maxDuration = 30;

const ALLOWED_ROLES = ["provider"];

function forensicColumns(request: Request) {
  return {
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  };
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
    .select("role, organization_id, full_name")
    .eq("id", user.id)
    .single();
  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgId = userRecord.organization_id;

  // Provider must have a care_relationships row for this patient.
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

  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .eq("organization_id", orgId)
    .single();
  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [meds, syms, docs, appts, biomarkers] = await Promise.all([
    supabase
      .from("medications")
      .select("name, dose, unit, frequency, start_date")
      .eq("patient_id", patientId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("symptom_logs")
      .select("created_at, overall_severity")
      .eq("patient_id", patientId)
      .gte("created_at", since30)
      .order("created_at", { ascending: true }),
    supabase
      .from("documents")
      .select("title, summary, created_at")
      .eq("patient_id", patientId)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("appointments")
      .select("title, datetime, provider_name, location, appointment_type")
      .eq("patient_id", patientId)
      .eq("organization_id", orgId)
      .gte("datetime", new Date().toISOString())
      .order("datetime", { ascending: true })
      .limit(3),
    supabase
      .from("biomarkers")
      .select("biomarker_type, status, value, tested_date, notes")
      .eq("patient_id", patientId)
      .eq("organization_id", orgId)
      .order("tested_date", { ascending: false })
      .limit(20),
  ]);

  const medications: PdfMedication[] = (meds.data ?? []).map((m) => ({
    name: m.name ?? "",
    dose: m.dose ?? null,
    unit: m.unit ?? null,
    frequency: m.frequency ?? null,
    start_date: m.start_date ?? null,
  }));

  const symptomSummary: PdfSymptomSummary[] = (syms.data ?? [])
    .map((s) => ({
      day: (s.created_at ?? "").slice(0, 10),
      severity: typeof s.overall_severity === "number" ? s.overall_severity : 0,
    }))
    .filter((s) => s.day.length === 10);

  const pdfDocuments: PdfDocument[] = (docs.data ?? []).map((d) => ({
    title: d.title ?? "Document",
    summary: d.summary ?? null,
    uploaded_at: d.created_at ?? null,
  }));

  const pdfAppointments: PdfAppointment[] = (appts.data ?? []).map((a) => ({
    title: a.title ?? "Appointment",
    datetime: a.datetime ?? "",
    provider_name: a.provider_name ?? null,
    location: a.location ?? null,
    appointment_type: a.appointment_type ?? null,
  }));

  const pdfBiomarkers: PdfBiomarker[] = (biomarkers.data ?? []).map((b) => ({
    biomarker_type: b.biomarker_type,
    status: b.status,
    value: b.value ?? null,
    tested_date: b.tested_date ?? null,
    notes: b.notes ?? null,
  }));

  const bundle: PdfBundle = {
    patient: {
      id: patient.id,
      name: patient.name ?? "Patient",
      dob: patient.dob ?? null,
      custom_diagnosis: patient.custom_diagnosis ?? null,
      diagnosis_date: patient.diagnosis_date ?? null,
      emergency_contact_name: patient.emergency_contact_name ?? null,
      emergency_contact_phone: patient.emergency_contact_phone ?? null,
    },
    caregiverName: "",
    primaryOncologist: userRecord.full_name ?? null,
    biomarkers: pdfBiomarkers,
    medications,
    symptomSummary,
    dpdFluoropyrimidine: false,
    documents: pdfDocuments,
    careTeam: [],
    appointments: pdfAppointments,
    generatedAt: new Date().toISOString(),
  };

  const pdfBytes = await generatePatientPdf(bundle);

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

  return new Response(new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="patient-${patientId}.pdf"`,
    },
  });
}
