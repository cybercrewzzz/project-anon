/**
 * Common color palette.
 *
 * Contains neutral and system colors shared across all roles and themes:
 * - grayscale
 * - semantic system colors (error, success, warning, info)
 * - base white and black
 *
 * These are raw tokens and MUST be mapped to semantic roles
 * before being used in components.
 *
 * This file is intentionally role-agnostic.
 *
 * @example
 * // ❌ Do not use directly
 * borderColor: common.gray[200]
 *
 * // ✅ Use via semantic role
 * borderColor: theme.border.default
 *
 * @remarks
 * Centralizing system colors here ensures consistency
 * across roles, modes, and platforms.
 */

export const common = {
  white: "#FFFFFF",
  black: "#050607",

  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#B8B8B8",
    500: "#6B7280",
    600: "#4F4F4F",
    700: "#374151",
  },

  red: {
    500: "#D62828",
    700: "#B51A28",
  },

  green: {
    500: "#36D367",
    600: "#26D367",
  },

  yellow: {
    500: "#F39C12",
    600: "#D48618",
  },

  blue: {
    500: "#349EDB",
  },
} as const;
