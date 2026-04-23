"use client";

import { useState, useEffect } from "react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("clarifer-cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("clarifer-cookie-consent", "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: "#1A1A1A",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", maxWidth: 600 }}>
        Clarifer uses essential cookies to keep you signed in. We do not use tracking or advertising
        cookies. See our{" "}
        <a href="/privacy" style={{ color: "#FFFFFF", textDecoration: "underline" }}>
          Privacy Policy
        </a>{" "}
        for details.
      </p>
      <button
        onClick={accept}
        style={{
          height: 36,
          padding: "0 20px",
          borderRadius: 18,
          backgroundColor: "#2C5F4A",
          color: "#FFFFFF",
          border: "none",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        Got it
      </button>
    </div>
  );
}
