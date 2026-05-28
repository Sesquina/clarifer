/**
 * tests/integration/core-flow.test.ts
 * Smoke tests: verifies the 4 API routes required for the CCF demo caregiver
 * flow exist and enforce authentication. Does NOT test business logic.
 * Routes: GET /api/patients/[id], POST /api/log/create,
 *         POST /api/family-update/generate, GET /api/notifications (pending)
 * Auth: all four require authenticated Supabase session
 * HIPAA: No PHI in this file
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

// All tests here verify the 401 auth gate — no real session supplied
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

function makeRequest(method = "GET", body?: unknown): Request {
  return new Request("http://localhost:3000/api/test", {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Core caregiver flow -- auth gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/patients/[id] returns 401 without auth", async () => {
    const { GET } = await import("@/app/api/patients/[id]/route");
    const params = Promise.resolve({ id: "patient-123" });
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("POST /api/log/create returns 401 without auth", async () => {
    const { POST } = await import("@/app/api/log/create/route");
    const res = await POST(makeRequest("POST", { patientId: "p1", symptoms: [] }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("POST /api/family-update/generate returns 401 without auth", async () => {
    const { POST } = await import("@/app/api/family-update/generate/route");
    const res = await POST(makeRequest("POST", { patientId: "p1" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it.todo(
    "GET /api/notifications returns 401 without auth -- DISCOVERED ISSUE: route lives on feat/notifications (S19), not yet merged to main. Merge S19 to unblock."
  );
});
