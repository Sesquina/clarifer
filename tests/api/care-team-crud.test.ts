/**
 * Sprint 7 — care team create.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

const inserts: Array<Record<string, unknown>> = [];

function makeSupabase(opts: { user?: { id: string } | null; organizationId?: string | null }) {
  const { user = { id: TEST_CAREGIVER.id }, organizationId = "test-org-ccf-demo" } = opts;
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
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
      if (table === "care_relationships") {
        return {
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            inserts.push(row);
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: { id: "cr-1", relationship_type: row.relationship_type } }),
            };
          }),
        };
      }
      if (table === "audit_log") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("POST /api/care-team/create", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    inserts.length = 0;
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("creates care team member → 201", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/care-team/create/route");
    const res = await POST(
      new Request("http://localhost/api/care-team/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: TEST_PATIENT_CARLOS.id,
          name: "Dr. Torres",
          role: "oncologist",
          phone: "+15551234567",
        }),
      })
    );
    expect(res.status).toBe(201);
    expect(inserts[0].relationship_type).toBe("oncologist");
  });

  it("unauthenticated → 401", async () => {
    createClient.mockResolvedValue(makeSupabase({ user: null, organizationId: null }));
    const { POST } = await import("@/app/api/care-team/create/route");
    const res = await POST(
      new Request("http://localhost/api/care-team/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: TEST_PATIENT_CARLOS.id,
          name: "Dr. Torres",
          role: "oncologist",
        }),
      })
    );
    expect(res.status).toBe(401);
  });
});
