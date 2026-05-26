/**
 * app/hq/layout.tsx
 * Shared sidebar layout for the /hq command center.
 * Auth: protected by middleware cookie gate (hq_session). No Supabase auth here.
 * Sprint: fix/hq-rename-and-passcode
 * HIPAA: No PHI in this file.
 */
"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};

const SIDEBAR_BG = "rgb(26, 46, 36)";

const NAV = [
  { label: "Overview", href: "/hq" },
  { label: "Sprint Board", href: "/hq/board" },
  { label: "Sprint History", href: "/hq/sprints" },
  { label: "Roadmap", href: "/hq/roadmap" },
  { label: "Agents", href: "/hq/agents" },
  { label: "Sessions", href: "/hq/sessions" },
  { label: "Content", href: "/hq/content" },
];

export default function HQLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Login page renders without the sidebar shell.
  const onLoginRoute = pathname === "/hq/login";
  if (onLoginRoute) return <>{children}</>;

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
            HQ
          </div>
          <div style={{ ...BODY, fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
            Clarifer
          </div>
        </div>
        <nav className="flex flex-col" style={{ padding: "4px 8px", gap: 2 }}>
          {NAV.map((item) => {
            const active = pathname === item.href ||
              (item.href !== "/hq" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...BODY,
                  display: "flex",
                  alignItems: "center",
                  height: 48,
                  padding: "0 12px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? "var(--white)" : "rgba(255,255,255,0.6)",
                  backgroundColor: active ? "rgba(255,255,255,0.15)" : "transparent",
                  transition: "background-color 120ms ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Quick Links */}
        <div style={{ padding: "12px 8px 4px" }}>
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "rgba(255,255,255,0.35)",
              marginBottom: 6,
              padding: "0 4px",
            }}
          >
            Quick Links
          </div>
          {[
            { label: "GitHub", href: "https://github.com/Sesquina/clarifer" },
            { label: "Vercel", href: "https://vercel.com/dashboard" },
            { label: "Supabase", href: "https://supabase.com/dashboard/project/lrhwgswbsctfqtvdjntr" },
            { label: "Brevo", href: "https://app.brevo.com" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                height: 36,
                padding: "0 12px",
                borderRadius: 8,
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
                textDecoration: "none",
                transition: "background 120ms ease, color 120ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(255,255,255,0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.55)";
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Footer -- sign out clears the hq_session cookie via GET /api/hq/logout */}
        <div
          className="flex flex-col"
          style={{
            marginTop: "auto",
            padding: 16,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            gap: 6,
          }}
        >
          <a
            href="/api/hq/logout"
            style={{
              ...BODY,
              marginTop: 4,
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            Sign out
          </a>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 32, overflowY: "auto" }}>{children}</main>
    </div>
  );
}
