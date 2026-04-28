/**
 * tests/api/admin/who-ictrp-ingest.test.ts
 * Tests for the admin-only WHO ICTRP CSV ingest endpoint.
 * Tables: mocks users, audit_log; ingest helper is mocked.
 * Auth: exercises 401 (no session), 403 (non-admin), 200 (admin).
 * Sprint: Sprint 10 -- WHO ICTRP Pipeline
 *
 * HIPAA: No PHI. Synthetic admin user.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const ingestMock = vi.fn();
vi.mock("@/lib/trials/who-ictrp-ingest", () => ({
  ingestWhoIctrpCsv: ingestMock,
}));

function makeSupabase(opts: { user?: { id: string } | null; role?: string }) {
  return {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: opts.user === undefined ? { id: "u1" } : opts.user } }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: opts.role ?? "admin", organization_id: "org-A" },
          }),
        };
      }
      if (table === "audit_log") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return {};
    }),
  };
}

describe("POST /api/admin/who-ictrp-ingest", () => {
  beforeEach(() => {
    vi.resetModules();
    ingestMock.mockReset();
    ingestMock.mockResolvedValue({ inserted: 2, updated: 1, errors: [] });
  });

  it("4. admin role returns 200 with inserted/updated counts", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "admin" })
    );
    const { POST } = await import("@/app/api/admin/who-ictrp-ingest/route");
    const res = await POST(
      new Request("http://localhost/api/admin/who-ictrp-ingest", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ csv_text: "TrialID,Public title\nNCT1,Test" }),
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.inserted).toBe(2);
    expect(json.updated).toBe(1);
  });

  it("5. non-admin role returns 403", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "caregiver" })
    );
    const { POST } = await import("@/app/api/admin/who-ictrp-ingest/route");
    const res = await POST(
      new Request("http://localhost/api/admin/who-ictrp-ingest", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ csv_text: "x" }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("6. unauthenticated returns 401", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: null })
    );
    const { POST } = await import("@/app/api/admin/who-ictrp-ingest/route");
    const res = await POST(
      new Request("http://localhost/api/admin/who-ictrp-ingest", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ csv_text: "x" }),
      })
    );
    expect(res.status).toBe(401);
  });
});
