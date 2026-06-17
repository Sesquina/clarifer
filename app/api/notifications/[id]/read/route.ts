/**
 * app/api/notifications/[id]/read/route.ts
 * PATCH /api/notifications/[id]/read -- mark a single notification read.
 * Tables: notifications (read+update), users (read), audit_log (write)
 * Auth: caregiver, patient, provider, admin (own notifications only)
 * HIPAA: row must belong to caller (user_id + organization_id) or we
 *        return 404 -- never leak whether a foreign row exists.
 *        audit_log UPDATE written with forensic columns.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from '@/lib/auth/get-user';
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const WRITE_ROLES = ["caregiver", "patient", "provider", "admin"];

function forensicColumns(request: Request) {
  return {
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = await createClient();
  const user = await getUserFromRequest(request);
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
  const orgId = userRecord.organization_id;

  // Cross-tenant / wrong-user guard: only update rows owned by the
  // caller. Return 404 if no row matches -- do not leak existence.
  const { data: updated, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("organization_id", orgId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      action: "UPDATE",
      resource_type: "notifications",
      resource_id: updated.id,
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ id: updated.id, read: true });
}
