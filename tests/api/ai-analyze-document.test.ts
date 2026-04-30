/**
 * Tests for POST /api/ai/analyze-document (Sprint 5 — Anthropic SDK rewrite)
 * Route now fetches document from storage, extracts text, and streams via @anthropic-ai/sdk.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PROVIDER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("pdf-parse", () => ({
  PDFParse: class {
    getText = vi.fn().mockResolvedValue({ text: "Fake document text for testing.", pages: [] });
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

const mockDoc = {
  id: "doc-1",
  patient_id: TEST_PATIENT_CARLOS.id,
  document_category: "pathology report",
  file_url: "org-1/patient-1/uuid.pdf",
  file_type: "application/pdf",
};

function makeStream(chunks: string[] = ["KEY FINDINGS"]) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const text of chunks) {
        yield { type: "content_block_delta", delta: { type: "text_delta", text } };
      }
      yield { type: "message_stop" };
    },
  };
}

function makeMockSupabase(userOverride: unknown, roleOverride: unknown, docOverride = mockDoc) {
  const chatInsert = vi.fn().mockResolvedValue({ error: null });
  const auditInsert = vi.fn().mockResolvedValue({ error: null });
  const docUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
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
          single: vi.fn().mockResolvedValue({ data: docOverride }),
          update: docUpdate,
        };
      }
      if (table === "patients") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { condition_template_id: null, primary_language: "en" } }) };
      }
      if (table === "chat_messages") return { insert: chatInsert };
      if (table === "audit_log") return { insert: auditInsert };
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        download: vi.fn().mockResolvedValue({ data: new Blob(["fake pdf"]), error: null }),
      }),
    },
    _chatInsert: chatInsert,
    _auditInsert: auditInsert,
    _docUpdate: docUpdate,
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("POST /api/ai/analyze-document", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    messagesStream.mockReturnValue(makeStream());
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("returns 401 when unauthenticated", async () => {
    createClient.mockResolvedValue(makeMockSupabase(null, null));
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
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    const text = await res.text();
    expect(text).toContain("KEY FINDINGS");
  });

  it("guardrail: prompt instructs model never to diagnose or recommend treatment", async () => {
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
    const callArgs = messagesStream.mock.calls[0][0] as { messages: Array<{ content: string }> };
    expect(callArgs.messages[0].content).toMatch(/DO NOT diagnose/i);
    expect(callArgs.messages[0].content).toMatch(/DO NOT recommend medications/i);
  });
});
