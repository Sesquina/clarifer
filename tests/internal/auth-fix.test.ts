import { describe, it, expect } from "vitest";
import { resolveCallbackRedirect } from "@/app/auth/callback/route";

describe("/auth/callback redirect resolution", () => {
  it("1. with next=/internal returns /internal", () => {
    expect(resolveCallbackRedirect("/internal")).toBe("/internal");
    expect(resolveCallbackRedirect("/internal/board")).toBe("/internal");
    expect(resolveCallbackRedirect("/internal/agents/page")).toBe("/internal");
  });

  it("2. with no next param returns /home", () => {
    expect(resolveCallbackRedirect(null)).toBe("/home");
    expect(resolveCallbackRedirect(undefined)).toBe("/home");
    expect(resolveCallbackRedirect("")).toBe("/home");
    // Unknown next values fall back to /home (open-redirect protection)
    expect(resolveCallbackRedirect("/home")).toBe("/home");
    expect(resolveCallbackRedirect("https://evil.com/internal")).toBe("/home");
    expect(resolveCallbackRedirect("//evil.com")).toBe("/home");
  });
});
