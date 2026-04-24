/**
 * GET /api/patients/[id]
 * Returns a patient record plus the 6 dashboard sections:
 * recent documents, recent symptoms, active medications,
 * upcoming appointments, care team, and the patient itself.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "provider", "admin"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id } = await params;
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

  const organizationId = userRecord.organization_id;

  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, dob, sex, custom_diagnosis, condition_template_id, primary_language, status")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!patient) {
    return NextResponse.json({ error: "We could not find this patient." }, { status: 404 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  const [documents, symptoms, medications, appointments, careTeam] = await Promise.all([
    supabase
      .from("documents")
      .select("id, title, document_category, analysis_status, uploaded_at")
      .eq("patient_id", id)
      .eq("organization_id", organizationId)
      .order("uploaded_at", { ascending: false })
      .limit(3),
    supabase
      .from("symptom_logs")
      .select("id, overall_severity, ai_summary, created_at")
      .eq("patient_id", id)
      .eq("organization_id", organizationId)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false }),
    supabase
      .from("medications")
      .select("id, name, dose, unit, frequency")
      .eq("patient_id", id)
      .eq("organization_id", organizationId)
      .eq("is_active", true),
    supabase
      .from("appointments")
      .select("id, title, datetime, provider_name, provider_specialty, location")
      .eq("patient_id", id)
      .eq("organization_id", organizationId)
      .gte("datetime", nowIso)
      .order("datetime", { ascending: true })
      .limit(3),
    supabase
      .from("care_relationships")
      .select("id, relationship_type, user_id, access_level")
      .eq("patient_id", id)
      .eq("organization_id", organizationId),
  ]);

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: id,
    action: "SELECT",
    resource_type: "patients",
    resource_id: id,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  return NextResponse.json({
    patient,
    documents: documents.data ?? [],
    symptoms: symptoms.data ?? [],
    medications: medications.data ?? [],
    appointments: appointments.data ?? [],
    care_team: careTeam.data ?? [],
  });
}
