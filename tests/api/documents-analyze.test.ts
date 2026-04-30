/**
 * Tests for POST /api/ai/analyze-document (Sprint 5)
 * Route: fetches doc from storage → extracts text → streams via @anthropic-ai/sdk
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("pdf-parse", () => ({
  PDFParse: class {
    getText = vi.fn().mockResolvedValue({ text: "Cholangiocarcinoma pathology report content.", pages: [] });
  },
}));

const { messagesStream } = vi.hoisted(() => ({ messagesStream: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { stream: messagesStream };
  },
}));

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/ratelimit", () => ({
  analyzeLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));

function makeStream(chunks: string[] = ["KEY FINDINGS: Normal."]) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const text of chunks) {
        yield { type: "content_block_delta", delta: { type: "text_delta", text } };
      }
      yield { type: "message_stop" };
    },
  };
}

function makeMockSupabase(userOverride: unknown, roleOverride: unknown) {
  const chatInsert = vi.fn().mockResolvedValue({ error: null });
  const auditInsert = vi.fn().mockResolvedValue({ error: null });
  const docUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: userOverride } }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: roleOverride }) };
      }
      if (table === "documents") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "doc-1", patient_id: TEST_PATIENT_CARLOS.id, document_category: "pathology report", file_url: "org/patient/uuid.pdf", file_type: "application/pdf" } }),
          update: docUpdate,
        };
      }
      if (table === "patients") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { condition_template_id: null } }) };
      }
      if (table === "chat_messages") return { insert: chatInsert };
      if (table === "audit_log") return { insert: auditInsert };
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    }),
    _chatInsert: chatInsert,
    _auditInsert: auditInsert,
    _docUpdate: docUpdate,
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("POST /api/ai/analyze-document (Sprint 5 — Anthropic SDK)", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    messagesStream.mockReturnValue(makeStream());
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }));
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("returns 401 when unauthenticated", async () => {
    createClient.mockResolvedValue(makeMockSupabase(null, null));
    const { POST } = await import("@/app/api/ai/analyze-document/route");
    const res = await POST(new Request("http://localhost/api/ai/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: "doc-1", patientId: TEST_PATIENT_CARLOS.id }),
    }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when role is not caregiver", async () => {
    createClient.mockResolvedValue(makeMockSupabase({ id: "user-1" }, { role: "provider", organization_id: "org-1" }));
    const { POST } = await import("@/app/api/ai/analyze-document/route");
    const res = await POST(new Request("http://localhost/api/ai/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: "doc-1", patientId: TEST_PATIENT_CARLOS.id }),
    }));
    expect(res.status).toBe(403);
  });

  it("streams text, writes chat_message and updates analysis_status on success", async () => {
    const mock = makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "org-1" });
    createClient.mockResolvedValue(mock);
    const { POST } = await import("@/app/api/ai/analyze-document/route");
    const res = await POST(new Request("http://localhost/api/ai/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: "doc-1", patientId: TEST_PATIENT_CARLOS.id }),
    }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    const text = await res.text();
    expect(text).toBeTruthy();
    expect(mock._chatInsert).toHaveBeenCalledOnce();
    const chatCall = mock._chatInsert.mock.calls[0][0];
    expect(chatCall.document_id).toBe("doc-1");
    expect(chatCall.role).toBe("assistant");
  });

  it("returns 503 when file fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    createClient.mockResolvedValue(makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "org-1" }));
    const { POST } = await import("@/app/api/ai/analyze-document/route");
    const res = await POST(new Request("http://localhost/api/ai/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: "doc-1", patientId: TEST_PATIENT_CARLOS.id }),
    }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/temporarily unavailable/i);
  });
});
