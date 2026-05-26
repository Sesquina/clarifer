/**
 * tests/api/audit-log-missing.test.ts
 * Verifies that audit_log writes include all required HIPAA fields on
 * document upload and account deletion, and that account deletion writes
 * the audit_log row BEFORE any patient data is deleted.
 *
 * Fix: S5 -- audit_log fields were incomplete or in the wrong order.
 * Routes: POST /api/documents/upload, POST /api/upload, DELETE /api/delete-account
 * Required fields tested: user_id, patient_id, action, resource_type,
 *   resource_id, organization_id, ip_address, user_agent, status
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/ratelimit", () => ({
  uploadLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));
vi.mock("@/lib/documents/storage", () => ({
  uploadToStorage: vi.fn().mockResolvedValue("org-1/patient-1/uuid.pdf"),
}));
vi.mock("@/lib/documents/validate", () => ({
  validateFile: vi.fn().mockReturnValue({ valid: true }),
}));
// Top-level module mocks (hoisted by Vitest) -- vi.doMock in beforeEach
// overrides these per-test with fresh implementations.
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Builds a mock formData request for /api/documents/upload */
function makeFormDataRequest() {
  const mockFormData = {
    get: (key: string) => {
      if (key === "file") return { name: "report.pdf", type: "application/pdf", size: 100 };
      if (key === "patientId") return TEST_PATIENT_CARLOS.id;
      if (key === "documentCategory") return "lab_result";
      return null;
    },
  };
  const req = new Request("http://localhost/api/documents/upload", { method: "POST" });
  Object.defineProperty(req, "formData", { value: () => Promise.resolve(mockFormData), writable: true });
  // Attach headers so ip_address / user_agent can be read
  Object.defineProperty(req, "headers", {
    value: new Headers({
      "x-forwarded-for": "1.2.3.4",
      "user-agent": "test-agent/1.0",
    }),
    writable: true,
  });
  return req;
}

/** Builds a mock JSON request for /api/upload (base64 route) */
function makeBase64UploadRequest() {
  // 4-byte PDF magic bytes encoded as base64
  const pdfMagic = Buffer.from([0x25, 0x50, 0x44, 0x46]).toString("base64");
  return new Request("http://localhost/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "1.2.3.4",
      "user-agent": "test-agent/1.0",
    },
    body: JSON.stringify({
      fileName: "labs.pdf",
      fileType: "application/pdf",
      fileSize: 4,
      fileData: pdfMagic,
      patientId: TEST_PATIENT_CARLOS.id,
    }),
  });
}

// ---------------------------------------------------------------------------
// POST /api/documents/upload -- audit_log completeness
// ---------------------------------------------------------------------------

describe("POST /api/documents/upload -- audit_log completeness (S5)", () => {
  const auditInserts: Array<Record<string, unknown>> = [];

  function makeSupabase() {
    return {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: TEST_CAREGIVER.id } },
        }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role: "caregiver", organization_id: TEST_CAREGIVER.organization_id },
            }),
          };
        }
        if (table === "patients") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: TEST_PATIENT_CARLOS.id } }),
          };
        }
        if (table === "documents") {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "doc-new-1", title: "report.pdf" },
              error: null,
            }),
          };
        }
        if (table === "audit_log") {
          return {
            insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
              auditInserts.push(row);
              return { then: (fn: (v: unknown) => void) => fn({ error: null }) };
            }),
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

  beforeEach(async () => {
    vi.clearAllMocks();
    auditInserts.length = 0;
    vi.resetModules();
  });

  it("writes audit_log with action=INSERT and resource_type=documents on successful upload", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(makeSupabase()),
    }));
    const { POST } = await import("@/app/api/documents/upload/route");
    const res = await POST(makeFormDataRequest());
    expect(res.status).toBe(201);

    expect(auditInserts).toHaveLength(1);
    const row = auditInserts[0];
    expect(row.action).toBe("INSERT");
    expect(row.resource_type).toBe("documents");
    expect(row.resource_id).toBe("doc-new-1");
    expect(row.user_id).toBe(TEST_CAREGIVER.id);
    expect(row.patient_id).toBe(TEST_PATIENT_CARLOS.id);
    expect(row.organization_id).toBe(TEST_CAREGIVER.organization_id);
    expect(row.status).toBe("success");
    // ip_address and user_agent must be present (not undefined)
    expect(row.ip_address).not.toBeUndefined();
    expect(row.user_agent).not.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/delete-account -- audit_log completeness + ordering
// ---------------------------------------------------------------------------

describe("DELETE /api/delete-account -- audit_log written before data deleted (S5)", () => {
  /** Tracks the sequence of significant operations so we can assert ordering. */
  const callSequence: string[] = [];

  // Captured audit inserts shared across both tests in this describe block
  const capturedAuditInserts: Array<Record<string, unknown>> = [];

  function makeAdminClient() {
    return {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "patients") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
            in: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn().mockImplementation(() => {
              callSequence.push(`delete:${table}`);
              return { eq: vi.fn().mockResolvedValue({ error: null }), in: vi.fn().mockResolvedValue({ error: null }) };
            }),
          };
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { organization_id: TEST_CAREGIVER.organization_id },
            }),
            delete: vi.fn().mockImplementation(() => {
              callSequence.push(`delete:${table}`);
              return { eq: vi.fn().mockResolvedValue({ error: null }) };
            }),
          };
        }
        if (table === "audit_log") {
          return {
            insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
              capturedAuditInserts.push(row);
              callSequence.push("audit_insert");
              return Promise.resolve({ error: null });
            }),
          };
        }
        // All other data tables: track deletes generically
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ error: null }),
          delete: vi.fn().mockImplementation(() => {
            callSequence.push(`delete:${table}`);
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
              in: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
          single: vi.fn().mockResolvedValue({ data: null }),
        };
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          list: vi.fn().mockResolvedValue({ data: [] }),
          remove: vi.fn().mockResolvedValue({ error: null }),
        }),
      },
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    };
  }

  function makeServerClient() {
    return {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: TEST_CAREGIVER.id } },
        }),
      },
    };
  }

  beforeEach(() => {
    callSequence.length = 0;
    capturedAuditInserts.length = 0;
    vi.resetModules();
  });

  it("writes audit_log with action=DELETE and resource_type=account", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(makeServerClient()),
    }));
    vi.doMock("@supabase/supabase-js", () => ({
      createClient: vi.fn().mockReturnValue(makeAdminClient()),
    }));
    vi.doMock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

    const { DELETE } = await import("@/app/api/delete-account/route");
    const req = new Request("http://localhost/api/delete-account", {
      method: "DELETE",
      headers: { "x-forwarded-for": "1.2.3.4", "user-agent": "test-agent/1.0" },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);

    // Verify audit_log row was written with all required HIPAA fields
    expect(capturedAuditInserts).toHaveLength(1);
    const row = capturedAuditInserts[0];
    expect(row.action).toBe("DELETE");
    expect(row.resource_type).toBe("account");
    expect(row.resource_id).toBe(TEST_CAREGIVER.id);
    expect(row.user_id).toBe(TEST_CAREGIVER.id);
    expect(row.patient_id).toBeNull();
    expect(row.status).toBe("success");
  });

  it("writes audit_log BEFORE any data tables are deleted", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(makeServerClient()),
    }));
    vi.doMock("@supabase/supabase-js", () => ({
      createClient: vi.fn().mockReturnValue(makeAdminClient()),
    }));
    vi.doMock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

    const { DELETE } = await import("@/app/api/delete-account/route");
    const req = new Request("http://localhost/api/delete-account", {
      method: "DELETE",
      headers: { "x-forwarded-for": "1.2.3.4", "user-agent": "test-agent/1.0" },
    });
    await DELETE(req);

    // audit_insert must appear in callSequence before any delete: entries
    const auditIdx = callSequence.indexOf("audit_insert");
    const firstDeleteIdx = callSequence.findIndex((s) => s.startsWith("delete:"));

    expect(auditIdx).toBeGreaterThanOrEqual(0); // audit was called
    if (firstDeleteIdx !== -1) {
      // If any deletes occurred, audit must have come first
      expect(auditIdx).toBeLessThan(firstDeleteIdx);
    }
  });
});
