"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Activity,
  FileText,
  Wrench,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/home",      icon: Home,          label: "Home"      },
  { href: "/log",       icon: Activity,      label: "Log"       },
  { href: "/chat",      icon: MessageCircle, label: "Ask"       },
  { href: "/documents", icon: FileText,      label: "Documents" },
  { href: "/tools",     icon: Wrench,        label: "Tools"     },
];

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
      aria-label="Main navigation"
      className="hidden md:flex"
      style={{
        position: "fixed",
        top: 56,
        left: 0,
        bottom: 0,
        width: 52,
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "var(--card)",
        borderRight: "1px solid var(--border)",
        zIndex: 30,
        paddingTop: 16,
        paddingBottom: 12,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 10,
              color: isActive ? "var(--primary)" : "var(--muted)",
              textDecoration: "none",
              marginBottom: 4,
            }}
          >
            <item.icon size={20} aria-hidden="true" />
          </Link>
        );
      })}

      <div style={{ flex: 1 }} />

      <button
        type="button"
        onClick={handleSignOut}
        title="Sign out"
        aria-label="Sign out"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 10,
          color: "var(--muted)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <LogOut size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}
