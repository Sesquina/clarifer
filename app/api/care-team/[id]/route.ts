/**
 * GET/PATCH/DELETE /api/care-team/[id]
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALL_ROLES = ["caregiver", "provider", "admin"];
const WRITE_ROLES = ["caregiver"];

async function loadUser(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, userRecord: null };
  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();
  return { supabase, user, userRecord };
}

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
  const { supabase, user, userRecord } = await loadUser(request);
  if (!user || !userRecord?.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ALL_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: row } = await supabase
    .from("care_relationships")
    .select("*")
    .eq("id", id)
    .eq("organization_id", userRecord.organization_id)
    .single();
  if (!row) return NextResponse.json({ error: "We could not find that member." }, { status: 404 });

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: row.patient_id,
    action: "SELECT",
    resource_type: "care_team",
    resource_id: id,
    organization_id: userRecord.organization_id,
    ...forensicColumns(request),
  });

  return NextResponse.json(row);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id } = await params;
  const { supabase, user, userRecord } = await loadUser(request);
  if (!user || !userRecord?.organization_id) {
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

  const update: Record<string, unknown> = {};
  if ("role" in body) update.relationship_type = body.role;
  if ("details" in body) update.access_level = JSON.stringify(body.details ?? {});

  const { data: existing } = await supabase
    .from("care_relationships")
    .select("id, patient_id")
    .eq("id", id)
    .eq("organization_id", userRecord.organization_id)
    .single();
  if (!existing) {
    return NextResponse.json({ error: "We could not find that member." }, { status: 404 });
  }

  if (Object.keys(update).length > 0) {
    await supabase
      .from("care_relationships")
      .update(update)
      .eq("id", id)
      .eq("organization_id", userRecord.organization_id);
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: existing.patient_id,
    action: "UPDATE",
    resource_type: "care_team",
    resource_id: id,
    organization_id: userRecord.organization_id,
    ...forensicColumns(request),
  });

  return NextResponse.json({ id });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id } = await params;
  const { supabase, user, userRecord } = await loadUser(request);
  if (!user || !userRecord?.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!WRITE_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("care_relationships")
    .select("id, patient_id")
    .eq("id", id)
    .eq("organization_id", userRecord.organization_id)
    .single();
  if (!existing) {
    return NextResponse.json({ error: "We could not find that member." }, { status: 404 });
  }

  await supabase
    .from("care_relationships")
    .delete()
    .eq("id", id)
    .eq("organization_id", userRecord.organization_id);

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: existing.patient_id,
    action: "DELETE",
    resource_type: "care_team",
    resource_id: id,
    organization_id: userRecord.organization_id,
    ...forensicColumns(request),
  });

  return NextResponse.json({ success: true });
}
