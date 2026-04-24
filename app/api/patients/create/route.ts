/**
 * POST /api/patients/create
 * Creates a new patient scoped to the caller's organization.
 * Auth → role check (caregiver/provider) → insert → audit.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "provider"];

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const organizationId = userRecord.organization_id;

  let body: {
    full_name?: string;
    date_of_birth?: string;
    diagnosis?: string;
    condition_template_id?: string;
    primary_language?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const fullName = body.full_name?.trim();
  if (!fullName) {
    return NextResponse.json(
      { error: "Please enter the patient's full name." },
      { status: 400 }
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("patients")
    .insert({
      name: fullName,
      dob: body.date_of_birth ?? null,
      custom_diagnosis: body.diagnosis ?? null,
      condition_template_id: body.condition_template_id ?? null,
      primary_language: body.primary_language ?? "en",
      organization_id: organizationId,
      created_by: user.id,
    })
    .select("id, name, condition_template_id")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: "We could not save this patient. Please try again." },
      { status: 500 }
    );
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: inserted.id,
    action: "INSERT",
    resource_type: "patients",
    resource_id: inserted.id,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  return NextResponse.json(
    { id: inserted.id, full_name: inserted.name, condition_template_id: inserted.condition_template_id },
    { status: 201 }
  );
}
