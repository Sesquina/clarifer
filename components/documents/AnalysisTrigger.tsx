/**
 * components/documents/AnalysisTrigger.tsx
 * Client component that fires document analysis when a document has no summary.
 * Mounts, POSTs to /api/ai/analyze-document, then refreshes the server component.
 * Tables: documents (indirect -- analysis route writes summary back)
 * Auth: caregiver role required (enforced by the API route)
 * Sprint: fix/p0-demo-blockers
 * HIPAA: No PHI in this file. documentId and patientId are UUIDs only.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type State = "loading" | "done" | "rate-limited" | "error";

interface Props {
  documentId: string;
  patientId: string;
}

/**
 * Fires a POST to /api/ai/analyze-document on mount.
 * Shows a spinner while in flight, then refreshes the page on success
 * so the parent server component re-renders with the new summary.
 * On 429 or other errors shows a calm, non-alarming message.
 */
export function AnalysisTrigger({ documentId, patientId }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    let cancelled = false;

    async function trigger() {
      try {
        const res = await fetch("/api/ai/analyze-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId, patientId }),
        });

        if (cancelled) return;

        if (res.status === 429) {
          setState("rate-limited");
          return;
        }

        if (!res.ok) {
          setState("error");
          return;
        }

        // The route streams text/plain on success and enqueues JSON {"error":"..."}
        // with HTTP 200 on Anthropic failures. Read the body to distinguish them:
        // non-JSON body = genuine streaming AI text = success.
        // JSON body with error field = Anthropic failed = show error, don't refresh.
        const text = await res.text();
        try {
          const json = JSON.parse(text) as { error?: string };
          if (json.error) {
            setState("error");
            return;
          }
          // Valid JSON without error field — treat as success
          setState("done");
          router.refresh();
        } catch {
          // Non-JSON body = streaming AI analysis text = genuine success
          setState("done");
          router.refresh();
        }
      } catch {
        if (!cancelled) setState("error");
      }
    }

    trigger();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "loading") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "20px 0",
          color: "var(--muted)",
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          fontSize: 14,
        }}
      >
        <Loader2 size={18} className="animate-spin" style={{ flexShrink: 0 }} />
        Reviewing your document...
      </div>
    );
  }

  if (state === "rate-limited") {
    return (
      <p
        style={{
          fontSize: 14,
          color: "var(--muted)",
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          padding: "20px 0",
        }}
      >
        Analysis in progress. Check back in a few minutes.
      </p>
    );
  }

  if (state === "error") {
    return (
      <p
        style={{
          fontSize: 14,
          color: "var(--muted)",
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          padding: "20px 0",
        }}
      >
        Analysis unavailable. Try again later.
      </p>
    );
  }

  // state === "done": router.refresh() has been called, server re-render in flight
  return null;
}
