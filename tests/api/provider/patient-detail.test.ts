/**
 * tests/api/provider/patient-detail.test.ts
 * Tests for GET /api/provider/patients/[id] -- auth, role, org-scope,
 * cross-tenant 404, audit_log entry.
 * Tables: mocks users, care_relationships, patients, symptom_logs,
 *         medications, appointments, documents, symptom_alerts,
 *         provider_notes, audit_log.
 * Sprint: Sprint 12 -- Provider Portal
 *
 * HIPAA: No PHI; synthetic ids.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

interface MakeOpts {
  user?: { id: string } | null;
  role?: string;
  hasRelationship?: boolean;
  patient?: Record<string, unknown> | null;
}

const auditInserts: Array<Record<string, unknown>> = [];

// The chain is itself a thenable so callers can await at any point:
// .order() alone, .order().limit(), .gte().order(), etc.
function listChain(rows: unknown[]) {
  const result = { data: rows, error: null };
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve);
  return chain;
}

function makeSupabase(opts: MakeOpts) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: opts.user === undefined ? { id: "provider-1" } : opts.user },
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: opts.role ?? "provider", organization_id: "org-A" },
          }),
        };
      }
      if (table === "care_relationships") {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.maybeSingle = vi.fn(() =>
          Promise.resolve({
            data: opts.hasRelationship === false ? null : { patient_id: "pat-1" },
          })
        );
        return chain;
      }
      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: opts.patient === undefined
              ? { id: "pat-1", name: "Carlos", organization_id: "org-A", condition_template_id: "cholangiocarcinoma" }
              : opts.patient,
          }),
        };
      }
      if (table === "symptom_logs") {
        return listChain([{ id: "log-1", created_at: "2026-04-20T00:00:00Z", overall_severity: 5 }]);
      }
      if (table === "medications") {
        return listChain([{ id: "med-1", name: "Capecitabine", dose: "1000", unit: "mg", frequency: "BID" }]);
      }
      if (table === "appointments") {
        return listChain([{ id: "appt-1", title: "Oncology", datetime: "2026-05-15T10:00:00Z" }]);
      }
      if (table === "documents") {
        return listChain([{ id: "doc-1", title: "Lab", summary: "CA 19-9 stable" }]);
      }
      if (table === "symptom_alerts") {
        return listChain([]);
      }
      if (table === "provider_notes") {
        return listChain([{ id: "note-1", note_text: "Patient stable", note_type: "general" }]);
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

describe("GET /api/provider/patients/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    auditInserts.length = 0;
  });

  it("40. provider gets full patient record with all sections", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    const { GET } = await import("@/app/api/provider/patients/[id]/route");
    const res = await GET(
      new Request("http://localhost/api/provider/patients/pat-1"),
      { params: Promise.resolve({ id: "pat-1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.patient.id).toBe("pat-1");
    expect(body.symptom_logs).toHaveLength(1);
    expect(body.medications[0].name).toBe("Capecitabine");
    expect(body.upcoming_appointments).toHaveLength(1);
    expect(body.recent_documents).toHaveLength(1);
    expect(body.provider_notes).toHaveLength(1);
  });

  it("41. provider without care_relationship for this patient gets 404 (cross-tenant safety)", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ hasRelationship: false })
    );
    const { GET } = await import("@/app/api/provider/patients/[id]/route");
    const res = await GET(
      new Request("http://localhost/api/provider/patients/pat-foreign"),
      { params: Promise.resolve({ id: "pat-foreign" }) }
    );
    expect(res.status).toBe(404);
  });

  it("42. caregiver role returns 403", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "caregiver" })
    );
    const { GET } = await import("@/app/api/provider/patients/[id]/route");
    const res = await GET(
      new Request("http://localhost/api/provider/patients/pat-1"),
      { params: Promise.resolve({ id: "pat-1" }) }
    );
    expect(res.status).toBe(403);
  });

  it("43. audit_log row written with PROVIDER_VIEW action", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    const { GET } = await import("@/app/api/provider/patients/[id]/route");
    await GET(
      new Request("http://localhost/api/provider/patients/pat-1"),
      { params: Promise.resolve({ id: "pat-1" }) }
    );
    expect(auditInserts[0]).toMatchObject({
      action: "PROVIDER_VIEW",
      resource_type: "patient",
      resource_id: "pat-1",
    });
  });
});
