/**
 * Sprint auth-providers — Phone + SMS OTP.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const signInWithOtp = vi.fn();
const verifyOtp = vi.fn();

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock("@mobile/lib/supabase-client", () => ({
  supabase: {
    auth: { signInWithOtp, verifyOtp },
  },
}));

describe("Phone OTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInWithOtp.mockResolvedValue({ data: {}, error: null });
    verifyOtp.mockResolvedValue({ data: { session: {} }, error: null });
  });

  it("sendPhoneOTP calls supabase.auth.signInWithOtp with phone", async () => {
    const { sendPhoneOTP } = await import("@mobile/lib/auth/phone");
    await sendPhoneOTP("+15551234567");
    expect(signInWithOtp).toHaveBeenCalledOnce();
    expect(signInWithOtp.mock.calls[0][0]).toEqual({ phone: "+15551234567" });
  });

  it("rejects non-E.164 phone numbers before calling Supabase", async () => {
    const { sendPhoneOTP } = await import("@mobile/lib/auth/phone");
    const result = await sendPhoneOTP("555-1234");
    expect(result.error).toBeInstanceOf(Error);
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("verifyPhoneOTP calls supabase.auth.verifyOtp with type: sms", async () => {
    const { verifyPhoneOTP } = await import("@mobile/lib/auth/phone");
    await verifyPhoneOTP("+15551234567", "123456");
    expect(verifyOtp).toHaveBeenCalledOnce();
    const arg = verifyOtp.mock.calls[0][0];
    expect(arg.phone).toBe("+15551234567");
    expect(arg.token).toBe("123456");
    expect(arg.type).toBe("sms");
  });

  it("isValidE164 accepts 6-digit and longer E.164 formats only", async () => {
    const { isValidE164 } = await import("@mobile/lib/auth/phone");
    expect(isValidE164("+15551234567")).toBe(true);
    expect(isValidE164("+447911123456")).toBe(true);
    expect(isValidE164("555-1234")).toBe(false);
    expect(isValidE164("15551234567")).toBe(true); // optional + allowed
    expect(isValidE164("+0")).toBe(false); // too short
    expect(isValidE164("")).toBe(false);
  });
});
