/**
 * tests/hq/passcode-gate.test.ts
 * Verifies the /hq passcode gate:
 *   - POST /api/hq/auth: correct passcode sets cookie, wrong passcode returns 401,
 *     missing env var returns 500.
 *   - Middleware: missing cookie redirects to /hq/login, valid cookie passes through.
 *
 * Sprint: fix/hq-rename-and-passcode
 * HIPAA: No PHI in this file.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "crypto";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Shared test constants
// ---------------------------------------------------------------------------

const TEST_PASSCODE = "test-passcode-for-hq-gate";
const SALT = "clarifer-hq-salt";
const EXPECTED_COOKIE_VALUE = createHash("sha256")
  .update(TEST_PASSCODE + SALT)
  .digest("hex");

// ---------------------------------------------------------------------------
// Middleware mocks (needed because middleware creates a Supabase client)
// ---------------------------------------------------------------------------

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}));

vi.mock("@/lib/ratelimit", () => ({
  loginLimiter: {
    limit: vi.fn().mockResolvedValue({ success: true, reset: Date.now() + 60000 }),
  },
  signupLimiter: {
    limit: vi.fn().mockResolvedValue({ success: true, reset: Date.now() + 60000 }),
  },
}));

// ---------------------------------------------------------------------------
// POST /api/hq/auth
// ---------------------------------------------------------------------------

describe("POST /api/hq/auth", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.INTERNAL_PASSCODE = TEST_PASSCODE;
  });

  afterEach(() => {
    delete process.env.INTERNAL_PASSCODE;
  });

  it("returns 200 and sets hq_session cookie on correct passcode", async () => {
    const { POST } = await import("@/app/api/hq/auth/route");
    const req = new Request("http://localhost/api/hq/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: TEST_PASSCODE }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    // Cookie must be present with the correct name
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain("hq_session");
    // Cookie value must be the expected sha256 hash
    expect(setCookie).toContain(EXPECTED_COOKIE_VALUE);
  });

  it("returns 401 and sets no cookie on incorrect passcode", async () => {
    const { POST } = await import("@/app/api/hq/auth/route");
    const req = new Request("http://localhost/api/hq/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "wrong-passcode-999" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toMatch(/incorrect/i);

    // No session cookie should be set
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeNull();
  });

  it("returns 500 when INTERNAL_PASSCODE env var is missing", async () => {
    delete process.env.INTERNAL_PASSCODE;
    const { POST } = await import("@/app/api/hq/auth/route");
    const req = new Request("http://localhost/api/hq/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "anything" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/server configuration/i);
  });
});

// ---------------------------------------------------------------------------
// Middleware /hq protection
// ---------------------------------------------------------------------------

describe("Middleware /hq protection", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.INTERNAL_PASSCODE = TEST_PASSCODE;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  afterEach(() => {
    delete process.env.INTERNAL_PASSCODE;
  });

  it("redirects to /hq/login when hq_session cookie is missing", async () => {
    const { middleware } = await import("@/middleware");
    const req = new NextRequest("http://localhost/hq/board");
    const res = await middleware(req);
    // Must be a redirect
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toContain("/hq/login");
  });

  it("redirects to /hq/login when hq_session cookie has wrong value", async () => {
    const { middleware } = await import("@/middleware");
    const req = new NextRequest("http://localhost/hq/board", {
      headers: { cookie: "hq_session=wrong-hash-value" },
    });
    const res = await middleware(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toContain("/hq/login");
  });

  it("passes through to /hq when hq_session cookie has correct value", async () => {
    const { middleware } = await import("@/middleware");
    const req = new NextRequest("http://localhost/hq/board", {
      headers: { cookie: `hq_session=${EXPECTED_COOKIE_VALUE}` },
    });
    const res = await middleware(req);
    // Must NOT redirect to /hq/login
    const location = res.headers.get("location") ?? "";
    expect(location).not.toContain("/hq/login");
  });

  it("does not gate /hq/login itself (allows unauthenticated access)", async () => {
    const { middleware } = await import("@/middleware");
    // No cookie -- but visiting /hq/login, which is the excluded path
    const req = new NextRequest("http://localhost/hq/login");
    const res = await middleware(req);
    // Should not redirect to /hq/login (that would be an infinite redirect loop)
    const location = res.headers.get("location") ?? "";
    expect(location).not.toContain("/hq/login");
  });
});
