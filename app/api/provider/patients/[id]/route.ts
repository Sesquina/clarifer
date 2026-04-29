/**
 * app/api/provider/patients/[id]/route.ts
 * Full patient detail view for a provider.
 * Tables: patients, symptom_logs, medications, appointments, documents,
 *         symptom_alerts, provider_notes, care_relationships,
 *         users (read), audit_log (write)
 * Auth: provider role only
 * Sprint: Sprint 12 -- Provider Portal
 *
 * HIPAA: Full clinical PHI for one patient. Org-scoped on every read.
 * Provider must have a care_relationships row for this patient_id;
 * otherwise 404 (do not leak existence). audit_log written with
 * action PROVIDER_VIEW.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["provider"];

function forensicColumns(request: Request) {
  return {
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id: patientId } = await params;
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
  const orgId = userRecord.organization_id;

  // Authorization gate: provider must have a care_relationships row
  // for this patient. Without it, return 404.
  const { data: relationship } = await supabase
    .from("care_relationships")
    .select("patient_id")
    .eq("user_id", user.id)
    .eq("patient_id", patientId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!relationship) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Patient must be in the same org (defense in depth).
  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .eq("organization_id", orgId)
    .single();
  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  const [symptomLogs, medications, upcomingAppts, recentDocs, alerts, notes] = await Promise.all([
    supabase
      .from("symptom_logs")
      .select("*")
      .eq("patient_id", patientId)
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
    supabase
      .from("medications")
      .select("*")
      .eq("patient_id", patientId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", patientId)
      .eq("organization_id", orgId)
      .gte("datetime", nowIso)
      .order("datetime", { ascending: true })
      .limit(3),
    supabase
      .from("documents")
      .select("*")
      .eq("patient_id", patientId)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("symptom_alerts")
      .select("*")
      .eq("patient_id", patientId)
      .is("acknowledged_at", null)
      .order("triggered_at", { ascending: false }),
    supabase
      .from("provider_notes")
      .select("*")
      .eq("patient_id", patientId)
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      action: "PROVIDER_VIEW",
      resource_type: "patient",
      resource_id: patientId,
      patient_id: patientId,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({
    patient,
    symptom_logs: symptomLogs.data ?? [],
    medications: medications.data ?? [],
    upcoming_appointments: upcomingAppts.data ?? [],
    recent_documents: recentDocs.data ?? [],
    active_alerts: alerts.data ?? [],
    provider_notes: notes.data ?? [],
  });
}
