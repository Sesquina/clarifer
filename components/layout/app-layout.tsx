import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import SessionTimeout from "@/components/SessionTimeout";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-full flex-col">
      <SessionTimeout />
      <AppHeader userName={profile?.full_name} userId={user.id} />
      <div className="flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
