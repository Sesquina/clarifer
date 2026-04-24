// Test-only stub for expo-apple-authentication. Real module pulls in
// react-native at module load which vitest cannot parse (Flow syntax).
// Tests override this via vi.mock("expo-apple-authentication", ...).
export const AppleAuthenticationScope = {
  FULL_NAME: "full_name",
  EMAIL: "email",
} as const;

export async function signInAsync(): Promise<{
  identityToken: string | null;
  fullName: { givenName: string | null; familyName: string | null } | null;
}> {
  throw new Error("expo-apple-authentication stub called — mock it in tests");
}
