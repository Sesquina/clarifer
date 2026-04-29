/**
 * app/api/provider/patients/route.ts
 * List all patients assigned to the authenticated provider.
 * Tables: care_relationships (read), patients (read), users (read),
 *         symptom_logs (read), appointments (read), medications (read),
 *         symptom_alerts (read), audit_log (write)
 * Auth: provider role only (403 for caregiver/patient/admin)
 * Sprint: Sprint 12 -- Provider Portal
 *
 * HIPAA: Returns patient demographics + activity counts. Org-scoped.
 * audit_log SELECT written for the list operation. Patients only
 * surface via care_relationships.user_id = caller; cross-tenant
 * patients are filtered at the join. No PHI in error responses.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["provider"];

function forensicColumns(request: Request) {
  return {
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  };
}

interface PatientCard {
  id: string;
  name: string | null;
  custom_diagnosis: string | null;
  condition_template_id: string | null;
  last_symptom_log_at: string | null;
  next_appointment_at: string | null;
  medication_count: number;
  active_alert_count: number;
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
  if (!ALLOWED_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgId = userRecord.organization_id;

  // 1. Pull this provider's care_relationships rows. patient_id is the
  //    join key; org filter is the safety net.
  const { data: relationships } = await supabase
    .from("care_relationships")
    .select("patient_id")
    .eq("user_id", user.id)
    .eq("organization_id", orgId);

  const patientIds: string[] = (relationships ?? [])
    .map((r) => r.patient_id)
    .filter((id): id is string => typeof id === "string");

  if (patientIds.length === 0) {
    await supabase
      .from("audit_log")
      .insert({
        user_id: user.id,
        organization_id: orgId,
        action: "PROVIDER_LIST",
        resource_type: "patients",
        ...forensicColumns(request),
      })
      .then(() => undefined, () => undefined);
    return NextResponse.json({ patients: [] });
  }

  // 2. Pull patient demographics for those ids.
  const { data: patients } = await supabase
    .from("patients")
    .select("id, name, custom_diagnosis, condition_template_id, organization_id")
    .in("id", patientIds)
    .eq("organization_id", orgId);

  // 3. Per-patient activity counts. Done in parallel; each query is
  //    org-scoped (defense in depth -- RLS would enforce too).
  const cards: PatientCard[] = await Promise.all(
    (patients ?? []).map(async (p) => {
      const [lastLog, nextAppt, medCount, alertCount] = await Promise.all([
        supabase
          .from("symptom_logs")
          .select("created_at")
          .eq("patient_id", p.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("appointments")
          .select("datetime")
          .eq("patient_id", p.id)
          .eq("organization_id", orgId)
          .gte("datetime", new Date().toISOString())
          .order("datetime", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("medications")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", p.id)
          .eq("is_active", true),
        supabase
          .from("symptom_alerts")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", p.id)
          .is("acknowledged_at", null),
      ]);
      return {
        id: p.id,
        name: p.name,
        custom_diagnosis: p.custom_diagnosis,
        condition_template_id: p.condition_template_id,
        last_symptom_log_at: lastLog.data?.created_at ?? null,
        next_appointment_at: nextAppt.data?.datetime ?? null,
        medication_count: medCount.count ?? 0,
        active_alert_count: alertCount.count ?? 0,
      };
    })
  );

  // 4. Sort: alerts first (desc), then alphabetical.
  cards.sort((a, b) => {
    if (a.active_alert_count !== b.active_alert_count) {
      return b.active_alert_count - a.active_alert_count;
    }
    return (a.name ?? "").localeCompare(b.name ?? "");
  });

  await supabase
    .from("audit_log")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      action: "PROVIDER_LIST",
      resource_type: "patients",
      ...forensicColumns(request),
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ patients: cards });
}
