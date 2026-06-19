/**
 * app/signup/page.tsx
 * Email/password + Google OAuth signup page.
 * Tables: users, organizations (via POST /api/auth/signup → Keycloak + pg)
 * Auth: public — redirect to /home if already authenticated (middleware)
 * HIPAA: No PHI in this file
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";

// ─── Error mapping ────────────────────────────────────────────────────────────

export function friendlySignupError(msg: string | null): string {
  if (!msg) return "";
  const lower = msg.toLowerCase();
  if (
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("user already") ||
    lower.includes("email already") ||
    lower.includes("conflict")
  ) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a moment.";
  }
  return "Something went wrong. Please try again.";
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw)) {
    return "At least 8 characters with uppercase, lowercase, and a number.";
  }
  return null;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const BODY: React.CSSProperties = { fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" };
const HEADING: React.CSSProperties = { fontFamily: "var(--font-playfair), 'Playfair Display', serif" };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const [lang, setLang] = useState<"en" | "es">("en");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const canSubmit =
    termsAccepted &&
    ageConfirmed &&
    !loading &&
    !googleLoading &&
    email.includes("@") &&
    password.length >= 8;

  // ── Google OAuth ─────────────────────────────────────────────────────────

  async function handleGoogleSignup() {
    if (loading || googleLoading) return;
    setError("");
    setGoogleLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });
      if (oauthError) {
        setError(friendlySignupError(oauthError.message));
        setGoogleLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setGoogleLoading(false);
    }
  }

  // ── Email/password signup ─────────────────────────────────────────────────

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const pwErr = validatePassword(password);
    if (pwErr) {
      setPasswordError(pwErr);
      return;
    }
    setPasswordError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: fullName }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string };

      if (!res.ok) {
        setError(friendlySignupError(data.error ?? ''));
        setLoading(false);
        return;
      }

      // Account created — redirect to login
      router.push('/login');
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 py-12"
      style={{ backgroundColor: "var(--background)", ...BODY }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <img
            src="/logo-mark.png"
            alt="Clarifer"
            width={48}
            height={48}
            style={{ objectFit: "contain" }}
          />
        </div>

        <div
          style={{
            backgroundColor: "var(--card)",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          }}
        >
          {/* 1. LangToggle — FIRST element, aligned right */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {(["en", "es"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-label={l === "en" ? "English" : "Español"}
                  onClick={() => setLang(l)}
                  style={{
                    ...BODY,
                    height: 32,
                    padding: "0 14px",
                    fontSize: 13,
                    fontWeight: lang === l ? 600 : 500,
                    backgroundColor: lang === l ? "var(--primary)" : "transparent",
                    color: lang === l ? "var(--card)" : "var(--muted)",
                    border: "none",
                    cursor: "pointer",
                    transition: "background-color 120ms",
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Heading */}
          <h1
            style={{
              ...HEADING,
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            Create your account.
          </h1>
          <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
            Free for caregivers. Always.
          </p>

          {/* 2. Continue with Google */}
          <button
            type="button"
            aria-label="Continue with Google"
            onClick={handleGoogleSignup}
            disabled={loading || googleLoading}
            style={{
              ...BODY,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              height: 48,
              borderRadius: 12,
              border: "1.5px solid var(--border)",
              backgroundColor: "var(--card)",
              color: "var(--text)",
              fontSize: 15,
              fontWeight: 500,
              cursor: loading || googleLoading ? "not-allowed" : "pointer",
              opacity: loading || googleLoading ? 0.7 : 1,
              marginBottom: 20,
            }}
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <GoogleG />
            )}
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </button>

          {/* 3. "or" divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
            <span style={{ ...BODY, fontSize: 13, color: "var(--muted)" }}>or</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
          </div>

          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 4. Name input */}
            <div>
              <label
                htmlFor="fullName"
                style={{ ...BODY, display: "block", fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 6 }}
              >
                Your name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                style={{
                  ...BODY,
                  width: "100%",
                  height: 48,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  padding: "0 16px",
                  fontSize: 15,
                  color: "var(--text)",
                  backgroundColor: "var(--card)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.border = "2px solid var(--primary)"; e.target.style.backgroundColor = "var(--pale-sage)"; }}
                onBlur={(e) => { e.target.style.border = "1px solid var(--border)"; e.target.style.backgroundColor = "var(--card)"; }}
              />
            </div>

            {/* 5. Email input */}
            <div>
              <label
                htmlFor="email"
                style={{ ...BODY, display: "block", fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 6 }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  ...BODY,
                  width: "100%",
                  height: 48,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  padding: "0 16px",
                  fontSize: 15,
                  color: "var(--text)",
                  backgroundColor: "var(--card)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.border = "2px solid var(--primary)"; e.target.style.backgroundColor = "var(--pale-sage)"; }}
                onBlur={(e) => { e.target.style.border = "1px solid var(--border)"; e.target.style.backgroundColor = "var(--card)"; }}
              />
            </div>

            {/* 6. Password input */}
            <div>
              <label
                htmlFor="password"
                style={{ ...BODY, display: "block", fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 6 }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(null); }}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  style={{
                    ...BODY,
                    width: "100%",
                    height: 48,
                    borderRadius: 12,
                    border: passwordError ? "2px solid var(--severity-high)" : "1px solid var(--border)",
                    padding: "0 48px 0 16px",
                    fontSize: 15,
                    color: "var(--text)",
                    backgroundColor: passwordError ? "#FFF0F0" : "var(--card)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => { if (!passwordError) { e.target.style.border = "2px solid var(--primary)"; e.target.style.backgroundColor = "var(--pale-sage)"; } }}
                  onBlur={(e) => { if (!passwordError) { e.target.style.border = "1px solid var(--border)"; e.target.style.backgroundColor = "var(--card)"; } }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--muted)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError ? (
                <p style={{ ...BODY, fontSize: 12, color: "var(--severity-high)", marginTop: 4 }}>{passwordError}</p>
              ) : (
                <p style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                  At least 8 characters with uppercase, lowercase, and a number
                </p>
              )}
            </div>

            {/* 7. Checkboxes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ marginTop: 3, accentColor: "var(--primary)", width: 16, height: 16, flexShrink: 0 }}
                />
                <span style={{ ...BODY, fontSize: 13, color: "var(--text)", lineHeight: 1.4 }}>
                  I agree to the{" "}
                  <Link href="/terms" style={{ color: "var(--primary)" }}>Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" style={{ color: "var(--primary)" }}>Privacy Policy</Link>
                </span>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  style={{ marginTop: 3, accentColor: "var(--primary)", width: 16, height: 16, flexShrink: 0 }}
                />
                <span style={{ ...BODY, fontSize: 13, color: "var(--text)", lineHeight: 1.4 }}>
                  I confirm I am 18 years of age or older
                </span>
              </label>
            </div>

            {/* 8. Submit button */}
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                ...BODY,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: 52,
                borderRadius: 12,
                backgroundColor: canSubmit ? "var(--primary)" : "#B0B0B0",
                color: canSubmit ? "var(--card)" : "#D0D0D0",
                fontSize: 15,
                fontWeight: 600,
                border: "none",
                cursor: canSubmit ? "pointer" : "not-allowed",
                transition: "background-color 120ms",
              }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : "Create account"}
            </button>

            {/* 9. Error banner */}
            {error && (
              <div
                role="alert"
                style={{
                  backgroundColor: "#FFF0F0",
                  border: "1px solid #E24B4A",
                  borderRadius: 12,
                  padding: "12px 16px",
                  fontSize: 14,
                  color: "#A32D2D",
                  ...BODY,
                }}
              >
                {error}
              </div>
            )}
          </form>

          {/* 10. Sign in link */}
          <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", marginTop: 20, textAlign: "center" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--primary)", fontWeight: 500 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
