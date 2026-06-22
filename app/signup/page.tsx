/**
 * app/signup/page.tsx
 * Email/password signup page.
 * Tables: users, organizations (via POST /api/auth/signup → Keycloak + pg)
 * Auth: public — redirect to /home if already authenticated (middleware)
 * HIPAA: No PHI in this file
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  const router = useRouter();

  const canSubmit =
    termsAccepted &&
    ageConfirmed &&
    !loading &&
    email.includes("@") &&
    password.length >= 8;

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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName: fullName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(friendlySignupError(data.error ?? ""));
        setLoading(false);
        return;
      }
      const data = await res.json() as { mustLogin?: boolean };
      if (data.mustLogin) {
        router.push("/login");
        return;
      }
      router.push("/onboarding");
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
