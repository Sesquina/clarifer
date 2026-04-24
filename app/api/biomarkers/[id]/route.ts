/**
 * PATCH/DELETE /api/biomarkers/[id]
 * Auth + role + org scope + audit_log.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "provider", "admin"];
const ALLOWED_STATUSES = ["positive", "negative", "not_tested", "pending", "inconclusive"];

async function authorize(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();
  if (!userRecord?.organization_id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { supabase, user, organizationId: userRecord.organization_id };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const auth = await authorize(request);
  if ("error" in auth) return auth.error;
  const { supabase, user, organizationId } = auth;
  const { id } = await params;

  let body: {
    status?: string;
    value?: string | null;
    tested_date?: string | null;
    notes?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.status === "string" && !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("biomarkers")
    .select("id, patient_id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "We could not find that biomarker." }, { status: 404 });
  }

  const { error } = await supabase
    .from("biomarkers")
    .update({
      status: body.status,
      value: body.value ?? null,
      tested_date: body.tested_date ?? null,
      notes: body.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "We could not save this biomarker." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: existing.patient_id,
    action: "UPDATE",
    resource_type: "biomarkers",
    resource_id: id,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  return NextResponse.json({ id });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const auth = await authorize(request);
  if ("error" in auth) return auth.error;
  const { supabase, user, organizationId } = auth;
  const { id } = await params;

  const { data: existing } = await supabase
    .from("biomarkers")
    .select("id, patient_id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "We could not find that biomarker." }, { status: 404 });
  }

  const { error } = await supabase.from("biomarkers").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "We could not delete that biomarker." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: existing.patient_id,
    action: "DELETE",
    resource_type: "biomarkers",
    resource_id: id,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  return NextResponse.json({ id });
}
