/**
 * tests/api/care-team/crud.test.ts
 * Tests for POST /api/care-team and PATCH/DELETE /api/care-team/[id].
 * Tables: mocks users, patients, care_team, audit_log.
 * Auth: 403 for patient role on create; PATCH allowlist; DELETE removes row.
 * Sprint: Sprint 10 -- Care Team Directory
 *
 * HIPAA: No PHI. Synthetic ids.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

interface State {
  inserts: Array<Record<string, unknown>>;
  audits: Array<Record<string, unknown>>;
  updates: Array<{ values: Record<string, unknown>; id: string }>;
  deletes: string[];
  existingRow: Record<string, unknown> | null;
}

function makeSupabase(opts: {
  user?: { id: string } | null;
  role?: string;
  userOrg?: string | null;
  patientOrg?: string | null;
  state: State;
}) {
  const userOrg = opts.userOrg ?? "org-A";
  const patientOrg = opts.patientOrg === undefined ? userOrg : opts.patientOrg;
  return {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: opts.user === undefined ? { id: "u1" } : opts.user } }),
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
        const chain: Record<string, ReturnType<typeof vi.fn>> = {};
        let pendingId: string | null = null;
        let mode: "select" | "update" | "delete" | null = null;
        let pendingUpdate: Record<string, unknown> | null = null;
        chain.select = vi.fn().mockReturnValue({
          ...chain,
          eq: vi.fn().mockImplementation((col: string, val: string) => {
            if (col === "id") pendingId = val;
            return {
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: opts.state.existingRow }),
              }),
              single: vi.fn().mockResolvedValue({ data: opts.state.existingRow }),
            };
          }),
        });
        chain.insert = vi.fn().mockImplementation((row: Record<string, unknown>) => {
          opts.state.inserts.push(row);
          return {
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { ...row, id: "ct-new-1" }, error: null }),
            }),
          };
        });
        chain.update = vi.fn().mockImplementation((values: Record<string, unknown>) => {
          mode = "update";
          pendingUpdate = values;
          return {
            eq: vi.fn().mockImplementation((col: string, val: string) => {
              if (col === "id") pendingId = val;
              return {
                eq: vi.fn().mockImplementation(() => {
                  if (mode === "update" && pendingUpdate && pendingId) {
                    opts.state.updates.push({ id: pendingId, values: pendingUpdate });
                  }
                  return Promise.resolve({ error: null });
                }),
              };
            }),
          };
        });
        chain.delete = vi.fn().mockImplementation(() => {
          mode = "delete";
          return {
            eq: vi.fn().mockImplementation((col: string, val: string) => {
              if (col === "id") pendingId = val;
              return {
                eq: vi.fn().mockImplementation(() => {
                  if (pendingId) opts.state.deletes.push(pendingId);
                  return Promise.resolve({ error: null });
                }),
              };
            }),
          };
        });
        return chain;
      }
      if (table === "audit_log") {
        return {
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            opts.state.audits.push(row);
            return Promise.resolve({ error: null });
          }),
        };
      }
      return {};
    }),
  };
}

function freshState(): State {
  return { inserts: [], audits: [], updates: [], deletes: [], existingRow: null };
}

describe("POST /api/care-team (create)", () => {
  beforeEach(() => vi.resetModules());

  it("13. caregiver POST creates member and writes audit_log", async () => {
    const state = freshState();
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "caregiver", state })
    );
    const { POST } = await import("@/app/api/care-team/route");
    const res = await POST(
      new Request("http://localhost/api/care-team", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ patient_id: "pat-1", name: "Dr. Torres", role: "Oncologist" }),
      })
    );
    expect(res.status).toBe(201);
    expect(state.inserts).toHaveLength(1);
    expect(state.inserts[0].name).toBe("Dr. Torres");
    expect(state.audits.some((a) => a.resource_type === "care_team" && a.action === "INSERT")).toBe(true);
  });

  it("14. PATCH updates only allowed fields", async () => {
    const state = freshState();
    state.existingRow = { id: "ct-1", patient_id: "pat-1", organization_id: "org-A" };
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "caregiver", state })
    );
    const { PATCH } = await import("@/app/api/care-team/[id]/route");
    const res = await PATCH(
      new Request("http://localhost/api/care-team/ct-1", {
        method: "PATCH",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ phone: "555-0100", malicious: "drop", id: "evil-id" }),
      }),
      { params: Promise.resolve({ id: "ct-1" }) }
    );
    expect(res.status).toBe(200);
    expect(state.updates).toHaveLength(1);
    const u = state.updates[0].values;
    expect(u.phone).toBe("555-0100");
    expect("malicious" in u).toBe(false);
    expect("id" in u).toBe(false);
  });

  it("15. DELETE removes the member (cascade FK handled by DB)", async () => {
    const state = freshState();
    state.existingRow = { id: "ct-1", patient_id: "pat-1", organization_id: "org-A" };
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "caregiver", state })
    );
    const { DELETE } = await import("@/app/api/care-team/[id]/route");
    const res = await DELETE(
      new Request("http://localhost/api/care-team/ct-1", {
        method: "DELETE",
        headers: { origin: "http://localhost" },
      }),
      { params: Promise.resolve({ id: "ct-1" }) }
    );
    expect(res.status).toBe(200);
    expect(state.deletes).toContain("ct-1");
    expect(state.audits.some((a) => a.action === "DELETE" && a.resource_type === "care_team")).toBe(true);
  });

  it("16. patient role POST returns 403", async () => {
    const state = freshState();
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "patient", state })
    );
    const { POST } = await import("@/app/api/care-team/route");
    const res = await POST(
      new Request("http://localhost/api/care-team", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ patient_id: "pat-1", name: "Dr. Torres" }),
      })
    );
    expect(res.status).toBe(403);
  });
});
