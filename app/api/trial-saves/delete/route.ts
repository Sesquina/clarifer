/**
 * app/api/trial-saves/delete/route.ts
 * Deletes a saved clinical trial record by row ID.
 * Tables: trial_saves (delete), patients (read), users (read), audit_log (write)
 * Auth: caregiver, patient, provider
 * Sprint: S4 -- fix client-side PHI delete on trial_saves table (final PHI write violation)
 * HIPAA: Contains patient trial data. Auth + role + org_id enforced.
 *        Cross-tenant check: trial_save.patient_id -> patients.organization_id verified before delete.
 *        audit_log written on every successful delete. No PHI in error responses.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from '@/lib/auth/get-user';
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "patient", "provider"];

export async function DELETE(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  // 1. Auth check
  const supabase = await createClient();
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Role check + org_id
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

  // Parse body to get row ID
  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // 3. Org_id filter -- fetch the trial_save row to get its patient_id,
  //    then confirm that patient belongs to caller's org (cross-tenant block).
  const { data: trialSave } = await supabase
    .from("trial_saves")
    .select("id, patient_id")
    .eq("id", body.id)
    .single();

  if (!trialSave || !trialSave.patient_id) {
    // Row not found or patient_id null -- return 404 (same response as cross-tenant block;
    // do not distinguish between "does not exist" and "belongs to another org")
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("organization_id")
    .eq("id", trialSave.patient_id)
    .single();

  if (!patient || patient.organization_id !== orgId) {
    // Return 404 -- do not leak whether the record exists in another org
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete the trial_save row
  const { error: deleteError } = await supabase
    .from("trial_saves")
    .delete()
    .eq("id", body.id)
    .eq("patient_id", trialSave.patient_id); // belt-and-suspenders: scope to patient

  if (deleteError) {
    return NextResponse.json(
      { error: "Could not remove this trial. Please try again." },
      { status: 500 }
    );
  }

  // 4. audit_log write -- every patient data delete must be logged
  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      patient_id: trialSave.patient_id,
      action: "DELETE",
      resource_type: "trial_saves",
      resource_id: body.id,
      organization_id: orgId,
      ip_address:
        request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
      status: "success",
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ success: true }, { status: 200 });
}
