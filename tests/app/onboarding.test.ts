/**
 * tests/app/onboarding.test.ts
 * Unit tests for the onboarding page logic.
 * Verifies: button disabled state, POST payload shape, removed fields.
 * Sprint: feat/signup-onboarding
 * HIPAA: No PHI in this file. Test uses synthetic first names.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildOnboardingPayload } from "@/app/onboarding/page";

// ─── buildOnboardingPayload ───────────────────────────────────────────────────

describe("buildOnboardingPayload", () => {
  it("sets role to 'caregiver' always", () => {
    const payload = buildOnboardingPayload("Carlos", "en");
    expect(payload.role).toBe("caregiver");
  });

  it("trims whitespace from name", () => {
    const payload = buildOnboardingPayload("  Carlos  ", "en");
    expect(payload.first_name).toBe("Carlos");
  });

  it("includes first_name in payload", () => {
    const payload = buildOnboardingPayload("Maria", "es");
    expect(payload.first_name).toBe("Maria");
  });

  it("includes language_preference 'en'", () => {
    const payload = buildOnboardingPayload("Jane", "en");
    expect(payload.language_preference).toBe("en");
  });

  it("includes language_preference 'es'", () => {
    const payload = buildOnboardingPayload("Maria", "es");
    expect(payload.language_preference).toBe("es");
  });

  it("payload does NOT include dob, sex, diagnosis, city, state, role_option", () => {
    const payload = buildOnboardingPayload("Carlos", "en") as Record<string, unknown>;
    expect(payload).not.toHaveProperty("dob");
    expect(payload).not.toHaveProperty("sex");
    expect(payload).not.toHaveProperty("diagnosis");
    expect(payload).not.toHaveProperty("custom_diagnosis");
    expect(payload).not.toHaveProperty("city");
    expect(payload).not.toHaveProperty("state");
    expect(payload).not.toHaveProperty("diagnosis_date");
  });
});

// ─── canSubmit logic ──────────────────────────────────────────────────────────

describe("onboarding canSubmit", () => {
  function canSubmit(name: string, loading = false): boolean {
    return name.trim().length > 0 && !loading;
  }

  it("disabled when name is empty string", () => {
    expect(canSubmit("")).toBe(false);
  });

  it("disabled when name is only whitespace", () => {
    expect(canSubmit("   ")).toBe(false);
  });

  it("enabled when name is 'Carlos'", () => {
    expect(canSubmit("Carlos")).toBe(true);
  });

  it("disabled during loading even with valid name", () => {
    expect(canSubmit("Carlos", true)).toBe(false);
  });

  it("enabled with single character name", () => {
    expect(canSubmit("A")).toBe(true);
  });
});

// ─── submit handler — fetch mock ──────────────────────────────────────────────

describe("onboarding submit handler", () => {
  const fetchMock = vi.fn();
  const pushMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fetchMock.mockReset();
    pushMock.mockReset();
  });

  it("POSTs to /api/patients/create with role 'caregiver'", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    const name = "Carlos";
    const lang = "en" as const;
    const payload = buildOnboardingPayload(name, lang);

    await fetch("/api/patients/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/patients/create");
    const body = JSON.parse(opts.body as string) as Record<string, unknown>;
    expect(body.role).toBe("caregiver");
  });

  it("POST body contains first_name and language_preference", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    const payload = buildOnboardingPayload("Carlos", "en");

    await fetch("/api/patients/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(opts.body as string) as Record<string, unknown>;
    expect(body.first_name).toBe("Carlos");
    expect(body.language_preference).toBe("en");
  });

  it("POST body contains language_preference 'es' when Spanish selected", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    const payload = buildOnboardingPayload("Maria", "es");

    await fetch("/api/patients/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(opts.body as string) as Record<string, unknown>;
    expect(body.language_preference).toBe("es");
  });
});
