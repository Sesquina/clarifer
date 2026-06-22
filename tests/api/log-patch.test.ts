/**
 * tests/api/log-patch.test.ts
 * Tests for PATCH /api/log/[id] -- Mode 2 detail save.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/auth/get-user", () => ({
  getUserFromRequest: vi.fn().mockResolvedValue({
    id: TEST_CAREGIVER.id,
    email: TEST_CAREGIVER.email,
    role: TEST_CAREGIVER.role,
    organization_id: TEST_CAREGIVER.organization_id,
    is_demo: false,
    auth_method: "supabase_legacy",
  }),
}));

const TEST_LOG_ID = "test-log-abc123";

const auditInserts: Array<Record<string, unknown>> = [];

function makeSupabase(opts: {
  role?: string;
  organizationId?: string | null;
  logRow?: Record<string, unknown> | null;
  updateError?: { message: string } | null;
}) {
  const {
    role = "caregiver",
    organizationId = TEST_CAREGIVER.organization_id,
    logRow = {
      id: TEST_LOG_ID,
      organization_id: TEST_CAREGIVER.organization_id,
      responses: { notes: "slept well" },
    },
    updateError = null,
  } = opts;

  const updateMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: updateError }),
  });

  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === "users") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: organizationId ? { role, organization_id: organizationId } : null,
        }),
      };
    }
    if (table === "symptom_logs") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: logRow }),
        update: updateMock,
      };
    }
    if (table === "audit_log") {
      return {
        insert: vi.fn().mockImplementation(
          (row: Record<string, unknown>) => {
            auditInserts.push(row);
            return Promise.resolve({ error: null });
          }
        ),
      };
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    };
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: TEST_CAREGIVER.id } },
        error: null,
      }),
    },
    from: fromMock,
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("PATCH /api/log/[id]", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    auditInserts.length = 0;
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("1. returns 200 and writes audit_log on valid PATCH", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { PATCH } = await import(
      "@/app/api/log/[id]/route"
    );
    const req = new Request(`http://localhost/api/log/${TEST_LOG_ID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        functional_status: "Slowing down a bit",
        appetite: "Eating less than usual",
        sensation_types: ["Achy"],
        timing: ["Morning"],
        infection_signs: [],
        detail_notes: null,
      }),
    });
    const params = Promise.resolve({ id: TEST_LOG_ID });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json() as { id: string };
    expect(body.id).toBe(TEST_LOG_ID);
    expect(auditInserts.length).toBeGreaterThanOrEqual(1);
    expect(auditInserts[0].action).toBe("UPDATE");
    expect(auditInserts[0].resource_type).toBe("symptom_logs");
  });

  it("2. returns 401 when user not authenticated", async () => {
    const { getUserFromRequest } = await import("@/lib/auth/get-user");
    (getUserFromRequest as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    createClient.mockResolvedValue(makeSupabase({}));
    const { PATCH } = await import("@/app/api/log/[id]/route");
    const req = new Request(`http://localhost/api/log/${TEST_LOG_ID}`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: TEST_LOG_ID }) });
    expect(res.status).toBe(401);
  });

  it("3. returns 401 when user has no organization_id", async () => {
    const { getUserFromRequest } = await import("@/lib/auth/get-user");
    (getUserFromRequest as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    createClient.mockResolvedValue(makeSupabase({}));
    const { PATCH } = await import("@/app/api/log/[id]/route");
    const req = new Request(`http://localhost/api/log/${TEST_LOG_ID}`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: TEST_LOG_ID }) });
    expect(res.status).toBe(401);
  });

  it("4. returns 404 when log does not exist", async () => {
    createClient.mockResolvedValue(makeSupabase({ logRow: null }));
    const { PATCH } = await import("@/app/api/log/[id]/route");
    const req = new Request(`http://localhost/api/log/nonexistent`, {
      method: "PATCH",
      body: JSON.stringify({ functional_status: "Active as usual" }),
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    expect(res.status).toBe(404);
  });

  it("5. returns 404 when log belongs to a different org (cross-tenant block)", async () => {
    createClient.mockResolvedValue(
      makeSupabase({
        logRow: {
          id: TEST_LOG_ID,
          organization_id: "other-org-id",
          responses: {},
        },
      })
    );
    const { PATCH } = await import("@/app/api/log/[id]/route");
    const req = new Request(`http://localhost/api/log/${TEST_LOG_ID}`, {
      method: "PATCH",
      body: JSON.stringify({ functional_status: "Active as usual" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: TEST_LOG_ID }) });
    expect(res.status).toBe(404);
  });

  it("6. merges detail fields into existing responses without losing prior notes", async () => {
    let capturedUpdate: Record<string, unknown> | null = null;
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: "caregiver", organization_id: TEST_CAREGIVER.organization_id },
          }),
        };
      }
      if (table === "symptom_logs") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: TEST_LOG_ID,
              organization_id: TEST_CAREGIVER.organization_id,
              responses: { notes: "original note" },
            },
          }),
          update: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
            capturedUpdate = payload;
            return { eq: vi.fn().mockResolvedValue({ error: null }) };
          }),
        };
      }
      if (table === "audit_log") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    });
    createClient.mockResolvedValue({ auth: { getUser: vi.fn() }, from: fromMock });
    const { PATCH } = await import("@/app/api/log/[id]/route");
    const req = new Request(`http://localhost/api/log/${TEST_LOG_ID}`, {
      method: "PATCH",
      body: JSON.stringify({ functional_status: "Active as usual", appetite: "Eating normally" }),
    });
    await PATCH(req, { params: Promise.resolve({ id: TEST_LOG_ID }) });
    expect(capturedUpdate).not.toBeNull();
    const responses = (capturedUpdate as unknown as { responses: Record<string, unknown> }).responses;
    expect(responses.notes).toBe("original note");
    expect(responses.functional_status).toBe("Active as usual");
    expect(responses.appetite).toBe("Eating normally");
  });

  it("7. returns 403 when user role is not allowed", async () => {
    const { getUserFromRequest } = await import("@/lib/auth/get-user");
    (getUserFromRequest as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: TEST_CAREGIVER.id,
      email: TEST_CAREGIVER.email,
      role: "admin",
      organization_id: TEST_CAREGIVER.organization_id,
      is_demo: false,
      auth_method: "supabase_legacy" as const,
    });
    createClient.mockResolvedValue(makeSupabase({}));
    const { PATCH } = await import("@/app/api/log/[id]/route");
    const req = new Request(`http://localhost/api/log/${TEST_LOG_ID}`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: TEST_LOG_ID }) });
    expect(res.status).toBe(403);
  });
});
