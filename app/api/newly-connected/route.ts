/**
 * GET/POST/PATCH /api/newly-connected
 * Auto-creates a 30-day checklist for a patient; persists toggle updates.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import { buildChecklist } from "@/lib/ccf/newly-connected-template";
import type { NewlyConnectedItem } from "@/lib/ccf/newly-connected-template";
import type { Json } from "@/lib/supabase/types";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "provider", "admin"];

export async function GET(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userRecord } = await supabase
    .from("users").select("role, organization_id").eq("id", user.id).single();
  if (!userRecord?.organization_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const patientId = url.searchParams.get("patient_id");
  if (!patientId) return NextResponse.json({ error: "Missing patient_id" }, { status: 400 });

  const organizationId = userRecord.organization_id;

  const { data: patient } = await supabase
    .from("patients").select("id").eq("id", patientId).eq("organization_id", organizationId).maybeSingle();
  if (!patient) return NextResponse.json({ error: "We could not find this patient." }, { status: 404 });

  let { data: row } = await supabase
    .from("newly_connected_checklists")
    .select("id, checklist_items, completed_at, created_at")
    .eq("patient_id", patientId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!row) {
    const items = buildChecklist();
    const insert = await supabase
      .from("newly_connected_checklists")
      .insert({
        patient_id: patientId,
        organization_id: organizationId,
        checklist_items: items as unknown as Json,
      })
      .select("id, checklist_items, completed_at, created_at")
      .single();
    row = insert.data ?? null;
  }

  return NextResponse.json({
    id: row?.id ?? null,
    items: ((row?.checklist_items as unknown) as NewlyConnectedItem[]) ?? buildChecklist(),
    completed_at: row?.completed_at ?? null,
    created_at: row?.created_at ?? null,
  });
}

export async function PATCH(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userRecord } = await supabase
    .from("users").select("role, organization_id").eq("id", user.id).single();
  if (!userRecord?.organization_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { patient_id?: string; items?: NewlyConnectedItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.patient_id || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Missing patient_id or items" }, { status: 400 });
  }

  const organizationId = userRecord.organization_id;
  const allDone = body.items.every((i) => i.checked);

  const { error } = await supabase
    .from("newly_connected_checklists")
    .update({
      checklist_items: body.items as unknown as Json,
      completed_at: allDone ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("patient_id", body.patient_id)
    .eq("organization_id", organizationId);

  if (error) {
    return NextResponse.json({ error: "We could not save your progress." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, completed: allDone });
}
