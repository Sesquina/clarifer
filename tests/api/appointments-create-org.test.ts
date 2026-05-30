/**
 * tests/api/appointments-create-org.test.ts
 * S21 deliverable -- verify POST /api/appointments stamps the
 * caller's organization_id on insert, never trusts the body, and
 * writes audit_log on success. Mirrors the mock pattern used by
 * tests/api/appointments-detail.test.ts.
 * Tables: mocks users, patients, appointments, audit_log.
 * Auth: caregiver fixture from tests/fixtures/users.ts.
 * Sprint: S21 -- appointments org_id correctness.
 *
 * HIPAA: synthetic ids only; no real PHI. Confirms the cross-tenant
 * write barrier (rule 6 -- org_id filter on every patient-data API).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const CALLER_ORG = TEST_CAREGIVER.organization_id; // "test-org-ccf-demo"
const OTHER_ORG = "test-org-other";

type InsertRow = Record<string, unknown>;

function makeSupabase(opts: {
  callerRole?: string;
  callerOrg?: string;
  patientOrg?: string;
  patientExists?: boolean;
  inserts: InsertRow[];
  auditInserts: InsertRow[];
}) {
  const {
    callerRole = "caregiver",
    callerOrg = CALLER_ORG,
    patientOrg = CALLER_ORG,
    patientExists = true,
    inserts,
    auditInserts,
  } = opts;

  return {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: TEST_CAREGIVER.id } }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({ data: { role: callerRole, organization_id: callerOrg } }),
        };
      }
      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: patientExists
              ? { organization_id: patientOrg, condition_template_id: "cholangiocarcinoma" }
              : null,
          }),
        };
      }
      if (table === "appointments") {
        return {
          insert: vi.fn().mockImplementation((row: InsertRow) => {
            inserts.push(row);
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...row, id: "new-appt-1" },
                  error: null,
                }),
              }),
            };
          }),
        };
      }
      if (table === "audit_log") {
        return {
          insert: vi.fn().mockImplementation((row: InsertRow) => {
            auditInserts.push(row);
            // route uses .then(success, fail) -- give it a thenable
            return Promise.resolve({ error: null });
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

describe("POST /api/appointments -- org_id correctness (S21)", () => {
  let createClient: ReturnType<typeof vi.fn>;
  let inserts: InsertRow[];
  let auditInserts: InsertRow[];

  beforeEach(async () => {
    vi.clearAllMocks();
    inserts = [];
    auditInserts = [];
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("stamps the caller's organization_id on insert", async () => {
    createClient.mockResolvedValue(
      makeSupabase({ inserts, auditInserts })
    );
    const { POST } = await import("@/app/api/appointments/route");
    const res = await POST(
      new Request("http://localhost/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: TEST_PATIENT_CARLOS.id,
          title: "Oncology follow-up",
          datetime: "2026-06-10T15:00:00Z",
        }),
      })
    );
    expect(res.status).toBe(201);
    expect(inserts).toHaveLength(1);
    expect(inserts[0].organization_id).toBe(CALLER_ORG);
    expect(inserts[0].patient_id).toBe(TEST_PATIENT_CARLOS.id);
    expect(inserts[0].created_by).toBe(TEST_CAREGIVER.id);
  });

  it("ignores any organization_id supplied in the request body", async () => {
    createClient.mockResolvedValue(
      makeSupabase({ inserts, auditInserts })
    );
    const { POST } = await import("@/app/api/appointments/route");
    const res = await POST(
      new Request("http://localhost/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: TEST_PATIENT_CARLOS.id,
          title: "Spoofed org attempt",
          organization_id: OTHER_ORG, // attacker tries to write into another tenant
        }),
      })
    );
    expect(res.status).toBe(201);
    expect(inserts[0].organization_id).toBe(CALLER_ORG);
    expect(inserts[0].organization_id).not.toBe(OTHER_ORG);
  });

  it("returns 404 when the patient belongs to another organization", async () => {
    createClient.mockResolvedValue(
      makeSupabase({ inserts, auditInserts, patientOrg: OTHER_ORG })
    );
    const { POST } = await import("@/app/api/appointments/route");
    const res = await POST(
      new Request("http://localhost/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: TEST_PATIENT_CARLOS.id,
          title: "Cross-tenant attempt",
        }),
      })
    );
    // Cross-tenant returns 404 to avoid leaking tenant existence
    expect(res.status).toBe(404);
    expect(inserts).toHaveLength(0);
  });

  it("writes an audit_log INSERT row scoped to the caller's organization", async () => {
    createClient.mockResolvedValue(
      makeSupabase({ inserts, auditInserts })
    );
    const { POST } = await import("@/app/api/appointments/route");
    const res = await POST(
      new Request("http://localhost/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-agent": "vitest-suite",
          "x-forwarded-for": "10.0.0.1",
        },
        body: JSON.stringify({
          patient_id: TEST_PATIENT_CARLOS.id,
          title: "Audit-checked visit",
        }),
      })
    );
    expect(res.status).toBe(201);
    expect(auditInserts).toHaveLength(1);
    const audit = auditInserts[0];
    expect(audit.action).toBe("INSERT");
    expect(audit.resource_type).toBe("appointments");
    expect(audit.organization_id).toBe(CALLER_ORG);
    expect(audit.user_id).toBe(TEST_CAREGIVER.id);
    expect(audit.patient_id).toBe(TEST_PATIENT_CARLOS.id);
  });

  it("rejects a patient-role caller with 403 (write role gate)", async () => {
    createClient.mockResolvedValue(
      makeSupabase({ inserts, auditInserts, callerRole: "patient" })
    );
    const { POST } = await import("@/app/api/appointments/route");
    const res = await POST(
      new Request("http://localhost/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: TEST_PATIENT_CARLOS.id,
          title: "Patient self-write attempt",
        }),
      })
    );
    expect(res.status).toBe(403);
    expect(inserts).toHaveLength(0);
  });
});
