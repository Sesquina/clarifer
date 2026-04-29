/**
 * app/api/provider/patients/[id]/notes/[noteId]/route.ts
 * Update or delete a single provider note.
 * Tables: provider_notes (read/write/delete), users (read),
 *         audit_log (write)
 * Auth: provider role only; provider must own the note (provider_id = caller)
 * Sprint: Sprint 12 -- Provider Portal
 *
 * HIPAA: Clinical notes are PHI. Org-scoped on every read/write.
 * Provider cannot edit or delete other providers' notes (404 leak-
 * proof). audit_log written for UPDATE / DELETE with forensic columns.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import type { Database } from "@/lib/supabase/types";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["provider"];
const ALLOWED_NOTE_TYPES = ["general", "visit", "alert", "follow_up"];

type ProviderNoteUpdate = Database["public"]["Tables"]["provider_notes"]["Update"];

function forensicColumns(request: Request) {
  return {
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  };
}

async function authorizeAndOwn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  patientId: string,
  noteId: string
) {
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
  // Note must exist, belong to this provider, this patient, this org.
  const { data: note } = await supabase
    .from("provider_notes")
    .select("id")
    .eq("id", noteId)
    .eq("patient_id", patientId)
    .eq("provider_id", user.id)
    .eq("organization_id", userRecord.organization_id)
    .maybeSingle();
  if (!note) return { ok: false as const, status: 404, message: "Not found" };
  return { ok: true as const, user, orgId: userRecord.organization_id };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id: patientId, noteId } = await params;
  const supabase = await createClient();
  const auth = await authorizeAndOwn(supabase, patientId, noteId);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const update: ProviderNoteUpdate = { updated_at: new Date().toISOString() };
  if ("note_text" in body && typeof body.note_text === "string") {
    const trimmed = body.note_text.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "note_text required" }, { status: 400 });
    }
    update.note_text = trimmed;
  }
  if (
    "note_type" in body &&
    typeof body.note_type === "string" &&
    ALLOWED_NOTE_TYPES.includes(body.note_type)
  ) {
    update.note_type = body.note_type;
  }

  const { error } = await supabase
    .from("provider_notes")
    .update(update)
    .eq("id", noteId)
    .eq("provider_id", auth.user.id)
    .eq("organization_id", auth.orgId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("audit_log")
    .insert({
      user_id: auth.user.id,
      organization_id: auth.orgId,
      action: "UPDATE",
      resource_type: "provider_notes",
      resource_id: noteId,
      patient_id: patientId,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ id: noteId, updated: Object.keys(update) });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id: patientId, noteId } = await params;
  const supabase = await createClient();
  const auth = await authorizeAndOwn(supabase, patientId, noteId);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { error } = await supabase
    .from("provider_notes")
    .delete()
    .eq("id", noteId)
    .eq("provider_id", auth.user.id)
    .eq("organization_id", auth.orgId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("audit_log")
    .insert({
      user_id: auth.user.id,
      organization_id: auth.orgId,
      action: "DELETE",
      resource_type: "provider_notes",
      resource_id: noteId,
      patient_id: patientId,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ id: noteId, deleted: true });
}
