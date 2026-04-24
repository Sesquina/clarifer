/**
 * GET/POST /api/biomarkers
 * Auth + role + org scope + audit_log.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "provider", "admin"];
const ALLOWED_STATUSES = ["positive", "negative", "not_tested", "pending", "inconclusive"];

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
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const patientId = url.searchParams.get("patient_id");
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient_id" }, { status: 400 });
  }

  const organizationId = userRecord.organization_id;

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!patient) {
    return NextResponse.json({ error: "We could not find this patient." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("biomarkers")
    .select("id, biomarker_type, status, value, tested_date, lab_name, notes, updated_at")
    .eq("patient_id", patientId)
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Something went wrong on our end." }, { status: 500 });
  }

  return NextResponse.json({ biomarkers: data ?? [] });
}

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
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    patient_id?: string;
    biomarker_type?: string;
    status?: string;
    value?: string;
    tested_date?: string;
    lab_name?: string;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.patient_id || !body.biomarker_type?.trim() || !body.status) {
    return NextResponse.json(
      { error: "Please enter a biomarker name and status." },
      { status: 400 }
    );
  }
  if (!ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const organizationId = userRecord.organization_id;

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", body.patient_id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!patient) {
    return NextResponse.json({ error: "We could not find this patient." }, { status: 404 });
  }

  const { data: row, error: insertError } = await supabase
    .from("biomarkers")
    .insert({
      patient_id: body.patient_id,
      organization_id: organizationId,
      created_by: user.id,
      biomarker_type: body.biomarker_type.trim(),
      status: body.status,
      value: body.value ?? null,
      tested_date: body.tested_date ?? null,
      lab_name: body.lab_name ?? null,
      notes: body.notes ?? null,
    })
    .select("id, biomarker_type, status")
    .single();

  if (insertError || !row) {
    return NextResponse.json(
      { error: "We could not save this biomarker. Please try again." },
      { status: 500 }
    );
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: body.patient_id,
    action: "INSERT",
    resource_type: "biomarkers",
    resource_id: row.id,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  return NextResponse.json({ id: row.id, biomarker_type: row.biomarker_type, status: row.status }, { status: 201 });
}
