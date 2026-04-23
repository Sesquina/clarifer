/**
 * Sprint 4 — Mobile auth flow tests
 * Tests pure auth-logic functions (no React Native imports).
 * Screen components cannot be rendered in jsdom; logic is extracted
 * into apps/mobile/lib/auth-logic.ts for testability.
 */
import { describe, it, expect } from "vitest";
import {
  getHomeRouteForRole,
  shouldShowDisclaimer,
  canAccessRoute,
  extractRoleFromUserRecord,
  DISCLAIMER_VERSION,
  UserRole,
} from "../../apps/mobile/lib/auth-logic";

describe("Mobile auth flow — auth-logic unit tests", () => {
  // ── Test 1: getHomeRouteForRole maps each role correctly ──────────────────

  it("Test 1: getHomeRouteForRole returns correct route for each role", () => {
    expect(getHomeRouteForRole("caregiver")).toBe("/(home)/caregiver");
    expect(getHomeRouteForRole("patient")).toBe("/(home)/patient");
    expect(getHomeRouteForRole("provider")).toBe("/(home)/provider");
    expect(getHomeRouteForRole("admin")).toBe("/(home)/admin");
  });

  // ── Test 2: shouldShowDisclaimer — no acceptance record ───────────────────

  it("Test 2: shouldShowDisclaimer returns true when no acceptance exists", () => {
    expect(shouldShowDisclaimer(null)).toBe(true);
    expect(shouldShowDisclaimer(undefined)).toBe(true);
  });

  // ── Test 3: shouldShowDisclaimer — current version accepted ───────────────

  it("Test 3: shouldShowDisclaimer returns false when current version is accepted", () => {
    expect(shouldShowDisclaimer({ disclaimer_version: DISCLAIMER_VERSION })).toBe(false);
  });

  // ── Test 4: shouldShowDisclaimer — old version triggers re-show ───────────

  it("Test 4: shouldShowDisclaimer returns true when accepted version is outdated", () => {
    expect(shouldShowDisclaimer({ disclaimer_version: "0.9" })).toBe(true);
    expect(shouldShowDisclaimer({ disclaimer_version: "0.1" })).toBe(true);
  });

  // ── Test 5: canAccessRoute — role-specific home routes ───────────────────

  it("Test 5: canAccessRoute allows each role only their own home route", () => {
    expect(canAccessRoute("caregiver", "(home)/caregiver")).toBe(true);
    expect(canAccessRoute("caregiver", "(home)/patient")).toBe(false);
    expect(canAccessRoute("caregiver", "(home)/provider")).toBe(false);
    expect(canAccessRoute("caregiver", "(home)/admin")).toBe(false);

    expect(canAccessRoute("patient", "(home)/patient")).toBe(true);
    expect(canAccessRoute("patient", "(home)/caregiver")).toBe(false);

    expect(canAccessRoute("provider", "(home)/provider")).toBe(true);
    expect(canAccessRoute("provider", "(home)/admin")).toBe(false);

    expect(canAccessRoute("admin", "(home)/admin")).toBe(true);
    expect(canAccessRoute("admin", "(home)/caregiver")).toBe(false);
  });

  // ── Test 6: canAccessRoute — shared routes accessible to all roles ────────

  it("Test 6: canAccessRoute allows all roles to access shared routes", () => {
    const roles: UserRole[] = ["caregiver", "patient", "provider", "admin"];
    for (const role of roles) {
      expect(canAccessRoute(role, "(onboarding)/condition-select")).toBe(true);
      expect(canAccessRoute(role, "(modals)/medical-disclaimer")).toBe(true);
    }
  });

  // ── Test 7: extractRoleFromUserRecord — valid role extraction ─────────────

  it("Test 7: extractRoleFromUserRecord returns typed role for valid records", () => {
    expect(extractRoleFromUserRecord({ id: "1", role: "caregiver" })).toBe("caregiver");
    expect(extractRoleFromUserRecord({ id: "2", role: "patient" })).toBe("patient");
    expect(extractRoleFromUserRecord({ id: "3", role: "provider" })).toBe("provider");
    expect(extractRoleFromUserRecord({ id: "4", role: "admin" })).toBe("admin");
  });

  // ── Test 8: extractRoleFromUserRecord — null/invalid cases ───────────────

  it("Test 8: extractRoleFromUserRecord returns null for missing or invalid role", () => {
    expect(extractRoleFromUserRecord(null)).toBeNull();
    expect(extractRoleFromUserRecord(undefined)).toBeNull();
    expect(extractRoleFromUserRecord({ id: "1", role: null })).toBeNull();
    expect(extractRoleFromUserRecord({ id: "1", role: undefined })).toBeNull();
    expect(extractRoleFromUserRecord({ id: "1", role: "superuser" })).toBeNull();
    expect(extractRoleFromUserRecord({ id: "1", role: "" })).toBeNull();
  });

  // ── Test 9: DISCLAIMER_VERSION constant ───────────────────────────────────

  it("Test 9: DISCLAIMER_VERSION is a non-empty string", () => {
    expect(typeof DISCLAIMER_VERSION).toBe("string");
    expect(DISCLAIMER_VERSION.length).toBeGreaterThan(0);
  });

  // ── Test 10: getHomeRouteForRole — unknown role fallback ──────────────────

  it("Test 10: getHomeRouteForRole returns login route for unknown role", () => {
    // @ts-expect-error intentional invalid role for runtime test
    expect(getHomeRouteForRole("unknown")).toBe("/(auth)/login");
    // @ts-expect-error
    expect(getHomeRouteForRole("")).toBe("/(auth)/login");
  });
});
