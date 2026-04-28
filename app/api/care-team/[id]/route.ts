/**
 * app/api/care-team/[id]/route.ts
 * GET / PATCH / DELETE a single care team member.
 * Tables: care_team (read/write), audit_log (write); message templates
 * cascade via FK on DELETE.
 * Auth: read = caregiver / patient / provider / admin; write = caregiver / admin.
 * Sprint: Sprint 10 -- Care Team Directory
 *
 * HIPAA: Provider contact info is org-scoped. Audit logged on every read,
 * update, and delete. PATCH uses an explicit allowlist so callers cannot
 * patch unintended columns.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import type { Database } from "@/lib/supabase/types";

export const runtime = "nodejs";

const READ_ROLES = ["caregiver", "patient", "provider", "admin"];
const WRITE_ROLES = ["caregiver", "admin"];

type CareTeamUpdate = Database["public"]["Tables"]["care_team"]["Update"];

function forensicColumns(request: Request) {
  return {
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  };
}

async function loadUserAndOrg(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, orgId: null, role: null };
  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();
  return {
    user,
    orgId: userRecord?.organization_id ?? null,
    role: userRecord?.role ?? null,
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
  const { user, orgId, role } = await loadUserAndOrg(supabase);
  if (!user || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!READ_ROLES.includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: row } = await supabase
    .from("care_team")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      action: "SELECT",
      resource_type: "care_team",
      resource_id: id,
      patient_id: row.patient_id,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ member: row });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id } = await params;
  const supabase = await createClient();
  const { user, orgId, role } = await loadUserAndOrg(supabase);
  if (!user || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!WRITE_ROLES.includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("care_team")
    .select("id, patient_id, organization_id")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const update: CareTeamUpdate = {};
  if ("name" in body && typeof body.name === "string" && body.name.trim().length > 0) {
    update.name = body.name.trim();
  }
  if ("role" in body && (typeof body.role === "string" || body.role === null)) {
    update.role = body.role as string | null;
  }
  if ("specialty" in body && (typeof body.specialty === "string" || body.specialty === null)) {
    update.specialty = body.specialty as string | null;
  }
  if ("phone" in body && (typeof body.phone === "string" || body.phone === null)) {
    update.phone = body.phone as string | null;
  }
  if ("email" in body && (typeof body.email === "string" || body.email === null)) {
    update.email = body.email as string | null;
  }
  if ("fax" in body && (typeof body.fax === "string" || body.fax === null)) {
    update.fax = body.fax as string | null;
  }
  if ("address" in body && (typeof body.address === "string" || body.address === null)) {
    update.address = body.address as string | null;
  }
  if ("npi" in body && (typeof body.npi === "string" || body.npi === null)) {
    update.npi = body.npi as string | null;
  }
  if ("notes" in body && (typeof body.notes === "string" || body.notes === null)) {
    update.notes = body.notes as string | null;
  }
  if ("is_primary" in body && typeof body.is_primary === "boolean") {
    update.is_primary = body.is_primary;
  }

  const updatedKeys = Object.keys(update);
  if (updatedKeys.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("care_team")
    .update(update)
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      action: "UPDATE",
      resource_type: "care_team",
      resource_id: id,
      patient_id: existing.patient_id,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ id, updated: updatedKeys });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id } = await params;
  const supabase = await createClient();
  const { user, orgId, role } = await loadUserAndOrg(supabase);
  if (!user || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!WRITE_ROLES.includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("care_team")
    .select("id, patient_id, organization_id")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Templates cascade via FK ON DELETE CASCADE on care_team_message_templates.
  const { error } = await supabase
    .from("care_team")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      action: "DELETE",
      resource_type: "care_team",
      resource_id: id,
      patient_id: existing.patient_id,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ ok: true });
}
