/**
 * tests/app/signup.test.ts
 * Unit tests for friendlySignupError — error message mapping on the signup page.
 * Sprint: feat/signup-onboarding
 * HIPAA: No PHI in this file.
 */
import { describe, it, expect } from "vitest";
import { friendlySignupError } from "@/app/signup/page";
import type { AuthError } from "@supabase/supabase-js";

function makeError(message: string, status = 400): AuthError {
  const err = new Error(message) as AuthError;
  err.status = status;
  return err;
}

describe("friendlySignupError", () => {
  it("null → empty string", () => {
    expect(friendlySignupError(null)).toBe("");
  });

  it("'User already registered' → account-exists message", () => {
    expect(friendlySignupError(makeError("User already registered"))).toBe(
      "An account with this email already exists. Sign in instead."
    );
  });

  it("'user already registered' (lowercase) → account-exists message", () => {
    expect(friendlySignupError(makeError("user already registered"))).toBe(
      "An account with this email already exists. Sign in instead."
    );
  });

  it("'email already exists' → account-exists message", () => {
    expect(friendlySignupError(makeError("email already exists"))).toBe(
      "An account with this email already exists. Sign in instead."
    );
  });

  it("'already exists' → account-exists message", () => {
    expect(friendlySignupError(makeError("already exists"))).toBe(
      "An account with this email already exists. Sign in instead."
    );
  });

  it("status 429 → rate-limit message", () => {
    expect(friendlySignupError(makeError("Too many requests", 429))).toBe(
      "Too many attempts. Please wait a moment."
    );
  });

  it("message containing 'rate limit' → rate-limit message", () => {
    expect(friendlySignupError(makeError("rate limit exceeded"))).toBe(
      "Too many attempts. Please wait a moment."
    );
  });

  it("message containing 'too many' → rate-limit message", () => {
    expect(friendlySignupError(makeError("too many requests"))).toBe(
      "Too many attempts. Please wait a moment."
    );
  });

  it("generic server error → generic message", () => {
    expect(friendlySignupError(makeError("Internal server error", 500))).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("unknown error without classification → generic message", () => {
    expect(friendlySignupError(makeError("unexpected failure"))).toBe(
      "Something went wrong. Please try again."
    );
  });
});
