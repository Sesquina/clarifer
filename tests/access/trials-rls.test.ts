/**
 * tests/access/trials-rls.test.ts
 * Vitest suite verifying cross-tenant isolation on the trials save/saved routes.
 * Tables: mocks users, patients, trial_saves; verifies org-scope checks reject cross-tenant access.
 * Auth: exercises authenticated-user paths with mismatched organization_id values.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: No PHI stored in this file. Tests use synthetic ids only.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

function makeSupabase(opts: {
  org: string;
  patientOrg: string;
  role?: string;
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { role: opts.role ?? "caregiver", organization_id: opts.org } }),
        };
      }
      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "patient-1", organization_id: opts.patientOrg, name: "P" } }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
}

describe("RLS / cross-org guards on Sprint 9 routes", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => vi.restoreAllMocks());

  it("1. cross-org trial save is rejected with 403", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ org: "org-A", patientOrg: "org-B" })
    );
    const { POST } = await import("@/app/api/trials/save/route");
    const res = await POST(
      new Request("http://localhost/api/trials/save", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ patient_id: "patient-1", nct_id: "NCT00000001" }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("2. cross-org family-update generation is rejected with 403", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ org: "org-A", patientOrg: "org-B" })
    );
    const { POST } = await import("@/app/api/family-update/generate/route");
    const res = await POST(
      new Request("http://localhost/api/family-update/generate", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ patient_id: "patient-1", language: "en" }),
      })
    );
    expect(res.status).toBe(403);
  });
});
