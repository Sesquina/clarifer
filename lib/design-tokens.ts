/**
 * Design tokens shared by web and mobile.
 *
 * Web uses CSS custom properties from app/globals.css; React Native
 * StyleSheet cannot read those, so mobile files import these constants
 * directly. Values must stay in sync with the CSS variables — if you
 * change one, change the other.
 */

export const colors = {
  background: "#F7F2EA",
  primary: "#2C5F4A",
  accent: "#C4714A",
  card: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  ok: "#2C5F4A",
  flag: "#C4714A",
  border: "#E8E2D9",
  paleSage: "#F0F5F2",
  paleTerra: "#FDF3EE",
  // Utility values used rarely but still worth sharing
  white: "#FFFFFF",
  error: "#C4714A",
  shadow: "#000000",
} as const;

export const typography = {
  displayFont: "Playfair_Display",
  bodyFont: "DMSans",
  sizeMeta: 13,
  sizeBody: 16,
  sizeLabel: 14,
  sizeTitle: 24,
  sizeHero: 28,
  weightRegular: "400" as const,
  weightMedium: "500" as const,
  weightSemibold: "600" as const,
  weightBold: "700" as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  input: 12,
  tile: 14,
  card: 16,
  pill: 26,
} as const;

export const touchTarget = {
  minimum: 48,
} as const;

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;
