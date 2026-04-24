/**
 * GET /api/patients/[id]/emergency-card
 * Returns the offline-cacheable emergency card payload.
 * Auth + role + org scope + audit_log.
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
    .select(
      "id, name, dob, sex, custom_diagnosis, primary_language, blood_type, allergies, emergency_contact_name, emergency_contact_phone, emergency_notes, dpd_deficiency_screened, dpd_deficiency_status"
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!patient) {
    return NextResponse.json({ error: "We could not find this patient." }, { status: 404 });
  }

  const [{ data: meds }, { data: biomarkers }] = await Promise.all([
    supabase
      .from("medications")
      .select("name, dose, unit, frequency, route")
      .eq("patient_id", id)
      .eq("organization_id", organizationId)
      .eq("is_active", true),
    supabase
      .from("biomarkers")
      .select("biomarker_type, status, value")
      .eq("patient_id", id)
      .eq("organization_id", organizationId),
  ]);

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: id,
    action: "SELECT",
    resource_type: "emergency_card",
    resource_id: id,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  const body = {
    patient,
    medications: meds ?? [],
    biomarkers: biomarkers ?? [],
    generated_at: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "private, max-age=300, stale-while-revalidate=86400",
    },
  });
}
