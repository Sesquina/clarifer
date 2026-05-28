/**
 * tests/api/notifications/read.test.ts
 * Tests for PATCH /api/notifications/[id]/read -- auth, role, cross-user
 * 404, audit_log on success.
 * Tables: mocks users, notifications, audit_log.
 *
 * HIPAA: synthetic ids; verifies update is scoped to caller's user_id
 * and organization_id, and that the absence of a matching row returns
 * 404 (never leaks foreign-row existence).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

interface MakeOpts {
  user?: { id: string } | null;
  role?: string;
  orgId?: string | null;
  updatedRow?: { id: string } | null;
  updateError?: { message: string } | null;
}

const updateFilters: Array<{ column: string; value: unknown }> = [];
const auditInserts: Array<Record<string, unknown>> = [];

function makeSupabase(opts: MakeOpts) {
  const orgId = opts.orgId === undefined ? "org-A" : opts.orgId;
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: opts.user === undefined ? { id: "user-1" } : opts.user },
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({ data: { role: opts.role ?? "caregiver", organization_id: orgId } }),
        };
      }
      if (table === "notifications") {
        const chain: Record<string, unknown> = {};
        chain.update = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockImplementation((column: string, value: unknown) => {
          updateFilters.push({ column, value });
          return chain;
        });
        chain.select = vi.fn().mockReturnValue(chain);
        chain.maybeSingle = vi.fn().mockResolvedValue({
          data: opts.updatedRow === undefined ? { id: "n-1" } : opts.updatedRow,
          error: opts.updateError ?? null,
        });
        return chain;
      }
      if (table === "audit_log") {
        return {
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            auditInserts.push(row);
            return {
              then: (onFulfilled: () => void) => {
                onFulfilled();
                return Promise.resolve({ error: null });
              },
            };
          }),
        };
      }
      return {};
    }),
  };
}

async function callPATCH(id: string) {
  const { PATCH } = await import("@/app/api/notifications/[id]/read/route");
  return PATCH(
    new Request(`http://localhost/api/notifications/${id}/read`, { method: "PATCH" }),
    { params: Promise.resolve({ id }) }
  );
}

describe("PATCH /api/notifications/[id]/read", () => {
  beforeEach(() => {
    vi.resetModules();
    updateFilters.length = 0;
    auditInserts.length = 0;
  });

  it("returns 401 with no session", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: null })
    );
    const res = await callPATCH("n-1");
    expect(res.status).toBe(401);
  });

  it("returns 403 for unknown role", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "guest" })
    );
    const res = await callPATCH("n-1");
    expect(res.status).toBe(403);
  });

  it("returns 200, scopes update to user_id + organization_id, writes audit_log UPDATE", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ updatedRow: { id: "n-1" } })
    );
    const res = await callPATCH("n-1");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; read: boolean };
    expect(body).toEqual({ id: "n-1", read: true });

    expect(updateFilters.find((f) => f.column === "id" && f.value === "n-1")).toBeTruthy();
    expect(updateFilters.find((f) => f.column === "user_id" && f.value === "user-1")).toBeTruthy();
    expect(updateFilters.find((f) => f.column === "organization_id" && f.value === "org-A")).toBeTruthy();

    expect(auditInserts).toHaveLength(1);
    expect(auditInserts[0].action).toBe("UPDATE");
    expect(auditInserts[0].resource_type).toBe("notifications");
    expect(auditInserts[0].resource_id).toBe("n-1");
  });

  it("returns 404 when no matching row exists for this user (no cross-user leak)", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ updatedRow: null })
    );
    const res = await callPATCH("foreign-id");
    expect(res.status).toBe(404);
    // Should NOT have written an audit_log entry on a failed update
    expect(auditInserts).toHaveLength(0);
  });

  it("returns 500 on database error", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ updateError: { message: "db down" } })
    );
    const res = await callPATCH("n-1");
    expect(res.status).toBe(500);
  });
});
