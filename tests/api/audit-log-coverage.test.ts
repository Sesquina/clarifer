/**
 * Sprint 6 — audit_log coverage for previously unlogged routes.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/ratelimit", () => ({
  chatLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  summarizeLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  uploadLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  familyUpdateLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  familyUpdateStreamLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  trialSummaryLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  analyzeLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  loginLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  signupLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));
vi.mock("@/lib/documents/storage", () => ({
  generateSignedUrl: vi.fn().mockResolvedValue("https://signed.example/doc"),
}));

const auditInserts: Array<Record<string, unknown>> = [];

function makeSupabase(opts: {
  role?: string;
  organizationId?: string | null;
  user?: { id: string } | null;
  documentRow?: Record<string, unknown> | null;
  patientRow?: Record<string, unknown> | null;
}) {
  const {
    role = "caregiver",
    organizationId = "test-org-ccf-demo",
    user = { id: TEST_CAREGIVER.id },
    documentRow = { id: "doc-1", patient_id: TEST_PATIENT_CARLOS.id, file_path: "path/file.pdf", file_url: "https://s/documents/path/file.pdf?x", uploaded_by: TEST_CAREGIVER.id },
    patientRow = TEST_PATIENT_CARLOS,
  } = opts;

  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === "users") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: organizationId ? { role, organization_id: organizationId } : null,
        }),
      };
    }
    if (table === "audit_log") {
      return {
        insert: vi.fn().mockImplementation((row: Record<string, unknown> | Record<string, unknown>[]) => {
          if (Array.isArray(row)) auditInserts.push(...row);
          else auditInserts.push(row);
          return Promise.resolve({ error: null });
        }),
      };
    }
    if (table === "documents") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: documentRow }),
      };
    }
    if (table === "patients") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: patientRow }),
      };
    }
    if (table === "chat_messages") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      };
    }
    if (table === "anonymized_exports") {
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    }
    if (table === "symptom_logs" || table === "medications" || table === "trial_saves") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [] }),
      };
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    };
  });

  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: fromMock,
    storage: {
      from: vi.fn().mockReturnValue({ remove: vi.fn().mockResolvedValue({ error: null }) }),
    },
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    storage: {
      from: vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
        upload: vi.fn().mockResolvedValue({ error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://signed.example" } }),
      }),
    },
  }),
}));

describe("Sprint 6 — audit_log coverage", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    auditInserts.length = 0;
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("DELETE /api/documents/[id] writes audit_log with action DELETE", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { DELETE } = await import("@/app/api/documents/[id]/route");
    const req = new Request("http://localhost/api/documents/doc-1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "doc-1" }) });
    expect(res.status).toBe(200);
    expect(auditInserts.some((r) => r.action === "DELETE" && r.resource_type === "documents")).toBe(true);
  });

  it("GET /api/documents/[id]/summary writes audit_log with action SELECT", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { GET } = await import("@/app/api/documents/[id]/summary/route");
    const req = new Request("http://localhost/api/documents/doc-1/summary");
    const res = await GET(req, { params: Promise.resolve({ id: "doc-1" }) });
    expect(res.status).toBe(200);
    expect(
      auditInserts.some((r) => r.action === "SELECT" && r.resource_type === "document_summaries")
    ).toBe(true);
  });

  it("POST /api/export writes audit_log with action EXPORT", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/export/route");
    const req = new Request("http://localhost/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: TEST_PATIENT_CARLOS.id }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(
      auditInserts.some((r) => r.action === "EXPORT" && r.resource_type === "patient_export")
    ).toBe(true);
  });

  it("POST /api/chat writes audit_log with action SELECT", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/chat/route");
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "hi" }],
        patientId: TEST_PATIENT_CARLOS.id,
      }),
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    // Audit is written before streaming; the response body type is not assertable in a unit test.
    expect(res).toBeDefined();
    expect(
      auditInserts.some((r) => r.action === "SELECT" && r.resource_type === "chat")
    ).toBe(true);
  });
});
