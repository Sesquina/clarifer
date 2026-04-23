/**
 * Sprint 6 — AI prompts are production-ready (no stub warnings, guardrails present).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

const mockStreamText = vi.fn();
const mockToTextStream = vi.fn().mockReturnValue(
  new Response(new ReadableStream({ start(c) { c.close(); } }), {
    headers: { "Content-Type": "text/event-stream" },
  })
);

vi.mock("ai", () => ({ streamText: mockStreamText }));
vi.mock("@ai-sdk/anthropic", () => ({ anthropic: vi.fn().mockReturnValue("mocked-model") }));
vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/ratelimit", () => ({
  familyUpdateStreamLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  trialSummaryLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));

function makeSupabase() {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: TEST_CAREGIVER.id } } }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { role: "caregiver", organization_id: "test-org-ccf-demo" } }),
        };
      }
      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: TEST_PATIENT_CARLOS }),
        };
      }
      if (table === "trial_saves") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "t1", trial_name: "Sample", phase: "2", status: "recruiting", location: "Remote", match_criteria: {} } }),
        };
      }
      if (table === "condition_templates") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
        };
      }
      if (table === "symptom_logs" || table === "medications" || table === "documents") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("Sprint 6 — AI prompts production-ready", () => {
  let createClient: ReturnType<typeof vi.fn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockStreamText.mockReturnValue({ toTextStreamResponse: mockToTextStream });
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("POST /api/ai/family-update emits no console.warn", async () => {
    createClient.mockResolvedValue(makeSupabase());
    const { POST } = await import("@/app/api/ai/family-update/route");
    const req = new Request("http://localhost/api/ai/family-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: TEST_PATIENT_CARLOS.id, language: "en" }),
    });
    await POST(req);
    const stubWarnings = warnSpy.mock.calls.filter((args: unknown[]) =>
      String(args[0] ?? "").toLowerCase().includes("stub")
    );
    expect(stubWarnings).toHaveLength(0);
  });

  it("POST /api/ai/trial-summary emits no console.warn", async () => {
    createClient.mockResolvedValue(makeSupabase());
    const { POST } = await import("@/app/api/ai/trial-summary/route");
    const req = new Request("http://localhost/api/ai/trial-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trialId: "t1", patientId: TEST_PATIENT_CARLOS.id }),
    });
    await POST(req);
    const stubWarnings = warnSpy.mock.calls.filter((args: unknown[]) =>
      String(args[0] ?? "").toLowerCase().includes("stub")
    );
    expect(stubWarnings).toHaveLength(0);
  });

  it("family update system prompt contains GUARDRAILS", async () => {
    createClient.mockResolvedValue(makeSupabase());
    const { POST } = await import("@/app/api/ai/family-update/route");
    const req = new Request("http://localhost/api/ai/family-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: TEST_PATIENT_CARLOS.id, language: "en" }),
    });
    await POST(req);
    const callArgs = mockStreamText.mock.calls[0]?.[0] as { system: string };
    expect(callArgs.system).toMatch(/GUARDRAILS/);
  });

  it("trial summary prompt instructs consulting the oncologist", async () => {
    createClient.mockResolvedValue(makeSupabase());
    const { POST } = await import("@/app/api/ai/trial-summary/route");
    const req = new Request("http://localhost/api/ai/trial-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trialId: "t1", patientId: TEST_PATIENT_CARLOS.id }),
    });
    await POST(req);
    const callArgs = mockStreamText.mock.calls[0]?.[0] as { system: string };
    expect(callArgs.system).toMatch(/oncologist/i);
  });
});
