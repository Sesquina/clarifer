/**
 * POST /api/export/pdf
 * Generates a hospital-grade PDF summary for a patient.
 * Auth + role (caregiver/provider/admin) + org scope + audit_log.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import { generatePatientPdf, type PdfBundle } from "@/lib/export/generate-pdf";
import { isFluoropyrimidine } from "@/components/medications/DPDAlert";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "provider", "admin"];

type MedRow = { name: string; dose: string | null; unit: string | null; frequency: string | null; start_date: string | null };
type BiomarkerRow = { biomarker_type: string; status: string; value: string | null; tested_date: string | null; notes: string | null };
type DocRow = { title: string | null; summary: string | null; uploaded_at: string | null };
type ApptRow = { title: string | null; datetime: string | null; provider_name: string | null; location: string | null; appointment_type: string | null };
type SymptomRow = { created_at: string | null; overall_severity: number | null };

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userRecord } = await supabase
    .from("users").select("role, organization_id, full_name").eq("id", user.id).single();
  if (!userRecord?.organization_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { patient_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.patient_id) return NextResponse.json({ error: "Missing patient_id" }, { status: 400 });

  const organizationId = userRecord.organization_id;

  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, dob, custom_diagnosis, diagnosis_date, emergency_contact_name, emergency_contact_phone")
    .eq("id", body.patient_id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!patient) return NextResponse.json({ error: "We could not find this patient." }, { status: 404 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  const [medsRes, bioRes, docsRes, apptsRes, symRes] = await Promise.all([
    supabase.from("medications").select("name, dose, unit, frequency, start_date")
      .eq("patient_id", body.patient_id).eq("organization_id", organizationId).eq("is_active", true),
    supabase.from("biomarkers").select("biomarker_type, status, value, tested_date, notes")
      .eq("patient_id", body.patient_id).eq("organization_id", organizationId),
    supabase.from("documents").select("title, summary, uploaded_at")
      .eq("patient_id", body.patient_id).eq("organization_id", organizationId)
      .order("uploaded_at", { ascending: false }).limit(5),
    supabase.from("appointments").select("title, datetime, provider_name, location, appointment_type")
      .eq("patient_id", body.patient_id).eq("organization_id", organizationId)
      .gte("datetime", nowIso).order("datetime", { ascending: true }).limit(3),
    supabase.from("symptom_logs").select("created_at, overall_severity")
      .eq("patient_id", body.patient_id).eq("organization_id", organizationId)
      .gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true }),
  ]);

  const medications = ((medsRes.data ?? []) as MedRow[]);
  const biomarkers = ((bioRes.data ?? []) as BiomarkerRow[]);
  const documents = ((docsRes.data ?? []) as DocRow[]).map((d) => ({
    title: d.title ?? "Untitled",
    summary: d.summary,
    uploaded_at: d.uploaded_at ? d.uploaded_at.slice(0, 10) : null,
  }));
  const appointments = ((apptsRes.data ?? []) as ApptRow[]).map((a) => ({
    title: a.title ?? "Appointment",
    datetime: a.datetime ? new Date(a.datetime).toLocaleString() : "TBD",
    provider_name: a.provider_name,
    location: a.location,
    appointment_type: a.appointment_type,
  }));
  const symptomSummary = ((symRes.data ?? []) as SymptomRow[]).map((s) => ({
    day: s.created_at ? s.created_at.slice(0, 10) : "",
    severity: s.overall_severity ?? 0,
  }));

  const { data: careTeamRows } = await supabase
    .from("chat_messages")
    .select("content")
    .eq("patient_id", body.patient_id)
    .eq("organization_id", organizationId)
    .eq("role", "system")
    .like("content", "[DEMO_CARE_TEAM]%")
    .limit(1)
    .maybeSingle();
  let careTeam: Array<{ name: string; role: string; phone: string; email: string }> = [];
  if (careTeamRows?.content) {
    try {
      const raw = careTeamRows.content.replace(/^\[DEMO_CARE_TEAM\]\s*/, "");
      const parsed = JSON.parse(raw) as Array<{ name: string; role: string; phone: string; email: string; institution?: string }>;
      careTeam = parsed.map((m) => ({ name: m.name, role: m.role, phone: m.phone, email: m.email }));
    } catch { /* ignore */ }
  }

  const primaryOncologist = careTeam.find((m) => m.role.toLowerCase().includes("oncolog"))?.name ?? null;
  const dpdFluoropyrimidine = medications.some((m) => isFluoropyrimidine(m.name));

  const bundle: PdfBundle = {
    patient: {
      id: patient.id,
      name: patient.name,
      dob: patient.dob,
      custom_diagnosis: patient.custom_diagnosis,
      diagnosis_date: patient.diagnosis_date,
      emergency_contact_name: patient.emergency_contact_name,
      emergency_contact_phone: patient.emergency_contact_phone,
    },
    caregiverName: userRecord.full_name ?? "the caregiver",
    primaryOncologist,
    biomarkers,
    medications,
    symptomSummary,
    dpdFluoropyrimidine,
    documents,
    careTeam,
    appointments,
    generatedAt: new Date().toISOString(),
  };

  const pdfBytes = await generatePatientPdf(bundle);

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: body.patient_id,
    action: "EXPORT",
    resource_type: "patient_pdf",
    resource_id: body.patient_id,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  return new Response(new Uint8Array(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="clarifer-${patient.id}.pdf"`,
    },
  });
}
