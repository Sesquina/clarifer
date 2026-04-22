/**
 * Tests for POST /api/ai/family-update (Sprint 2 — new streaming route)
 * API route test pattern per TESTING_SPEC.md Section "API ROUTE TEST PATTERN"
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

const mockToDataStreamResponse = vi.fn().mockReturnValue(
  new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: Family update\n\n"));
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
  familyUpdateStreamLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));

function makeMockSupabase(user: unknown, userRecord: unknown) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: userRecord }) };
      }
      if (table === "patients") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: TEST_PATIENT_CARLOS }) };
      }
      if (table === "symptom_logs") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [] }) };
      }
      if (table === "medications") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), mockResolvedValue: vi.fn().mockResolvedValue({ data: [] }), then: undefined };
      }
      if (table === "documents") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [] }) };
      }
      if (table === "audit_log") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [] }) };
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("POST /api/ai/family-update", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockStreamText.mockReturnValue({ toTextStreamResponse: mockToDataStreamResponse });
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("returns 401 when unauthenticated", async () => {
    createClient.mockResolvedValue(makeMockSupabase(null, null));

    const { POST } = await import("@/app/api/ai/family-update/route");
    const req = new Request("http://localhost/api/ai/family-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: TEST_PATIENT_CARLOS.id, language: "en" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("streams response in English for language=en", async () => {
    createClient.mockResolvedValue(
      makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "test-org-ccf-demo" })
    );

    const { POST } = await import("@/app/api/ai/family-update/route");
    const req = new Request("http://localhost/api/ai/family-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: TEST_PATIENT_CARLOS.id, language: "en" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    const callArgs = mockStreamText.mock.calls[0][0] as { system: string };
    expect(callArgs.system).toMatch(/english/i);
  });

  it("streams response in Spanish for language=es", async () => {
    createClient.mockResolvedValue(
      makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "test-org-ccf-demo" })
    );

    const { POST } = await import("@/app/api/ai/family-update/route");
    const req = new Request("http://localhost/api/ai/family-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: TEST_PATIENT_CARLOS.id, language: "es" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const callArgs = mockStreamText.mock.calls[0][0] as { system: string };
    expect(callArgs.system).toMatch(/spanish|español/i);
  });

  it("respects patient language preference when no language provided", async () => {
    const spanishPatient = { ...TEST_PATIENT_CARLOS, primary_language: "es" };
    const supabase = makeMockSupabase(
      { id: TEST_CAREGIVER.id },
      { role: "caregiver", organization_id: "test-org-ccf-demo" }
    );
    // Override patient to return Spanish preference
    const originalFrom = supabase.from.bind(supabase);
    supabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === "patients") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: spanishPatient }) };
      }
      return originalFrom(table);
    });
    createClient.mockResolvedValue(supabase);

    const { POST } = await import("@/app/api/ai/family-update/route");
    const req = new Request("http://localhost/api/ai/family-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: spanishPatient.id }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const callArgs = mockStreamText.mock.calls[0][0] as { system: string };
    expect(callArgs.system).toMatch(/spanish|español/i);
  });
});
