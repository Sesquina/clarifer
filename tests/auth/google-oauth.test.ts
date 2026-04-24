/**
 * Sprint auth-providers — Google OAuth flow.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const signInWithOAuth = vi.fn();
const onAuthStateChange = vi.fn();

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock("@mobile/lib/supabase-client", () => ({
  supabase: {
    auth: {
      signInWithOAuth,
      onAuthStateChange,
    },
  },
}));

describe("Google OAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInWithOAuth.mockResolvedValue({ data: { url: "https://accounts.google.com/..." }, error: null });
  });

  it("calls supabase.auth.signInWithOAuth with provider: google", async () => {
    const { signInWithGoogle } = await import("@mobile/lib/auth/google");
    await signInWithGoogle();
    expect(signInWithOAuth).toHaveBeenCalledOnce();
    const arg = signInWithOAuth.mock.calls[0][0];
    expect(arg.provider).toBe("google");
  });

  it("uses the clarifer:// redirect scheme", async () => {
    const { signInWithGoogle, GOOGLE_REDIRECT_URL } = await import("@mobile/lib/auth/google");
    await signInWithGoogle();
    const arg = signInWithOAuth.mock.calls[0][0];
    expect(arg.options.redirectTo).toBe("clarifer://auth/callback");
    expect(GOOGLE_REDIRECT_URL).toMatch(/^clarifer:\/\//);
  });

  it("requests offline access + consent prompt (needed for refresh tokens)", async () => {
    const { signInWithGoogle } = await import("@mobile/lib/auth/google");
    await signInWithGoogle();
    const arg = signInWithOAuth.mock.calls[0][0];
    expect(arg.options.queryParams.access_type).toBe("offline");
    expect(arg.options.queryParams.prompt).toBe("consent");
  });
});
