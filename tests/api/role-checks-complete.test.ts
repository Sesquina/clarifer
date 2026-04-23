/**
 * Sprint 6 — verify role gates on routes that previously had only auth checks.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/ratelimit", () => ({
  chatLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  summarizeLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  familyUpdateLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  familyUpdateStreamLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  trialSummaryLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  uploadLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  analyzeLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  loginLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  signupLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));
vi.mock("@/lib/documents/storage", () => ({
  generateSignedUrl: vi.fn().mockResolvedValue("https://signed.example/doc"),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    storage: {
      from: vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  }),
}));

function makeSupabase(opts: { user?: { id: string } | null; role?: string | null; organizationId?: string | null }) {
  const { user = { id: TEST_CAREGIVER.id }, role = "caregiver", organizationId = "test-org-ccf-demo" } = opts;
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: organizationId ? { role, organization_id: organizationId } : null,
          }),
        };
      }
      if (table === "documents") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "doc-1", patient_id: TEST_PATIENT_CARLOS.id, uploaded_by: TEST_CAREGIVER.id, file_url: "https://s/documents/x" } }),
          delete: vi.fn().mockReturnThis(),
        };
      }
      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: TEST_PATIENT_CARLOS }),
        };
      }
      if (table === "audit_log") return { insert: vi.fn().mockResolvedValue({ error: null }) };
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("Sprint 6 — role checks complete", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("patient role cannot DELETE documents → 403", async () => {
    createClient.mockResolvedValue(makeSupabase({ role: "patient" }));
    const { DELETE } = await import("@/app/api/documents/[id]/route");
    const req = new Request("http://localhost/api/documents/doc-1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "doc-1" }) });
    expect(res.status).toBe(403);
  });

  it("patient role cannot POST /api/export → 403", async () => {
    createClient.mockResolvedValue(makeSupabase({ role: "patient" }));
    const { POST } = await import("@/app/api/export/route");
    const req = new Request("http://localhost/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: TEST_PATIENT_CARLOS.id }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("admin role cannot POST /api/chat → 403", async () => {
    createClient.mockResolvedValue(makeSupabase({ role: "admin" }));
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
    expect(res.status).toBe(403);
  });

  it("provider role cannot POST /api/family-update → 403", async () => {
    createClient.mockResolvedValue(makeSupabase({ role: "provider" }));
    const { POST } = await import("@/app/api/family-update/route");
    const req = new Request("http://localhost/api/family-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: TEST_PATIENT_CARLOS.id }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("unauthenticated request to protected route → 401", async () => {
    createClient.mockResolvedValue(makeSupabase({ user: null, organizationId: null, role: null }));
    const { DELETE } = await import("@/app/api/documents/[id]/route");
    const req = new Request("http://localhost/api/documents/doc-1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "doc-1" }) });
    expect(res.status).toBe(401);
  });
});
