"use client";

import { useState } from "react";
import Link from "next/link";

interface HeaderProps {
  userName?: string | null;
}

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "For Hospitals", href: "/#hospitals" },
  { label: "About", href: "/about" },
];

export function Header(_props: HeaderProps = {}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-[100] w-full border-b"
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex h-16 items-center justify-between px-6">
        {/* LEFT: Logo */}
        <Link
          href="/"
          className="flex items-center no-underline"
          style={{ gap: 10 }}
          aria-label="Clarifer home"
        >
          <img src="/clarifer-logo.png" alt="Clarifer" width={28} height={28} style={{ objectFit: "contain" }} />
          <span
            className="font-bold"
            style={{
              color: "var(--primary)",
              fontSize: 18,
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontWeight: 700,
            }}
          >
            Clarifer
          </span>
        </Link>

        {/* CENTER: Desktop nav */}
        <nav className="hidden md:flex items-center" style={{ gap: 32 }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors"
              style={{
                color: "var(--muted)",
                fontSize: 15,
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* RIGHT: Actions */}
        <div className="hidden md:flex items-center" style={{ gap: 20 }}>
          <Link
            href="/login"
            aria-label="Sign in"
            style={{
              color: "var(--muted)",
              fontSize: 14,
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            Sign in
          </Link>
          <Link
            href="/waitlist"
            aria-label="Join the waitlist"
            className="inline-flex items-center"
            style={{
              height: 40,
              padding: "0 20px",
              borderRadius: 26,
              border: "1.5px solid var(--primary)",
              color: "var(--primary)",
              backgroundColor: "transparent",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            }}
          >
            Join the waitlist
          </Link>
        </div>

        {/* MOBILE: Hamburger */}
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden inline-flex flex-col items-center justify-center"
          style={{
            width: 40,
            height: 40,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            gap: 5,
          }}
        >
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M6 18L18 6"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <>
              <span style={{ width: 22, height: 2, backgroundColor: "var(--primary)" }} />
              <span style={{ width: 22, height: 2, backgroundColor: "var(--primary)" }} />
              <span style={{ width: 22, height: 2, backgroundColor: "var(--primary)" }} />
            </>
          )}
        </button>
      </div>

      {/* MOBILE: Drawer */}
      {menuOpen && (
        <div
          className="md:hidden flex flex-col"
          style={{
            backgroundColor: "var(--background)",
            borderTop: "1px solid var(--border)",
            padding: "8px 0 16px",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center"
              style={{
                height: 48,
                padding: "0 24px",
                color: "var(--text)",
                fontSize: 16,
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            aria-label="Sign in"
            className="flex items-center"
            style={{
              height: 48,
              padding: "0 24px",
              color: "var(--muted)",
              fontSize: 16,
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
          <div style={{ padding: "12px 24px 0" }}>
            <Link
              href="/waitlist"
              onClick={() => setMenuOpen(false)}
              aria-label="Join the waitlist"
              className="inline-flex items-center justify-center"
              style={{
                height: 48,
                width: "100%",
                borderRadius: 26,
                border: "1.5px solid var(--primary)",
                color: "var(--primary)",
                backgroundColor: "transparent",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              }}
            >
              Join the waitlist
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
