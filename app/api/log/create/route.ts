/**
 * app/api/log/create/route.ts
 * Creates a new symptom log entry for a patient.
 * Tables: symptom_logs (write), patients (read), users (read), audit_log (write)
 * Auth: caregiver, patient, provider
 * Sprint: S2 -- fix client-side PHI write on symptom_logs
 * HIPAA: Contains patient symptom data. Auth + role + org_id enforced.
 *        audit_log written on every successful insert. No PHI in error responses.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import type { Json } from "@/lib/supabase/types";

export const runtime = "nodejs";

const ROUTE = 'api/log/create';

const ALLOWED_ROLES = ["caregiver", "patient", "provider"];

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

  // Parse body
  let body: {
    patient_id?: string;
    overall_severity?: number;
    symptoms?: Json;
    responses?: Json;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.patient_id) {
    return NextResponse.json({ error: "patient_id is required" }, { status: 400 });
  }

  // overall_severity must be 1-5 integer
  const severity = body.overall_severity;
  if (typeof severity !== "number" || !Number.isInteger(severity) || severity < 1 || severity > 5) {
    return NextResponse.json(
      { error: "overall_severity must be an integer between 1 and 5" },
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

  // Write symptom log
  const { data: inserted, error: insertError } = await supabase
    .from("symptom_logs")
    .insert({
      patient_id: body.patient_id,
      logged_by: user.id,
      organization_id: orgId,
      symptoms: body.symptoms ?? [],
      overall_severity: severity,
      responses: body.responses ?? null,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error(JSON.stringify({ route: ROUTE, method: request.method, error: insertError?.message ?? 'insert returned no data', code: (insertError as any)?.code ?? null, stack: null, userId: user.id, timestamp: new Date().toISOString(), step: 'insert_symptom_log' }));
    return NextResponse.json(
      { error: "Could not save your log entry. Please try again." },
      { status: 500 }
    );
  }

  // 4. audit_log write -- every patient data insert must be logged
  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      patient_id: body.patient_id,
      action: "INSERT",
      resource_type: "symptom_logs",
      resource_id: inserted.id,
      organization_id: orgId,
      ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
      status: "success",
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ id: inserted.id }, { status: 201 });
}
