import { supabase } from "../supabase-client";

/** Clarifer custom scheme for returning to the native app after OAuth. */
export const GOOGLE_REDIRECT_URL = "clarifer://auth/callback";

/** Sign in with Google via Supabase's OAuth flow. Works on web + iOS + Android. */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: GOOGLE_REDIRECT_URL,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  return { data, error };
}
