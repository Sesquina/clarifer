/**
 * Sprint 7 — POST /api/patients/create
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

const auditInserts: Array<Record<string, unknown>> = [];
const patientInserts: Array<Record<string, unknown>> = [];

function makeSupabase(opts: { user?: { id: string } | null; role?: string; organizationId?: string | null }) {
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
      if (table === "patients") {
        return {
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            patientInserts.push(row);
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "patient-new-1",
                  name: (row.name as string) ?? "",
                  condition_template_id: row.condition_template_id ?? null,
                },
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
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("POST /api/patients/create", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    auditInserts.length = 0;
    patientInserts.length = 0;
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("caregiver creates patient → 201 and row written with org_id", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/patients/create/route");
    const res = await POST(
      new Request("http://localhost/api/patients/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: "Carlos Rivera",
          date_of_birth: "1958-03-14",
          diagnosis: "Cholangiocarcinoma",
          condition_template_id: "cond-1",
        }),
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("patient-new-1");
    expect(patientInserts[0].organization_id).toBe("test-org-ccf-demo");
    expect(auditInserts.some((r) => r.action === "INSERT" && r.resource_type === "patients")).toBe(true);
  });

  it("missing full_name → 400 with warm message", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/patients/create/route");
    const res = await POST(
      new Request("http://localhost/api/patients/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: "  " }),
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(String(body.error)).toMatch(/full name/i);
  });

  it("admin role → 403", async () => {
    createClient.mockResolvedValue(makeSupabase({ role: "admin" }));
    const { POST } = await import("@/app/api/patients/create/route");
    const res = await POST(
      new Request("http://localhost/api/patients/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: "X" }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("unauthenticated → 401", async () => {
    createClient.mockResolvedValue(makeSupabase({ user: null, organizationId: null }));
    const { POST } = await import("@/app/api/patients/create/route");
    const res = await POST(
      new Request("http://localhost/api/patients/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: "X" }),
      })
    );
    expect(res.status).toBe(401);
  });

  // S18 hardening: input validation. Each case must 400 with a warm message
  // BEFORE Postgres is ever asked to insert.
  async function postBody(payload: Record<string, unknown>) {
    createClient.mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/patients/create/route");
    return POST(
      new Request("http://localhost/api/patients/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
  }

  it("name longer than 200 chars → 400", async () => {
    const res = await postBody({ full_name: "x".repeat(201) });
    expect(res.status).toBe(400);
    expect(patientInserts).toHaveLength(0);
  });

  it("malformed dob (not YYYY-MM-DD) → 400", async () => {
    const res = await postBody({ full_name: "Carlos", dob: "March 14 1958" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(String(body.error)).toMatch(/date of birth/i);
    expect(patientInserts).toHaveLength(0);
  });

  it("malformed diagnosis_date → 400", async () => {
    const res = await postBody({ full_name: "Carlos", diagnosis_date: "not-a-date" });
    expect(res.status).toBe(400);
    expect(patientInserts).toHaveLength(0);
  });

  it("sex outside enum → 400", async () => {
    const res = await postBody({ full_name: "Carlos", sex: "yes please" });
    expect(res.status).toBe(400);
    expect(patientInserts).toHaveLength(0);
  });

  it("language_preference outside enum → 400", async () => {
    const res = await postBody({ full_name: "Carlos", language_preference: "klingon" });
    expect(res.status).toBe(400);
    expect(patientInserts).toHaveLength(0);
  });

  it("status outside enum → 400", async () => {
    const res = await postBody({ full_name: "Carlos", status: "pending" });
    expect(res.status).toBe(400);
    expect(patientInserts).toHaveLength(0);
  });

  it("custom_diagnosis longer than 500 chars → 400", async () => {
    const res = await postBody({ full_name: "Carlos", custom_diagnosis: "x".repeat(501) });
    expect(res.status).toBe(400);
    expect(patientInserts).toHaveLength(0);
  });

  it("city longer than 100 chars → 400", async () => {
    const res = await postBody({ full_name: "Carlos", city: "x".repeat(101) });
    expect(res.status).toBe(400);
    expect(patientInserts).toHaveLength(0);
  });

  it("state longer than 100 chars → 400", async () => {
    const res = await postBody({ full_name: "Carlos", state: "x".repeat(101) });
    expect(res.status).toBe(400);
    expect(patientInserts).toHaveLength(0);
  });

  it("valid full onboarding payload (caregiver) → 201 and DB receives normalized fields", async () => {
    const res = await postBody({
      full_name: "Carlos Rivera",
      dob: "1958-03-14",
      diagnosis_date: "2024-06-01",
      sex: "male",
      city: "Cleveland",
      state: "OH",
      custom_diagnosis: "Cholangiocarcinoma",
      language_preference: "en",
      status: "active",
    });
    expect(res.status).toBe(201);
    expect(patientInserts).toHaveLength(1);
    expect(patientInserts[0].sex).toBe("male");
    expect(patientInserts[0].dob).toBe("1958-03-14");
    expect(patientInserts[0].language_preference).toBe("en");
    expect(patientInserts[0].status).toBe("active");
  });
});
