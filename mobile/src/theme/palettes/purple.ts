/**
 * Purple color palette.
 *
 * This file defines the raw purple color scale used across the app.
 * These values are **pure color tokens** and MUST NOT encode any semantic meaning.
 *
 * Usage rules:
 * - Do NOT reference these colors directly in components or screens.
 * - Always consume colors through a semantic role theme (e.g. `roles/user/light`).
 * - These values may change without affecting semantic usage.
 *
 * Scale:
 * - Lower numbers (50–200): very light / background tones
 * - Mid numbers (300–600): primary brand usage
 * - Higher numbers (700–900): emphasis / contrast
 *
 * @example
 * // ❌ Avoid direct usage
 * backgroundColor: purple[500]
 *
 * // ✅ Correct usage
 * backgroundColor: theme.background.accent
 *
 * @remarks
 * Inspired by modern token systems (Material, Tailwind, Radix).
 * Changing a value here will affect all themes that consume it.
 */

export const purple = {
  25: '#FAF5FF',
  50: '#FAF4FF',
  100: '#F6ECFF',
  200: '#F3E0FF',
  300: '#D2C2FF',
  400: '#A56FFF',
  500: '#9500FF',
  600: '#783FCA',
  700: '#570096',
  800: '#4F39F6',
  900: '#2D004F',
} as const;
