/**
 * app/api/care-team/[id]/message-templates/route.ts
 * GET / POST short message templates for a care team member.
 * Tables: care_team (read for org check), care_team_message_templates (read/write),
 *         audit_log (write).
 * Auth: read = caregiver / admin; create = caregiver / admin.
 * Sprint: Sprint 10 -- Care Team Directory
 *
 * HIPAA: Templates can contain PHI by user choice (e.g. "Refill request for
 * Carlos"). Org isolation is enforced via the parent care_team row's
 * organization_id; cross-tenant member ids return 404. Audit logged on write.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import type { Database } from "@/lib/supabase/types";

export const runtime = "nodejs";

const ROLES = ["caregiver", "admin"];

type TemplateInsert = Database["public"]["Tables"]["care_team_message_templates"]["Insert"];

async function loadOrg(supabase: Awaited<ReturnType<typeof createClient>>) {
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

async function memberInOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberId: string,
  orgId: string
): Promise<{ id: string; patient_id: string | null } | null> {
  const { data } = await supabase
    .from("care_team")
    .select("id, patient_id")
    .eq("id", memberId)
    .eq("organization_id", orgId)
    .single();
  return data ?? null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id: memberId } = await params;
  const supabase = await createClient();
  const { user, orgId, role } = await loadOrg(supabase);
  if (!user || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ROLES.includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const member = await memberInOrg(supabase, memberId, orgId);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("care_team_message_templates")
    .select("*")
    .eq("care_team_member_id", memberId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id: memberId } = await params;
  const supabase = await createClient();
  const { user, orgId, role } = await loadOrg(supabase);
  if (!user || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ROLES.includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const member = await memberInOrg(supabase, memberId, orgId);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as
    | { label?: string; body?: string }
    | null;
  if (!body || typeof body.label !== "string" || !body.label.trim()) {
    return NextResponse.json({ error: "label required" }, { status: 400 });
  }
  if (typeof body.body !== "string" || !body.body.trim()) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  const insertRow: TemplateInsert = {
    care_team_member_id: memberId,
    label: body.label.trim(),
    body: body.body,
  };
  const { data, error } = await supabase
    .from("care_team_message_templates")
    .insert(insertRow)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      action: "INSERT",
      resource_type: "care_team_message_templates",
      resource_id: data.id,
      patient_id: member.patient_id,
      ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
      status: "success",
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ template: data }, { status: 201 });
}
