"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface AppHeaderProps {
  userName?: string | null;
  userId?: string | null;
}

export function AppHeader({ userName, userId }: AppHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        backgroundColor: "var(--background)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <Link href="/home" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
        <img src="/logo-with-text.png" alt="Clarifer" style={{ height: 32, width: "auto", objectFit: "contain" }} />
      </Link>

      {userName && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {userId && <NotificationBell userId={userId} />}
          <span style={{
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: 14,
            color: "var(--muted)",
          }}>
            {userName.split(' ')[0]}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              height: 44,
              padding: "0 12px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--primary)",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              minWidth: 44,
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
