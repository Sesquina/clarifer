"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not send reset email.");
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <h1 className="mb-4 font-[var(--font-playfair)] text-3xl text-[var(--primary)]">
          Check your email
        </h1>
        <p className="mb-8 text-[var(--foreground)]">
          If an account exists for {email}, a password reset link is on its way.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-[var(--primary)] px-6 py-3 text-center text-white"
        >
          Back to sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-2 font-[var(--font-playfair)] text-3xl text-[var(--primary)]">
        Reset your password
      </h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Enter your email and we will send you a link to reset your password.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="sr-only">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] px-4 py-3 text-base"
            aria-label="Email"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-[var(--terracotta)]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-12 rounded-md bg-[var(--primary)] px-4 py-3 text-white disabled:opacity-60"
          aria-label="Send reset link"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <Link
        href="/login"
        className="mt-6 text-center text-sm text-[var(--primary)] underline"
      >
        Back to sign in
      </Link>
    </main>
  );
}
