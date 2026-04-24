/**
 * GET /api/medications/[id] -- lists a patient's active medications.
 * The [id] segment is the patient id. The PATCH update route lives at
 * /api/medications/[id]/update and uses [id] as the medication id; Next.js
 * requires the same slug name at a given path level, so both endpoints
 * share "id" even though the semantic target differs.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["caregiver", "provider", "admin"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const { id: patientId } = await params;
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

  const { data: meds } = await supabase
    .from("medications")
    .select("id, name, dose, unit, frequency, indication, notes, start_date, is_active")
    .eq("patient_id", patientId)
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: patientId,
    action: "SELECT",
    resource_type: "medications",
    resource_id: patientId,
    organization_id: organizationId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  return NextResponse.json({ medications: meds ?? [] });
}
