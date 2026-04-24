/**
 * Sprint auth-providers — password reset flow.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const resetPasswordForEmail = vi.fn();
const updateUser = vi.fn();

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock("@mobile/lib/supabase-client", () => ({
  supabase: {
    auth: { resetPasswordForEmail, updateUser },
  },
}));

describe("Password reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    updateUser.mockResolvedValue({ data: {}, error: null });
  });

  it("sendPasswordReset calls supabase.auth.resetPasswordForEmail with the trimmed email", async () => {
    const { sendPasswordReset } = await import("@mobile/lib/auth/password-reset");
    await sendPasswordReset("  ana@example.com  ");
    expect(resetPasswordForEmail).toHaveBeenCalledOnce();
    expect(resetPasswordForEmail.mock.calls[0][0]).toBe("ana@example.com");
  });

  it("uses the clarifer.com reset-password redirect URL", async () => {
    const { sendPasswordReset, RESET_PASSWORD_REDIRECT } = await import("@mobile/lib/auth/password-reset");
    await sendPasswordReset("ana@example.com");
    expect(RESET_PASSWORD_REDIRECT).toBe("https://clarifer.com/auth/reset-password");
    const opts = resetPasswordForEmail.mock.calls[0][1];
    expect(opts.redirectTo).toBe("https://clarifer.com/auth/reset-password");
  });

  it("rejects invalid email formats with an error", async () => {
    const { sendPasswordReset } = await import("@mobile/lib/auth/password-reset");
    const result = await sendPasswordReset("not-an-email");
    expect(result.error).toBeInstanceOf(Error);
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });
});
