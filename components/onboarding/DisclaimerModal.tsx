/**
 * components/onboarding/DisclaimerModal.tsx
 * Disclaimer gate shown on /onboarding/complete before entering the app.
 * onAccept is async: must succeed before navigation. Error shown on failure.
 * Tables: users (via POST /api/users/disclaimer — handled by caller)
 * Auth: required (caller provides async onAccept that calls the API)
 * HIPAA: No PHI in this file
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface Props {
  onAccept: () => Promise<void>;
}

export function DisclaimerModal({ onAccept }: Props) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleAccept() {
    if (!checked || loading) return;
    setLoading(true);
    setError("");
    try {
      await onAccept();
      // onAccept navigates on success — if we reach here the caller didn't navigate
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "rgba(247, 242, 234, 0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--card)",
          borderRadius: 16,
          padding: 32,
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <Image src="/clarifer-logo.png" alt="Clarifer" width={40} height={40} />
        </div>

        <h2
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontSize: 24,
            fontWeight: 700,
            color: "var(--primary)",
            marginBottom: 16,
            lineHeight: 1.25,
          }}
        >
          Before you continue
        </h2>

        <p
          style={{
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: 15,
            color: "var(--muted)",
            lineHeight: 1.7,
            marginBottom: 24,
          }}
        >
          Clarifer helps you organize and understand medical information.
          It is not a medical device and does not diagnose, treat, or replace
          professional medical advice. Always consult your care team before
          making any medical decisions.
        </p>

        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            cursor: "pointer",
            marginBottom: error ? 12 : 28,
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: 14,
            color: "var(--text)",
            lineHeight: 1.5,
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{ marginTop: 2, width: 18, height: 18, flexShrink: 0 }}
          />
          I understand Clarifer is a care coordination tool, not a medical device.
        </label>

        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: "#FFF0F0",
              border: "1px solid var(--severity-high)",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--severity-high)",
              marginBottom: 16,
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleAccept}
          disabled={!checked || loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            height: 52,
            borderRadius: 26,
            backgroundColor: "var(--primary)",
            color: "var(--card)",
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            border: "none",
            cursor: !checked || loading ? "not-allowed" : "pointer",
            opacity: !checked || loading ? 0.6 : 1,
          }}
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? "Saving..." : "I understand, continue"}
        </button>
      </div>
    </div>
  );
}
