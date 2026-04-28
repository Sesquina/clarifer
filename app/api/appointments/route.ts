/**
 * app/api/appointments/route.ts
 * List and create appointments for a patient.
 * Tables: appointments (read/write), patients (read), users (read),
 *         audit_log (write)
 * Auth: GET caregiver/patient/provider/admin; POST caregiver/admin
 * Sprint: Sprint 11 -- Appointment Tracker
 *
 * HIPAA: No clinical PHI in responses beyond appointment metadata
 * already in the patient's care record. Org-scoped on every read and
 * write. audit_log written for SELECT (list) and INSERT (create) with
 * forensic columns. No PHI in error responses or logs.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import type { Database, Json } from "@/lib/supabase/types";
import { getPreVisitChecklist } from "@/lib/appointments/checklist-templates";

export const runtime = "nodejs";

const READ_ROLES = ["caregiver", "patient", "provider", "admin"];
const WRITE_ROLES = ["caregiver", "admin"];

type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"];

function forensicColumns(request: Request) {
  return {
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  };
}

/**
 * GET /api/appointments?patient_id=...&from=ISO&to=ISO
 * Returns appointments scoped to the caller's organization for the
 * given patient_id. Optional from/to filter narrows the date range
 * (used by the calendar month/week views). Ordered by datetime asc
 * so upcoming appointments surface first.
 */
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
  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!READ_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgId = userRecord.organization_id;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patient_id");
  if (!patientId) {
    return NextResponse.json({ error: "patient_id required" }, { status: 400 });
  }

  // Cross-tenant guard: confirm patient belongs to caller's org.
  // Returns 404 (not 403) so we do not leak whether the patient exists
  // in another tenant -- per master prompt § HIPAA.
  const { data: patient } = await supabase
    .from("patients")
    .select("organization_id")
    .eq("id", patientId)
    .single();
  if (!patient || patient.organization_id !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .eq("organization_id", orgId);
  if (from) query = query.gte("datetime", from);
  if (to) query = query.lte("datetime", to);
  const { data, error } = await query.order("datetime", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      action: "SELECT",
      resource_type: "appointments",
      patient_id: patientId,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ appointments: data ?? [] });
}

/**
 * POST /api/appointments
 * Body: { patient_id, title, datetime?, provider_name?, provider_specialty?,
 *         location?, notes?, appointment_type?, pre_visit_checklist? }
 * If pre_visit_checklist is omitted, server populates one from the
 * patient's condition_template_id × appointment_type via
 * getPreVisitChecklist(). Caller can still supply a custom list to
 * override. audit_log INSERT with forensic columns.
 */
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
  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!WRITE_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgId = userRecord.organization_id;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  const patientId = typeof body.patient_id === "string" ? body.patient_id : null;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!patientId) return NextResponse.json({ error: "patient_id required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  // Cross-tenant guard + we need condition_template_id for the
  // checklist auto-populate path below.
  const { data: patient } = await supabase
    .from("patients")
    .select("organization_id, condition_template_id")
    .eq("id", patientId)
    .single();
  if (!patient || patient.organization_id !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const apptType = typeof body.appointment_type === "string" ? body.appointment_type : null;
  const providedChecklist =
    Array.isArray(body.pre_visit_checklist) ? (body.pre_visit_checklist as Json) : null;
  const checklist =
    providedChecklist ??
    (getPreVisitChecklist(patient.condition_template_id, apptType) as unknown as Json);

  const insertRow: AppointmentInsert = {
    patient_id: patientId,
    organization_id: orgId,
    created_by: user.id,
    title,
    datetime: typeof body.datetime === "string" ? body.datetime : null,
    provider_name: typeof body.provider_name === "string" ? body.provider_name : null,
    provider_specialty:
      typeof body.provider_specialty === "string" ? body.provider_specialty : null,
    location: typeof body.location === "string" ? body.location : null,
    notes: typeof body.notes === "string" ? body.notes : null,
    appointment_type: apptType,
    pre_visit_checklist: checklist,
    source: "manual",
  };

  const { data, error } = await supabase
    .from("appointments")
    .insert(insertRow)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      action: "INSERT",
      resource_type: "appointments",
      resource_id: data.id,
      patient_id: patientId,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ appointment: data }, { status: 201 });
}
