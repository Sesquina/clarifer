/**
 * app/hq/login/page.tsx
 * Passcode gate for /hq. POSTs to /api/hq/auth which sets an httpOnly cookie.
 * Tables: none
 * Auth: none (this is the entry point)
 * Sprint: fix/hq-rename-and-passcode
 * HIPAA: No PHI in this file.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

export default function HQLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/hq/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        router.replace("/hq");
      } else {
        setError("Incorrect access code");
        setBusy(false);
      }
    } catch {
      setError("Incorrect access code");
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...BODY,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "40px 32px",
          backgroundColor: "var(--card)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo + wordmark */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          {/* Lighthouse logo placeholder -- 40x48 dark sage square */}
          <div
            aria-hidden="true"
            style={{
              width: 40,
              height: 48,
              backgroundColor: "var(--primary)",
              borderRadius: 8,
              marginBottom: 10,
            }}
          />
          <span
            style={{
              ...BODY,
              fontSize: 20,
              fontWeight: 500,
              color: "var(--text)",
              letterSpacing: 0.2,
            }}
          >
            Clarifer
          </span>
        </div>

        <h1
          style={{
            ...HEADING,
            fontSize: 28,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          HQ Access
        </h1>

        <form onSubmit={handleSubmit} noValidate>
          <input
            type="password"
            placeholder="Access code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="current-password"
            required
            style={{
              ...BODY,
              display: "block",
              width: "100%",
              minHeight: 48,
              padding: "0 16px",
              fontSize: 15,
              color: "var(--text)",
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              outline: "none",
              boxSizing: "border-box",
              marginBottom: error ? 8 : 16,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />

          {error && (
            <p
              role="alert"
              style={{
                ...BODY,
                fontSize: 13,
                color: "var(--accent)",
                marginBottom: 12,
                marginTop: 0,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              ...BODY,
              display: "block",
              width: "100%",
              minHeight: 52,
              backgroundColor: "var(--primary)",
              color: "var(--white)",
              fontSize: 16,
              fontWeight: 500,
              border: "none",
              borderRadius: 12,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Checking..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
