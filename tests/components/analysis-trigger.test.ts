/**
 * tests/components/analysis-trigger.test.ts
 * Verifies the AnalysisTrigger response-parsing logic:
 *   - 200 + error JSON body  → error state, router.refresh() NOT called
 *   - 200 + plain text body  → done state, router.refresh() called
 *   - non-ok response        → error state, router.refresh() NOT called
 * Sprint: fix/p0-demo-blockers
 * HIPAA: No PHI in this file.
 */
import { describe, it, expect } from "vitest";

/**
 * Mirrors the response-handling logic in AnalysisTrigger.tsx so we can
 * unit-test it without rendering React or touching the DOM.
 */
async function handleAnalysisResponse(
  res: Response,
  refresh: () => void
): Promise<"loading" | "done" | "rate-limited" | "error"> {
  if (res.status === 429) return "rate-limited";
  if (!res.ok) return "error";

  const text = await res.text();
  try {
    const json = JSON.parse(text) as { error?: string };
    if (json.error) return "error";
    refresh();
    return "done";
  } catch {
    refresh();
    return "done";
  }
}

describe("AnalysisTrigger response handling", () => {
  it("200 with error JSON body → error state, router.refresh() NOT called", async () => {
    let refreshCalled = false;
    const refresh = () => { refreshCalled = true; };
    const res = new Response(
      JSON.stringify({ error: "Analysis temporarily unavailable" }),
      { status: 200, headers: { "Content-Type": "text/plain" } }
    );

    const state = await handleAnalysisResponse(res, refresh);

    expect(state).toBe("error");
    expect(refreshCalled).toBe(false);
  });

  it("200 with plain text body (streaming AI text) → done state, router.refresh() called", async () => {
    let refreshCalled = false;
    const refresh = () => { refreshCalled = true; };
    const res = new Response(
      "This week Carlos had an appointment with his oncologist. He is stable.",
      { status: 200, headers: { "Content-Type": "text/plain" } }
    );

    const state = await handleAnalysisResponse(res, refresh);

    expect(state).toBe("done");
    expect(refreshCalled).toBe(true);
  });

  it("200 with valid JSON but no error field → done state, router.refresh() called", async () => {
    let refreshCalled = false;
    const refresh = () => { refreshCalled = true; };
    const res = new Response(
      JSON.stringify({ summary: "All clear" }),
      { status: 200 }
    );

    const state = await handleAnalysisResponse(res, refresh);

    expect(state).toBe("done");
    expect(refreshCalled).toBe(true);
  });

  it("503 non-ok response → error state, router.refresh() NOT called", async () => {
    let refreshCalled = false;
    const refresh = () => { refreshCalled = true; };
    const res = new Response(
      JSON.stringify({ error: "Analysis temporarily unavailable" }),
      { status: 503 }
    );

    const state = await handleAnalysisResponse(res, refresh);

    expect(state).toBe("error");
    expect(refreshCalled).toBe(false);
  });

  it("429 rate-limit response → rate-limited state, router.refresh() NOT called", async () => {
    let refreshCalled = false;
    const refresh = () => { refreshCalled = true; };
    const res = new Response(
      JSON.stringify({ error: "Rate limited", code: "RATE_LIMITED" }),
      { status: 429 }
    );

    const state = await handleAnalysisResponse(res, refresh);

    expect(state).toBe("rate-limited");
    expect(refreshCalled).toBe(false);
  });
});
