/**
 * PATCH /api/medications/[id]/update
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import type { Database } from "@/lib/supabase/types";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "provider"];

type MedicationUpdate = Database["public"]["Tables"]["medications"]["Update"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id } = await params;
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("medications")
    .select("id, patient_id, organization_id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();
  if (!existing) {
    return NextResponse.json({ error: "We could not find that medication." }, { status: 404 });
  }

  const update: MedicationUpdate = {};
  if ("dose" in body && (typeof body.dose === "string" || body.dose === null)) {
    update.dose = body.dose;
  }
  if ("unit" in body && (typeof body.unit === "string" || body.unit === null)) {
    update.unit = body.unit;
  }
  if ("frequency" in body && (typeof body.frequency === "string" || body.frequency === null)) {
    update.frequency = body.frequency;
  }
  if ("notes" in body && (typeof body.notes === "string" || body.notes === null)) {
    update.notes = body.notes;
  }
  if ("is_active" in body && (typeof body.is_active === "boolean" || body.is_active === null)) {
    update.is_active = body.is_active;
  }

  const updatedKeys = Object.keys(update);
  if (updatedKeys.length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("medications")
    .update(update)
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (updateError) {
    return NextResponse.json(
      { error: "We could not update this medication. Please try again." },
      { status: 500 }
    );
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: existing.patient_id,
    action: "UPDATE",
    resource_type: "medications",
    resource_id: id,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  return NextResponse.json({ id, updated: updatedKeys });
}
