/**
 * tests/api/appointments/delete.test.ts
 * Tests for DELETE /api/appointments/[id] -- auth, role, audit, 404.
 * Tables: mocks users, appointments, audit_log.
 * Sprint: Sprint 11 -- Appointment Tracker
 *
 * HIPAA: No PHI; synthetic ids.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

interface MakeOpts {
  user?: { id: string } | null;
  role?: string;
  existing?: { id: string; patient_id: string } | null;
  deleteError?: { message: string } | null;
}

const auditInserts: Array<Record<string, unknown>> = [];

function makeSupabase(opts: MakeOpts) {
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
            .mockResolvedValue({ data: { role: opts.role ?? "caregiver", organization_id: "org-A" } }),
        };
      }
      if (table === "appointments") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({
              data:
                opts.existing === undefined
                  ? { id: "appt-1", patient_id: "pat-1" }
                  : opts.existing,
            }),
          delete: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: opts.deleteError ?? null }),
            }),
          })),
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
      return {};
    }),
  };
}

describe("DELETE /api/appointments/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    auditInserts.length = 0;
  });

  it("24. caregiver deletes own-org appointment, audit_log written", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    const { DELETE } = await import("@/app/api/appointments/[id]/route");
    const res = await DELETE(
      new Request("http://localhost/api/appointments/appt-1", {
        method: "DELETE",
        headers: { origin: "http://localhost" },
      }),
      { params: Promise.resolve({ id: "appt-1" }) }
    );
    expect(res.status).toBe(200);
    expect(auditInserts[0].action).toBe("DELETE");
    expect(auditInserts[0].resource_type).toBe("appointments");
  });

  it("25. provider role is forbidden from deleting", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "provider" })
    );
    const { DELETE } = await import("@/app/api/appointments/[id]/route");
    const res = await DELETE(
      new Request("http://localhost/api/appointments/appt-1", {
        method: "DELETE",
        headers: { origin: "http://localhost" },
      }),
      { params: Promise.resolve({ id: "appt-1" }) }
    );
    expect(res.status).toBe(403);
  });

  it("26. unknown / cross-tenant id returns 404", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ existing: null })
    );
    const { DELETE } = await import("@/app/api/appointments/[id]/route");
    const res = await DELETE(
      new Request("http://localhost/api/appointments/unknown", {
        method: "DELETE",
        headers: { origin: "http://localhost" },
      }),
      { params: Promise.resolve({ id: "unknown" }) }
    );
    expect(res.status).toBe(404);
    expect(auditInserts).toHaveLength(0);
  });

  it("27. unauthenticated returns 401", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: null })
    );
    const { DELETE } = await import("@/app/api/appointments/[id]/route");
    const res = await DELETE(
      new Request("http://localhost/api/appointments/appt-1", {
        method: "DELETE",
        headers: { origin: "http://localhost" },
      }),
      { params: Promise.resolve({ id: "appt-1" }) }
    );
    expect(res.status).toBe(401);
  });
});
