/**
 * app/api/admin/who-ictrp-ingest/route.ts
 * Admin-only endpoint to ingest WHO ICTRP CSV data.
 * Tables: who_ictrp_trials (write), audit_log (write)
 * Auth: admin role only
 * Sprint: Sprint 10 -- WHO ICTRP Pipeline
 *
 * HIPAA: No PHI. Public trial data ingest. Audit logged with action
 * ADMIN_WHO_ICTRP_INGEST so any ingest is attributable to a specific admin.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import { ingestWhoIctrpCsv } from "@/lib/trials/who-ictrp-ingest";

export const runtime = "nodejs";
export const maxDuration = 300;

const ALLOWED_ROLES = ["admin"];

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();
  if (!userRecord || !ALLOWED_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgId = userRecord.organization_id;

  const body = (await request.json().catch(() => null)) as { csv_text?: string } | null;
  if (!body?.csv_text || typeof body.csv_text !== "string") {
    return NextResponse.json({ error: "csv_text required" }, { status: 400 });
  }

  const result = await ingestWhoIctrpCsv(body.csv_text);

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      action: "ADMIN_WHO_ICTRP_INGEST",
      resource_type: "who_ictrp_trials",
      ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
      status: result.errors.length > 0 ? "partial" : "success",
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json(result);
}
