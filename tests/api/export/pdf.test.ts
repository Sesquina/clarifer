/**
 * tests/api/export/pdf.test.ts
 * Tests for POST /api/export/pdf -- caregiver-facing hospital-grade
 * PDF export. Auth, role, org-scope, audit_log, performance.
 * Tables: mocks users, audit_log; lib mocks fetchExportData and
 *         renderHospitalGradePdf.
 * Sprint: Sprint 13 -- Hospital-Grade PDF Export
 *
 * HIPAA: No PHI; synthetic ids only.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/pdf/hospital-grade-export", () => ({
  renderHospitalGradePdf: vi.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46])),
}));
vi.mock("@/lib/pdf/fetch-export-data", () => ({
  fetchExportData: vi.fn(),
}));

const auditInserts: Array<Record<string, unknown>> = [];

interface MakeOpts {
  user?: { id: string } | null;
  role?: string;
  patient?: Record<string, unknown> | null;
}

function makeSupabase(opts: MakeOpts) {
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
          single: vi.fn().mockResolvedValue({
            data: { role: opts.role ?? "caregiver", organization_id: "org-A" },
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

const fixtureBundle = {
  patient: { id: "pat-1", name: "Carlos Rivera", organization_id: "org-A" },
  medications: [],
  symptomLogs: [],
  documents: [],
  appointments: [],
  careTeam: [],
  providerNotes: [],
  generatedBy: "Ana Rivera",
  generatedAt: new Date().toISOString(),
  dateRangeDays: 30,
  orgName: "Cleveland Clinic",
};

async function setupFetchExportData(returnValue: typeof fixtureBundle | null = fixtureBundle) {
  const mod = await import("@/lib/pdf/fetch-export-data");
  (mod.fetchExportData as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(returnValue);
}

describe("POST /api/export/pdf", () => {
  beforeEach(async () => {
    vi.resetModules();
    auditInserts.length = 0;
    await setupFetchExportData(fixtureBundle);
  });

  it("70. POST returns 200 with application/pdf content type", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    await setupFetchExportData(fixtureBundle);
    const { POST } = await import("@/app/api/export/pdf/route");
    const res = await POST(
      new Request("http://localhost/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: "pat-1" }),
      })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("71. caregiver role: 200", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "caregiver" })
    );
    await setupFetchExportData(fixtureBundle);
    const { POST } = await import("@/app/api/export/pdf/route");
    const res = await POST(
      new Request("http://localhost/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: "pat-1" }),
      })
    );
    expect(res.status).toBe(200);
  });

  it("72. provider role: 403 (provider has its own export route)", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "provider" })
    );
    const { POST } = await import("@/app/api/export/pdf/route");
    const res = await POST(
      new Request("http://localhost/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: "pat-1" }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("73. patient role: 403", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "patient" })
    );
    const { POST } = await import("@/app/api/export/pdf/route");
    const res = await POST(
      new Request("http://localhost/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: "pat-1" }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("74. unauthenticated: 401", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: null })
    );
    const { POST } = await import("@/app/api/export/pdf/route");
    const res = await POST(
      new Request("http://localhost/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: "pat-1" }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("75. cross-tenant patient_id: 404 (fetchExportData returns null)", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    await setupFetchExportData(null);
    const { POST } = await import("@/app/api/export/pdf/route");
    const res = await POST(
      new Request("http://localhost/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: "pat-foreign" }),
      })
    );
    expect(res.status).toBe(404);
  });

  it("76. audit_log entry written with CAREGIVER_EXPORT action", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    await setupFetchExportData(fixtureBundle);
    const { POST } = await import("@/app/api/export/pdf/route");
    await POST(
      new Request("http://localhost/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: "pat-1" }),
      })
    );
    expect(auditInserts.find((a) => a.action === "CAREGIVER_EXPORT")).toBeTruthy();
  });

  it("77. response completes in under 3000ms (with mocked renderer)", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    await setupFetchExportData(fixtureBundle);
    const { POST } = await import("@/app/api/export/pdf/route");
    const start = Date.now();
    await POST(
      new Request("http://localhost/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: "pat-1" }),
      })
    );
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });
});
