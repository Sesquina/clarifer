"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("Could not update your password. Please request a new reset link.");
        return;
      }
      router.push("/home");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{ ...BODY, background: "var(--background)" }}
      className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12"
    >
      <img
        src="/logo-mark.png"
        alt="Clarifer"
        width={48}
        height={48}
        style={{ objectFit: "contain" }}
        className="mb-6"
      />

      <h1
        style={HEADING}
        className="mb-2 text-center text-3xl text-[var(--primary)]"
      >
        Set your new password
      </h1>
      <p className="mb-8 text-center text-sm text-[var(--muted)]">
        Choose a strong password for your account.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <label className="block">
          <span className="sr-only">New password</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="New password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-base text-[var(--text)]"
            aria-label="New password"
          />
        </label>

        <label className="block">
          <span className="sr-only">Confirm new password</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Confirm new password"
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-base text-[var(--text)]"
            aria-label="Confirm new password"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm" style={{ color: "#8B1A1A" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[52px] rounded-md bg-[var(--primary)] px-4 py-3 text-base font-medium text-white disabled:opacity-60"
          aria-label="Update password"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </main>
  );
}
