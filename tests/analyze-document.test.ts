/**
 * Tests for POST /api/ai/analyze-document
 * Updated in Sprint 5: route migrated to @anthropic-ai/sdk with document download + text extraction.
 * Full coverage in tests/api/ai-analyze-document.test.ts and tests/api/documents-analyze.test.ts
 */
import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("pdf-parse", () => ({
  PDFParse: class {
    getText = vi.fn().mockResolvedValue({ text: "Fake document text.", pages: [] });
  },
}));

const { hoistedStream } = vi.hoisted(() => ({ hoistedStream: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { stream: hoistedStream };
  },
}));

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
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: "doc-1", patient_id: "patient-1", document_category: "lab_result", file_url: "org-1/p-1/uuid.pdf", file_type: "application/pdf" } }), update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) };
      }
      if (table === "patients") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { condition_template_id: null } }) };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }), insert: vi.fn().mockResolvedValue({ error: null }) };
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        download: vi.fn().mockResolvedValue({ data: new Blob(["fake pdf"]), error: null }),
      }),
    },
  }),
}));

describe("POST /api/ai/analyze-document", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }));
  });

  test("module exports a POST handler", async () => {
    hoistedStream.mockReturnValue({ [Symbol.asyncIterator]: async function* () {} });
    const mod = await import("@/app/api/ai/analyze-document/route");
    expect(typeof mod.POST).toBe("function");
  });

  test("returns streaming response for authenticated caregiver (Sprint 5 contract)", async () => {
    hoistedStream.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield { type: "content_block_delta", delta: { type: "text_delta", text: "KEY FINDINGS" } };
      },
    });
    const { POST } = await import("@/app/api/ai/analyze-document/route");
    const response = await POST(new Request("http://localhost/api/ai/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: "doc-1", patientId: "patient-1" }),
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");
  });
});
