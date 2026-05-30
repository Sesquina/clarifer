/**
 * tests/api/waitlist.test.ts
 * POST /api/waitlist — new field structure, rate limiting, and Brevo error handling.
 * All external calls (Brevo fetch, Supabase insert, Upstash) are mocked.
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

// Mutable closure lets individual tests flip rate-limit success without re-mocking
const rl = { success: true };
vi.mock("@/lib/ratelimit", () => ({
  waitlistLimiter: { limit: vi.fn().mockImplementation(() => Promise.resolve({ success: rl.success })) },
}));

function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Samira",
      email: "test@example.com",
      languagePreference: "en",
      ...body,
    }),
  });
}

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
    rl.success = true;
    process.env.BREVO_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("returns 200 and success:true when Brevo accepts the contact", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(listLookupOk())
      .mockResolvedValueOnce(new Response("{}", { status: 201 }))
      .mockResolvedValueOnce(new Response("{}", { status: 202 }));

    const { POST } = await import("@/app/api/waitlist/route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });

  it("returns 200 with full new field set (all optional fields populated)", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(listLookupOk())
      .mockResolvedValueOnce(new Response("{}", { status: 201 }))
      .mockResolvedValueOnce(new Response("{}", { status: 202 }));

    const { POST } = await import("@/app/api/waitlist/route");
    const res = await POST(
      makeRequest({
        lastName: "Esquina",
        languagePreference: "es",
        caringFor: "Parent",
        challenges: ["Coordinating family updates", "Managing medications"],
        whyClarifer: "I need help staying organized.",
        marketingOptin: true,
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });

  it("returns 400 when email is missing", async () => {
    const { POST } = await import("@/app/api/waitlist/route");
    const res = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: "Samira" }),
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/email/i);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    rl.success = false;
    const { POST } = await import("@/app/api/waitlist/route");
    const res = await POST(makeRequest());
    expect(res.status).toBe(429);
  });

  it("returns 500 and logs console.error when Brevo /contacts returns 401", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(listLookupOk())
      .mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));

    const { POST } = await import("@/app/api/waitlist/route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Signup failed. Please try again.");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[waitlist]"),
      401,
      expect.any(String)
    );
  });
});
