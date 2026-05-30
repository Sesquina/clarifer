/**
 * components/nav/nav-rail.tsx
 * Desktop-only left navigation rail (52 px wide, icon-only, hidden below lg).
 * Tables: None
 * Auth: sign-out via supabase client
 * HIPAA: No PHI in this file
 */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Home, Activity, FileText, Wrench, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/home",      icon: Home,      label: "Home" },
  { href: "/log",       icon: Activity,  label: "Log" },
  { href: "/documents", icon: FileText,  label: "Documents" },
  { href: "/tools",     icon: Wrench,    label: "Tools" },
] as const;

export function NavRail() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav
      aria-label="Desktop navigation"
      style={{
        width: 52,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        backgroundColor: "var(--pale-sage)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 12,
        paddingBottom: 12,
        gap: 4,
      }}
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isActive ? "var(--primary)" : "transparent",
              color: isActive ? "var(--card)" : "var(--muted)",
              flexShrink: 0,
              textDecoration: "none",
              transition: "background-color 120ms, color 120ms",
            }}
          >
            <Icon size={20} aria-hidden="true" />
          </Link>
        );
      })}

      <div style={{ marginTop: "auto" }}>
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sign out"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "transparent",
            color: "var(--muted)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
