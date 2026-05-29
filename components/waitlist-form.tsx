/**
 * components/waitlist-form.tsx
 * Beta waitlist signup form. POSTs { email } to /api/waitlist.
 * Tables: waitlist (via API route)
 * Auth: public -- no auth required
 * Sprint: fix/landing-page-beta
 * HIPAA: No PHI in this file
 */
"use client";

import { useState } from "react";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong. Please try again or email team@clarifer.com");
        return;
      }
      setSuccess(true);
      if (typeof window !== "undefined") {
        const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
        if (typeof gtag === "function") {
          gtag("event", "waitlist_signup", {
            event_category: "engagement",
            event_label: "waitlist_form",
          });
        }
      }
    } catch (err) {
      console.error("[waitlist] submit error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        style={{
          ...BODY,
          marginTop: 36,
          padding: "24px 28px",
          backgroundColor: "var(--pale-sage)",
          borderRadius: 14,
          border: "1px solid var(--border)",
          maxWidth: 480,
          marginLeft: "auto",
          marginRight: "auto",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 17, color: "var(--primary)", fontWeight: 600, marginBottom: 4 }}>
          You are on the list.
        </p>
        <p style={{ fontSize: 15, color: "var(--muted)" }}>
          We will be in touch.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 36,
        maxWidth: 480,
        marginLeft: "auto",
        marginRight: "auto",
        width: "100%",
      }}
    >
      <h2
        style={{
          ...HEADING,
          fontSize: 30,
          color: "var(--primary)",
          fontWeight: 700,
          marginBottom: 14,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        Coming June 15, 2026
      </h2>
      <p
        style={{
          ...BODY,
          fontSize: 16,
          color: "var(--muted)",
          lineHeight: 1.65,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        We are looking for families who want to be part of something meaningful.
        If you are on a caregiving journey, we would love to have you.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Your email address"
          style={{
            ...BODY,
            height: 52,
            padding: "0 18px",
            borderRadius: 10,
            border: "1.5px solid var(--border)",
            fontSize: 15,
            color: "var(--text)",
            backgroundColor: "var(--card)",
            width: "100%",
            boxSizing: "border-box",
          }}
        />

        {error && (
          <p
            role="alert"
            style={{ ...BODY, fontSize: 14, color: "var(--accent)", textAlign: "left" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          aria-label="Join the waitlist"
          style={{
            ...BODY,
            height: 52,
            borderRadius: 26,
            backgroundColor: "var(--primary)",
            color: "var(--white)",
            fontSize: 16,
            fontWeight: 600,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.65 : 1,
            width: "100%",
          }}
        >
          {loading ? "Joining..." : "Join the waitlist"}
        </button>
      </form>

      <p
        style={{
          ...BODY,
          fontSize: 13,
          color: "var(--muted)",
          marginTop: 14,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        Free for caregivers. Always. Launching June 15, 2026.
      </p>
    </div>
  );
}
