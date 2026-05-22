"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  onAccept: () => void;
}

export function DisclaimerModal({ onAccept }: Props) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    if (!checked || loading) return;
    setLoading(true);
    await fetch("/api/users/disclaimer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accepted: true }),
    });
    onAccept();
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
            marginBottom: 28,
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

        <button
          type="button"
          onClick={handleAccept}
          disabled={!checked || loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
          {loading ? "Saving..." : "I understand, continue"}
        </button>
      </div>
    </div>
  );
}
