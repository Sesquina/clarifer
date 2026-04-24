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
});
