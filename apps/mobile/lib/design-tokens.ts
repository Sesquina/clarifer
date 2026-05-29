/**
 * design-tokens.ts
 * Single source of truth for all design system values used in mobile screens.
 * Tables: None
 * Auth: Public
 * HIPAA: No PHI in this file.
 */

export const colors = {
  background: "#F7F2EA",
  primary:    "#2C5F4A",
  accent:     "#C4714A",
  card:       "#FFFFFF",
  text:       "#1A1A1A",
  muted:      "#6B6B6B",
  border:     "#E8E2D9",
  paleSage:   "#F0F5F2",
  paleTerra:  "#FDF3EE",
  white:      "#FFFFFF",
} as const;

export const radius = {
  card:  16,
  pill:  26,
  tile:  14,
  input: 12,
} as const;

// 8px base grid
export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const touchTarget = {
  minimum: 48,
} as const;

export const typography = {
  sizeHero:       36,
  sizeTitle:      28,
  sizeBody:       16,
  sizeLabel:      14,
  sizeMeta:       11,
  weightSemibold: "600" as const,
  weightBold:     "700" as const,
} as const;
