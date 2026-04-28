/**
 * app/api/trials/saved/route.ts
 * GET lists a patient's saved trials and DELETE removes one with audit logging.
 * Tables: reads users, patients, trial_saves; deletes from trial_saves; inserts into audit_log on DELETE.
 * Auth: caregiver, patient, or provider role; cross-tenant access returns 403.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: Lists trial identifiers per patient; DELETE writes audit_log row (action=DELETE, resource_type=trial_save). No PHI in error responses.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "patient", "provider"];

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patient_id");
  if (!patientId) {
    return NextResponse.json({ error: "patient_id required" }, { status: 400 });
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("organization_id")
    .eq("id", patientId)
    .single();
  if (!patient || patient.organization_id !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("trial_saves")
    .select("*")
    .eq("patient_id", patientId)
    .order("saved_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ saves: data ?? [] });
}

export async function DELETE(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const saveId = searchParams.get("id");
  if (!saveId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: save } = await supabase
    .from("trial_saves")
    .select("organization_id, patient_id")
    .eq("id", saveId)
    .single();
  if (!save || save.organization_id !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("trial_saves").delete().eq("id", saveId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("audit_log").insert({
    user_id: user.id,
    organization_id: orgId,
    action: "DELETE",
    resource_type: "trial_save",
    resource_id: saveId,
    patient_id: save.patient_id,
  }).then(() => undefined, () => undefined);

  return NextResponse.json({ ok: true });
}
