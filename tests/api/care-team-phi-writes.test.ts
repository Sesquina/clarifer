/**
 * care-team-phi-writes.test.ts
 * Verifies that POST /api/care-team and DELETE /api/care-team/[id] enforce
 * auth, role, org_id scoping, and audit_log on every write.
 *
 * Fix: S2 -- client-side PHI writes on care_team table moved server-side.
 * Tables: care_team (write), audit_log (write), users (read), patients (read)
 * Auth: caregiver / admin for writes
 * HIPAA: audit_log asserted on every write in these tests.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

// ---------------------------------------------------------------------------
// POST /api/care-team
// ---------------------------------------------------------------------------

describe("POST /api/care-team -- auth + audit", () => {
  const auditInserts: unknown[] = [];
  const careTeamInserts: unknown[] = [];

  function makeSupabase(opts: {
    user?: { id: string } | null;
    role?: string;
    orgId?: string | null;
    patientOrgId?: string;
  }) {
    const {
      user = { id: TEST_CAREGIVER.id },
      role = "caregiver",
      orgId = "test-org-1",
      patientOrgId = "test-org-1",
    } = opts;

    return {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: user ? { role, organization_id: orgId } : null,
            }),
          };
        }
        if (table === "patients") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { organization_id: patientOrgId },
            }),
          };
        }
        if (table === "care_team") {
          return {
            insert: vi.fn().mockImplementation((row: unknown) => {
              careTeamInserts.push(row);
              return {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { id: "ct-1", ...(row as object) },
                  error: null,
                }),
              };
            }),
          };
        }
        if (table === "audit_log") {
          return {
            insert: vi.fn().mockImplementation((row: unknown) => {
              auditInserts.push(row);
              return Promise.resolve({ error: null });
            }),
          };
        }
        return {};
      }),
    };
  }

  beforeEach(() => {
    auditInserts.length = 0;
    careTeamInserts.length = 0;
    vi.resetModules();
  });

  it("returns 401 when no session", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(makeSupabase({ user: null })),
    }));
    const { POST } = await import("@/app/api/care-team/route");
    const req = new Request("https://clarifer.com/api/care-team", {
      method: "POST",
      body: JSON.stringify({ patient_id: TEST_PATIENT_CARLOS.id, name: "Dr. Kim" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(careTeamInserts).toHaveLength(0);
  });

  it("returns 403 when role is provider (read-only)", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(makeSupabase({ role: "provider" })),
    }));
    const { POST } = await import("@/app/api/care-team/route");
    const req = new Request("https://clarifer.com/api/care-team", {
      method: "POST",
      body: JSON.stringify({ patient_id: TEST_PATIENT_CARLOS.id, name: "Dr. Kim" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(careTeamInserts).toHaveLength(0);
  });

  it("returns 404 when patient belongs to a different org (cross-tenant block)", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(
        makeSupabase({ orgId: "org-a", patientOrgId: "org-b" })
      ),
    }));
    const { POST } = await import("@/app/api/care-team/route");
    const req = new Request("https://clarifer.com/api/care-team", {
      method: "POST",
      body: JSON.stringify({ patient_id: TEST_PATIENT_CARLOS.id, name: "Dr. Kim" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
    expect(careTeamInserts).toHaveLength(0);
  });

  it("inserts org-scoped row and writes audit_log on valid caregiver request", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(makeSupabase({})),
    }));
    const { POST } = await import("@/app/api/care-team/route");
    const req = new Request("https://clarifer.com/api/care-team", {
      method: "POST",
      body: JSON.stringify({
        patient_id: TEST_PATIENT_CARLOS.id,
        name: "Dr. Kim",
        role: "Doctor",
        phone: "555-0100",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    // care_team row was inserted with correct org_id
    expect(careTeamInserts).toHaveLength(1);
    expect((careTeamInserts[0] as Record<string, unknown>).organization_id).toBe("test-org-1");
    // audit_log was written
    expect(auditInserts).toHaveLength(1);
    expect((auditInserts[0] as Record<string, unknown>).action).toBe("INSERT");
    expect((auditInserts[0] as Record<string, unknown>).resource_type).toBe("care_team");
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/care-team/[id]
// ---------------------------------------------------------------------------

describe("DELETE /api/care-team/[id] -- auth + audit", () => {
  const auditInserts: unknown[] = [];
  const careTeamDeletes: unknown[] = [];

  function makeDeleteSupabase(opts: {
    user?: { id: string } | null;
    role?: string;
    orgId?: string | null;
    memberOrgId?: string;
  }) {
    const {
      user = { id: TEST_CAREGIVER.id },
      role = "caregiver",
      orgId = "test-org-1",
      memberOrgId = "test-org-1",
    } = opts;

    return {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: user ? { role, organization_id: orgId } : null,
            }),
          };
        }
        if (table === "care_team") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data:
                orgId === memberOrgId
                  ? { id: "ct-1", patient_id: TEST_PATIENT_CARLOS.id, organization_id: memberOrgId }
                  : null,
            }),
            delete: vi.fn().mockImplementation(() => {
              careTeamDeletes.push("deleted");
              return {
                eq: vi.fn().mockReturnThis(),
                then: vi.fn(),
              };
            }),
          };
        }
        if (table === "audit_log") {
          return {
            insert: vi.fn().mockImplementation((row: unknown) => {
              auditInserts.push(row);
              return { then: vi.fn() };
            }),
          };
        }
        return {};
      }),
    };
  }

  beforeEach(() => {
    auditInserts.length = 0;
    careTeamDeletes.length = 0;
    vi.resetModules();
  });

  it("returns 401 when no session", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(makeDeleteSupabase({ user: null })),
    }));
    const { DELETE } = await import("@/app/api/care-team/[id]/route");
    const req = new Request("https://clarifer.com/api/care-team/ct-1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "ct-1" }) });
    expect(res.status).toBe(401);
    expect(careTeamDeletes).toHaveLength(0);
  });

  it("returns 403 when role is patient", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(makeDeleteSupabase({ role: "patient" })),
    }));
    const { DELETE } = await import("@/app/api/care-team/[id]/route");
    const req = new Request("https://clarifer.com/api/care-team/ct-1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "ct-1" }) });
    expect(res.status).toBe(403);
    expect(careTeamDeletes).toHaveLength(0);
  });

  it("returns 404 when member belongs to different org", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(
        makeDeleteSupabase({ orgId: "org-a", memberOrgId: "org-b" })
      ),
    }));
    const { DELETE } = await import("@/app/api/care-team/[id]/route");
    const req = new Request("https://clarifer.com/api/care-team/ct-1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "ct-1" }) });
    expect(res.status).toBe(404);
    expect(careTeamDeletes).toHaveLength(0);
  });

  it("deletes member and writes audit_log on valid caregiver request", async () => {
    const supabaseMock = makeDeleteSupabase({});
    // Override care_team mock to properly chain delete().eq().eq()
    const deleteChain = { eq: vi.fn().mockReturnThis(), error: null };
    (supabaseMock.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: "caregiver", organization_id: "test-org-1" },
          }),
        };
      }
      if (table === "care_team") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: "ct-1", patient_id: TEST_PATIENT_CARLOS.id, organization_id: "test-org-1" },
          }),
          delete: vi.fn().mockReturnValue(deleteChain),
        };
      }
      if (table === "audit_log") {
        return {
          insert: vi.fn().mockImplementation((row: unknown) => {
            auditInserts.push(row);
            return { then: (fn: (v: unknown) => void) => fn({ error: null }) };
          }),
        };
      }
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(supabaseMock),
    }));
    const { DELETE } = await import("@/app/api/care-team/[id]/route");
    const req = new Request("https://clarifer.com/api/care-team/ct-1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "ct-1" }) });
    expect(res.status).toBe(200);
    // audit_log was written with DELETE action
    expect(auditInserts.length).toBeGreaterThan(0);
    const auditRow = auditInserts[0] as Record<string, unknown>;
    expect(auditRow.action).toBe("DELETE");
    expect(auditRow.resource_type).toBe("care_team");
    expect(auditRow.resource_id).toBe("ct-1");
  });
});
