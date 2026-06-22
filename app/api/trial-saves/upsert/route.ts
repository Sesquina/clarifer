/**
 * app/api/trial-saves/upsert/route.ts
 * Upserts a saved clinical trial for a patient.
 * Tables: trial_saves (write), patients (read), users (read), audit_log (write)
 * Auth: caregiver, patient, provider
 * Sprint: S3 -- fix client-side PHI write on trial_saves table
 * HIPAA: Contains patient trial data. Auth + role + org_id enforced.
 *        audit_log written on every successful upsert. No PHI in error responses.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from '@/lib/auth/get-user';
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "patient", "provider"];

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  // 1. Auth check
  const supabase = await createClient();
  const user = await getUserFromRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Role check + org_id
  if (!ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = user.organization_id;

  let body: {
    patient_id?: string;
    trial_id?: string;
    trial_name?: string;
    phase?: string | null;
    status?: string | null;
    location?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.patient_id || !body.trial_id?.trim()) {
    return NextResponse.json(
      { error: "patient_id and trial_id are required" },
      { status: 400 }
    );
  }

  // 3. Org_id filter -- confirm patient belongs to caller's org (cross-tenant block)
  const { data: patient } = await supabase
    .from("patients")
    .select("organization_id")
    .eq("id", body.patient_id)
    .single();

  if (!patient || patient.organization_id !== orgId) {
    // Return 404 -- do not leak whether the patient exists in another org
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Upsert trial save record
  const { data: saved, error: upsertError } = await supabase
    .from("trial_saves")
    .upsert(
      {
        patient_id: body.patient_id,
        trial_id: body.trial_id.trim(),
        trial_name: body.trial_name ?? null,
        phase: body.phase ?? null,
        status: body.status ?? null,
        location: body.location ?? null,
        organization_id: orgId,
      },
      { onConflict: "patient_id,trial_id" }
    )
    .select("id")
    .single();

  if (upsertError || !saved) {
    return NextResponse.json(
      { error: "Could not save this trial. Please try again." },
      { status: 500 }
    );
  }

  // 4. audit_log write -- every patient data write must be logged
  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: body.patient_id,
    action: "UPSERT",
    resource_type: "trial_saves",
    resource_id: saved.id,
    organization_id: orgId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  }).then(() => undefined, () => undefined);

  return NextResponse.json({ id: saved.id }, { status: 200 });
}
