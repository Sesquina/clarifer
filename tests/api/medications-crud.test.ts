/**
 * Sprint 7 — medications CRUD.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

const medInserts: Array<Record<string, unknown>> = [];
const medUpdates: Array<Record<string, unknown>> = [];
const auditInserts: Array<Record<string, unknown>> = [];

function makeSupabase(opts: {
  organizationId?: string | null;
  existingMed?: Record<string, unknown> | null;
  activeMeds?: Array<Record<string, unknown>>;
}) {
  const {
    organizationId = "test-org-ccf-demo",
    existingMed = { id: "med-1", patient_id: TEST_PATIENT_CARLOS.id, organization_id: "test-org-ccf-demo" },
    activeMeds = [{ id: "med-1", name: "Gemcitabine", is_active: true }],
  } = opts;
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
      if (table === "medications") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: activeMeds }),
          single: vi.fn().mockResolvedValue({ data: existingMed }),
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            medInserts.push(row);
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: { id: "med-new-1", name: row.name }, error: null }),
            };
          }),
          update: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            medUpdates.push(row);
            return {
              eq: vi.fn().mockReturnThis(),
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
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("Medications CRUD", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    medInserts.length = 0;
    medUpdates.length = 0;
    auditInserts.length = 0;
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("POST /create → 201 with org_id", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/medications/create/route");
    const res = await POST(
      new Request("http://localhost/api/medications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: TEST_PATIENT_CARLOS.id,
          drug_name: "Gemcitabine",
          dosage: "1000",
          dosage_unit: "mg",
          frequency: "Once daily",
        }),
      })
    );
    expect(res.status).toBe(201);
    expect(medInserts[0].organization_id).toBe("test-org-ccf-demo");
  });

  it("GET list returns active only", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { GET } = await import("@/app/api/medications/[patientId]/route");
    const res = await GET(
      new Request("http://localhost/api/medications/patient-1"),
      { params: Promise.resolve({ patientId: "patient-1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.medications)).toBe(true);
  });

  it("PATCH /update dosage → 200", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { PATCH } = await import("@/app/api/medications/[id]/update/route");
    const res = await PATCH(
      new Request("http://localhost/api/medications/med-1/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dose: "500" }),
      }),
      { params: Promise.resolve({ id: "med-1" }) }
    );
    expect(res.status).toBe(200);
    expect(medUpdates[0].dose).toBe("500");
  });

  it("cross-tenant update → 404", async () => {
    createClient.mockResolvedValue(makeSupabase({ existingMed: null }));
    const { PATCH } = await import("@/app/api/medications/[id]/update/route");
    const res = await PATCH(
      new Request("http://localhost/api/medications/other-med/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dose: "500" }),
      }),
      { params: Promise.resolve({ id: "other-med" }) }
    );
    expect(res.status).toBe(404);
  });
});
