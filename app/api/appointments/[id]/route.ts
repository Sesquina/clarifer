/**
 * app/api/appointments/[id]/route.ts
 * GET/PATCH/DELETE single appointment by id.
 * Tables: appointments (read/write/delete), users (read), audit_log (write)
 * Auth: GET caregiver/provider/admin; PATCH caregiver/provider; DELETE caregiver/admin
 * Sprint: Sprint 7 (GET/PATCH) + Sprint 11 (post_visit_action_items, DELETE)
 *
 * HIPAA: Org-scoped on every read/write. Cross-tenant access returns
 * 404 (not 403) to avoid leaking tenant existence. audit_log written
 * for every operation with forensic columns. No PHI in error responses.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import type { Database, Json } from "@/lib/supabase/types";

export const runtime = "nodejs";

const ALL_ROLES = ["caregiver", "provider", "admin"];
const WRITE_ROLES = ["caregiver", "provider"];
const DELETE_ROLES = ["caregiver", "admin"];

type AppointmentUpdate = Database["public"]["Tables"]["appointments"]["Update"];

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
  if (!ALL_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: appt } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("organization_id", userRecord.organization_id)
    .single();
  if (!appt) {
    return NextResponse.json({ error: "We could not find that appointment." }, { status: 404 });
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: appt.patient_id,
    action: "SELECT",
    resource_type: "appointments",
    resource_id: id,
    organization_id: userRecord.organization_id,
    ...forensicColumns(request),
  });

  return NextResponse.json(appt);
}

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
  if (!WRITE_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const update: AppointmentUpdate = {};
  if ("pre_visit_checklist" in body) update.pre_visit_checklist = body.pre_visit_checklist as Json;
  if ("post_visit_notes" in body && (typeof body.post_visit_notes === "string" || body.post_visit_notes === null)) {
    update.post_visit_notes = body.post_visit_notes;
  }
  if ("appointment_type" in body && (typeof body.appointment_type === "string" || body.appointment_type === null)) {
    update.appointment_type = body.appointment_type;
  }
  if ("completed" in body && (typeof body.completed === "boolean" || body.completed === null)) {
    update.completed = body.completed;
  }
  if ("notes" in body && (typeof body.notes === "string" || body.notes === null)) {
    update.notes = body.notes;
  }
  if ("post_visit_action_items" in body && Array.isArray(body.post_visit_action_items)) {
    update.post_visit_action_items = body.post_visit_action_items as Json;
  }

  const { data: existing } = await supabase
    .from("appointments")
    .select("id, patient_id")
    .eq("id", id)
    .eq("organization_id", userRecord.organization_id)
    .single();
  if (!existing) {
    return NextResponse.json({ error: "We could not find that appointment." }, { status: 404 });
  }

  if (Object.keys(update).length > 0) {
    const { error } = await supabase
      .from("appointments")
      .update(update)
      .eq("id", id)
      .eq("organization_id", userRecord.organization_id);
    if (error) {
      return NextResponse.json(
        { error: "We could not update this appointment. Please try again." },
        { status: 500 }
      );
    }
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: existing.patient_id,
    action: "UPDATE",
    resource_type: "appointments",
    resource_id: id,
    organization_id: userRecord.organization_id,
    ...forensicColumns(request),
  });

  return NextResponse.json({ id, updated: Object.keys(update) });
}

/**
 * DELETE /api/appointments/[id]
 * Removes an appointment from the patient's record. Restricted to
 * caregiver/admin roles. Cross-tenant returns 404 (do not leak tenant
 * existence). audit_log DELETE written with forensic columns even when
 * the row is gone afterwards -- the action is the audit subject.
 */
export async function DELETE(
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
  if (!DELETE_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgId = userRecord.organization_id;

  const { data: existing } = await supabase
    .from("appointments")
    .select("id, patient_id")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();
  if (!existing) {
    return NextResponse.json({ error: "We could not find that appointment." }, { status: 404 });
  }

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) {
    return NextResponse.json(
      { error: "We could not remove this appointment. Please try again." },
      { status: 500 }
    );
  }

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      patient_id: existing.patient_id,
      action: "DELETE",
      resource_type: "appointments",
      resource_id: id,
      organization_id: orgId,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ id, deleted: true });
}
