/**
 * tests/lib/trials/who-ictrp-search.test.ts
 * Tests for searchWhoIctrp -- queries the local mirror via service-role client.
 * Tables: mocks who_ictrp_trials.
 * Auth: not exercised; helper is service-role internal.
 * Sprint: Sprint 10 -- WHO ICTRP Pipeline
 *
 * HIPAA: No PHI. Tests use synthetic trial fixtures.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const fixtureRow = {
  id: "uuid-1",
  trial_id: "ICTRP-MX-001",
  title: "Cholangiocarcinoma trial in Mexico",
  condition: "Cholangiocarcinoma",
  phase: "Phase 2",
  countries: ["Mexico"],
  status: "Recruiting",
  sponsor: "Acme",
  primary_sponsor: "Acme",
  date_registration: "2026-01-15T00:00:00Z",
  url: "https://trialsearch.who.int/Trial2.aspx?TrialID=ICTRP-MX-001",
  raw: {},
  ingested_at: "2026-04-28T00:00:00Z",
};

const queryState = {
  rows: [fixtureRow],
  error: null as null | Error,
  countryFilter: null as null | string,
  conditionQuery: null as null | string,
};

function makeChain() {
  const chain = {
    textSearch: vi.fn((_col: string, q: string) => {
      queryState.conditionQuery = q;
      return chain;
    }),
    contains: vi.fn((_col: string, vals: string[]) => {
      queryState.countryFilter = vals[0];
      return chain;
    }),
    limit: vi.fn(() =>
      Promise.resolve({ data: queryState.error ? null : queryState.rows, error: queryState.error })
    ),
  };
  return chain;
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: () => ({
      select: vi.fn(() => makeChain()),
    }),
  })),
}));

describe("searchWhoIctrp", () => {
  beforeEach(() => {
    queryState.rows = [fixtureRow];
    queryState.error = null;
    queryState.countryFilter = null;
    queryState.conditionQuery = null;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
    vi.resetModules();
  });

  it("7. returns NormalizedTrial-shaped results matching the condition", async () => {
    const { searchWhoIctrp } = await import("@/lib/trials/who-ictrp");
    const out = await searchWhoIctrp("Cholangiocarcinoma");
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      source: "who_ictrp",
      nct_id: "ICTRP-MX-001",
      title: "Cholangiocarcinoma trial in Mexico",
      country: "Mexico",
      external_url: fixtureRow.url,
    });
    expect(queryState.conditionQuery).toBe("Cholangiocarcinoma");
  });

  it("8. filters by country when provided", async () => {
    const { searchWhoIctrp } = await import("@/lib/trials/who-ictrp");
    await searchWhoIctrp("Cholangiocarcinoma", "Mexico");
    expect(queryState.countryFilter).toBe("Mexico");
  });

  it("9. returns empty array on db error without throwing", async () => {
    queryState.error = new Error("connection lost");
    const { searchWhoIctrp } = await import("@/lib/trials/who-ictrp");
    const out = await searchWhoIctrp("Cholangiocarcinoma", "Mexico");
    expect(out).toEqual([]);
  });
});
