/**
 * Sprint auth-providers — Apple Sign In.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const signInAsync = vi.fn();
const signInWithIdToken = vi.fn();
const updateUser = vi.fn();

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock("expo-apple-authentication", () => ({
  signInAsync,
  AppleAuthenticationScope: {
    FULL_NAME: "full_name",
    EMAIL: "email",
  },
}));

vi.mock("@mobile/lib/supabase-client", () => ({
  supabase: {
    auth: {
      signInWithIdToken,
      updateUser,
    },
  },
}));

describe("Apple Sign In", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInAsync.mockResolvedValue({
      identityToken: "mock-identity-token",
      fullName: { givenName: "Jane", familyName: "Doe" },
    });
    signInWithIdToken.mockResolvedValue({ data: { session: {} }, error: null });
    updateUser.mockResolvedValue({ data: {}, error: null });
  });

  it("calls supabase.auth.signInWithIdToken with the Apple identity token", async () => {
    const { signInWithApple } = await import("@mobile/lib/auth/apple");
    await signInWithApple();
    expect(signInWithIdToken).toHaveBeenCalledOnce();
    const arg = signInWithIdToken.mock.calls[0][0];
    expect(arg.provider).toBe("apple");
    expect(arg.token).toBe("mock-identity-token");
  });

  it("persists the Apple-supplied full name via updateUser (Apple only sends it once)", async () => {
    const { signInWithApple } = await import("@mobile/lib/auth/apple");
    await signInWithApple();
    expect(updateUser).toHaveBeenCalledOnce();
    const arg = updateUser.mock.calls[0][0];
    expect(arg.data.full_name).toBe("Jane Doe");
  });
});
