import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { QuickActions } from "@/components/home/quick-actions";
import { RecentLogs } from "@/components/home/recent-logs";
import { UpcomingAppointments } from "@/components/home/upcoming-appointments";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: patient } = await supabase
    .from("patients")
    .select("id, name")
    .eq("created_by", user.id)
    .limit(1)
    .single();

  if (!patient) redirect("/onboarding");

  const [logsResult, apptsResult] = await Promise.all([
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
      .gte("datetime", new Date().toISOString())
      .order("datetime", { ascending: true })
      .limit(3),
  ]);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Managing care for {patient.name}
          </p>
        </div>
        <QuickActions />
        <RecentLogs logs={logsResult.data || []} />
        <UpcomingAppointments appointments={apptsResult.data || []} />
      </div>
    </PageContainer>
  );
}
