/**
 * POST /api/medications/create
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

  const organizationId = userRecord.organization_id;

  let body: {
    patient_id?: string;
    drug_name?: string;
    dosage?: string;
    dosage_unit?: string;
    frequency?: string;
    start_date?: string;
    notes?: string;
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
      organization_id: organizationId,
    })
    .select("id, name")
    .single();

  if (insertError || !med) {
    return NextResponse.json(
      { error: "We could not save this medication. Please try again." },
      { status: 500 }
    );
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: body.patient_id,
    action: "INSERT",
    resource_type: "medications",
    resource_id: med.id,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  return NextResponse.json({ id: med.id, name: med.name }, { status: 201 });
}
