/**
 * Sprint 7 — GET /api/patients/[id]
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

const auditInserts: Array<Record<string, unknown>> = [];

function makeSupabase(opts: {
  patientFound?: boolean;
  organizationId?: string | null;
}) {
  const { patientFound = true, organizationId = "test-org-ccf-demo" } = opts;
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
          single: vi.fn().mockResolvedValue({
            data: patientFound ? TEST_PATIENT_CARLOS : null,
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
      // Documents / symptoms / medications / appointments / care_relationships
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [] }),
      };
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("GET /api/patients/[id]", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    auditInserts.length = 0;
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("returns all 6 dashboard sections", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { GET } = await import("@/app/api/patients/[id]/route");
    const res = await GET(
      new Request("http://localhost/api/patients/p1"),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("patient");
    expect(body).toHaveProperty("documents");
    expect(body).toHaveProperty("symptoms");
    expect(body).toHaveProperty("medications");
    expect(body).toHaveProperty("appointments");
    expect(body).toHaveProperty("care_team");
  });

  it("cross-tenant patient → 404", async () => {
    createClient.mockResolvedValue(makeSupabase({ patientFound: false }));
    const { GET } = await import("@/app/api/patients/[id]/route");
    const res = await GET(
      new Request("http://localhost/api/patients/other"),
      { params: Promise.resolve({ id: "other" }) }
    );
    expect(res.status).toBe(404);
  });

  it("writes audit_log on SELECT", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { GET } = await import("@/app/api/patients/[id]/route");
    await GET(
      new Request("http://localhost/api/patients/p1"),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(
      auditInserts.some((r) => r.action === "SELECT" && r.resource_type === "patients")
    ).toBe(true);
  });
});
