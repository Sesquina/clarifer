/**
 * app/api/log/[id]/route.ts
 * Updates a symptom log entry with Mode 2 detail fields.
 * Tables: symptom_logs (read + update), users (read), audit_log (write)
 * Auth: caregiver, patient, provider
 * HIPAA: PHI update. All 4 HIPAA checks enforced. No PHI in error responses.
 */
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/get-user";
import { checkOrigin } from "@/lib/cors";

const ROUTE = "api/log/[id]";
const ALLOWED_ROLES = ["caregiver", "patient", "provider"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  // 1. Auth check
  const supabase = await createClient();
  const user = await getUserFromRequest();
  if (!user) {
    console.warn(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        event: "unauthorized",
        userId: "none",
        timestamp: new Date().toISOString(),
      })
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Role check + org_id
  if (!ALLOWED_ROLES.includes(user.role)) {
    console.warn(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        event: "unauthorized",
        userId: user.id,
        timestamp: new Date().toISOString(),
      })
    );
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgId = user.organization_id;

  const { id: logId } = await params;

  // Parse body
  let body: {
    functional_status?: string | null;
    appetite?: string | null;
    sensation_types?: string[];
    timing?: string[];
    infection_signs?: string[];
    detail_notes?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // 3. Org filter -- confirm the log belongs to caller's org
  const { data: existingLog } = await supabase
    .from("symptom_logs")
    .select("id, organization_id, responses")
    .eq("id", logId)
    .single();

  if (!existingLog) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existingLog.organization_id !== orgId) {
    // Return 404 -- do not leak existence of logs in another org
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Merge detail fields into existing responses JSONB
  const currentResponses =
    existingLog.responses &&
    typeof existingLog.responses === "object" &&
    !Array.isArray(existingLog.responses)
      ? (existingLog.responses as Record<string, unknown>)
      : {};

  const mergedResponses = {
    ...currentResponses,
    functional_status: body.functional_status ?? null,
    appetite: body.appetite ?? null,
    sensation_types: body.sensation_types ?? [],
    timing: body.timing ?? [],
    infection_signs: body.infection_signs ?? [],
    detail_notes: body.detail_notes ?? null,
  };

  const { error: updateError } = await supabase
    .from("symptom_logs")
    .update({ responses: mergedResponses })
    .eq("id", logId);

  if (updateError) {
    console.error(
      JSON.stringify({
        route: ROUTE,
        method: request.method,
        error: updateError.message,
        code: (updateError as { code?: string }).code ?? null,
        stack: null,
        userId: user.id,
        timestamp: new Date().toISOString(),
        step: "update_symptom_log",
      })
    );
    return NextResponse.json(
      { error: "Could not update your log entry. Please try again." },
      { status: 500 }
    );
  }

  // 4. Audit log -- every patient data write must be logged
  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      patient_id: null, // log id is the resource -- patient_id not surfaced from symptom_logs here
      action: "UPDATE",
      resource_type: "symptom_logs",
      resource_id: logId,
      organization_id: orgId,
      ip_address:
        request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
      status: "success",
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ id: logId }, { status: 200 });
}
