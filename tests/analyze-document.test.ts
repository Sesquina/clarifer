/**
 * Tests for POST /api/ai/analyze-document
 * Updated in Sprint 2: route migrated to Vercel AI SDK streaming with role-based auth.
 * Original Sprint 1 tests (JSON response, summarizeLimiter) replaced by streaming tests.
 * Full coverage now in tests/api/ai-analyze-document.test.ts
 */
import { describe, test, expect, vi } from "vitest";

// Mock Vercel AI SDK (Sprint 2 route uses streamText, not @anthropic-ai/sdk directly)
vi.mock("ai", () => ({
  streamText: vi.fn().mockReturnValue({
    toTextStreamResponse: vi.fn().mockReturnValue(
      new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode("data: ok\n\n")); c.close(); } }), {
        headers: { "Content-Type": "text/event-stream" },
      })
    ),
  }),
}));
vi.mock("@ai-sdk/anthropic", () => ({ anthropic: vi.fn().mockReturnValue("mocked") }));
vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/ratelimit", () => ({
  analyzeLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { role: "caregiver", organization_id: "org-1" } }) };
      }
      if (table === "documents") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: "doc-1", patient_id: "patient-1", document_category: "lab_result" } }), update: vi.fn().mockReturnThis() };
      }
      if (table === "patients") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { condition_template_id: null, language: "en" } }) };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }), insert: vi.fn().mockResolvedValue({ error: null }) };
    }),
  }),
}));

describe("POST /api/ai/analyze-document", () => {
  test("module exports a POST handler", async () => {
    const mod = await import("@/app/api/ai/analyze-document/route");
    expect(typeof mod.POST).toBe("function");
  });

  test("returns streaming response for authenticated caregiver (Sprint 2 contract)", async () => {
    const { POST } = await import("@/app/api/ai/analyze-document/route");

    const request = new Request("http://localhost/api/ai/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: "doc-1", patientId: "patient-1" }),
    });

    const response = await POST(request);
    // Sprint 2: route streams, no longer returns JSON with documentId
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
  });
});
