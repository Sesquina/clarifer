/**
 * Tests for POST /api/ai/trial-summary (Sprint 2 — new streaming route)
 * API route test pattern per TESTING_SPEC.md Section "API ROUTE TEST PATTERN"
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

const mockToDataStreamResponse = vi.fn().mockReturnValue(
  new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: Eligibility summary\n\n"));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } }
  )
);

const mockStreamText = vi.fn().mockReturnValue({
  toTextStreamResponse: mockToDataStreamResponse,
});

vi.mock("ai", () => ({ streamText: mockStreamText }));
vi.mock("@ai-sdk/anthropic", () => ({ anthropic: vi.fn().mockReturnValue("mocked-model") }));
vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/ratelimit", () => ({
  trialSummaryLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));

const TEST_TRIAL_SAVE = {
  id: "trial-save-1",
  trial_id: "NCT12345678",
  trial_name: "Phase 3 GEMOX Trial",
  phase: "3",
  location: "Houston, TX",
  status: "recruiting",
  match_criteria: { eligibility: "Stage 3-4 cholangiocarcinoma" },
  patient_id: TEST_PATIENT_CARLOS.id,
};

function makeMockSupabase(user: unknown, userRecord: unknown) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: userRecord }) };
      }
      if (table === "trial_saves") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: TEST_TRIAL_SAVE }) };
      }
      if (table === "patients") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: TEST_PATIENT_CARLOS }) };
      }
      if (table === "condition_templates") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { ai_context: "oncology, hepatobiliary", trial_filters: { condition: "cholangiocarcinoma" } } }) };
      }
      if (table === "audit_log") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("POST /api/ai/trial-summary", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockStreamText.mockReturnValue({ toTextStreamResponse: mockToDataStreamResponse });
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("returns 401 when unauthenticated", async () => {
    createClient.mockResolvedValue(makeMockSupabase(null, null));

    const { POST } = await import("@/app/api/ai/trial-summary/route");
    const req = new Request("http://localhost/api/ai/trial-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trialId: TEST_TRIAL_SAVE.id, patientId: TEST_PATIENT_CARLOS.id }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("streams a plain-language eligibility summary for valid caregiver", async () => {
    createClient.mockResolvedValue(
      makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "test-org-ccf-demo" })
    );

    const { POST } = await import("@/app/api/ai/trial-summary/route");
    const req = new Request("http://localhost/api/ai/trial-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trialId: TEST_TRIAL_SAVE.id, patientId: TEST_PATIENT_CARLOS.id }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    expect(mockStreamText).toHaveBeenCalledOnce();
  });

  it("system prompt instructs model to flag disqualifying criteria", async () => {
    createClient.mockResolvedValue(
      makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "test-org-ccf-demo" })
    );

    const { POST } = await import("@/app/api/ai/trial-summary/route");
    const req = new Request("http://localhost/api/ai/trial-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trialId: TEST_TRIAL_SAVE.id, patientId: TEST_PATIENT_CARLOS.id }),
    });

    await POST(req);

    const callArgs = mockStreamText.mock.calls[0][0] as { system: string };
    expect(callArgs.system).toMatch(/disqualif/i);
    expect(callArgs.system).toMatch(/eligibility/i);
    expect(callArgs.system).toMatch(/plain language/i);
    // Guardrail: must not recommend enrolling or not enrolling
    expect(callArgs.system).toMatch(/never recommend/i);
  });
});
