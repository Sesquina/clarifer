"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isAllowedEmail } from "@/lib/internal/types";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

export default function InternalLoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user && isAllowedEmail(data.user.email)) {
        router.replace("/internal");
      } else if (data.user && !isAllowedEmail(data.user.email)) {
        supabase.auth.signOut().finally(() => router.replace("/"));
      }
    });
    return () => {
      active = false;
    };
  }, [supabase, router]);

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/internal/login` },
      });
      if (oauthError) {
        setError("Sign in failed. Try again.");
        setBusy(false);
      }
    } catch {
      setError("Sign in failed. Try again.");
      setBusy(false);
    }
  }

  return (
    <div
      className="flex items-center justify-center"
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        ...BODY,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          backgroundColor: "var(--card)",
          borderRadius: 16,
          padding: 40,
          border: "1px solid var(--border)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            ...HEADING,
            fontSize: 28,
            color: "var(--primary)",
            marginBottom: 8,
            fontWeight: 700,
          }}
        >
          Command Center
        </h1>
        <p
          style={{
            ...BODY,
            fontSize: 14,
            color: "var(--muted)",
            marginBottom: 28,
          }}
        >
          Internal dashboard. Google Sign In only.
        </p>
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="inline-flex items-center justify-center"
          style={{
            ...BODY,
            width: "100%",
            height: 48,
            borderRadius: 12,
            border: "1px solid var(--border)",
            backgroundColor: "var(--white)",
            color: "var(--text)",
            fontSize: 15,
            fontWeight: 500,
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.7 : 1,
            gap: 10,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          {busy ? "Connecting..." : "Continue with Google"}
        </button>
        {error && (
          <p
            role="alert"
            style={{
              ...BODY,
              fontSize: 13,
              color: "var(--accent)",
              marginTop: 12,
            }}
          >
            {error}
          </p>
        )}
        <p
          style={{
            ...BODY,
            fontSize: 12,
            color: "var(--muted)",
            marginTop: 20,
            lineHeight: 1.6,
          }}
        >
          Access restricted to approved internal emails.
        </p>
      </div>
    </div>
  );
}
