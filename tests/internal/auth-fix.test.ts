import { describe, it, expect } from "vitest";
import { resolveCallbackRedirect } from "@/app/auth/callback/route";

describe("/auth/callback redirect resolution", () => {
  it("1. with next=/internal returns /internal", () => {
    expect(resolveCallbackRedirect("/internal")).toBe("/internal");
    expect(resolveCallbackRedirect("/internal/board")).toBe("/internal");
    expect(resolveCallbackRedirect("/internal/agents/page")).toBe("/internal");
  });

  it("2. with no next param returns /patients", () => {
    expect(resolveCallbackRedirect(null)).toBe("/patients");
    expect(resolveCallbackRedirect(undefined)).toBe("/patients");
    expect(resolveCallbackRedirect("")).toBe("/patients");
    // Unknown next values fall back to /patients (open-redirect protection)
    expect(resolveCallbackRedirect("/home")).toBe("/patients");
    expect(resolveCallbackRedirect("https://evil.com/internal")).toBe("/patients");
    expect(resolveCallbackRedirect("//evil.com")).toBe("/patients");
  });
});
