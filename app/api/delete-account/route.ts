import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function DELETE() {
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

  // Delete all user data in order (respecting foreign keys)
  const tables = [
    { table: "chat_messages", column: "user_id" },
    { table: "symptom_logs", column: "patient_id", via: "patients" },
    { table: "medications", column: "patient_id", via: "patients" },
    { table: "documents", column: "uploaded_by" },
    { table: "trial_saves", column: "patient_id", via: "patients" },
    { table: "care_team", column: "patient_id", via: "patients" },
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
      // Table may not exist yet — continue cleanup
    }
  }

  // Delete storage files
  if (patientIds.length > 0) {
    for (const pid of patientIds) {
      const prefix = `${user.id}/${pid}/`;
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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getAdmin() as any;

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
      "Content-Disposition": `attachment; filename="medalyn-data-export-${Date.now()}.json"`,
    },
  });
}
