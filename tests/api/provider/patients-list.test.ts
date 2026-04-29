/**
 * tests/api/provider/patients-list.test.ts
 * Tests for GET /api/provider/patients -- auth, role, org-scope,
 * sort by alerts.
 * Tables: mocks users, care_relationships, patients, symptom_logs,
 *         appointments, medications, symptom_alerts, audit_log.
 * Sprint: Sprint 12 -- Provider Portal
 *
 * HIPAA: No PHI; synthetic ids.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

interface PatientFixture {
  id: string;
  name: string;
  custom_diagnosis: string | null;
  condition_template_id: string | null;
  organization_id: string;
}

interface MakeOpts {
  user?: { id: string } | null;
  role?: string;
  userOrg?: string | null;
  relationships?: Array<{ patient_id: string }>;
  patients?: PatientFixture[];
  alertCounts?: Record<string, number>;
  medCounts?: Record<string, number>;
  lastLogs?: Record<string, string | null>;
  nextAppts?: Record<string, string | null>;
}

const auditInserts: Array<Record<string, unknown>> = [];

function makeSupabase(opts: MakeOpts) {
  const userOrg = opts.userOrg ?? "org-A";
  return {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({
          data: { user: opts.user === undefined ? { id: "provider-1" } : opts.user },
        }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: userOrg ? { role: opts.role ?? "provider", organization_id: userOrg } : null,
          }),
        };
      }
      if (table === "care_relationships") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation(function (this: unknown) {
            // Final eq returns a thenable when both eqs called; use a counter.
            const chain = this as Record<string, unknown> & { _ct?: number };
            chain._ct = (chain._ct ?? 0) + 1;
            if (chain._ct >= 2) return Promise.resolve({ data: opts.relationships ?? [], error: null });
            return chain;
          }),
        };
      }
      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          eq: vi.fn(() => Promise.resolve({ data: opts.patients ?? [], error: null })),
        };
      }
      if (table === "symptom_logs") {
        // Used inline per patient -- chain ends with maybeSingle
        let pid = "";
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn((col: string, val: string) => {
          if (col === "patient_id") pid = val;
          return chain;
        });
        chain.order = vi.fn().mockReturnValue(chain);
        chain.limit = vi.fn().mockReturnValue(chain);
        chain.maybeSingle = vi.fn(() =>
          Promise.resolve({
            data: opts.lastLogs?.[pid] ? { created_at: opts.lastLogs[pid] } : null,
          })
        );
        return chain;
      }
      if (table === "appointments") {
        let pid = "";
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn((col: string, val: string) => {
          if (col === "patient_id") pid = val;
          return chain;
        });
        chain.gte = vi.fn().mockReturnValue(chain);
        chain.order = vi.fn().mockReturnValue(chain);
        chain.limit = vi.fn().mockReturnValue(chain);
        chain.maybeSingle = vi.fn(() =>
          Promise.resolve({
            data: opts.nextAppts?.[pid] ? { datetime: opts.nextAppts[pid] } : null,
          })
        );
        return chain;
      }
      if (table === "medications") {
        let pid = "";
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn((col: string, val: string) => {
          if (col === "patient_id") pid = val;
          if (col === "is_active") return Promise.resolve({ count: opts.medCounts?.[pid] ?? 0 });
          return chain;
        });
        return chain;
      }
      if (table === "symptom_alerts") {
        let pid = "";
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn((col: string, val: string) => {
          if (col === "patient_id") pid = val;
          return chain;
        });
        chain.is = vi.fn(() => Promise.resolve({ count: opts.alertCounts?.[pid] ?? 0 }));
        return chain;
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

describe("GET /api/provider/patients", () => {
  beforeEach(() => {
    vi.resetModules();
    auditInserts.length = 0;
  });

  it("35. provider gets assigned patients", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({
        relationships: [{ patient_id: "pat-1" }],
        patients: [
          { id: "pat-1", name: "Carlos", custom_diagnosis: "CCA", condition_template_id: "cholangiocarcinoma", organization_id: "org-A" },
        ],
        medCounts: { "pat-1": 5 },
        alertCounts: { "pat-1": 0 },
      })
    );
    const { GET } = await import("@/app/api/provider/patients/route");
    const res = await GET(new Request("http://localhost/api/provider/patients"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.patients).toHaveLength(1);
    expect(json.patients[0]).toMatchObject({ id: "pat-1", medication_count: 5 });
  });

  it("36. caregiver role returns 403", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "caregiver" })
    );
    const { GET } = await import("@/app/api/provider/patients/route");
    const res = await GET(new Request("http://localhost/api/provider/patients"));
    expect(res.status).toBe(403);
  });

  it("37. unauthenticated returns 401", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: null })
    );
    const { GET } = await import("@/app/api/provider/patients/route");
    const res = await GET(new Request("http://localhost/api/provider/patients"));
    expect(res.status).toBe(401);
  });

  it("38. provider with no relationships gets empty list and audit_log written", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ relationships: [] })
    );
    const { GET } = await import("@/app/api/provider/patients/route");
    const res = await GET(new Request("http://localhost/api/provider/patients"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.patients).toEqual([]);
    expect(auditInserts[0]).toMatchObject({ action: "PROVIDER_LIST", resource_type: "patients" });
  });

  it("39. patients with active alerts are sorted before quiet patients", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({
        relationships: [{ patient_id: "pat-quiet" }, { patient_id: "pat-noisy" }],
        patients: [
          { id: "pat-quiet", name: "Alice", custom_diagnosis: null, condition_template_id: null, organization_id: "org-A" },
          { id: "pat-noisy", name: "Beatrice", custom_diagnosis: null, condition_template_id: null, organization_id: "org-A" },
        ],
        alertCounts: { "pat-quiet": 0, "pat-noisy": 3 },
      })
    );
    const { GET } = await import("@/app/api/provider/patients/route");
    const res = await GET(new Request("http://localhost/api/provider/patients"));
    const json = await res.json();
    expect(json.patients[0].id).toBe("pat-noisy");
    expect(json.patients[1].id).toBe("pat-quiet");
  });
});
