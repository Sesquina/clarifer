"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";

function friendlyLoginError(msg: string): string {
  const lower = msg.toLowerCase();
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials") ||
    lower.includes("invalid_credentials")
  ) {
    return "That email or password doesn't match. Try again?";
  }
  if (lower.includes("email not confirmed")) {
    return "Your email has not been confirmed yet. Please check your inbox.";
  }
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many attempts. Please wait a few minutes.";
  }
  return "Something went wrong. Please try again.";
}

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignIn() {
    if (loading || googleLoading) return;
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(friendlyLoginError(authError.message));
        setLoading(false);
        return;
      }
      router.push("/home");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(friendlyLoginError(msg));
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (loading || googleLoading) return;
    setError(null);
    setGoogleLoading(true);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/auth/callback` },
      });
      if (oauthError) {
        setError(friendlyLoginError(oauthError.message));
        setGoogleLoading(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(friendlyLoginError(msg));
      setGoogleLoading(false);
    }
  }

  const featureLines = [
    "AI document analysis and plain-language summaries",
    "30-day symptom trends and care team charts",
    "Family updates in English and Spanish",
  ];

  return (
    <div
      className="flex flex-col md:flex-row"
      style={{ minHeight: "100vh", ...BODY }}
    >
      {/* LEFT: Marketing column */}
      <div
        className="flex flex-col"
        style={{
          backgroundColor: "var(--pale-sage)",
          padding: "60px 48px",
          flex: "0 0 auto",
          justifyContent: "center",
        }}
      >
        <div className="hidden md:block" style={{ width: "100%" }}>
          <div style={{ marginBottom: 32 }}>
            <img src="/clarifer-logo.png" alt="Clarifer" width={48} height={48} style={{ objectFit: "contain" }} />
          </div>
          <h1
            style={{
              ...HEADING,
              fontSize: 34,
              color: "var(--primary)",
              marginBottom: 12,
              fontWeight: 700,
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              ...BODY,
              fontSize: 16,
              color: "var(--muted)",
              marginBottom: 40,
              lineHeight: 1.6,
            }}
          >
            The care coordination platform for families navigating serious
            illness.
          </p>
          <ul
            className="flex flex-col"
            style={{ gap: 14, padding: 0, margin: 0, listStyle: "none" }}
          >
            {featureLines.map((line) => (
              <li
                key={line}
                className="flex items-start"
                style={{ gap: 10 }}
              >
                <span
                  className="inline-flex items-center justify-center"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    backgroundColor: "var(--pale-terra)",
                    color: "var(--primary)",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                  aria-hidden="true"
                >
                  <Check size={14} strokeWidth={3} />
                </span>
                <span style={{ ...BODY, fontSize: 15, color: "var(--text)", lineHeight: 1.5 }}>
                  {line}
                </span>
              </li>
            ))}
          </ul>
          <p
            style={{
              ...BODY,
              fontSize: 13,
              color: "var(--muted)",
              lineHeight: 1.6,
              marginTop: 48,
            }}
          >
            Clarifer is a care coordination tool, not a medical device. It does
            not diagnose or replace professional medical advice.
          </p>
        </div>
      </div>

      {/* RIGHT: Auth column */}
      <div
        className="flex flex-col"
        style={{
          backgroundColor: "var(--card)",
          padding: "60px 48px",
          flex: "1 1 auto",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: 420, margin: "0 auto", width: "100%" }}>
          <div className="md:hidden" style={{ marginBottom: 24 }}>
            <img src="/clarifer-logo.png" alt="Clarifer" width={40} height={40} style={{ objectFit: "contain" }} />
          </div>
          <h2
            style={{
              ...HEADING,
              fontSize: 26,
              color: "var(--text)",
              marginBottom: 28,
              fontWeight: 600,
            }}
          >
            Sign in to your account
          </h2>

          {/* Email */}
          <label
            htmlFor="login-email"
            style={{
              ...BODY,
              fontSize: 14,
              color: "var(--text)",
              fontWeight: 500,
              display: "block",
              marginBottom: 6,
            }}
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSignIn();
            }}
            style={{
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
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />

          {/* Password */}
          <label
            htmlFor="login-password"
            style={{
              ...BODY,
              fontSize: 14,
              color: "var(--text)",
              fontWeight: 500,
              display: "block",
              marginTop: 16,
              marginBottom: 6,
            }}
          >
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSignIn();
              }}
              style={{
                ...BODY,
                height: 48,
                width: "100%",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "0 48px 0 16px",
                fontSize: 15,
                outline: "none",
                color: "var(--text)",
                backgroundColor: "var(--card)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute"
              style={{
                right: 12,
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
          <div style={{ textAlign: "right", marginTop: 8 }}>
            <Link
              href="/forgot-password"
              style={{
                ...BODY,
                fontSize: 13,
                color: "var(--accent)",
                fontWeight: 500,
              }}
            >
              Forgot password?
            </Link>
          </div>

          {/* Sign in */}
          <button
            type="button"
            aria-label="Sign in"
            onClick={handleSignIn}
            disabled={loading || googleLoading}
            className="inline-flex items-center justify-center"
            style={{
              ...BODY,
              marginTop: 24,
              width: "100%",
              height: 48,
              borderRadius: 12,
              backgroundColor: "var(--primary)",
              color: "var(--white)",
              fontSize: 16,
              fontWeight: 600,
              border: "none",
              cursor: loading || googleLoading ? "not-allowed" : "pointer",
              opacity: loading || googleLoading ? 0.7 : 1,
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign in"}
          </button>

          {error && (
            <p
              role="alert"
              style={{
                ...BODY,
                fontSize: 14,
                color: "var(--accent)",
                marginTop: 12,
              }}
            >
              {error}
            </p>
          )}

          {/* Divider */}
          <div
            className="flex items-center"
            style={{ margin: "24px 0", gap: 12 }}
          >
            <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
            <span
              style={{
                ...BODY,
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              or
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
          </div>

          {/* Google */}
          <button
            type="button"
            aria-label="Continue with Google"
            onClick={handleGoogle}
            disabled={loading || googleLoading}
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
              cursor: loading || googleLoading ? "not-allowed" : "pointer",
              opacity: loading || googleLoading ? 0.7 : 1,
              gap: 10,
            }}
          >
            <GoogleG />
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </button>

          <p
            className="text-center"
            style={{
              ...BODY,
              fontSize: 14,
              color: "var(--muted)",
              marginTop: 28,
            }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              style={{ color: "var(--primary)", fontWeight: 500 }}
            >
              Sign up
            </Link>
          </p>
          <p
            className="text-center"
            style={{
              ...BODY,
              fontSize: 13,
              color: "var(--muted)",
              marginTop: 12,
            }}
          >
            New caregiver?{" "}
            <Link
              href="/download"
              style={{ color: "var(--primary)", fontWeight: 500 }}
            >
              Download the app instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
