/**
 * app/notifications/page.tsx
 * Caregiver/patient/provider notifications inbox: symptom alerts,
 * medication reminders, care team updates.
 * Tables: notifications (read), users (read)
 * Auth: signed-in users only (redirect to /login otherwise).
 * HIPAA: row scoped to user_id + organization_id. No condition names
 *        are surfaced. Mark-read happens per row via the API route,
 *        not implicitly on load.
 */
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { NotificationList, type NotificationRow } from "@/components/notifications/NotificationList";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const orgId = userRecord?.organization_id ?? null;

  let notifications: NotificationRow[] = [];
  if (orgId) {
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, type, action_url, read, created_at")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(100);
    notifications = (data ?? []) as NotificationRow[];
  }

  return (
    <PageContainer>
      <div className="space-y-4">
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
          Notifications
        </h1>
        <NotificationList initial={notifications} />
      </div>
    </PageContainer>
  );
}
