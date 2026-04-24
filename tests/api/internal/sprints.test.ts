import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  }),
}));

type AnyFn = (...args: unknown[]) => unknown;

function buildSupabase(rows: Array<Record<string, unknown>>) {
  const insertSpy = vi.fn();
  const client = {
    from: vi.fn((_t: string) => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(function (this: unknown) {
        return Object.assign(this as object, {
          then(resolve: AnyFn) {
            resolve({ data: rows, error: null });
          },
        });
      }),
      insert: vi.fn((row: Record<string, unknown>) => {
        insertSpy(row);
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: "sprint-new", ...row },
            error: null,
          }),
        };
      }),
    })),
  };
  return { client, insertSpy };
}

describe("/api/internal/sprints", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.INTERNAL_API_SECRET = "test-secret-value";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "srv-key";
  });
  afterEach(() => vi.restoreAllMocks());

  it("5. POST creates a sprint_update and returns 201", async () => {
    const supabaseMod = await import("@supabase/supabase-js");
    const { client, insertSpy } = buildSupabase([]);
    (supabaseMod.createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client);
    const { POST } = await import("@/app/api/internal/sprints/route");
    const res = await POST(
      new Request("http://localhost/api/internal/sprints", {
        method: "POST",
        headers: {
          authorization: "Bearer test-secret-value",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sprint_name: "sprint-cc-command-center",
          summary: "Built the command center",
          tests_before: 136,
          tests_after: 151,
          files_changed: 20,
        }),
      }) as unknown as import("next/server").NextRequest
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.sprint.sprint_name).toBe("sprint-cc-command-center");
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ sprint_name: "sprint-cc-command-center" })
    );
  });

  it("6. GET returns sprints ordered newest first", async () => {
    const supabaseMod = await import("@supabase/supabase-js");
    const rows = [
      { id: "s2", sprint_name: "sprint-9", created_at: "2026-04-26T00:00:00Z" },
      { id: "s1", sprint_name: "sprint-8", created_at: "2026-04-23T00:00:00Z" },
    ];
    const { client } = buildSupabase(rows);
    (supabaseMod.createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client);
    const { GET } = await import("@/app/api/internal/sprints/route");
    const res = await GET(
      new Request("http://localhost/api/internal/sprints", {
        headers: { authorization: "Bearer test-secret-value" },
      }) as unknown as import("next/server").NextRequest
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sprints).toHaveLength(2);
    expect(json.sprints[0].sprint_name).toBe("sprint-9");
  });

  it("7. rejects without auth header", async () => {
    const { POST } = await import("@/app/api/internal/sprints/route");
    const res = await POST(
      new Request("http://localhost/api/internal/sprints", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sprint_name: "x", summary: "y" }),
      }) as unknown as import("next/server").NextRequest
    );
    expect(res.status).toBe(401);
  });
});
