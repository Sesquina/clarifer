// Bug 3: AI document analysis must be linked to the source document_id
import { describe, test, expect, vi } from "vitest";

const mockUpdate = vi.fn().mockReturnThis();
const mockEqUpdate = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "doc-1", patient_id: "patient-1" },
      }),
      update: mockUpdate,
    }),
  }),
}));

vi.mock("@/lib/ratelimit", () => ({
  summarizeLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));

vi.mock("@/lib/cors", () => ({
  checkOrigin: vi.fn().mockReturnValue(null),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: '{"headline":"Normal results","findings":[],"fullSummary":"All values normal."}',
          },
        ],
      }),
    };
  },
}));

describe("POST /api/ai/analyze-document", () => {
  test("module exports a POST handler", async () => {
    const mod = await import("@/app/api/ai/analyze-document/route");
    expect(typeof mod.POST).toBe("function");
  });

  test("returns 200 with summary and documentId linked", async () => {
    const { POST } = await import("@/app/api/ai/analyze-document/route");

    const request = new Request("http://localhost/api/ai/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({ documentId: "doc-1", content: "Lab results text" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.documentId).toBe("doc-1");
    expect(typeof body.summary).toBe("string");
  });
});
