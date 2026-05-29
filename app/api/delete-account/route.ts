/**
 * app/api/delete-account/route.ts
 * Deletes all data for the authenticated user and removes the auth account.
 * Tables (deletion order: children before parents):
 *   symptom_alerts, research_consent, anonymized_exports, notifications (patient),
 *   family_updates, newly_connected_checklists, ai_analysis_consents, provider_notes,
 *   care_relationships (patient), symptom_logs, medications, trial_saves, care_team
 *   (→ care_team_message_templates CASCADE), appointments, biomarkers,
 *   chat_messages, documents,
 *   patients,
 *   care_relationships (user), notifications (user), ai_analysis_consents (user),
 *   research_consent (user), calendar_connections, medical_disclaimer_acceptances,
 *   users
 * Auth: any authenticated user (self-deletion only)
 * Sprint: S6 -- complete cascade across all 12 missing tables
 * HIPAA: audit_log must be written BEFORE any data is deleted so the record
 *        is preserved even if deletion partially fails. organization_id captured
 *        before users row is deleted. patient_id=null (account-level event).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkOrigin } from "@/lib/cors";

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function DELETE(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getAdmin() as any;

  // Get patient IDs first for cascading deletes
  const { data: patients } = await admin
    .from("patients")
    .select("id")
    .eq("created_by", user.id);
  const patientIds = (patients || []).map((p: { id: string }) => p.id);

  // Capture org_id BEFORE any deletions -- the users row is deleted in the loop
  // below and cannot be re-fetched after that point.
  const { data: userRecord } = await admin
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  const orgId: string | null = userRecord?.organization_id ?? null;

  // Audit log BEFORE deleting account data (HIPAA requirement: the record of
  // the deletion must be preserved even if the deletion itself partially fails).
  // patient_id=null -- this is an account-level event, not a patient-level event.
  await admin.from("audit_log").insert({
    user_id: user.id,
    patient_id: null,
    action: "DELETE",
    resource_type: "account",
    resource_id: user.id,
    organization_id: orgId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  // Delete all user data in order (children before parents, respecting foreign keys).
  // Entries with via:"patients" use .in(column, patientIds); entries without via
  // use .eq(column, user.id). Tables that already have ON DELETE CASCADE are included
  // explicitly as belt-and-suspenders in case the migration has not yet been applied.
  // care_team_message_templates is omitted: it cascades automatically when care_team
  // rows are deleted (ON DELETE CASCADE on care_team_member_id FK).
  const tables = [
    // ── NEW: children of patients (delete before patients) ──────────────────
    { table: "symptom_alerts",             column: "patient_id", via: "patients" },
    { table: "research_consent",           column: "patient_id", via: "patients" },
    { table: "anonymized_exports",         column: "patient_id", via: "patients" },
    { table: "notifications",              column: "patient_id", via: "patients" },
    { table: "family_updates",             column: "patient_id", via: "patients" },
    { table: "newly_connected_checklists", column: "patient_id", via: "patients" },
    { table: "ai_analysis_consents",       column: "patient_id", via: "patients" },
    { table: "provider_notes",             column: "patient_id", via: "patients" },
    { table: "care_relationships",         column: "patient_id", via: "patients" },
    // ── EXISTING: children of patients ──────────────────────────────────────
    { table: "symptom_logs",   column: "patient_id", via: "patients" },
    { table: "medications",    column: "patient_id", via: "patients" },
    { table: "trial_saves",    column: "patient_id", via: "patients" },
    { table: "care_team",      column: "patient_id", via: "patients" },
    { table: "appointments",   column: "patient_id", via: "patients" },
    { table: "biomarkers",     column: "patient_id", via: "patients" },
    // ── EXISTING: children of user (by user_id, not tied to patients) ───────
    { table: "chat_messages", column: "user_id" },
    { table: "documents",     column: "uploaded_by" },
    // ── Delete patients ──────────────────────────────────────────────────────
    { table: "patients", column: "created_by" },
    // ── NEW: children of user (direct user_id references, post-patients) ────
    // care_relationships: also delete rows where this user is the caregiver
    //   for another user's patient (not caught by patient_id phase above).
    { table: "care_relationships",             column: "user_id" },
    { table: "notifications",                  column: "user_id" },
    { table: "ai_analysis_consents",           column: "user_id" },
    { table: "research_consent",               column: "user_id" },
    { table: "calendar_connections",           column: "user_id" },
    { table: "medical_disclaimer_acceptances", column: "user_id" },
    // ── Delete user ──────────────────────────────────────────────────────────
    { table: "users", column: "id" },
  ];

  for (const { table, column, via } of tables) {
    try {
      if (via === "patients" && patientIds.length > 0) {
        await admin.from(table).delete().in(column, patientIds);
      } else if (!via) {
        await admin.from(table).delete().eq(column, user.id);
      }
    } catch {
      // Table may not exist yet -- continue cleanup
    }
  }

  // Delete storage files using orgId captured above (users row is already gone)
  if (patientIds.length > 0) {
    for (const pid of patientIds) {
      const prefix = orgId ? `${orgId}/${pid}/` : null;
      if (!prefix) continue;
      const { data: files } = await admin.storage.from("documents").list(prefix);
      if (files && files.length > 0) {
        await admin.storage
          .from("documents")
          .remove(files.map((f: { name: string }) => `${prefix}${f.name}`));
      }
    }
  }

  // Delete the auth user
  await admin.auth.admin.deleteUser(user.id);

  return NextResponse.json({ success: true });
}

const SELF_SERVICE_ROLES = ["caregiver", "patient", "provider", "admin"];

export async function GET(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getAdmin() as any;

  // Role check + org_id capture — required before audit log
  const { data: userRecord } = await admin
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();
  if (!userRecord || !SELF_SERVICE_ROLES.includes(userRecord.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgId: string | null = userRecord.organization_id ?? null;

  // Audit log: record data export with real org_id
  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "EXPORT_ACCOUNT_DATA",
    resource_type: "account",
    resource_id: user.id,
    organization_id: orgId,
    ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    user_agent: request.headers.get("user-agent"),
    status: "success",
  });

  // Get patient IDs
  const { data: patients } = await admin
    .from("patients")
    .select("id")
    .eq("created_by", user.id);
  const patientIds = (patients || []).map((p: { id: string }) => p.id);

  // Gather all user data for export
  const [userData, patientsData, logsData, medsData, docsData, chatData, trialsData] =
    await Promise.all([
      admin.from("users").select("*").eq("id", user.id),
      admin.from("patients").select("*").eq("created_by", user.id),
      patientIds.length > 0
        ? admin.from("symptom_logs").select("*").in("patient_id", patientIds)
        : { data: [] },
      patientIds.length > 0
        ? admin.from("medications").select("*").in("patient_id", patientIds)
        : { data: [] },
      admin.from("documents").select("*").eq("uploaded_by", user.id),
      admin.from("chat_messages").select("*").eq("user_id", user.id),
      patientIds.length > 0
        ? admin.from("trial_saves").select("*").in("patient_id", patientIds)
        : { data: [] },
    ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: userData.data,
    patients: patientsData.data,
    symptom_logs: logsData.data,
    medications: medsData.data,
    documents: docsData.data,
    chat_messages: chatData.data,
    saved_trials: trialsData.data,
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="clarifer-data-export-${Date.now()}.json"`,
    },
  });
}
