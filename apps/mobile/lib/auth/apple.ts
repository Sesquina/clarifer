import { supabase } from "../supabase-client";

/**
 * Sign in with Apple (iOS only). Caller must check Platform.OS === "ios"
 * before invoking. Throws if the user cancels the native prompt.
 *
 * Uses a dynamic import of `expo-apple-authentication` so that unit-test
 * environments (vitest/jsdom) don't try to transform React Native's Flow
 * syntax at module-load time.
 */
export async function signInWithApple() {
  const AppleAuth = await import("expo-apple-authentication");

  const credential = await AppleAuth.signInAsync({
    requestedScopes: [
      AppleAuth.AppleAuthenticationScope.FULL_NAME,
      AppleAuth.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    return {
      data: null,
      error: new Error("Apple did not return an identity token."),
    };
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });

  // Apple only returns full_name on the FIRST sign-in. Persist it via
  // updateUser so we have it for future sessions.
  if (!error && credential.fullName) {
    const parts = [credential.fullName.givenName, credential.fullName.familyName]
      .filter(Boolean)
      .join(" ");
    if (parts) {
      await supabase.auth.updateUser({ data: { full_name: parts } });
    }
  }

  return { data, error };
}
