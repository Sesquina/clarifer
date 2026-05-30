/**
 * app/onboarding/page.tsx
 * Single-question onboarding: patient first name + language preference.
 * ONE QUESTION ONLY. No role picker, no dob, no diagnosis, no location.
 * Tables: patients (via POST /api/patients/create)
 * Auth: required — middleware redirects to /login if no session
 * HIPAA: No PHI in this file. Patient name sent to server-side API only.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const BODY: React.CSSProperties = { fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" };
const HEADING: React.CSSProperties = { fontFamily: "var(--font-playfair), 'Playfair Display', serif" };

/** Exported for unit tests. */
export function buildOnboardingPayload(name: string, lang: "en" | "es") {
  return {
    first_name: name.trim(),
    language_preference: lang,
    role: "caregiver" as const,
  };
}

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [lang, setLang] = useState<"en" | "es">("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [nameFocused, setNameFocused] = useState(false);
  const router = useRouter();

  const canSubmit = name.trim().length > 0 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/patients/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildOnboardingPayload(name, lang)),
      });

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/onboarding/complete");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        ...BODY,
      }}
    >
      {/* Logo — above card */}
      <div style={{ marginBottom: 24 }}>
        <img
          src="/clarifer-logo.png"
          alt="Clarifer"
          width={48}
          height={48}
          style={{ objectFit: "contain", display: "block" }}
        />
      </div>

      {/* Card — max 480px desktop, full-width mobile */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          backgroundColor: "var(--card)",
          borderRadius: 16,
          padding: 40,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {/* Heading */}
        <h1
          style={{
            ...HEADING,
            fontSize: 28,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 8,
            lineHeight: 1.25,
          }}
        >
          Who are you caring for?
        </h1>

        {/* Subtext */}
        <p
          style={{
            ...BODY,
            fontSize: 14,
            color: "var(--muted)",
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          Their first name is all we need right now. You can add more details any time.
        </p>

        {/* Label: THEIR FIRST NAME */}
        <p
          style={{
            ...BODY,
            fontSize: 11,
            fontWeight: 500,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            marginBottom: 8,
          }}
        >
          Their first name
        </p>

        {/* Name input */}
        <input
          id="patient-name"
          type="text"
          placeholder="First name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          autoFocus
          autoComplete="off"
          style={{
            ...BODY,
            display: "block",
            width: "100%",
            height: 56,
            borderRadius: 12,
            border: nameFocused
              ? "2px solid var(--primary)"
              : error
              ? "2px solid var(--severity-high)"
              : "1px solid var(--border)",
            padding: "0 16px",
            fontSize: 16,
            color: "var(--text)",
            backgroundColor: nameFocused
              ? "var(--pale-sage)"
              : error
              ? "#FFF0F0"
              : "var(--card)",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 120ms, background-color 120ms",
            marginBottom: 24,
          }}
        />

        {/* Label: LANGUAGE */}
        <p
          style={{
            ...BODY,
            fontSize: 11,
            fontWeight: 500,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            marginBottom: 8,
          }}
        >
          Language
        </p>

        {/* EN / ES toggle */}
        <div
          style={{
            display: "flex",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 32,
          }}
        >
          {(["en", "es"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              style={{
                ...BODY,
                flex: 1,
                height: 44,
                border: "none",
                backgroundColor: lang === l ? "var(--primary)" : "transparent",
                color: lang === l ? "var(--card)" : "var(--muted)",
                fontSize: 14,
                fontWeight: lang === l ? 600 : 500,
                cursor: "pointer",
                transition: "background-color 120ms, color 120ms",
              }}
            >
              {l === "en" ? "English" : "Español"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: "#FFF0F0",
              border: "1px solid var(--severity-high)",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 14,
              color: "var(--severity-high)",
              marginBottom: 16,
              ...BODY,
            }}
          >
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-label="Take me to my dashboard"
          style={{
            ...BODY,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: 52,
            borderRadius: 12,
            backgroundColor: canSubmit ? "var(--primary)" : "#B0B0B0",
            color: "var(--card)",
            fontSize: 15,
            fontWeight: 600,
            border: "none",
            cursor: canSubmit ? "pointer" : "not-allowed",
            transition: "background-color 120ms",
          }}
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            "Take me to my dashboard →"
          )}
        </button>

        {/* Hint text */}
        <p
          style={{
            ...BODY,
            fontSize: 13,
            color: "var(--muted)",
            marginTop: 12,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Upload your first document and Clarifer will explain what it means.
        </p>
      </div>
    </div>
  );
}
