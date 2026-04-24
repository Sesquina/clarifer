/**
 * GET /api/symptoms/[patientId]?days=7|30|90
 * Returns time-series symptom data for the chart.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "provider", "admin"];
const ALLOWED_WINDOWS = [7, 30, 90];

type SymptomResponses = Record<string, number | string | boolean | null | Array<unknown>>;
type SymptomRow = {
  created_at: string | null;
  overall_severity: number | null;
  responses: SymptomResponses | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { patientId } = await params;
  const url = new URL(request.url);
  const daysRaw = parseInt(url.searchParams.get("days") ?? "30", 10);
  const days = ALLOWED_WINDOWS.includes(daysRaw) ? daysRaw : 30;

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
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = userRecord.organization_id;
  const windowStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: logs } = await supabase
    .from("symptom_logs")
    .select("created_at, overall_severity, responses")
    .eq("patient_id", patientId)
    .eq("organization_id", organizationId)
    .gte("created_at", windowStart)
    .order("created_at", { ascending: true });

  const points: Array<{ date: string; symptom_key: string; value: number }> = [];
  for (const row of ((logs ?? []) as SymptomRow[])) {
    const date = row.created_at?.slice(0, 10) ?? "";
    if (!date) continue;
    if (row.overall_severity != null) {
      points.push({ date, symptom_key: "overall_severity", value: row.overall_severity });
    }
    const responses = row.responses;
    if (responses && typeof responses === "object") {
      for (const [key, val] of Object.entries(responses)) {
        if (typeof val === "number") {
          points.push({ date, symptom_key: key, value: val });
        }
      }
    }
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: patientId,
    action: "SELECT",
    resource_type: "symptom_logs",
    resource_id: patientId,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  return NextResponse.json({ points, days });
}
