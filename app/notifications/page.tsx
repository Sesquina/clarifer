import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Mark all as read
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return (
    <PageContainer>
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Notifications</h1>

        {(!notifications || notifications.length === 0) ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Bell className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Card key={n.id} className={n.read ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bell className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.message && <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelativeDate(n.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
