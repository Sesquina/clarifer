import { supabase } from "../supabase-client";

/** E.164: optional +, 1-3 digit country code, then 4-14 digits. */
const E164_REGEX = /^\+?[1-9]\d{1,14}$/;

export function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone);
}

/** Send a 6-digit SMS OTP via Supabase. Phone must be E.164 (`+15551234567`). */
export async function sendPhoneOTP(phone: string) {
  if (!isValidE164(phone)) {
    return {
      data: null,
      error: new Error("Phone number must be in E.164 format (e.g. +15551234567)."),
    };
  }
  const { data, error } = await supabase.auth.signInWithOtp({ phone });
  return { data, error };
}

/** Verify a 6-digit SMS OTP. Returns a Supabase session on success. */
export async function verifyPhoneOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  return { data, error };
}
