"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { AnchorLogo } from "@/components/ui/AnchorLogo";
import { Home, Activity, FileText, Wrench, MessageCircle } from "lucide-react";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};

const NAV_ITEMS = [
  { icon: "🏠", label: "Home", href: "/home" },
  { icon: "📊", label: "Log", href: "/log" },
  { icon: "📄", label: "Documents", href: "/documents" },
  { icon: "🛠️", label: "Tools", href: "/tools" },
  { icon: "💬", label: "Chat", href: "/chat" },
];

const MOBILE_TABS = [
  { icon: Home, label: "Home", href: "/home" },
  { icon: Activity, label: "Log", href: "/log" },
  { icon: FileText, label: "Documents", href: "/documents" },
  { icon: Wrench, label: "Tools", href: "/tools" },
  { icon: MessageCircle, label: "Chat", href: "/chat" },
];

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUser(data.user);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session?.user) {
        router.replace("/login");
      } else {
        setUser(session.user);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading || !user) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}
      >
        <p style={{ ...BODY, fontSize: 14, color: "var(--muted)" }}>Loading...</p>
      </div>
    );
  }

  const email = user.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();
  const truncatedEmail = email.length > 24 ? `${email.slice(0, 23)}...` : email;
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div
      className="flex"
      style={{ minHeight: "100vh", backgroundColor: "var(--background)", ...BODY }}
    >
      {/* SIDEBAR — desktop only */}
      <aside
        className="hidden md:flex flex-col"
        style={{
          width: 256,
          flexShrink: 0,
          backgroundColor: "var(--primary)",
          height: "100vh",
          position: "sticky",
          top: 0,
          overflowY: "auto",
        }}
      >
        <div
          className="flex items-center"
          style={{ padding: "20px 16px", gap: 10 }}
        >
          <AnchorLogo size={28} color="var(--white)" />
          <span
            style={{
              ...BODY,
              fontSize: 18,
              fontWeight: 700,
              color: "var(--white)",
            }}
          >
            Clarifer
          </span>
        </div>

        <nav className="flex flex-col" style={{ padding: "4px 8px", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className="inline-flex items-center"
                style={{
                  ...BODY,
                  height: 44,
                  padding: "10px 12px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  gap: 12,
                  color: active ? "var(--white)" : "rgba(255,255,255,0.65)",
                  backgroundColor: active
                    ? "rgba(255,255,255,0.15)"
                    : "transparent",
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 16 }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div
          className="flex items-center"
          style={{
            marginTop: "auto",
            padding: 16,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            gap: 10,
          }}
        >
          <div
            className="inline-flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "var(--accent)",
              color: "var(--white)",
              fontWeight: 600,
              fontSize: 14,
              flexShrink: 0,
              ...BODY,
            }}
          >
            {initials || "U"}
          </div>
          <div className="flex flex-col" style={{ minWidth: 0 }}>
            <span
              style={{
                ...BODY,
                fontSize: 12,
                color: "rgba(255,255,255,0.65)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {truncatedEmail}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              style={{
                ...BODY,
                fontSize: 12,
                color: "rgba(255,255,255,0.5)",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main
        className="flex-1"
        style={{
          backgroundColor: "var(--background)",
          padding: 32,
          paddingBottom: "calc(32px + 64px)",
          overflowY: "auto",
        }}
      >
        {children}
      </main>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav
        className="md:hidden flex items-center justify-around"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: 64,
          backgroundColor: "var(--white)",
          borderTop: "1px solid var(--border)",
          zIndex: 90,
        }}
      >
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="flex flex-col items-center justify-center"
              style={{
                flex: 1,
                height: "100%",
                gap: 2,
                color: active ? "var(--primary)" : "var(--muted)",
              }}
              aria-label={tab.label}
            >
              <Icon size={20} aria-hidden />
              <span style={{ ...BODY, fontSize: 11, fontWeight: 500 }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
