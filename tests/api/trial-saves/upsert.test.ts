/**
 * tests/api/trial-saves/upsert.test.ts
 * Verifies that POST /api/trial-saves/upsert includes organization_id in
 * the trial_saves upsert payload.
 *
 * Fix: S7 -- organization_id was missing from the upsert payload (Known Bug #6).
 * File: app/api/trial-saves/upsert/route.ts
 * HIPAA: organization_id is required for RLS and cross-tenant isolation.
 *        Without it every upserted row has a NULL org, bypassing row-level security.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/trial-saves/upsert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "1.2.3.4",
      "user-agent": "test-agent/1.0",
    },
    body: JSON.stringify(body),
  });
}

function makeSupabase(
  upsertCapture: Array<Record<string, unknown>>,
  auditCapture: Array<Record<string, unknown>>
) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: TEST_CAREGIVER.id } },
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              role: TEST_CAREGIVER.role,
              organization_id: TEST_CAREGIVER.organization_id,
            },
          }),
        };
      }

      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { organization_id: TEST_PATIENT_CARLOS.organization_id },
          }),
        };
      }

      if (table === "trial_saves") {
        return {
          upsert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
            upsertCapture.push(payload);
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: "trial-save-1" },
                error: null,
              }),
            };
          }),
        };
      }

      if (table === "audit_log") {
        return {
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            auditCapture.push(row);
            return { then: (fn: (v: unknown) => void) => fn({ error: null }) };
          }),
        };
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/trial-saves/upsert -- organization_id in payload (S7)", () => {
  const upsertCapture: Array<Record<string, unknown>> = [];
  const auditCapture: Array<Record<string, unknown>> = [];

  beforeEach(() => {
    upsertCapture.length = 0;
    auditCapture.length = 0;
    vi.resetModules();
  });

  it("includes organization_id in the trial_saves upsert payload", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(makeSupabase(upsertCapture, auditCapture)),
    }));
    vi.doMock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

    const { POST } = await import("@/app/api/trial-saves/upsert/route");

    const res = await POST(
      makeRequest({
        patient_id: TEST_PATIENT_CARLOS.id,
        trial_id: "NCT00000001",
        trial_name: "Phase 3 Trial",
        phase: "3",
        status: "recruiting",
        location: "Cleveland, OH",
      })
    );

    expect(res.status).toBe(200);
    expect(upsertCapture).toHaveLength(1);

    const payload = upsertCapture[0];
    expect(payload.organization_id).toBe(TEST_CAREGIVER.organization_id);
    expect(payload.patient_id).toBe(TEST_PATIENT_CARLOS.id);
    expect(payload.trial_id).toBe("NCT00000001");
  });

  it("returns 200 and the saved row id on success", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(makeSupabase(upsertCapture, auditCapture)),
    }));
    vi.doMock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

    const { POST } = await import("@/app/api/trial-saves/upsert/route");

    const res = await POST(
      makeRequest({
        patient_id: TEST_PATIENT_CARLOS.id,
        trial_id: "NCT00000001",
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("trial-save-1");
  });

  it("rejects unauthenticated requests with 401", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(),
      }),
    }));
    vi.doMock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

    const { POST } = await import("@/app/api/trial-saves/upsert/route");

    const res = await POST(
      makeRequest({ patient_id: TEST_PATIENT_CARLOS.id, trial_id: "NCT00000001" })
    );

    expect(res.status).toBe(401);
  });

  it("blocks cross-tenant access -- returns 404 when patient org does not match caller org", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: TEST_CAREGIVER.id } },
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "users") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  role: TEST_CAREGIVER.role,
                  organization_id: TEST_CAREGIVER.organization_id,
                },
              }),
            };
          }
          if (table === "patients") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { organization_id: "other-org-id" }, // different org -- cross-tenant attempt
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
          };
        }),
      }),
    }));
    vi.doMock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

    const { POST } = await import("@/app/api/trial-saves/upsert/route");

    const res = await POST(
      makeRequest({ patient_id: "patient-in-other-org", trial_id: "NCT00000001" })
    );

    expect(res.status).toBe(404);
  });
});
