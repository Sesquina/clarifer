/**
 * app/api/provider/patients/[id]/notes/route.ts
 * List and create provider notes for a patient.
 * Tables: provider_notes (read/write), care_relationships (read),
 *         users (read), audit_log (write)
 * Auth: provider role only
 * Sprint: Sprint 12 -- Provider Portal
 *
 * HIPAA: Clinical notes are PHI. Org-scoped on every read/write.
 * Provider can only see and create their own notes (not other
 * providers' notes for the same patient). audit_log written.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import type { Database } from "@/lib/supabase/types";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["provider"];
const ALLOWED_NOTE_TYPES = ["general", "visit", "alert", "follow_up"];

type ProviderNoteInsert = Database["public"]["Tables"]["provider_notes"]["Insert"];

function forensicColumns(request: Request) {
  return {
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  };
}

async function authorize(supabase: Awaited<ReturnType<typeof createClient>>, patientId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, message: "Unauthorized" };
  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();
  if (!userRecord?.organization_id) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }
  // Provider must have access to this patient via care_relationships.
  const { data: relationship } = await supabase
    .from("care_relationships")
    .select("patient_id")
    .eq("user_id", user.id)
    .eq("patient_id", patientId)
    .eq("organization_id", userRecord.organization_id)
    .maybeSingle();
  if (!relationship) {
    return { ok: false as const, status: 404, message: "Not found" };
  }
  return { ok: true as const, user, orgId: userRecord.organization_id };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id: patientId } = await params;
  const supabase = await createClient();
  const auth = await authorize(supabase, patientId);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { data, error } = await supabase
    .from("provider_notes")
    .select("*")
    .eq("patient_id", patientId)
    .eq("provider_id", auth.user.id)
    .eq("organization_id", auth.orgId)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("audit_log")
    .insert({
      user_id: auth.user.id,
      organization_id: auth.orgId,
      action: "SELECT",
      resource_type: "provider_notes",
      patient_id: patientId,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id: patientId } = await params;
  const supabase = await createClient();
  const auth = await authorize(supabase, patientId);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const noteText = typeof body.note_text === "string" ? body.note_text.trim() : "";
  if (!noteText) return NextResponse.json({ error: "note_text required" }, { status: 400 });
  const noteType =
    typeof body.note_type === "string" && ALLOWED_NOTE_TYPES.includes(body.note_type)
      ? body.note_type
      : "general";

  const insertRow: ProviderNoteInsert = {
    patient_id: patientId,
    provider_id: auth.user.id,
    organization_id: auth.orgId,
    note_text: noteText,
    note_type: noteType,
  };

  const { data, error } = await supabase
    .from("provider_notes")
    .insert(insertRow)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("audit_log")
    .insert({
      user_id: auth.user.id,
      organization_id: auth.orgId,
      action: "INSERT",
      resource_type: "provider_notes",
      resource_id: data.id,
      patient_id: patientId,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ note: data }, { status: 201 });
}
