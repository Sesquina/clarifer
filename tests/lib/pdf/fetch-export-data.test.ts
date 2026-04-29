/**
 * tests/lib/pdf/fetch-export-data.test.ts
 * Tests for fetchExportData() -- the server-side aggregator that
 * powers caregiver and provider PDF exports.
 * Tables: mocks patients, medications, symptom_logs, documents,
 *         appointments, care_team, provider_notes, organizations,
 *         users.
 * Sprint: Sprint 13 -- Hospital-Grade PDF Export
 *
 * HIPAA: No PHI; synthetic ids only.
 */
import { describe, it, expect, vi } from "vitest";
import { fetchExportData } from "@/lib/pdf/fetch-export-data";

interface BuilderOpts {
  patient?: Record<string, unknown> | null;
  medications?: unknown[];
  symptomLogs?: unknown[];
  documents?: unknown[];
  appointments?: unknown[];
  careTeam?: unknown[];
  providerNotes?: unknown[];
  caller?: { full_name?: string | null } | null;
  org?: { name?: string | null } | null;
}

// Build a fake supabase that returns canned data per table. The route
// chains use { select, eq, gte, lt, order, limit, single }; the chain
// itself is a thenable so tests can await any terminus.
function makeFake(opts: BuilderOpts) {
  const tableData: Record<string, unknown[]> = {
    medications: opts.medications ?? [],
    symptom_logs: opts.symptomLogs ?? [],
    documents: opts.documents ?? [],
    appointments: opts.appointments ?? [],
    care_team: opts.careTeam ?? [],
    provider_notes: opts.providerNotes ?? [],
  };

  function chainFor(table: string) {
    const result = { data: tableData[table], error: null };
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.gte = vi.fn().mockReturnValue(chain);
    chain.lt = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.then = (resolve: (v: typeof result) => unknown) =>
      Promise.resolve(result).then(resolve);
    return chain;
  }

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: opts.patient === undefined
              ? { id: "pat-1", name: "Carlos", organization_id: "org-A" }
              : opts.patient,
          }),
        };
      }
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: opts.caller === undefined ? { full_name: "Ana Rivera" } : opts.caller,
          }),
        };
      }
      if (table === "organizations") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: opts.org === undefined ? { name: "Cleveland Clinic" } : opts.org,
          }),
        };
      }
      return chainFor(table);
    }),
  };
}

describe("fetchExportData()", () => {
  it("60. returns a complete bundle for a valid patient + org", async () => {
    const supabase = makeFake({
      medications: [{ id: "m1", name: "Capecitabine" }],
      symptomLogs: [{ id: "s1", overall_severity: 5 }],
      careTeam: [{ id: "c1", name: "Dr. Torres" }],
    }) as unknown as Parameters<typeof fetchExportData>[0]["supabase"];
    const data = await fetchExportData({
      supabase,
      patientId: "pat-1",
      orgId: "org-A",
      callerId: "user-1",
      callerRole: "caregiver",
    });
    expect(data).not.toBeNull();
    expect(data!.patient.name).toBe("Carlos");
    expect(data!.medications).toHaveLength(1);
    expect(data!.symptomLogs).toHaveLength(1);
    expect(data!.careTeam).toHaveLength(1);
    expect(data!.orgName).toBe("Cleveland Clinic");
    expect(data!.generatedBy).toBe("Ana Rivera");
  });

  it("61. returns empty arrays for tables with no data", async () => {
    const supabase = makeFake({}) as unknown as Parameters<typeof fetchExportData>[0]["supabase"];
    const data = await fetchExportData({
      supabase,
      patientId: "pat-1",
      orgId: "org-A",
      callerId: "user-1",
      callerRole: "caregiver",
    });
    expect(data).not.toBeNull();
    expect(data!.medications).toEqual([]);
    expect(data!.symptomLogs).toEqual([]);
    expect(data!.documents).toEqual([]);
    expect(data!.appointments).toEqual([]);
    expect(data!.careTeam).toEqual([]);
  });

  it("62. providerNotes is empty when callerRole is caregiver", async () => {
    const supabase = makeFake({
      providerNotes: [{ id: "n1", note_text: "should not surface" }],
    }) as unknown as Parameters<typeof fetchExportData>[0]["supabase"];
    const data = await fetchExportData({
      supabase,
      patientId: "pat-1",
      orgId: "org-A",
      callerId: "user-1",
      callerRole: "caregiver",
    });
    expect(data!.providerNotes).toEqual([]);
  });

  it("63. providerNotes is populated when callerRole is provider", async () => {
    const supabase = makeFake({
      providerNotes: [{ id: "n1", note_text: "Stable on chemo" }],
    }) as unknown as Parameters<typeof fetchExportData>[0]["supabase"];
    const data = await fetchExportData({
      supabase,
      patientId: "pat-1",
      orgId: "org-A",
      callerId: "provider-1",
      callerRole: "provider",
    });
    expect(data!.providerNotes).toHaveLength(1);
  });

  it("64. cross-org patient returns null (caller route translates to 404)", async () => {
    const supabase = makeFake({ patient: null }) as unknown as Parameters<typeof fetchExportData>[0]["supabase"];
    const data = await fetchExportData({
      supabase,
      patientId: "pat-foreign",
      orgId: "org-A",
      callerId: "user-1",
      callerRole: "caregiver",
    });
    expect(data).toBeNull();
  });
});
