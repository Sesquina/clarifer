"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AppHeaderProps {
  userName?: string | null;
}

export function AppHeader({ userName }: AppHeaderProps) {
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
      <Link href="/home" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <img src="/clarifer-logo.png" alt="Clarifer" width={32} height={32} style={{ objectFit: "contain" }} />
        <span style={{
          fontFamily: "var(--font-playfair), 'Playfair Display', serif",
          fontSize: 18,
          fontWeight: 600,
          color: "var(--primary)",
        }}>
          Clarifer
        </span>
      </Link>

      {userName && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: 14,
            color: "var(--muted)",
          }}>
            {userName}
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
