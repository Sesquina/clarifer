/**
 * components/layout/bottom-nav.tsx
 * Mobile tab bar: Home · Log · Ask (elevated primary circle) · Docs · Tools.
 * Hidden on md+ (desktop uses the left rail in home-client).
 * Tables: None
 * Auth: None (visual only)
 * HIPAA: No PHI in this file
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, FileText, Activity, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home",      icon: Home,          label: "Home",  isCenter: false },
  { href: "/log",       icon: Activity,      label: "Log",   isCenter: false },
  { href: "/chat",      icon: MessageCircle, label: "Ask",   isCenter: true  },
  { href: "/documents", icon: FileText,      label: "Docs",  isCenter: false },
  { href: "/tools",     icon: Wrench,        label: "Tools", isCenter: false },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Tab bar"
      className="fixed bottom-0 left-0 right-0 z-40 border-t md:hidden"
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="flex items-end justify-around"
        style={{ height: 64, padding: "0 8px" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);

          if (item.isCenter) {
            // Elevated primary circle for the Ask / Chat action
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="flex flex-col items-center justify-end pb-1"
                style={{ flex: 1 }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 2,
                    // Slightly elevated above the bar
                    transform: "translateY(-8px)",
                    boxShadow: "0 4px 12px rgba(44,95,74,0.35)",
                  }}
                >
                  <item.icon
                    size={20}
                    color="var(--card)"
                    aria-hidden="true"
                  />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: isActive ? "var(--primary)" : "var(--muted)",
                    transform: "translateY(-8px)",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[48px] flex-col items-center justify-center gap-1 px-3 py-1 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              style={{ flex: 1 }}
            >
              <item.icon
                className={cn("h-5 w-5", isActive && "fill-primary/10")}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
