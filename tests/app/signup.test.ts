/**
 * tests/app/signup.test.ts
 * Unit tests for friendlySignupError — error message mapping on the signup page.
 * Sprint: feat/signup-onboarding
 * HIPAA: No PHI in this file.
 */
import { describe, it, expect } from "vitest";
import { friendlySignupError } from "@/app/signup/page";

describe("friendlySignupError", () => {
  it("null → empty string", () => {
    expect(friendlySignupError(null)).toBe("");
  });

  it("empty string → empty string", () => {
    expect(friendlySignupError("")).toBe("");
  });

  it("'User already registered' → account-exists message", () => {
    expect(friendlySignupError("User already registered")).toBe(
      "An account with this email already exists. Sign in instead."
    );
  });

  it("'user already registered' (lowercase) → account-exists message", () => {
    expect(friendlySignupError("user already registered")).toBe(
      "An account with this email already exists. Sign in instead."
    );
  });

  it("'email already exists' → account-exists message", () => {
    expect(friendlySignupError("email already exists")).toBe(
      "An account with this email already exists. Sign in instead."
    );
  });

  it("'already exists' → account-exists message", () => {
    expect(friendlySignupError("already exists")).toBe(
      "An account with this email already exists. Sign in instead."
    );
  });

  it("'Too many requests' → rate-limit message", () => {
    expect(friendlySignupError("Too many requests")).toBe(
      "Too many attempts. Please wait a moment."
    );
  });

  it("'rate limit exceeded' → rate-limit message", () => {
    expect(friendlySignupError("rate limit exceeded")).toBe(
      "Too many attempts. Please wait a moment."
    );
  });

  it("'too many requests' → rate-limit message", () => {
    expect(friendlySignupError("too many requests")).toBe(
      "Too many attempts. Please wait a moment."
    );
  });

  it("generic server error → generic message", () => {
    expect(friendlySignupError("Internal server error")).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("unknown error without classification → generic message", () => {
    expect(friendlySignupError("unexpected failure")).toBe(
      "Something went wrong. Please try again."
    );
  });
});
