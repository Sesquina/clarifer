/**
 * Tests for POST /api/ai/analyze-document (Sprint 2 — streaming rewrite)
 * API route test pattern per TESTING_SPEC.md Section "API ROUTE TEST PATTERN"
 * Tier 1 coverage required: auth, role check, audit log, guardrails.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PROVIDER, TEST_PATIENT_CARLOS } from "../fixtures/users";

// -- Mock Vercel AI SDK before any imports --
const mockToDataStreamResponse = vi.fn().mockReturnValue(
  new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: KEY FINDINGS\n\n"));
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
  analyzeLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));

// Supabase mock factory
function makeMockSupabase(userOverride: unknown, roleOverride: unknown, extraTables: Record<string, unknown> = {}) {
  const auditInsert = vi.fn().mockResolvedValue({ error: null });
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: userOverride }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: roleOverride }) };
      }
      if (table === "documents") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "doc-1", patient_id: TEST_PATIENT_CARLOS.id } }),
          update: vi.fn().mockReturnThis(),
        };
      }
      if (table === "condition_templates") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { ai_context: "oncology, hepatobiliary", document_types: ["pathology report"] } }) };
      }
      if (table === "patients") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: TEST_PATIENT_CARLOS }) };
      }
      if (table === "audit_log") {
        return { insert: auditInsert };
      }
      if (extraTables[table]) return extraTables[table];
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    }),
    _auditInsert: auditInsert,
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("POST /api/ai/analyze-document", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockStreamText.mockReturnValue({ toTextStreamResponse: mockToDataStreamResponse });
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("returns 401 when unauthenticated", async () => {
    createClient.mockResolvedValue(
      makeMockSupabase(null, null)
    );

    const { POST } = await import("@/app/api/ai/analyze-document/route");
    const req = new Request("http://localhost/api/ai/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: "doc-1", patientId: "patient-1" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 when called by provider role", async () => {
    createClient.mockResolvedValue(
      makeMockSupabase({ id: TEST_PROVIDER.id }, { role: "provider", organization_id: "org-1" })
    );

    const { POST } = await import("@/app/api/ai/analyze-document/route");
    const req = new Request("http://localhost/api/ai/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: "doc-1", patientId: TEST_PATIENT_CARLOS.id }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("FORBIDDEN");
  });

  it("streams a response for valid caregiver request", async () => {
    createClient.mockResolvedValue(
      makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "test-org-ccf-demo" })
    );

    const { POST } = await import("@/app/api/ai/analyze-document/route");
    const req = new Request("http://localhost/api/ai/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: "doc-1", patientId: TEST_PATIENT_CARLOS.id }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    expect(mockStreamText).toHaveBeenCalledOnce();
  });

  it("guardrail: system prompt instructs model never to diagnose", async () => {
    createClient.mockResolvedValue(
      makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "test-org-ccf-demo" })
    );

    const { POST } = await import("@/app/api/ai/analyze-document/route");
    const req = new Request("http://localhost/api/ai/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: "doc-1", patientId: TEST_PATIENT_CARLOS.id }),
    });

    await POST(req);

    const callArgs = mockStreamText.mock.calls[0][0] as { system: string };
    expect(callArgs.system).toMatch(/never diagnose/i);
    expect(callArgs.system).toMatch(/never recommend/i);
    expect(callArgs.system).toMatch(/never speculate on prognosis/i);
  });
});
