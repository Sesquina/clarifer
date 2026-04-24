"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { isAllowedEmail, accessLevelFor } from "@/lib/internal/types";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};

const SIDEBAR_BG = "rgb(26, 46, 36)";

const NAV = [
  { label: "Overview", href: "/internal" },
  { label: "Sprint Board", href: "/internal/board" },
  { label: "Sprint History", href: "/internal/sprints" },
  { label: "Roadmap", href: "/internal/roadmap" },
  { label: "Agents", href: "/internal/agents" },
];

export default function InternalLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const onLoginRoute = pathname === "/internal/login";

  useEffect(() => {
    if (onLoginRoute) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const email = data.user?.email ?? null;
      if (!data.user) {
        router.replace("/internal/login");
        return;
      }
      if (!isAllowedEmail(email)) {
        supabase.auth.signOut().finally(() => router.replace("/"));
        return;
      }
      setUser(data.user);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [supabase, router, onLoginRoute]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/internal/login");
  }

  if (onLoginRoute) return <>{children}</>;

  if (loading || !user) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "100vh", backgroundColor: "var(--background)", ...BODY }}
      >
        <p style={{ fontSize: 14, color: "var(--muted)" }}>Loading...</p>
      </div>
    );
  }

  const email = user.email ?? "";
  const level = accessLevelFor(email) ?? "growth";

  return (
    <div
      className="flex"
      style={{ minHeight: "100vh", backgroundColor: "var(--background)", ...BODY }}
    >
      <aside
        className="flex flex-col"
        style={{
          width: 240,
          flexShrink: 0,
          backgroundColor: SIDEBAR_BG,
          height: "100vh",
          position: "sticky",
          top: 0,
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "20px 16px" }}>
          <div
            style={{
              ...BODY,
              fontSize: 18,
              fontWeight: 700,
              color: "var(--white)",
              letterSpacing: 0.3,
            }}
          >
            Command Center
          </div>
          <div style={{ ...BODY, fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
            Clarifer
          </div>
        </div>
        <nav className="flex flex-col" style={{ padding: "4px 8px", gap: 2 }}>
          {NAV.map((item) => {
            const active = pathname === item.href ||
              (item.href !== "/internal" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...BODY,
                  display: "flex",
                  alignItems: "center",
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? "var(--white)" : "rgba(255,255,255,0.65)",
                  backgroundColor: active ? "rgba(255,255,255,0.1)" : "transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div
          className="flex flex-col"
          style={{
            marginTop: "auto",
            padding: 16,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            gap: 6,
          }}
        >
          <div style={{ ...BODY, fontSize: 12, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {email}
          </div>
          <div
            className="inline-flex items-center"
            style={{
              ...BODY,
              alignSelf: "flex-start",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--white)",
              backgroundColor: level === "full" ? "var(--accent)" : "rgba(255,255,255,0.15)",
              padding: "2px 8px",
              borderRadius: 10,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {level}
          </div>
          <button
            type="button"
            onClick={signOut}
            style={{
              ...BODY,
              marginTop: 4,
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              cursor: "pointer",
              textAlign: "left",
              padding: 0,
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 32, overflowY: "auto" }}>{children}</main>
    </div>
  );
}
