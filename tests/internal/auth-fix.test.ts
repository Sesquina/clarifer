import { describe, it, expect } from "vitest";
import { resolveCallbackRedirect } from "@/app/auth/callback/route";

describe("/auth/callback redirect resolution", () => {
  it("1. with next=/hq returns /hq (renamed from /internal)", () => {
    expect(resolveCallbackRedirect("/hq")).toBe("/hq");
    expect(resolveCallbackRedirect("/hq/board")).toBe("/hq");
    expect(resolveCallbackRedirect("/hq/agents/page")).toBe("/hq");
  });

  it("2. with no next param returns /home", () => {
    expect(resolveCallbackRedirect(null)).toBe("/home");
    expect(resolveCallbackRedirect(undefined)).toBe("/home");
    expect(resolveCallbackRedirect("")).toBe("/home");
    // Unknown next values fall back to /home (open-redirect protection)
    expect(resolveCallbackRedirect("/home")).toBe("/home");
    expect(resolveCallbackRedirect("https://evil.com/hq")).toBe("/home");
    expect(resolveCallbackRedirect("//evil.com")).toBe("/home");
  });
});
