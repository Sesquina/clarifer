/**
 * Tests for POST /api/documents/upload (Sprint 5)
 * Uses mocked request.formData() to avoid jsdom/undici File type incompatibility.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/documents/storage", () => ({
  uploadToStorage: vi.fn().mockResolvedValue("org-1/patient-1/uuid.pdf"),
}));

function makeMockFile(overrides: Partial<{ name: string; type: string; size: number }> = {}) {
  return {
    name: overrides.name ?? "report.pdf",
    type: overrides.type ?? "application/pdf",
    size: overrides.size ?? 100,
  };
}

function makeRequest(file: unknown | null, patientId: string | null, category = "other") {
  const mockFormData = {
    get: (key: string) => {
      if (key === "file") return file;
      if (key === "patientId") return patientId;
      if (key === "documentCategory") return category;
      return null;
    },
  };
  const req = new Request("http://localhost/api/documents/upload", { method: "POST" });
  Object.defineProperty(req, "formData", { value: () => Promise.resolve(mockFormData), writable: true });
  return req;
}

function makeMockSupabase(userOverride: unknown, roleOverride: unknown, patientOverride: unknown = { id: TEST_PATIENT_CARLOS.id }) {
  const auditInsert = vi.fn().mockResolvedValue({ error: null });
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: userOverride } }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: roleOverride }) };
      }
      if (table === "patients") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: patientOverride }) };
      }
      if (table === "documents") {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "doc-new", title: "report.pdf" }, error: null }),
        };
      }
      if (table === "audit_log") return { insert: auditInsert };
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    }),
    _auditInsert: auditInsert,
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("POST /api/documents/upload", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("returns 401 when unauthenticated", async () => {
    createClient.mockResolvedValue(makeMockSupabase(null, null));
    const { POST } = await import("@/app/api/documents/upload/route");
    const res = await POST(makeRequest(makeMockFile(), TEST_PATIENT_CARLOS.id));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user has no organization", async () => {
    createClient.mockResolvedValue(makeMockSupabase({ id: "user-1" }, { role: "caregiver", organization_id: null }));
    const { POST } = await import("@/app/api/documents/upload/route");
    const res = await POST(makeRequest(makeMockFile(), TEST_PATIENT_CARLOS.id));
    expect(res.status).toBe(403);
  });

  it("returns 400 when no file provided", async () => {
    createClient.mockResolvedValue(makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "org-1" }));
    const { POST } = await import("@/app/api/documents/upload/route");
    const res = await POST(makeRequest(null, TEST_PATIENT_CARLOS.id));
    expect(res.status).toBe(400);
  });

  it("returns 400 when file type is not allowed", async () => {
    createClient.mockResolvedValue(makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "org-1" }));
    const { POST } = await import("@/app/api/documents/upload/route");
    const res = await POST(makeRequest(makeMockFile({ name: "virus.exe", type: "application/x-msdownload" }), TEST_PATIENT_CARLOS.id));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/not allowed/i);
  });

  it("returns 201 with document id on successful upload", async () => {
    createClient.mockResolvedValue(makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "org-1" }));
    const { POST } = await import("@/app/api/documents/upload/route");
    const res = await POST(makeRequest(makeMockFile(), TEST_PATIENT_CARLOS.id));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("doc-new");
    expect(body.title).toBe("report.pdf");
  });

  it("writes audit_log on successful upload", async () => {
    const mock = makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "org-1" });
    createClient.mockResolvedValue(mock);
    const { POST } = await import("@/app/api/documents/upload/route");
    await POST(makeRequest(makeMockFile(), TEST_PATIENT_CARLOS.id));
    expect(mock._auditInsert).toHaveBeenCalledOnce();
    const auditCall = mock._auditInsert.mock.calls[0][0];
    expect(auditCall.action).toBe("UPLOAD_DOCUMENT");
  });
});
