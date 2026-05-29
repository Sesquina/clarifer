/**
 * tests/api/waitlist.test.ts
 * POST /api/waitlist — Brevo integration error handling.
 * Verifies that a successful Brevo response → 200, and a failed
 * Brevo response → 500 with a console.error log.
 * All external calls (Brevo fetch, Supabase insert) are mocked.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/sanitize", () => ({
  stripHtml: vi.fn().mockImplementation((s: string) => s),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}));

function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", ...body }),
  });
}

// Helper: build a mock Brevo list-lookup response (first fetch in getOrCreateList)
function listLookupOk() {
  return new Response(
    JSON.stringify({ lists: [{ id: 1, name: "Clarifer Waitlist" }] }),
    { status: 200 }
  );
}

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    process.env.BREVO_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("returns 200 and success:true when Brevo accepts the contact", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(listLookupOk())                                    // GET /contacts/lists
      .mockResolvedValueOnce(new Response("{}", { status: 201 }))               // POST /contacts
      .mockResolvedValueOnce(new Response("{}", { status: 202 }));              // POST /smtp/email

    const { POST } = await import("@/app/api/waitlist/route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean };
    expect(body.success).toBe(true);
  });

  it("returns 500 and logs console.error when Brevo /contacts returns 401", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(listLookupOk())                                     // GET /contacts/lists
      .mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));    // POST /contacts → fail

    const { POST } = await import("@/app/api/waitlist/route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Signup failed. Please try again.");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[waitlist]"),
      401,
      expect.any(String)
    );
  });
});
