/**
 * tests/api/appointments/list.test.ts
 * Tests for GET /api/appointments -- auth, role, org-scope, filtering.
 * Tables: mocks users, patients, appointments, audit_log.
 * Auth: 401 unauth, 403 wrong role, 404 cross-tenant, 200 caregiver.
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
  userOrg?: string | null;
  patientOrg?: string | null;
  appts?: Array<Record<string, unknown>>;
}

function makeSupabase(opts: MakeOpts) {
  const userOrg = opts.userOrg ?? "org-A";
  const patientOrg = opts.patientOrg === undefined ? userOrg : opts.patientOrg;
  return {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({
          data: { user: opts.user === undefined ? { id: "user-1" } : opts.user },
        }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: userOrg ? { role: opts.role ?? "caregiver", organization_id: userOrg } : null,
          }),
        };
      }
      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({
              data: patientOrg ? { organization_id: patientOrg, condition_template_id: "cholangiocarcinoma" } : null,
            }),
        };
      }
      if (table === "appointments") {
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          order: vi.fn(() => Promise.resolve({ data: opts.appts ?? [], error: null })),
        };
        return chain;
      }
      if (table === "audit_log") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return {};
    }),
  };
}

describe("GET /api/appointments", () => {
  beforeEach(() => vi.resetModules());

  it("16. caregiver gets own org appointments", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({
        appts: [
          { id: "appt-1", title: "Oncology follow-up", datetime: "2026-05-01T10:00:00Z" },
          { id: "appt-2", title: "Imaging", datetime: "2026-05-08T09:00:00Z" },
        ],
      })
    );
    const { GET } = await import("@/app/api/appointments/route");
    const res = await GET(
      new Request("http://localhost/api/appointments?patient_id=pat-1", {
        headers: { origin: "http://localhost" },
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.appointments).toHaveLength(2);
    expect(json.appointments[0].title).toBe("Oncology follow-up");
  });

  it("17. unauthenticated returns 401", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: null })
    );
    const { GET } = await import("@/app/api/appointments/route");
    const res = await GET(
      new Request("http://localhost/api/appointments?patient_id=pat-1", {
        headers: { origin: "http://localhost" },
      })
    );
    expect(res.status).toBe(401);
  });

  it("18. cross-tenant patient_id returns 404", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ userOrg: "org-A", patientOrg: "org-B" })
    );
    const { GET } = await import("@/app/api/appointments/route");
    const res = await GET(
      new Request("http://localhost/api/appointments?patient_id=pat-foreign", {
        headers: { origin: "http://localhost" },
      })
    );
    expect(res.status).toBe(404);
  });

  it("19. missing patient_id returns 400", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({})
    );
    const { GET } = await import("@/app/api/appointments/route");
    const res = await GET(
      new Request("http://localhost/api/appointments", {
        headers: { origin: "http://localhost" },
      })
    );
    expect(res.status).toBe(400);
  });
});
