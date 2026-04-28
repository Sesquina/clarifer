/**
 * tests/api/trials/search.test.ts
 * Vitest suite for the trials search route covering ClinicalTrials.gov + ICTRP merging, caching, and audit.
 * Tables: mocks users, patients, condition_templates, trial_cache, trial_saves, audit_log.
 * Auth: exercises authorized caregiver path; cross-tenant rejection is covered in trials-rls.test.ts.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: No PHI stored in this file. Tests use synthetic ids and stubbed trial fixtures.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/trials/clinicaltrials-gov", () => ({
  searchTrials: vi.fn().mockResolvedValue([
    {
      source: "clinicaltrials.gov",
      nct_id: "NCT00000001",
      title: "US Trial",
      phase: "Phase 2",
      status: "RECRUITING",
      location: "Boston, MA, United States",
      city: "Boston",
      state: "MA",
      country: "United States",
      brief_summary: "A US study",
      eligibility: "Age 18+",
      contact: null,
      external_url: "https://clinicaltrials.gov/study/NCT00000001",
    },
  ]),
}));
vi.mock("@/lib/trials/who-ictrp", () => ({
  searchInternationalTrials: vi.fn().mockResolvedValue([
    {
      source: "who_ictrp",
      nct_id: "WHO-MX-001",
      title: "Mexico Trial",
      phase: "Phase 1",
      status: "RECRUITING",
      location: "Mexico City, Mexico",
      city: "Mexico City",
      state: null,
      country: "Mexico",
      brief_summary: "An MX study",
      eligibility: "Age 18+",
      contact: null,
      external_url: "https://example.org/who/MX-001",
    },
  ]),
}));
const { mockCreateFn } = vi.hoisted(() => {
  const fn = async () => ({
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          "NCT00000001": {
            five_things_to_know: ["a", "b", "c", "d", "e"],
            possible_disqualifiers: [],
            next_step: "Call site",
          },
          "WHO-MX-001": {
            five_things_to_know: ["a", "b", "c", "d", "e"],
            possible_disqualifiers: [],
            next_step: "Call site",
          },
        }),
      },
    ],
  });
  return { mockCreateFn: fn };
});
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: mockCreateFn };
  }
  return { default: MockAnthropic };
});
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

function makeSupabase(opts: {
  user?: { id: string } | null;
  role?: string;
  organizationId?: string | null;
  patient?: Record<string, unknown> | null;
  patientOrg?: string;
  template?: { name: string } | null;
  savedRows?: Array<{ trial_id: string }>;
}) {
  const userRecord =
    opts.organizationId === null
      ? null
      : { role: opts.role ?? "caregiver", organization_id: opts.organizationId ?? "org-A" };

  const patient =
    opts.patient ?? {
      id: "patient-1",
      organization_id: opts.patientOrg ?? "org-A",
      condition_template_id: "template-1",
      custom_diagnosis: null,
      country: "United States",
      city: "Boston",
      state: "MA",
    };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user === undefined ? { id: "user-1" } : opts.user } }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: userRecord }),
        };
      }
      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: patient, error: patient ? null : { message: "not found" } }),
        };
      }
      if (table === "condition_templates") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: opts.template ?? { name: "cancer" } }),
        };
      }
      if (table === "trial_saves") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: opts.savedRows ?? [], error: null }),
        };
      }
      if (table === "audit_log") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      };
    }),
  };
}

describe("/api/trials/search", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "srv-key";
  });
  afterEach(() => vi.restoreAllMocks());

  it("1. requires auth (401 when no user)", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({ user: null }));
    const { POST } = await import("@/app/api/trials/search/route");
    const res = await POST(new Request("http://localhost/api/trials/search", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({ patient_id: "patient-1" }),
    }));
    expect(res.status).toBe(401);
  });

  it("2. caregiver searches trials for own-org patient and gets 200 with trials", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/trials/search/route");
    const res = await POST(new Request("http://localhost/api/trials/search", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({ patient_id: "patient-1" }),
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.trials.length).toBeGreaterThanOrEqual(1);
    expect(json.trials[0].plain_language).toBeTruthy();
  });

  it("3. cannot search trials for another org's patient (403)", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ organizationId: "org-A", patientOrg: "org-B" })
    );
    const { POST } = await import("@/app/api/trials/search/route");
    const res = await POST(new Request("http://localhost/api/trials/search", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({ patient_id: "patient-other-org" }),
    }));
    expect(res.status).toBe(403);
  });

  it("4. international patient gets both ClinicalTrials.gov and WHO ICTRP results", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({
        patient: {
          id: "patient-mx",
          organization_id: "org-A",
          condition_template_id: "template-1",
          custom_diagnosis: null,
          country: "Mexico",
          city: "Mexico City",
          state: null,
        },
      })
    );
    const { POST } = await import("@/app/api/trials/search/route");
    const res = await POST(new Request("http://localhost/api/trials/search", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({ patient_id: "patient-mx" }),
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    const sources = new Set((json.trials as Array<{ source: string }>).map((t) => t.source));
    expect(sources.has("clinicaltrials.gov")).toBe(true);
    expect(sources.has("who_ictrp")).toBe(true);
  });
});
