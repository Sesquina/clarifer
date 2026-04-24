/**
 * Sprint 8 — biomarkers API (POST create, GET list, cross-tenant → 404).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

const biomarkerInserts: Array<Record<string, unknown>> = [];
const auditInserts: Array<Record<string, unknown>> = [];

function makeSupabase(opts: {
  organizationId?: string | null;
  patientFound?: boolean;
  rows?: Array<Record<string, unknown>>;
}) {
  const { organizationId = "test-org-ccf-demo", patientFound = true, rows = [{ id: "bm-1", biomarker_type: "FGFR2 fusion", status: "positive" }] } = opts;
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: TEST_CAREGIVER.id } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: organizationId ? { role: "caregiver", organization_id: organizationId } : null,
          }),
        };
      }
      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: patientFound ? { id: TEST_PATIENT_CARLOS.id } : null,
          }),
          single: vi.fn().mockResolvedValue({
            data: patientFound ? { id: TEST_PATIENT_CARLOS.id } : null,
          }),
        };
      }
      if (table === "biomarkers") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: rows, error: null }),
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            biomarkerInserts.push(row);
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: "bm-new", biomarker_type: row.biomarker_type, status: row.status },
                error: null,
              }),
            };
          }),
        };
      }
      if (table === "audit_log") {
        return {
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            auditInserts.push(row);
            return Promise.resolve({ error: null });
          }),
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("biomarkers API", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    biomarkerInserts.length = 0;
    auditInserts.length = 0;
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("POST → 201 with org_id set", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/biomarkers/route");
    const res = await POST(
      new Request("http://localhost/api/biomarkers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: TEST_PATIENT_CARLOS.id,
          biomarker_type: "FGFR2 fusion",
          status: "positive",
          value: "FGFR2-BICC1",
        }),
      })
    );
    expect(res.status).toBe(201);
    expect(biomarkerInserts[0].organization_id).toBe("test-org-ccf-demo");
  });

  it("GET by patient_id → returns biomarkers", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { GET } = await import("@/app/api/biomarkers/route");
    const res = await GET(
      new Request(`http://localhost/api/biomarkers?patient_id=${TEST_PATIENT_CARLOS.id}`)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.biomarkers)).toBe(true);
    expect(body.biomarkers.length).toBe(1);
  });

  it("cross-tenant POST → 404", async () => {
    createClient.mockResolvedValue(makeSupabase({ patientFound: false }));
    const { POST } = await import("@/app/api/biomarkers/route");
    const res = await POST(
      new Request("http://localhost/api/biomarkers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: "not-mine",
          biomarker_type: "FGFR2 fusion",
          status: "positive",
        }),
      })
    );
    expect(res.status).toBe(404);
  });
});
