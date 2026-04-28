/**
 * tests/api/trials/who-ictrp-ingest.test.ts
 * Tests for the WHO ICTRP CSV ingest helper -- parses, upserts, handles errors.
 * Tables: mocks who_ictrp_trials via @supabase/supabase-js mock.
 * Auth: not exercised; helper is service-role internal.
 * Sprint: Sprint 10 -- WHO ICTRP Pipeline
 *
 * HIPAA: No PHI. Tests use synthetic trial fixtures.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const upsertCalls: Array<Record<string, unknown>> = [];
const existingByTrialId = new Map<string, boolean>();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation((_col: string, val: string) => ({
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: existingByTrialId.get(val) ? { id: "existing" } : null }),
      })),
      upsert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
        upsertCalls.push(row);
        return Promise.resolve({ data: null, error: null });
      }),
    }),
  })),
}));

const HEADER =
  '"TrialID","Public title","Condition","Phase","Countries","Recruitment Status","Primary Sponsor","Date of Registration","URL"';

describe("ingestWhoIctrpCsv", () => {
  beforeEach(() => {
    upsertCalls.length = 0;
    existingByTrialId.clear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
    vi.resetModules();
  });

  it("1. parses valid CSV and reports inserted count", async () => {
    const csv =
      `${HEADER}\n` +
      '"NCT01000001","Trial A","Cholangiocarcinoma","Phase 2","Mexico;Panama","Recruiting","Acme","2026-01-15","https://example.org/a"\n' +
      '"NCT01000002","Trial B","Cholangiocarcinoma","Phase 3","Mexico","Recruiting","Beta","2026-02-01","https://example.org/b"';
    const { ingestWhoIctrpCsv } = await import("@/lib/trials/who-ictrp-ingest");
    const result = await ingestWhoIctrpCsv(csv);
    expect(result.inserted).toBe(2);
    expect(result.updated).toBe(0);
    expect(result.errors).toEqual([]);
    expect(upsertCalls[0].trial_id).toBe("NCT01000001");
    expect(upsertCalls[0].countries).toEqual(["Mexico", "Panama"]);
  });

  it("2. handles malformed row without throwing", async () => {
    const csv =
      `${HEADER}\n` +
      '"","Missing trial id","Condition","Phase 1","Mexico","Recruiting","Sponsor","2026-01-01","https://example.org"\n' +
      '"NCT01000003","Good","Cholangiocarcinoma","Phase 2","Panama","Recruiting","Acme","2026-01-15","https://example.org/c"';
    const { ingestWhoIctrpCsv } = await import("@/lib/trials/who-ictrp-ingest");
    const result = await ingestWhoIctrpCsv(csv);
    expect(result.inserted).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toMatch(/missing TrialID/i);
  });

  it("3. counts updates on duplicate trial_id", async () => {
    existingByTrialId.set("NCT01000001", true);
    const csv =
      `${HEADER}\n` +
      '"NCT01000001","Trial A","Cholangiocarcinoma","Phase 2","Mexico","Recruiting","Acme","2026-01-15","https://example.org/a"';
    const { ingestWhoIctrpCsv } = await import("@/lib/trials/who-ictrp-ingest");
    const result = await ingestWhoIctrpCsv(csv);
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(1);
  });
});
