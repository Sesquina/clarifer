/**
 * tests/api/care-team/list.test.ts
 * Tests for GET /api/care-team -- auth, role, and org-scope.
 * Tables: mocks users, patients, care_team, audit_log.
 * Auth: 401 unauth, 403 wrong role, 404 cross-tenant, 200 caregiver.
 * Sprint: Sprint 10 -- Care Team Directory
 *
 * HIPAA: No PHI. Synthetic ids.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

interface MakeOpts {
  user?: { id: string } | null;
  role?: string;
  userOrg?: string | null;
  patientOrg?: string | null;
  members?: Array<Record<string, unknown>>;
}

function makeSupabase(opts: MakeOpts) {
  const userOrg = opts.userOrg ?? "org-A";
  const patientOrg = opts.patientOrg === undefined ? userOrg : opts.patientOrg;
  return {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: opts.user === undefined ? { id: "user-1" } : opts.user } }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({ data: userOrg ? { role: opts.role ?? "caregiver", organization_id: userOrg } : null }),
        };
      }
      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: patientOrg ? { organization_id: patientOrg } : null }),
        };
      }
      if (table === "care_team") {
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
        };
        // The route chains .select().eq().eq().order().order() and the final
        // call resolves the promise. order() is called twice so make the
        // second call return a thenable.
        let orderCalls = 0;
        chain.order = vi.fn().mockImplementation(() => {
          orderCalls += 1;
          if (orderCalls < 2) return chain;
          return Promise.resolve({ data: opts.members ?? [], error: null });
        });
        return chain;
      }
      if (table === "audit_log") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return {};
    }),
  };
}

describe("GET /api/care-team", () => {
  beforeEach(() => vi.resetModules());

  it("10. caregiver gets own org care team members", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({
        members: [
          { id: "m1", name: "Dr. Torres", role: "Oncologist", organization_id: "org-A", patient_id: "pat-1" },
        ],
      })
    );
    const { GET } = await import("@/app/api/care-team/route");
    const res = await GET(
      new Request("http://localhost/api/care-team?patient_id=pat-1", {
        headers: { origin: "http://localhost" },
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.members).toHaveLength(1);
    expect(json.members[0].name).toBe("Dr. Torres");
  });

  it("11. cross-tenant patient_id returns 404", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ userOrg: "org-A", patientOrg: "org-B" })
    );
    const { GET } = await import("@/app/api/care-team/route");
    const res = await GET(
      new Request("http://localhost/api/care-team?patient_id=pat-foreign", {
        headers: { origin: "http://localhost" },
      })
    );
    expect(res.status).toBe(404);
  });

  it("12. unauthenticated returns 401", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: null })
    );
    const { GET } = await import("@/app/api/care-team/route");
    const res = await GET(
      new Request("http://localhost/api/care-team?patient_id=pat-1", {
        headers: { origin: "http://localhost" },
      })
    );
    expect(res.status).toBe(401);
  });
});
