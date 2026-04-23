/**
 * Sprint 6 — lib/env.ts validates environment variables at startup.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const REQUIRED = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
  ANTHROPIC_API_KEY: "sk-ant-test",
} as const;

const originalEnv = { ...process.env };

function clearEnv() {
  for (const key of Object.keys(REQUIRED)) {
    delete process.env[key];
  }
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
}

describe("Sprint 6 — env validation", () => {
  beforeEach(() => {
    vi.resetModules();
    clearEnv();
  });

  afterAll(() => {
    clearEnv();
    Object.assign(process.env, originalEnv);
  });

  it("throws when ANTHROPIC_API_KEY is missing", async () => {
    Object.assign(process.env, REQUIRED);
    delete process.env.ANTHROPIC_API_KEY;
    await expect(import("@/lib/env")).rejects.toThrow();
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is not a URL", async () => {
    Object.assign(process.env, REQUIRED, { NEXT_PUBLIC_SUPABASE_URL: "not-a-url" });
    await expect(import("@/lib/env")).rejects.toThrow();
  });

  it("passes when all required env vars are present", async () => {
    Object.assign(process.env, REQUIRED);
    const mod = await import("@/lib/env");
    expect(mod.env.NEXT_PUBLIC_SUPABASE_URL).toBe(REQUIRED.NEXT_PUBLIC_SUPABASE_URL);
    expect(mod.env.ANTHROPIC_API_KEY).toBe(REQUIRED.ANTHROPIC_API_KEY);
  });
});
