/**
 * tests/api/notifications/list.test.ts
 * Tests for GET /api/notifications -- auth, role, org filter, audit_log,
 * and the ?count=1 shortcut used by the bell badge.
 * Tables: mocks users, notifications, audit_log.
 * Auth: 401 no session, 403 wrong role, 200 caregiver, 200 ?count.
 *
 * HIPAA: synthetic ids only; verifies user_id + organization_id filters.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

interface MakeOpts {
  user?: { id: string } | null;
  role?: string;
  orgId?: string | null;
  rows?: Array<Record<string, unknown>>;
  unreadCount?: number;
}

const lastQueryFilters: Array<{ column: string; value: unknown }> = [];
const auditInserts: Array<Record<string, unknown>> = [];

function makeSupabase(opts: MakeOpts) {
  const orgId = opts.orgId === undefined ? "org-A" : opts.orgId;
  const rows = opts.rows ?? [];
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
          single: vi
            .fn()
            .mockResolvedValue({ data: { role: opts.role ?? "caregiver", organization_id: orgId } }),
        };
      }
      if (table === "notifications") {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockImplementation((_cols: string, options?: { count?: string; head?: boolean }) => {
          if (options?.head) {
            // count branch: terminal chain that resolves with count
            return {
              eq: vi.fn().mockImplementation(function (this: unknown, column: string, value: unknown) {
                lastQueryFilters.push({ column, value });
                return this;
              }),
              then: (resolve: (v: { count: number }) => unknown) =>
                resolve({ count: opts.unreadCount ?? 0 }),
            };
          }
          return chain;
        });
        chain.eq = vi.fn().mockImplementation((column: string, value: unknown) => {
          lastQueryFilters.push({ column, value });
          return chain;
        });
        chain.order = vi.fn().mockReturnValue(chain);
        chain.limit = vi.fn().mockResolvedValue({ data: rows, error: null });
        return chain;
      }
      if (table === "audit_log") {
        return {
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            auditInserts.push(row);
            return {
              then: (onFulfilled: () => void) => {
                onFulfilled();
                return Promise.resolve({ error: null });
              },
            };
          }),
        };
      }
      return {};
    }),
  };
}

describe("GET /api/notifications", () => {
  beforeEach(() => {
    vi.resetModules();
    lastQueryFilters.length = 0;
    auditInserts.length = 0;
  });

  it("returns 401 when no session", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: null })
    );
    const { GET } = await import("@/app/api/notifications/route");
    const res = await GET(new Request("http://localhost/api/notifications"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when user has no organization_id", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ orgId: null })
    );
    const { GET } = await import("@/app/api/notifications/route");
    const res = await GET(new Request("http://localhost/api/notifications"));
    expect(res.status).toBe(401);
  });

  it("returns 403 for unknown role", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ role: "guest" })
    );
    const { GET } = await import("@/app/api/notifications/route");
    const res = await GET(new Request("http://localhost/api/notifications"));
    expect(res.status).toBe(403);
  });

  it("returns the user's notifications scoped to user_id + organization_id, writes audit_log", async () => {
    const rows = [
      { id: "n1", title: "Symptom alert", message: "Pain reported high", type: "symptom_alert", read: false, created_at: "2026-05-27T10:00:00Z", action_url: null },
      { id: "n2", title: "Medication reminder", message: "Dose due", type: "medication_reminder", read: true, created_at: "2026-05-26T08:00:00Z", action_url: null },
    ];
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ rows })
    );
    const { GET } = await import("@/app/api/notifications/route");
    const res = await GET(new Request("http://localhost/api/notifications"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { notifications: unknown[]; unread: number };
    expect(body.notifications).toHaveLength(2);
    expect(body.unread).toBe(1);

    // Filters applied: user_id + organization_id + read=false NOT required here (it's the unread-count branch only)
    expect(lastQueryFilters.find((f) => f.column === "user_id" && f.value === "user-1")).toBeTruthy();
    expect(lastQueryFilters.find((f) => f.column === "organization_id" && f.value === "org-A")).toBeTruthy();

    // Audit log written
    expect(auditInserts).toHaveLength(1);
    expect(auditInserts[0].action).toBe("SELECT");
    expect(auditInserts[0].resource_type).toBe("notifications");
    expect(auditInserts[0].organization_id).toBe("org-A");
  });

  it("?count=1 returns just the unread count and applies read=false filter", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ unreadCount: 4 })
    );
    const { GET } = await import("@/app/api/notifications/route");
    const res = await GET(new Request("http://localhost/api/notifications?count=1"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { unread: number };
    expect(body.unread).toBe(4);
    expect(lastQueryFilters.find((f) => f.column === "read" && f.value === false)).toBeTruthy();
    expect(lastQueryFilters.find((f) => f.column === "user_id" && f.value === "user-1")).toBeTruthy();
  });

  it("filter=symptom_alert applies type filter", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ rows: [] })
    );
    const { GET } = await import("@/app/api/notifications/route");
    const res = await GET(new Request("http://localhost/api/notifications?filter=symptom_alert"));
    expect(res.status).toBe(200);
    expect(lastQueryFilters.find((f) => f.column === "type" && f.value === "symptom_alert")).toBeTruthy();
  });
});
