/**
 * app/(app)/layout.tsx
 * Auth-guarded layout for all patient-facing app pages
 * (patients/[id]/*, patients/new, provider/*).
 *
 * DESKTOP (lg+):  52 px icon-only NavRail (left) + 52 px header bar + main content
 * MOBILE (<lg):   52 px AppHeader (top, fixed) + main + 56 px BottomNav (bottom, fixed)
 *
 * Tables: users (read full_name for header)
 * Auth: server-side redirect to /login when no session
 * HIPAA: No PHI written to logs or rendered in this file (patient name
 *        rendered in PatientCrumb only — first name only, via client fetch)
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NavRail } from "@/components/nav/nav-rail";
import { PatientCrumb } from "@/components/nav/patient-crumb";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name ?? null;

  return (
    <>
      {/* ── DESKTOP (lg+) ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex" style={{ minHeight: "100vh" }}>
        <NavRail />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Desktop header bar */}
          <header
            style={{
              height: 52,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              backgroundColor: "var(--background)",
              borderBottom: "1px solid var(--border)",
              position: "sticky",
              top: 0,
              zIndex: 30,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-playfair), 'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--primary)",
                whiteSpace: "nowrap",
              }}
            >
              Clarifer
            </span>

            <PatientCrumb />

            <Link
              href="/chat"
              aria-label="Ask Clarifer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 36,
                padding: "0 16px",
                backgroundColor: "var(--primary)",
                color: "var(--card)",
                borderRadius: 12,
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Ask Clarifer
            </Link>
          </header>

          <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
        </div>
      </div>

      {/* ── MOBILE (<lg) ────────────────────────────────────────────────── */}
      <div
        className="flex flex-col lg:hidden"
        style={{ minHeight: "100vh" }}
      >
        <AppHeader userName={userName} userId={user.id} />
        <main style={{ flex: 1, paddingBottom: 64 }}>{children}</main>
        <BottomNav />
      </div>
    </>
  );
}
