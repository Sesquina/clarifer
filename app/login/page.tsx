"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  const router = useRouter();

  async function handleSignIn() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "Login failed. Check your email and password.");
        setLoading(false);
        return;
      }
      router.push("/home");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(friendlyLoginError(msg));
      setLoading(false);
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
            <img src="/logo-mark.png" alt="Clarifer" width={48} height={48} style={{ objectFit: "contain" }} />
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
            The care coordination platform for families doing everything they can.
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
            <img src="/logo-mark.png" alt="Clarifer" width={40} height={40} style={{ objectFit: "contain" }} />
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

          <Suspense fallback={null}>
            <SessionTimeoutBanner />
          </Suspense>

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
            disabled={loading}
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
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
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

function SessionTimeoutBanner() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("reason") === "session_timeout";
  if (!sessionExpired) return null;
  return (
    <div
      role="alert"
      style={{
        backgroundColor: "var(--pale-sage)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "12px 16px",
        marginBottom: 20,
        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        fontSize: 14,
        color: "var(--primary)",
        lineHeight: 1.5,
      }}
    >
      You were signed out after 30 minutes of inactivity. Please sign in again.
    </div>
  );
}

