/**
 * tests/api/provider/export.test.ts
 * Tests for POST /api/provider/patients/[id]/export -- PDF binary,
 * Content-Type, audit_log, role gating, generation timing.
 * Tables: mocks users, care_relationships, patients, medications,
 *         symptom_logs, documents, appointments, biomarkers,
 *         audit_log.
 * Sprint: Sprint 12 -- Provider Portal
 *
 * HIPAA: No PHI; synthetic ids. Mocks generatePatientPdf to avoid
 * a heavy renderToBuffer call in CI; the real generator is exercised
 * by Sprint 8's PDF test suite.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/export/generate-pdf", () => ({
  generatePatientPdf: vi.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46])),
}));

const auditInserts: Array<Record<string, unknown>> = [];

interface MakeOpts {
  user?: { id: string } | null;
  role?: string;
  hasRelationship?: boolean;
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
            data: { role: opts.role ?? "provider", organization_id: "org-A", full_name: "Dr. Torres" },
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
            data: { id: "pat-1", name: "Carlos", organization_id: "org-A", dob: "1955-01-01" },
          }),
        };
      }
      // medications, symptom_logs, documents, appointments, biomarkers
      // all share the same "list" chain shape: select -> eq* -> order -> limit
      if (
        table === "medications" ||
        table === "symptom_logs" ||
        table === "documents" ||
        table === "appointments" ||
        table === "biomarkers"
      ) {
        const result = { data: [], error: null };
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.gte = vi.fn().mockReturnValue(chain);
        chain.order = vi.fn().mockReturnValue(chain);
        chain.limit = vi.fn().mockReturnValue(chain);
        chain.then = (resolve: (v: typeof result) => unknown) =>
          Promise.resolve(result).then(resolve);
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

describe("POST /api/provider/patients/[id]/export", () => {
  beforeEach(() => {
    vi.resetModules();
    auditInserts.length = 0;
  });

  it("48. provider gets a PDF response", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/provider/patients/[id]/export/route");
    const res = await POST(
      new Request("http://localhost/api/provider/patients/pat-1/export", { method: "POST" }),
      { params: Promise.resolve({ id: "pat-1" }) }
    );
    expect(res.status).toBe(200);
    const blob = await res.blob();
    expect(blob.size).toBeGreaterThan(0);
  });

  it("49. Content-Type is application/pdf", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/provider/patients/[id]/export/route");
    const res = await POST(
      new Request("http://localhost/api/provider/patients/pat-1/export", { method: "POST" }),
      { params: Promise.resolve({ id: "pat-1" }) }
    );
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("50. audit_log entry written with PROVIDER_EXPORT action", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/provider/patients/[id]/export/route");
    await POST(
      new Request("http://localhost/api/provider/patients/pat-1/export", { method: "POST" }),
      { params: Promise.resolve({ id: "pat-1" }) }
    );
    expect(auditInserts[0]).toMatchObject({
      action: "PROVIDER_EXPORT",
      resource_type: "patient_pdf",
      resource_id: "pat-1",
    });
  });

  it("51. caregiver role returns 403", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "caregiver" })
    );
    const { POST } = await import("@/app/api/provider/patients/[id]/export/route");
    const res = await POST(
      new Request("http://localhost/api/provider/patients/pat-1/export", { method: "POST" }),
      { params: Promise.resolve({ id: "pat-1" }) }
    );
    expect(res.status).toBe(403);
  });

  it("52. PDF generation completes in under 3 seconds (mocked generator)", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/provider/patients/[id]/export/route");
    const start = Date.now();
    await POST(
      new Request("http://localhost/api/provider/patients/pat-1/export", { method: "POST" }),
      { params: Promise.resolve({ id: "pat-1" }) }
    );
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });
});
