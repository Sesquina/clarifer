"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { isAllowedEmail } from "@/lib/internal/types";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

function friendlyAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("invalid") && (lower.includes("credential") || lower.includes("password"))) {
    return "That email or password doesn't match. Try again?";
  }
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many attempts. Please wait a few minutes.";
  }
  if (lower.includes("not allowed") || lower.includes("not authorized")) {
    return "This account isn't authorized for the command center.";
  }
  return "Something went wrong. Please try again.";
}

export default function InternalLoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [busyGoogle, setBusyGoogle] = useState(false);
  const [busyPassword, setBusyPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    if (busyGoogle || busyPassword) return;
    setBusyGoogle(true);
    setError(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/auth/callback?next=/internal` },
      });
      if (oauthError) {
        setError(friendlyAuthError(oauthError.message));
        setBusyGoogle(false);
      }
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : ""));
      setBusyGoogle(false);
    }
  }

  async function handlePassword() {
    if (busyGoogle || busyPassword) return;
    if (!email.trim() || !password) {
      setError("Email and password are both required.");
      return;
    }
    setBusyPassword(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(friendlyAuthError(authError.message));
        setBusyPassword(false);
        return;
      }
      const signedInEmail = data.user?.email ?? null;
      if (!isAllowedEmail(signedInEmail)) {
        await supabase.auth.signOut();
        router.replace("/");
        return;
      }
      router.replace("/internal");
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : ""));
      setBusyPassword(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    ...BODY,
    height: 48,
    width: "100%",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "0 16px",
    fontSize: 15,
    outline: "none",
    color: "var(--text)",
    backgroundColor: "var(--card)",
  };

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
            marginBottom: 24,
          }}
        >
          Internal dashboard. Restricted access.
        </p>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busyGoogle || busyPassword}
          aria-label="Continue with Google"
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
            cursor: busyGoogle || busyPassword ? "not-allowed" : "pointer",
            opacity: busyGoogle || busyPassword ? 0.7 : 1,
            gap: 10,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          {busyGoogle ? "Connecting..." : "Continue with Google"}
        </button>

        {/* Divider */}
        <div className="flex items-center" style={{ margin: "24px 0", gap: 12 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
          <span style={{ ...BODY, fontSize: 12, color: "var(--muted)" }}>
            or sign in with email
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
        </div>

        {/* Email */}
        <label
          htmlFor="internal-email"
          style={{ ...BODY, fontSize: 13, fontWeight: 500, color: "var(--text)", display: "block", marginBottom: 6 }}
        >
          Email
        </label>
        <input
          id="internal-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handlePassword();
          }}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />

        {/* Password */}
        <label
          htmlFor="internal-password"
          style={{
            ...BODY,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text)",
            display: "block",
            marginTop: 14,
            marginBottom: 6,
          }}
        >
          Password
        </label>
        <div className="relative">
          <input
            id="internal-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handlePassword();
            }}
            style={{ ...inputStyle, padding: "0 48px 0 16px" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((s) => !s)}
            className="absolute"
            style={{
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              width: 36,
              height: 36,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Submit */}
        <button
          type="button"
          aria-label="Sign in"
          onClick={handlePassword}
          disabled={busyGoogle || busyPassword}
          className="inline-flex items-center justify-center"
          style={{
            ...BODY,
            marginTop: 18,
            width: "100%",
            height: 48,
            borderRadius: 12,
            backgroundColor: "var(--primary)",
            color: "var(--white)",
            fontSize: 15,
            fontWeight: 600,
            border: "none",
            cursor: busyGoogle || busyPassword ? "not-allowed" : "pointer",
            opacity: busyGoogle || busyPassword ? 0.7 : 1,
          }}
        >
          {busyPassword ? <Loader2 className="animate-spin" size={18} /> : "Sign in"}
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
