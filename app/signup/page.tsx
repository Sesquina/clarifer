"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Playfair_Display, DM_Sans } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
});

function friendlySignupError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already been registered") || lower.includes("duplicate") || lower.includes("unique constraint")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (lower.includes("invalid email") || lower.includes("valid email")) {
    return "Please enter a valid email address.";
  }
  if (lower.includes("password") && (lower.includes("short") || lower.includes("least") || lower.includes("characters") || lower.includes("weak"))) {
    return "Your password needs to be at least 8 characters.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed to fetch") || lower.includes("load failed")) {
    return "Could not connect. Please check your internet connection and try again.";
  }
  if (lower.includes("signup is disabled") || lower.includes("signups not allowed")) {
    return "Sign-ups are temporarily unavailable. Please try again later.";
  }
  return msg;
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
  if (!/[A-Z]/.test(pw)) return "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
  if (!/[a-z]/.test(pw)) return "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
  if (!/[0-9]/.test(pw)) return "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
  return null;
}

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const canSubmit = termsAccepted && ageConfirmed && !loading && email.includes("@") && password.length >= 8;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pwError = validatePassword(password);
    if (pwError) {
      setPasswordError(pwError);
      return;
    }
    setPasswordError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) {
        setError(friendlySignupError(error.message));
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.user.email_confirmed_at && data.session === null) {
        setEmailSent(true);
        setLoading(false);
        return;
      }

      // Insert into public.users table
      if (data.user) {
        await supabase.from("users").insert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          terms_accepted_at: new Date().toISOString(),
        });
      }

      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(friendlySignupError(msg));
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div
        className={`${playfair.variable} ${dmSans.variable} flex min-h-screen items-center justify-center px-4`}
        style={{ backgroundColor: "#F7F2EA" }}
      >
        <div
          className="w-full"
          style={{
            maxWidth: 400,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            textAlign: "center",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#2C5F4A" strokeWidth="2" width="48" height="48" style={{ margin: "0 auto" }}>
            <circle cx="12" cy="5" r="3" />
            <line x1="12" y1="8" x2="12" y2="22" />
            <path d="M5 15l7 7 7-7" />
            <path d="M5 12h4M15 12h4" />
          </svg>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, color: "#1A1A1A", marginTop: 16 }}>
            Check your email
          </h1>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#6B6B6B", marginTop: 12, lineHeight: 1.6 }}>
            Please check your email inbox to confirm your account before signing in.
          </p>
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 44,
              padding: "0 24px",
              borderRadius: 22,
              backgroundColor: "#2C5F4A",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              marginTop: 24,
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${playfair.variable} ${dmSans.variable} flex min-h-screen items-center justify-center px-4`}
      style={{ backgroundColor: "#F7F2EA" }}
    >
      <div
        className="w-full"
        style={{
          maxWidth: 400,
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        }}
      >
        {/* Logo */}
        <div className="flex justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2C5F4A" strokeWidth="2" width="48" height="48">
            <circle cx="12" cy="5" r="3" />
            <line x1="12" y1="8" x2="12" y2="22" />
            <path d="M5 15l7 7 7-7" />
            <path d="M5 12h4M15 12h4" />
          </svg>
        </div>

        <h1 className="text-center" style={{ fontFamily: "var(--font-playfair)", fontSize: 28, color: "#1A1A1A", marginTop: 16 }}>
          Create your account.
        </h1>
        <p className="text-center" style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#6B6B6B", marginTop: 4 }}>
          For the family doing everything they can.
        </p>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="fullName" style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#1A1A1A", fontWeight: 500 }}>
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
              className="mt-1.5 w-full outline-none transition-colors"
              style={{ height: 52, borderRadius: 12, border: "1.5px solid #E8E2D9", padding: "0 16px", fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#1A1A1A" }}
              onFocus={(e) => (e.target.style.borderColor = "#2C5F4A")}
              onBlur={(e) => (e.target.style.borderColor = "#E8E2D9")}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#1A1A1A", fontWeight: 500 }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1.5 w-full outline-none transition-colors"
              style={{ height: 52, borderRadius: 12, border: "1.5px solid #E8E2D9", padding: "0 16px", fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#1A1A1A" }}
              onFocus={(e) => (e.target.style.borderColor = "#2C5F4A")}
              onBlur={(e) => (e.target.style.borderColor = "#E8E2D9")}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#1A1A1A", fontWeight: 500 }}>
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full outline-none transition-colors"
                style={{ height: 52, borderRadius: 12, border: `1.5px solid ${passwordError ? "#C4714A" : "#E8E2D9"}`, padding: "0 48px 0 16px", fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#1A1A1A" }}
                onFocus={(e) => (e.target.style.borderColor = "#2C5F4A")}
                onBlur={(e) => (e.target.style.borderColor = passwordError ? "#C4714A" : "#E8E2D9")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "#6B6B6B" }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordError ? (
              <p className="mt-1" style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#C4714A" }}>
                {passwordError}
              </p>
            ) : (
              <p className="mt-1" style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#6B6B6B" }}>
                At least 8 characters with uppercase, lowercase, and a number
              </p>
            )}
          </div>

          {/* Terms and age checkboxes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ marginTop: 3, accentColor: "#2C5F4A" }}
              />
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#1A1A1A", lineHeight: 1.4 }}>
                I agree to the{" "}
                <Link href="/terms" style={{ color: "#2C5F4A", textDecoration: "underline" }}>Terms of Service</Link>{" "}
                and{" "}
                <Link href="/privacy" style={{ color: "#2C5F4A", textDecoration: "underline" }}>Privacy Policy</Link>
              </span>
            </label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                style={{ marginTop: 3, accentColor: "#2C5F4A" }}
              />
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#1A1A1A", lineHeight: 1.4 }}>
                I confirm I am 18 years of age or older
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              height: 52, borderRadius: 26, backgroundColor: "#2C5F4A", color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans)", fontSize: 16, fontWeight: 600,
            }}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create account"}
          </button>

          {error && (
            <div style={{ backgroundColor: "#FDF3EE", borderLeft: "3px solid #C4714A", padding: "12px 16px", borderRadius: 8, fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#C4714A" }}>
              {error}
            </div>
          )}
        </form>

        <p className="mt-4 text-center" style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#6B6B6B" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#2C5F4A", fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
