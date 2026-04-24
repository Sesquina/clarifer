/**
 * Sprint 8 — GET /api/patients/[id]/emergency-card
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

function makeSupabase(opts: {
  authed?: boolean;
  organizationId?: string | null;
  patientFound?: boolean;
}) {
  const { authed = true, organizationId = "test-org-ccf-demo", patientFound = true } = opts;
  return {
    auth: { getUser: vi.fn().mockResolvedValue({
      data: { user: authed ? { id: TEST_CAREGIVER.id } : null }, error: null,
    })},
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
            data: patientFound ? {
              ...TEST_PATIENT_CARLOS,
              dob: "1962-03-15",
              sex: "male",
              blood_type: "O+",
              allergies: ["penicillin"],
              emergency_contact_name: "Maria Rivera",
              emergency_contact_phone: "(555) 111-2233",
              emergency_notes: "FGFR2 positive",
              dpd_deficiency_screened: false,
              dpd_deficiency_status: "unknown",
            } : null,
          }),
        };
      }
      if (table === "audit_log") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      // medications / biomarkers chain: select().eq().eq().eq() — thenable.
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
          resolve({ data: [], error: null }),
      };
      return chain;
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("GET /api/patients/[id]/emergency-card", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("returns patient + meds + biomarkers with offline cache headers", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { GET } = await import("@/app/api/patients/[id]/emergency-card/route");
    const res = await GET(
      new Request("http://localhost/api/patients/p1/emergency-card"),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("max-age=300");
    const body = await res.json();
    expect(body.patient).toHaveProperty("blood_type");
    expect(body.medications).toBeDefined();
    expect(body.biomarkers).toBeDefined();
  });

  it("unauthenticated → 401", async () => {
    createClient.mockResolvedValue(makeSupabase({ authed: false }));
    const { GET } = await import("@/app/api/patients/[id]/emergency-card/route");
    const res = await GET(
      new Request("http://localhost/api/patients/p1/emergency-card"),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(401);
  });

  it("cross-tenant patient → 404", async () => {
    createClient.mockResolvedValue(makeSupabase({ patientFound: false }));
    const { GET } = await import("@/app/api/patients/[id]/emergency-card/route");
    const res = await GET(
      new Request("http://localhost/api/patients/other/emergency-card"),
      { params: Promise.resolve({ id: "other" }) }
    );
    expect(res.status).toBe(404);
  });
});
