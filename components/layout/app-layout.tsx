import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import SessionTimeout from "@/components/SessionTimeout";
import { NavRail } from "@/components/layout/NavRail";

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
      <div className="flex flex-1">
        <NavRail />
        <main className="flex-1 md:ml-[52px] pb-[64px] md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
