/**
 * Colors palette.
 *
 * Contains neutral and system colors shared across all roles and themes:
 * - blue shades (50, 100, 200)
 *
 * These are raw tokens and MUST be mapped to semantic roles
 * before being used in components.
 *
 * This file is intentionally role-agnostic.
 *
 * @example
 * // ❌ Do not use directly
 * borderColor: colors.blue[200]
 *
 * // ✅ Use via semantic role
 * borderColor: theme.border.default
 *
 * @remarks
 * Centralizing system colors here ensures consistency
 * across roles, modes, and platforms.
 */

export const colors = {
  blue: {
    50: '#F9FBFF',
    100: '#EEF2FF',
    200: '#D2ECFE',
  },
} as const;
