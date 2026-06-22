/**
 * tests/api/documents-minio.test.ts
 * Unit tests for MinIO storage layer and document upload route auth/validation gates.
 * Tables: None (all Supabase calls mocked)
 * Auth: Mocked via @/lib/auth/get-user
 * HIPAA: No PHI in this file.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER } from "../fixtures/users";

// ── MinIO mock ────────────────────────────────────────────────────────────────
const putObjectMock = vi.fn().mockResolvedValue(undefined);
const presignedGetObjectMock = vi.fn().mockResolvedValue(
  "https://minio.clarifer.com/clarifer-documents/org/patient/test.pdf?X-Amz-Signature=abc"
);
const removeObjectMock = vi.fn().mockResolvedValue(undefined);

vi.mock("minio", () => ({
  Client: vi.fn().mockImplementation(() => ({
    putObject: putObjectMock,
    presignedGetObject: presignedGetObjectMock,
    removeObject: removeObjectMock,
  })),
}));

// ── Route-level mocks ─────────────────────────────────────────────────────────
vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/documents/validate", () => ({
  validateFile: vi.fn().mockReturnValue({ valid: true }),
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("unpdf", () => ({
  extractText: vi.fn().mockResolvedValue({ text: ["extracted text"] }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth/get-user", () => ({
  getUserFromRequest: vi.fn().mockResolvedValue({
    id: TEST_CAREGIVER.id,
    email: TEST_CAREGIVER.email,
    role: TEST_CAREGIVER.role,
    organization_id: TEST_CAREGIVER.organization_id,
    is_demo: false,
    auth_method: "supabase_legacy",
  }),
}));

const auditInserts: Array<Record<string, unknown>> = [];

function makeSupabase() {
  return {
    auth: { getUser: vi.fn() },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "patient-123" } }),
        };
      }
      if (table === "documents") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "doc-abc", title: "test.pdf" },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === "audit_log") {
        return {
          insert: vi.fn().mockImplementation(
            (row: Record<string, unknown>) => {
              auditInserts.push(row);
              return Promise.resolve({ error: null });
            }
          ),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      };
    }),
  };
}

// ── Storage layer tests ───────────────────────────────────────────────────────
describe("MinIO storage layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditInserts.length = 0;
    process.env.MINIO_ENDPOINT = "minio.clarifer.com";
    process.env.MINIO_ACCESS_KEY = "test-access-key";
    process.env.MINIO_SECRET_KEY = "test-secret-key";
    process.env.MINIO_BUCKET = "clarifer-documents";
  });

  it("1. uploadToStorage returns path matching [uuid].ext pattern", async () => {
    const { uploadToStorage } = await import("@/lib/documents/storage");
    const file = new File(["content"], "report.pdf", { type: "application/pdf" });
    const result = await uploadToStorage(file, "org-1", "patient-1");
    expect(result).toMatch(/^org-1\/patient-1\/[0-9a-f-]{36}\.pdf$/);
  });

  it("2. uploadToStorage calls putObject with MINIO_BUCKET", async () => {
    const { uploadToStorage } = await import("@/lib/documents/storage");
    const { MINIO_BUCKET } = await import("@/lib/documents/minio-client");
    const file = new File(["content"], "labs.pdf", { type: "application/pdf" });
    await uploadToStorage(file, "org-1", "patient-1");
    expect(putObjectMock).toHaveBeenCalledWith(
      MINIO_BUCKET,
      expect.stringMatching(/^org-1\/patient-1\//),
      expect.anything(),
      expect.any(Number),
      expect.objectContaining({ "Content-Type": "application/pdf" })
    );
  });

  it("3. generateSignedUrl returns string starting with https://", async () => {
    const { generateSignedUrl } = await import("@/lib/documents/storage");
    const url = await generateSignedUrl("org-1/patient-1/test-uuid.pdf");
    expect(url).toMatch(/^https:\/\//);
  });

  it("4. generateSignedUrl calls presignedGetObject with MINIO_BUCKET", async () => {
    const { generateSignedUrl } = await import("@/lib/documents/storage");
    const { MINIO_BUCKET } = await import("@/lib/documents/minio-client");
    await generateSignedUrl("org-1/patient-1/test-uuid.pdf");
    expect(presignedGetObjectMock).toHaveBeenCalledWith(
      MINIO_BUCKET,
      "org-1/patient-1/test-uuid.pdf",
      3600
    );
  });

  it("5. deleteFromStorage calls removeObject with correct args", async () => {
    const { deleteFromStorage } = await import("@/lib/documents/storage");
    const { MINIO_BUCKET } = await import("@/lib/documents/minio-client");
    await deleteFromStorage("org-1/patient-1/test-uuid.pdf");
    expect(removeObjectMock).toHaveBeenCalledWith(
      MINIO_BUCKET,
      "org-1/patient-1/test-uuid.pdf"
    );
  });

  it("6. getMinioClient throws when MINIO_ENDPOINT is missing", async () => {
    vi.resetModules();
    const savedEndpoint = process.env.MINIO_ENDPOINT;
    delete process.env.MINIO_ENDPOINT;
    const { getMinioClient } = await import("@/lib/documents/minio-client");
    expect(() => getMinioClient()).toThrow(
      "[minio] Missing env vars: MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY"
    );
    process.env.MINIO_ENDPOINT = savedEndpoint;
  });
});

// ── Upload route auth/validation tests ───────────────────────────────────────
describe("POST /api/documents/upload", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    auditInserts.length = 0;
    process.env.MINIO_ENDPOINT = "minio.clarifer.com";
    process.env.MINIO_ACCESS_KEY = "test-access-key";
    process.env.MINIO_SECRET_KEY = "test-secret-key";
    process.env.MINIO_BUCKET = "clarifer-documents";
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("7. returns 401 when getUserFromRequest returns null", async () => {
    const { getUserFromRequest } = await import("@/lib/auth/get-user");
    (getUserFromRequest as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    createClient.mockResolvedValue(makeSupabase());
    const { POST } = await import("@/app/api/documents/upload/route");
    const formData = new FormData();
    formData.append("file", new File(["data"], "test.pdf", { type: "application/pdf" }));
    formData.append("patientId", "patient-123");
    const req = new Request("http://localhost/api/documents/upload", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("8. returns 400 when file is missing from form data", async () => {
    createClient.mockResolvedValue(makeSupabase());
    const { POST } = await import("@/app/api/documents/upload/route");
    const formData = new FormData();
    formData.append("patientId", "patient-123");
    const req = new Request("http://localhost/api/documents/upload", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
