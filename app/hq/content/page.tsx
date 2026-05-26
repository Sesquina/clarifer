// app/hq/content/page.tsx
// AI content generator for Clarifer social posts -- Command Center.
// Generates Substack and LinkedIn drafts via server-side API route.
// Rule: Anthropic is NEVER called client-side. All AI calls go through /api/hq/content/generate.
// Rule: no hex strings in JSX -- use CSS variables only.

"use client";

import { useState } from "react";

type Phase = "input" | "loading" | "output";

interface OutputState {
  substack: string;
  linkedin: string;
}

function OutputCard({
  label,
  value,
  onChange,
  onRegenerate,
  maxChars,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onRegenerate: () => void;
  maxChars?: number;
}) {
  const [copied, setCopied] = useState(false);
  const charCount = value.length;
  const overLimit = maxChars !== undefined && charCount > maxChars;

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            color: "var(--muted)",
          }}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={onRegenerate}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--accent)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 8px",
          }}
        >
          Regenerate
        </button>
      </div>

      {/* Editable draft */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        style={{
          width: "100%",
          borderRadius: 8,
          border: "1px solid var(--border)",
          padding: "10px 12px",
          fontSize: 14,
          lineHeight: 1.6,
          color: "var(--foreground)",
          backgroundColor: "var(--surface)",
          resize: "vertical",
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          boxSizing: "border-box",
        }}
      />

      {/* Footer: char count + copy */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 12,
            color: overLimit ? "var(--accent)" : "var(--muted)",
          }}
        >
          {charCount.toLocaleString()} chars
          {overLimit && maxChars !== undefined && (
            <> -- LinkedIn limit is {maxChars.toLocaleString()}</>
          )}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          style={{
            height: 36,
            borderRadius: 18,
            border: "1px solid var(--primary)",
            backgroundColor: "transparent",
            color: "var(--primary)",
            fontSize: 13,
            fontWeight: 600,
            padding: "0 18px",
            cursor: "pointer",
            transition: "background-color 120ms ease, color 120ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--primary)";
            e.currentTarget.style.color = "var(--white)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--primary)";
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default function ContentPage() {
  const [phase, setPhase] = useState<Phase>("input");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState<OutputState>({ substack: "", linkedin: "" });
  const [errorMsg, setErrorMsg] = useState("");

  async function generate(opts: { target: "both" | "substack" | "linkedin"; promptOverride?: string }) {
    const { target, promptOverride } = opts;
    const body = { prompt: promptOverride ?? prompt, target };

    setPhase("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/hq/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setPhase("output");
        setErrorMsg(err.error ?? "Something went wrong. Please try again.");
        return;
      }

      const data = await res.json() as { substack?: string; linkedin?: string };

      setOutput((prev) => ({
        substack: data.substack ?? prev.substack,
        linkedin: data.linkedin ?? prev.linkedin,
      }));
      setPhase("output");
    } catch {
      setPhase("output");
      setErrorMsg("Network error. Please try again.");
    }
  }

  function handleGenerate() {
    if (!prompt.trim()) return;
    generate({ target: "both" });
  }

  function handleRegenerate(platform: "substack" | "linkedin") {
    generate({ target: platform });
  }

  return (
    <div style={{ maxWidth: 720, paddingBottom: 64 }}>
      {/* Header */}
      <h1
        style={{
          fontFamily: "var(--font-playfair)",
          fontSize: 28,
          fontWeight: 700,
          color: "var(--primary)",
          marginBottom: 4,
        }}
      >
        Content
      </h1>
      <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>
        Describe what you want to say. Get a Substack post and a LinkedIn post drafted for you.
      </p>

      {/* Input area -- always visible so you can start a new topic */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <label
          htmlFor="content-prompt"
          style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}
        >
          What do you want to write about?
        </label>
        <textarea
          id="content-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. We just hit 200 waitlist signups and I want to share what we learned about what caregivers are searching for."
          rows={5}
          style={{
            width: "100%",
            borderRadius: 8,
            border: "1px solid var(--border)",
            padding: "10px 12px",
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--foreground)",
            backgroundColor: "var(--surface)",
            resize: "vertical",
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={phase === "loading" || !prompt.trim()}
          style={{
            alignSelf: "flex-start",
            height: 48,
            borderRadius: 24,
            backgroundColor: "var(--primary)",
            color: "var(--white)",
            border: "none",
            fontSize: 15,
            fontWeight: 600,
            padding: "0 32px",
            cursor: phase === "loading" || !prompt.trim() ? "not-allowed" : "pointer",
            opacity: phase === "loading" || !prompt.trim() ? 0.6 : 1,
            transition: "opacity 120ms ease",
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          }}
        >
          Generate posts
        </button>
      </div>

      {/* Loading state */}
      {phase === "loading" && (
        <p
          style={{
            fontSize: 14,
            color: "var(--muted)",
            fontStyle: "italic",
            marginBottom: 24,
          }}
        >
          Drafting your posts...
        </p>
      )}

      {/* Error */}
      {errorMsg && phase === "output" && (
        <p
          style={{
            fontSize: 14,
            color: "var(--accent)",
            marginBottom: 16,
          }}
        >
          {errorMsg}
        </p>
      )}

      {/* Output cards */}
      {phase === "output" && !errorMsg && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <OutputCard
            label="Substack"
            value={output.substack}
            onChange={(v) => setOutput((o) => ({ ...o, substack: v }))}
            onRegenerate={() => handleRegenerate("substack")}
          />
          <OutputCard
            label="LinkedIn"
            value={output.linkedin}
            onChange={(v) => setOutput((o) => ({ ...o, linkedin: v }))}
            onRegenerate={() => handleRegenerate("linkedin")}
            maxChars={3000}
          />
        </div>
      )}
    </div>
  );
}
