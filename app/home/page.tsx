import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HomeClient } from "@/components/home/home-client";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) {
    redirect("/onboarding");
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, custom_diagnosis")
    .eq("organization_id", userRecord.organization_id)
    .limit(1)
    .maybeSingle();

  if (!patient) {
    redirect("/onboarding");
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString();

  const [logsResult, apptsResult, todayLogResult, docsResult] = await Promise.all([
    supabase
      .from("symptom_logs")
      .select("*")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", patient.id)
      .gte("datetime", todayStart)
      .lte("datetime", tomorrowEnd)
      .order("datetime", { ascending: true })
      .limit(3),
    supabase
      .from("symptom_logs")
      .select("id")
      .eq("patient_id", patient.id)
      .gte("created_at", todayStart)
      .limit(1),
    supabase
      .from("documents")
      .select("id")
      .eq("uploaded_by", user.id)
      .limit(1),
  ]);

  // Determine status line
  const appointments = apptsResult.data || [];
  const logs = logsResult.data || [];
  const loggedToday = (todayLogResult.data || []).length > 0;
  const documentsCount = (docsResult.data || []).length;

  const firstName = patient.name.split(" ")[0];

  let statusLine = "Nothing on the schedule today.";
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  for (const appt of appointments) {
    if (!appt.datetime) continue;
    const apptDate = new Date(appt.datetime);
    if (apptDate.toDateString() === now.toDateString()) {
      statusLine = `${firstName} has an appointment today.`;
      break;
    }
    if (apptDate.toDateString() === tomorrow.toDateString()) {
      statusLine = `${firstName} has an appointment tomorrow.`;
      break;
    }
  }

  if (statusLine === "Nothing on the schedule today.") {
    if (loggedToday) {
      statusLine = "Symptom log is up to date.";
    } else if (logs.length > 0 && logs[0].created_at) {
      const lastLog = new Date(logs[0].created_at);
      const daysSince = Math.floor((now.getTime() - lastLog.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince >= 3) {
        statusLine = `How has ${firstName} been feeling lately?`;
      }
    }
  }

  return (
    <HomeClient
      patient={{ id: patient.id, name: patient.name, diagnosis: patient.custom_diagnosis }}
      statusLine={statusLine}
      logs={logs}
      appointments={appointments}
      loggedToday={loggedToday}
      documentsCount={documentsCount}
    />
  );
}
