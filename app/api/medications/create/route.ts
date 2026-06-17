/**
 * app/api/medications/create/route.ts
 * Creates a new medication record for a patient.
 * Tables: medications (write), patients (read), users (read), audit_log (write)
 * Auth: caregiver, provider
 * Sprint: S3 -- fix client-side PHI write on medications table
 * HIPAA: Contains patient medication data. Auth + role + org_id enforced.
 *        audit_log written on every successful insert. No PHI in error responses.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ROUTE = 'api/medications/create';

const ALLOWED_ROLES = ["caregiver", "provider"];

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn(JSON.stringify({ route: ROUTE, method: request.method, event: 'unauthorized', userId: 'none', timestamp: new Date().toISOString() }));
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Role check + org_id
  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();
  if (!userRecord?.organization_id) {
    console.warn(JSON.stringify({ route: ROUTE, method: request.method, event: 'unauthorized', userId: user.id, timestamp: new Date().toISOString() }));
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) {
    console.warn(JSON.stringify({ route: ROUTE, method: request.method, event: 'unauthorized', userId: user.id, timestamp: new Date().toISOString() }));
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = userRecord.organization_id;

  let body: {
    patient_id?: string;
    drug_name?: string;
    dosage?: string | null;
    dosage_unit?: string | null;
    frequency?: string | null;
    start_date?: string | null;
    notes?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.patient_id || !body.drug_name?.trim()) {
    return NextResponse.json(
      { error: "Please enter a medication name and pick a patient." },
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

  // Write medication record
  const { data: med, error: insertError } = await supabase
    .from("medications")
    .insert({
      patient_id: body.patient_id,
      added_by: user.id,
      name: body.drug_name.trim(),
      dose: body.dosage ?? null,
      unit: body.dosage_unit ?? null,
      frequency: body.frequency ?? null,
      start_date: body.start_date ?? null,
      notes: body.notes ?? null,
      is_active: true,
      organization_id: orgId,
    })
    .select("*")
    .single();

  if (insertError || !med) {
    console.error(JSON.stringify({ route: ROUTE, method: request.method, error: insertError?.message ?? 'insert returned no data', code: (insertError as any)?.code ?? null, stack: null, userId: user.id, timestamp: new Date().toISOString(), step: 'insert_medication' }));
    return NextResponse.json(
      { error: "We could not save this medication. Please try again." },
      { status: 500 }
    );
  }

  // 4. audit_log write -- every patient data insert must be logged
  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: body.patient_id,
    action: "INSERT",
    resource_type: "medications",
    resource_id: med.id,
    organization_id: orgId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  }).then(() => undefined, () => undefined);

  return NextResponse.json({ medication: med }, { status: 201 });
}
