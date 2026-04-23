/**
 * Sprint 6 — rate limiting on /login path via proxy.ts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const loginLimit = vi.fn();

vi.mock("@/lib/ratelimit", () => ({
  loginLimiter: { limit: loginLimit },
  signupLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn().mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  }),
}));

describe("Sprint 6 — auth rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("6th POST attempt to /login in 15 minutes → 429", async () => {
    // First five: success; sixth: rejected.
    loginLimit
      .mockResolvedValueOnce({ success: true, reset: Date.now() + 900_000 })
      .mockResolvedValueOnce({ success: true, reset: Date.now() + 900_000 })
      .mockResolvedValueOnce({ success: true, reset: Date.now() + 900_000 })
      .mockResolvedValueOnce({ success: true, reset: Date.now() + 900_000 })
      .mockResolvedValueOnce({ success: true, reset: Date.now() + 900_000 })
      .mockResolvedValueOnce({ success: false, reset: Date.now() + 900_000 });

    const { proxy } = await import("@/proxy");

    function makeReq() {
      const req = new Request("http://localhost/login", {
        method: "POST",
        headers: { "x-forwarded-for": "1.2.3.4" },
      });
      // NextRequest-compatible: add nextUrl + cookies
      return Object.assign(req, {
        nextUrl: new URL("http://localhost/login"),
        cookies: { get: vi.fn().mockReturnValue(undefined), getAll: vi.fn().mockReturnValue([]) },
      }) as unknown as import("next/server").NextRequest;
    }

    let lastRes: Response | undefined;
    for (let i = 0; i < 6; i += 1) {
      lastRes = await proxy(makeReq());
    }
    expect(lastRes?.status).toBe(429);
  });

  it("429 response includes Retry-After header", async () => {
    loginLimit.mockResolvedValueOnce({ success: false, reset: Date.now() + 600_000 });

    const { proxy } = await import("@/proxy");
    const req = Object.assign(
      new Request("http://localhost/login", {
        method: "POST",
        headers: { "x-forwarded-for": "1.2.3.4" },
      }),
      {
        nextUrl: new URL("http://localhost/login"),
        cookies: { get: vi.fn().mockReturnValue(undefined), getAll: vi.fn().mockReturnValue([]) },
      }
    ) as unknown as import("next/server").NextRequest;

    const res = await proxy(req);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });
});
