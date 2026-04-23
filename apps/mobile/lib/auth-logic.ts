/**
 * Pure auth logic — no React Native imports, fully testable in jsdom/Node.
 */

export type UserRole = "caregiver" | "patient" | "provider" | "admin";

export const DISCLAIMER_VERSION = "1.0";

export interface UserRecord {
  id?: string;
  role?: string | null;
  organization_id?: string | null;
}

export interface DisclaimerAcceptance {
  disclaimer_version: string;
}

/**
 * Returns the home route path for a given role.
 */
export function getHomeRouteForRole(role: UserRole): string {
  switch (role) {
    case "caregiver":
      return "/(home)/caregiver";
    case "patient":
      return "/(home)/patient";
    case "provider":
      return "/(home)/provider";
    case "admin":
      return "/(home)/admin";
    default:
      return "/(auth)/login";
  }
}

/**
 * Returns true if the disclaimer modal should be shown to the user.
 * Shows when no acceptance record exists or the version has changed.
 */
export function shouldShowDisclaimer(
  acceptance: DisclaimerAcceptance | null | undefined
): boolean {
  if (!acceptance) return true;
  return acceptance.disclaimer_version !== DISCLAIMER_VERSION;
}

/**
 * Returns true if the user with the given role can access the given route segment.
 */
export function canAccessRoute(role: UserRole, routeSegment: string): boolean {
  if (routeSegment === "(home)/caregiver") return role === "caregiver";
  if (routeSegment === "(home)/patient") return role === "patient";
  if (routeSegment === "(home)/provider") return role === "provider";
  if (routeSegment === "(home)/admin") return role === "admin";
  // Shared routes (onboarding, modals) are accessible to all authenticated roles
  return true;
}

/**
 * Extracts the typed role from a user record, returning null if unset or invalid.
 */
export function extractRoleFromUserRecord(
  userRecord: UserRecord | null | undefined
): UserRole | null {
  const validRoles: UserRole[] = ["caregiver", "patient", "provider", "admin"];
  if (!userRecord?.role) return null;
  if (validRoles.includes(userRecord.role as UserRole)) {
    return userRecord.role as UserRole;
  }
  return null;
}
