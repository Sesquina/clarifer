"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface AppHeaderProps {
  userName?: string | null;
  userId?: string | null;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppHeader({ userName, userId }: AppHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
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

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {userId && <NotificationBell userId={userId} />}
        {userName && (
          <Link
            href="/profile"
            aria-label="Your profile"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              textDecoration: "none",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: "var(--pale-sage)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--primary)",
                flexShrink: 0,
              }}
            >
              {getInitials(userName)}
            </span>
          </Link>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            height: 44,
            padding: "0 12px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--muted)",
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            minWidth: 44,
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
