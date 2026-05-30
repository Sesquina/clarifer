/**
 * tests/api/waitlist.test.ts
 * POST /api/waitlist — Supabase insert, SMTP notification, rate limiting.
 * All external calls (Supabase, nodemailer, Upstash) are mocked.
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

// Mutable closure lets test 5 simulate SMTP failure without re-mocking
const smtp = { shouldFail: false };
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockImplementation(() => ({
      sendMail: vi.fn().mockImplementation(() =>
        smtp.shouldFail
          ? Promise.reject(new Error("SMTP connection refused"))
          : Promise.resolve({ messageId: "test-id" })
      ),
    })),
  },
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

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    rl.success = true;
    smtp.shouldFail = false;
    process.env.BREVO_SMTP_HOST = "smtp-relay.brevo.com";
    process.env.BREVO_SMTP_USER = "aaa008001@smtp-brevo.com";
    process.env.BREVO_SMTP_PASS = "test-smtp-pass";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("returns 200 and success:true on a valid minimal signup", async () => {
    const { POST } = await import("@/app/api/waitlist/route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });

  it("returns 200 with full field set (all optional fields populated)", async () => {
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

  it("SMTP failure logs error but still returns 200 (signup already succeeded)", async () => {
    smtp.shouldFail = true;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { POST } = await import("@/app/api/waitlist/route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[waitlist]"),
      expect.any(Error)
    );
  });
});
