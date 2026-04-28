/**
 * tests/api/appointments/create.test.ts
 * Tests for POST /api/appointments -- auth, role, checklist auto-pop.
 * Tables: mocks users, patients, appointments, audit_log.
 * Auth: 401 unauth, 403 wrong role, 200 caregiver with checklist.
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
  conditionId?: string | null;
  patientOrg?: string | null;
}

const insertedRows: Array<Record<string, unknown>> = [];
const auditInserts: Array<Record<string, unknown>> = [];

function makeSupabase(opts: MakeOpts) {
  const userOrg = "org-A";
  const patientOrg = opts.patientOrg === undefined ? userOrg : opts.patientOrg;
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
            .mockResolvedValue({ data: { role: opts.role ?? "caregiver", organization_id: userOrg } }),
        };
      }
      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({
              data: patientOrg
                ? {
                    organization_id: patientOrg,
                    condition_template_id:
                      opts.conditionId === undefined ? "cholangiocarcinoma" : opts.conditionId,
                  }
                : null,
            }),
        };
      }
      if (table === "appointments") {
        return {
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            insertedRows.push(row);
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: { id: "new-appt-1", ...row }, error: null }),
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
      return {};
    }),
  };
}

describe("POST /api/appointments", () => {
  beforeEach(() => {
    vi.resetModules();
    insertedRows.length = 0;
    auditInserts.length = 0;
  });

  it("20. caregiver creates an appointment, server auto-populates the cholangio oncology checklist", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/appointments/route");
    const res = await POST(
      new Request("http://localhost/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({
          patient_id: "pat-1",
          title: "Oncology follow-up",
          datetime: "2026-05-15T10:00:00Z",
          appointment_type: "oncology",
        }),
      })
    );
    expect(res.status).toBe(201);
    expect(insertedRows).toHaveLength(1);
    const checklist = insertedRows[0].pre_visit_checklist as Array<{ text: string; checked: boolean }>;
    expect(Array.isArray(checklist)).toBe(true);
    expect(checklist.some((i) => i.text.includes("CA 19-9"))).toBe(true);
    expect(auditInserts[0].action).toBe("INSERT");
  });

  it("21. provider role is forbidden from creating", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "provider" })
    );
    const { POST } = await import("@/app/api/appointments/route");
    const res = await POST(
      new Request("http://localhost/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ patient_id: "pat-1", title: "X" }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("22. cross-tenant patient_id returns 404", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ patientOrg: "org-B" })
    );
    const { POST } = await import("@/app/api/appointments/route");
    const res = await POST(
      new Request("http://localhost/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ patient_id: "pat-foreign", title: "X" }),
      })
    );
    expect(res.status).toBe(404);
  });

  it("23. caller-supplied checklist overrides the template", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/appointments/route");
    const custom = [{ text: "Bring genetic test results", checked: false }];
    const res = await POST(
      new Request("http://localhost/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({
          patient_id: "pat-1",
          title: "Custom prep",
          pre_visit_checklist: custom,
        }),
      })
    );
    expect(res.status).toBe(201);
    expect(insertedRows[0].pre_visit_checklist).toEqual(custom);
  });
});
