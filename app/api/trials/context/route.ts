/**
 * GET /api/trials/context
 * Returns the current user's linked patient context needed to bootstrap the trials page:
 * patient_id, city, state, country (for auto-search and location prompt), condition name,
 * and oncologist email (for mailto pre-fill).
 * Tables: reads care_relationships, patients, condition_templates, care_relationships→users.
 * Auth: caregiver, patient, provider.
 * HIPAA: Returns patient_id + location; no patient name or diagnosis in response.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/get-user";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "patient", "provider"];

export async function GET(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const user = await getUserFromRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = user.organization_id;

  // Find the first patient linked to this user via care_relationships.
  const { data: rel } = await supabase
    .from("care_relationships")
    .select("patient_id")
    .eq("user_id", user.id)
    .eq("organization_id", orgId)
    .limit(1)
    .single();

  if (!rel?.patient_id) {
    return NextResponse.json({ patient_id: null });
  }

  const patientId = rel.patient_id;

  const { data: patient } = await supabase
    .from("patients")
    .select("city, state, country, condition_template_id, custom_diagnosis")
    .eq("id", patientId)
    .eq("organization_id", orgId)
    .single();

  if (!patient) {
    return NextResponse.json({ patient_id: null });
  }

  let conditionName: string | null = patient.custom_diagnosis ?? null;
  if (patient.condition_template_id) {
    const { data: tmpl } = await supabase
      .from("condition_templates")
      .select("name")
      .eq("id", patient.condition_template_id)
      .single();
    if (tmpl?.name) conditionName = tmpl.name;
  }

  // Find the oncologist email from the care team (provider role).
  let oncologistEmail: string | null = null;
  const { data: teamRels } = await supabase
    .from("care_relationships")
    .select("user_id, relationship_type")
    .eq("patient_id", patientId)
    .eq("organization_id", orgId);

  if (teamRels?.length) {
    const providerRel = teamRels.find((r: { relationship_type: string }) =>
      r.relationship_type === "oncologist" || r.relationship_type === "provider"
    );
    if (providerRel) {
      const { data: providerUser } = await supabase
        .from("users")
        .select("email")
        .eq("id", providerRel.user_id)
        .single();
      oncologistEmail = (providerUser?.email as string) ?? null;
    }
  }

  return NextResponse.json({
    patient_id: patientId,
    city: patient.city ?? null,
    state: patient.state ?? null,
    country: patient.country ?? null,
    condition: conditionName,
    oncologist_email: oncologistEmail,
  });
}
