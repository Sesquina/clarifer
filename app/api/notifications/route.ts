/**
 * app/api/notifications/route.ts
 * GET /api/notifications -- list current user's notifications (and unread count).
 * Tables: notifications (read), users (read), audit_log (write)
 * Auth: caregiver, patient, provider, admin
 * HIPAA: notifications are user-scoped; we also enforce organization_id
 *        on every read. audit_log SELECT written with forensic columns.
 *        No PHI in error responses or logs.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const READ_ROLES = ["caregiver", "patient", "provider", "admin"];

function forensicColumns(request: Request) {
  return {
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  };
}

export async function GET(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

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
  if (!READ_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgId = userRecord.organization_id;

  const { searchParams } = new URL(request.url);
  const onlyCount = searchParams.get("count") === "1";
  const filter = searchParams.get("filter");

  if (onlyCount) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .eq("read", false);
    return NextResponse.json({ unread: count ?? 0 });
  }

  let query = supabase
    .from("notifications")
    .select("id, title, message, type, action_url, read, created_at")
    .eq("user_id", user.id)
    .eq("organization_id", orgId);

  if (filter === "symptom_alert" || filter === "medication_reminder" || filter === "care_team_update") {
    query = query.eq("type", filter);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      action: "SELECT",
      resource_type: "notifications",
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  const unread = (data ?? []).filter((n) => !n.read).length;
  return NextResponse.json({ notifications: data ?? [], unread });
}
