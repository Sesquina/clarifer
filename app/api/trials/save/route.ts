/**
 * app/api/trials/save/route.ts
 * POST endpoint that saves a clinical trial to a patient's saved-trials list with audit logging.
 * Tables: reads users, patients; inserts into trial_saves and audit_log.
 * Auth: caregiver, patient, or provider role; cross-tenant patient access returns 403.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: Stores patient_id and trial identifier only; writes audit_log row (action=INSERT, resource_type=trial_save). No PHI in error responses.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "patient", "provider"];

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
  if (!userRecord || !ALLOWED_ROLES.includes(userRecord.role ?? "") || !userRecord.organization_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgId = userRecord.organization_id;

  const body = (await request.json().catch(() => null)) as {
    patient_id?: string;
    nct_id?: string;
    trial_name?: string;
    phase?: string;
    location?: string;
  } | null;
  if (!body?.patient_id || !body?.nct_id) {
    return NextResponse.json({ error: "patient_id and nct_id required" }, { status: 400 });
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("organization_id")
    .eq("id", body.patient_id)
    .single();
  if (!patient || patient.organization_id !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("trial_saves")
    .insert({
      patient_id: body.patient_id,
      organization_id: orgId,
      saved_by: user.id,
      trial_id: body.nct_id,
      trial_name: body.trial_name ?? null,
      phase: body.phase ?? null,
      location: body.location ?? null,
      status: "saved",
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    organization_id: orgId,
    action: "INSERT",
    resource_type: "trial_save",
    resource_id: data.id,
    patient_id: body.patient_id,
  }).then(() => undefined, () => undefined);

  return NextResponse.json({ save: data }, { status: 201 });
}
