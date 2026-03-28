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

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Insert into public.users table immediately (no email confirmation)
    if (data.user) {
      await supabase.from("users").insert({
        id: data.user.id,
        email: email,
        full_name: fullName,
      });
    }

    router.push("/onboarding");
    router.refresh();
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2C5F4A"
            strokeWidth="2"
            width="48"
            height="48"
          >
            <circle cx="12" cy="5" r="3" />
            <line x1="12" y1="8" x2="12" y2="22" />
            <path d="M5 15l7 7 7-7" />
            <path d="M5 12h4M15 12h4" />
          </svg>
        </div>

        {/* Heading */}
        <h1
          className="text-center"
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: 28,
            color: "#1A1A1A",
            marginTop: 16,
          }}
        >
          Create your account.
        </h1>
        <p
          className="text-center"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: 15,
            color: "#6B6B6B",
            marginTop: 4,
          }}
        >
          For the family doing everything they can.
        </p>

        {/* Form */}
        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="fullName"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: 14,
                color: "#1A1A1A",
                fontWeight: 500,
              }}
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
              className="mt-1.5 w-full outline-none transition-colors"
              style={{
                height: 52,
                borderRadius: 12,
                border: "1.5px solid #E8E2D9",
                padding: "0 16px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: 16,
                color: "#1A1A1A",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2C5F4A")}
              onBlur={(e) => (e.target.style.borderColor = "#E8E2D9")}
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: 14,
                color: "#1A1A1A",
                fontWeight: 500,
              }}
            >
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
              style={{
                height: 52,
                borderRadius: 12,
                border: "1.5px solid #E8E2D9",
                padding: "0 16px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: 16,
                color: "#1A1A1A",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2C5F4A")}
              onBlur={(e) => (e.target.style.borderColor = "#E8E2D9")}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: 14,
                color: "#1A1A1A",
                fontWeight: 500,
              }}
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full outline-none transition-colors"
                style={{
                  height: 52,
                  borderRadius: 12,
                  border: "1.5px solid #E8E2D9",
                  padding: "0 48px 0 16px",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: 16,
                  color: "#1A1A1A",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#2C5F4A")}
                onBlur={(e) => (e.target.style.borderColor = "#E8E2D9")}
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
            <p
              className="mt-1"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: 12,
                color: "#6B6B6B",
              }}
            >
              At least 8 characters
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              height: 52,
              borderRadius: 26,
              backgroundColor: "#2C5F4A",
              color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans)",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Create account"
            )}
          </button>

          {/* Error */}
          {error && (
            <div
              style={{
                backgroundColor: "#FDF3EE",
                borderLeft: "3px solid #C4714A",
                padding: "12px 16px",
                borderRadius: 8,
                fontFamily: "var(--font-dm-sans)",
                fontSize: 14,
                color: "#C4714A",
              }}
            >
              {error}
            </div>
          )}
        </form>

        {/* Terms */}
        <p
          className="mt-5 text-center"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: 12,
            color: "#6B6B6B",
          }}
        >
          By continuing you agree to our Terms and Privacy Policy.
        </p>

        {/* Sign in link */}
        <p
          className="mt-4 text-center"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: 14,
            color: "#6B6B6B",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "#2C5F4A", fontWeight: 500 }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
