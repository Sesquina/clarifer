/**
 * POST /api/symptoms/log
 * Logs a symptom entry scoped to a condition_template_id.
 * Auth: authenticate → role-check (caregiver only) → insert symptom_log → audit_log.
 * HIPAA Tier 1: audit_log written on every successful insert.
 * No PHI in any log output.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import type { Json } from "@/lib/supabase/types";

const ALLOWED_ROLES = ["caregiver"];

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  // 1. Authenticate
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // 2. Authorize
  const { data: userRecord } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord || !ALLOWED_ROLES.includes(userRecord.role ?? "") || !userRecord.organization_id) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const organizationId = userRecord.organization_id;

  // 3. Parse input
  let patientId: string;
  let conditionTemplateId: string;
  let responses: Record<string, unknown>;
  let overallSeverity: number;

  try {
    const body = await request.json();
    patientId = body.patientId;
    conditionTemplateId = body.conditionTemplateId;
    responses = body.responses ?? {};
    overallSeverity = body.overallSeverity ?? 5;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  if (!patientId || !conditionTemplateId) {
    return NextResponse.json(
      { error: "patientId and conditionTemplateId are required", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  // 4. Insert symptom log scoped to condition template
  const { data: log, error: insertError } = await supabase
    .from("symptom_logs")
    .insert({
      patient_id: patientId,
      logged_by: user.id,
      condition_context: conditionTemplateId,
      responses: responses as unknown as Json,
      overall_severity: overallSeverity,
      organization_id: organizationId,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message, code: "DB_ERROR" },
      { status: 500 }
    );
  }

  // 5. Audit log — HIPAA Tier 1, required on every symptom write
  await supabase.from("audit_log").insert({
    user_id: user.id,
    patient_id: patientId,
    action: "symptom_logged",
    resource_type: "symptom_logs",
    resource_id: log.id,
    organization_id: organizationId,
  });

  return NextResponse.json({ id: log.id }, { status: 201 });
}
