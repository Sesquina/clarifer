// Type shims for @mobile/lib/auth/* used by tests.
// The real implementation lives in apps/mobile/lib/auth/ and is loaded at
// runtime via the vitest alias configured in vitest.config.ts. apps/mobile is
// excluded from root tsc compilation (React Native typings conflict with DOM),
// so tests get their type info from this file instead.

declare module "@mobile/lib/auth/google" {
  export const GOOGLE_REDIRECT_URL: string;
  export function signInWithGoogle(): Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
}

declare module "@mobile/lib/auth/apple" {
  export function signInWithApple(): Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
}

declare module "@mobile/lib/auth/phone" {
  export function isValidE164(phone: string): boolean;
  export function sendPhoneOTP(phone: string): Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
  export function verifyPhoneOTP(
    phone: string,
    token: string
  ): Promise<{ data: unknown; error: { message: string } | null }>;
}

declare module "@mobile/lib/auth/password-reset" {
  export const RESET_PASSWORD_REDIRECT: string;
  export function sendPasswordReset(email: string): Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
  export function updatePassword(newPassword: string): Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
}

declare module "@mobile/lib/supabase-client" {
  export const supabase: unknown;
}
