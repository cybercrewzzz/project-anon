/**
 * -----------------------------------------------------------------------------
 * SPACING TOKENS
 * -----------------------------------------------------------------------------
 *
 * A semantic abstraction over the 4-point grid system.
 *
 * **Guidelines:**
 * - Avoid using raw numbers (e.g., `10`, `15`) in styles.
 * - Prefer **Semantic** tokens (e.g., `screenEdge`) over Primitive tokens (e.g., `lg`).
 * - If you need a value not listed here, check with Design to see if it fits the grid.
 *
 * @example
 * // ✅ Good: Semantic usage
 * <View style={{ paddingHorizontal: spacing.screenEdge }} />
 *
 * // ⚠️ Okay: Primitive usage (for one-off custom layouts)
 * <View style={{ gap: spacing.scale.xs }} />
 */

// -----------------------------------------------------------------------------
// 1. PRIMITIVES
// The raw palette. Avoid exporting these directly if possible.
// -----------------------------------------------------------------------------
export const spacing = {
  s0: 0,
  s1: 2,
  s2: 4,
  s3: 8,
  s4: 16,
  s5: 24,
  s6: 32,
  s7: 48,
  s8: 64,
  s9: 96,
} as const;

export type Spacing = keyof typeof spacing;
