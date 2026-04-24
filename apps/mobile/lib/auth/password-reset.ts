import { supabase } from "../supabase-client";

export const RESET_PASSWORD_REDIRECT = "https://clarifer.com/auth/reset-password";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Send a password-reset email. Redirect lands the user on the reset-password page. */
export async function sendPasswordReset(email: string) {
  const trimmed = email.trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return { data: null, error: new Error("Please enter a valid email address.") };
  }
  const { data, error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: RESET_PASSWORD_REDIRECT,
  });
  return { data, error };
}

/** Update the authenticated user's password after they click the reset email link. */
export async function updatePassword(newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    return { data: null, error: new Error("Password must be at least 8 characters.") };
  }
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
}
