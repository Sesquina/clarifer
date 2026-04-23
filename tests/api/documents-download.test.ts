/**
 * Tests for GET /api/documents/[id] (Sprint 5)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/documents/storage", () => ({
  generateSignedUrl: vi.fn().mockResolvedValue("https://supabase.co/storage/signed/doc.pdf?token=abc"),
  uploadToStorage: vi.fn(),
  deleteFromStorage: vi.fn(),
}));

const mockDoc = {
  id: "doc-1",
  file_name: "report.pdf",
  file_path: "org-1/patient-1/uuid.pdf",
  mime_type: "application/pdf",
  document_category: "pathology report",
  analysis_status: "completed",
  patient_id: TEST_PATIENT_CARLOS.id,
  created_at: "2026-04-22T00:00:00Z",
};

function makeMockSupabase(userOverride: unknown, roleOverride: unknown, doc: unknown = mockDoc) {
  const auditInsert = vi.fn().mockResolvedValue({ error: null });
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: userOverride } }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: roleOverride }) };
      }
      if (table === "documents") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: doc }) };
      }
      if (table === "audit_log") return { insert: auditInsert };
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    }),
    _auditInsert: auditInsert,
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("GET /api/documents/[id]", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("returns 401 when unauthenticated", async () => {
    createClient.mockResolvedValue(makeMockSupabase(null, null));
    const { GET } = await import("@/app/api/documents/[id]/route");
    const res = await GET(
      new Request("http://localhost/api/documents/doc-1"),
      { params: Promise.resolve({ id: "doc-1" }) }
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when document not found", async () => {
    createClient.mockResolvedValue(makeMockSupabase({ id: TEST_CAREGIVER.id }, { organization_id: "org-1" }, null));
    const { GET } = await import("@/app/api/documents/[id]/route");
    const res = await GET(
      new Request("http://localhost/api/documents/missing"),
      { params: Promise.resolve({ id: "missing" }) }
    );
    expect(res.status).toBe(404);
  });

  it("returns document and signedUrl on success", async () => {
    createClient.mockResolvedValue(makeMockSupabase({ id: TEST_CAREGIVER.id }, { organization_id: "org-1" }));
    const { GET } = await import("@/app/api/documents/[id]/route");
    const res = await GET(
      new Request("http://localhost/api/documents/doc-1"),
      { params: Promise.resolve({ id: "doc-1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.signedUrl).toContain("signed");
    expect(body.document.id).toBe("doc-1");
    expect(body.document.file_name).toBe("report.pdf");
  });

  it("writes audit_log with action DOWNLOAD", async () => {
    const mock = makeMockSupabase({ id: TEST_CAREGIVER.id }, { organization_id: "org-1" });
    createClient.mockResolvedValue(mock);
    const { GET } = await import("@/app/api/documents/[id]/route");
    await GET(
      new Request("http://localhost/api/documents/doc-1"),
      { params: Promise.resolve({ id: "doc-1" }) }
    );
    expect(mock._auditInsert).toHaveBeenCalledOnce();
    const auditCall = mock._auditInsert.mock.calls[0][0];
    expect(auditCall.action).toBe("DOWNLOAD");
    expect(auditCall.resource_id).toBe("doc-1");
  });
});
