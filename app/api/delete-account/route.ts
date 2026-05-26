/**
 * app/api/delete-account/route.ts
 * Deletes all data for the authenticated user and removes the auth account.
 * Tables: patients, users, chat_messages, symptom_logs, medications, documents,
 *         trial_saves, care_team, appointments, biomarkers, audit_log (write)
 * Auth: any authenticated user (self-deletion only)
 * Sprint: S5 -- fix missing/incorrect audit_log on account deletion
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

  // Delete all user data in order (respecting foreign keys)
  const tables = [
    { table: "chat_messages", column: "user_id" },
    { table: "symptom_logs", column: "patient_id", via: "patients" },
    { table: "medications", column: "patient_id", via: "patients" },
    { table: "documents", column: "uploaded_by" },
    { table: "trial_saves", column: "patient_id", via: "patients" },
    { table: "care_team", column: "patient_id", via: "patients" },
    { table: "appointments", column: "patient_id", via: "patients" },
    { table: "biomarkers", column: "patient_id", via: "patients" },
    { table: "patients", column: "created_by" },
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

  // Audit log: record data export
  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "EXPORT_ACCOUNT_DATA",
    resource_type: "account",
    resource_id: user.id,
    organization_id: null,
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
