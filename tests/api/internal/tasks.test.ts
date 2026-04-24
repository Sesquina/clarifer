import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: vi.fn(),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  }),
}));

type AnyFn = (...args: unknown[]) => unknown;

function buildSupabase(options: {
  tasks?: Array<Record<string, unknown>>;
  insertReturn?: Record<string, unknown> | null;
  updateReturn?: Record<string, unknown> | null;
  insertError?: { message: string } | null;
}) {
  const tasks = options.tasks ?? [];
  const insertSpy = vi.fn();
  const updateSpy = vi.fn();
  const fromSpy = vi.fn((_table: string) => {
    return {
      select: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(function (this: unknown) {
        return Object.assign(this as object, {
          then(resolve: AnyFn) {
            resolve({ data: tasks, error: null });
          },
        });
      }),
      insert: vi.fn((row: Record<string, unknown>) => {
        insertSpy(row);
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: options.insertReturn ?? { id: "new-task", ...row },
            error: options.insertError ?? null,
          }),
        };
      }),
      update: vi.fn((row: Record<string, unknown>) => {
        updateSpy(row);
        return {
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: options.updateReturn ?? { id: "updated", ...row },
            error: null,
          }),
        };
      }),
    };
  });
  return { fromSpy, insertSpy, updateSpy, client: { from: fromSpy } };
}

describe("GET /api/internal/tasks", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.INTERNAL_API_SECRET = "test-secret-value";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "srv-key";
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. returns tasks grouped by lane with valid bearer", async () => {
    const supabaseMod = await import("@supabase/supabase-js");
    const { client } = buildSupabase({
      tasks: [
        { id: "a", lane: "samira", priority: "high", status: "active", title: "t1" },
        { id: "b", lane: "michael", priority: "medium", status: "active", title: "t2" },
        { id: "c", lane: "blocked", priority: "low", status: "active", title: "t3" },
      ],
    });
    (supabaseMod.createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client);
    const { GET } = await import("@/app/api/internal/tasks/route");
    const res = await GET(
      new Request("http://localhost/api/internal/tasks", {
        headers: { authorization: "Bearer test-secret-value" },
      }) as unknown as import("next/server").NextRequest
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tasks).toHaveLength(3);
    expect(json.byLane.samira).toHaveLength(1);
    expect(json.byLane.michael).toHaveLength(1);
    expect(json.byLane.blocked).toHaveLength(1);
    expect(json.byLane.build).toHaveLength(0);
  });

  it("2. POST creates a task and returns 201", async () => {
    const supabaseMod = await import("@supabase/supabase-js");
    const { client, insertSpy } = buildSupabase({
      insertReturn: { id: "created", title: "New task", lane: "build" },
    });
    (supabaseMod.createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client);
    const { POST } = await import("@/app/api/internal/tasks/route");
    const res = await POST(
      new Request("http://localhost/api/internal/tasks", {
        method: "POST",
        headers: {
          authorization: "Bearer test-secret-value",
          "content-type": "application/json",
        },
        body: JSON.stringify({ title: "New task", lane: "build", priority: "high" }),
      }) as unknown as import("next/server").NextRequest
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.task.id).toBe("created");
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New task", lane: "build" })
    );
  });

  it("3. rejects request without INTERNAL_API_SECRET bearer and no session", async () => {
    const { GET } = await import("@/app/api/internal/tasks/route");
    const res = await GET(
      new Request("http://localhost/api/internal/tasks") as unknown as import("next/server").NextRequest
    );
    expect(res.status).toBe(401);
  });

  it("4. PATCH updates task lane and returns 200", async () => {
    const supabaseMod = await import("@supabase/supabase-js");
    const { client, updateSpy } = buildSupabase({
      updateReturn: { id: "x", lane: "michael" },
    });
    (supabaseMod.createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client);
    const { PATCH } = await import("@/app/api/internal/tasks/[id]/route");
    const res = await PATCH(
      new Request("http://localhost/api/internal/tasks/x", {
        method: "PATCH",
        headers: {
          authorization: "Bearer test-secret-value",
          "content-type": "application/json",
        },
        body: JSON.stringify({ lane: "michael" }),
      }) as unknown as import("next/server").NextRequest,
      { params: Promise.resolve({ id: "x" }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.task.lane).toBe("michael");
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ lane: "michael" })
    );
  });
});
