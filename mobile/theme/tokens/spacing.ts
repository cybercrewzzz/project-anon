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
const primitives = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

// -----------------------------------------------------------------------------
// 2. SEMANTICS
// The public API. Describes intent rather than size.
// -----------------------------------------------------------------------------
export const spacing = {
  /**
   * **0px**
   * Force no spacing. Useful for resetting defaults.
   */
  none: primitives.none,

  /* -------------------------- MICRO INTERACTION ------------------------- */

  /**
   * **4px** (Primitive: `xs`)
   * Extremely tight spacing.
   * @usage Grouping a label with its value, or an input with its error text.
   */
  micro: primitives.xs,

  /**
   * **8px** (Primitive: `sm`)
   * Small gap for related items.
   * @usage Space between an icon and text, or tags in a row.
   */
  iconGap: primitives.sm,

  /**
   * **12px** (Primitive: `md`)
   * Standard gap for lists and forms.
   * @usage Vertical space between stacked input fields.
   */
  itemGap: primitives.md,

  /* -------------------------- CONTAINERS -------------------------------- */

  /**
   * **16px** (Primitive: `lg`)
   * Standard internal padding.
   * @usage Padding inside Cards, Buttons, or Modals.
   */
  gutter: primitives.lg,

  /**
   * **16px** (Primitive: `lg`)
   * The "Safe Zone" for the sides of the device.
   * @usage `paddingHorizontal` for the root screen container.
   */
  screenEdge: primitives.lg,

  /* -------------------------- LAYOUT & SECTIONS ------------------------- */

  /**
   * **24px** (Primitive: `xl`)
   * Distinct separation.
   * @usage Spacing between a Header and the Body content.
   */
  section: primitives.xl,

  /**
   * **32px** (Primitive: `xxl`)
   * Large visual break.
   * @usage Top padding for a Modal, or spacing after a major graphic.
   */
  largeSection: primitives.xxl,

  /**
   * **64px** (Primitive: `huge`)
   * Hero spacing.
   * @usage Top margin for empty states or major onboarding screens.
   */
  hero: primitives.huge,

  /* -------------------------- RAW SCALE --------------------------------- */

  /**
   * Access to raw T-shirt sizes for ad-hoc custom layouts.
   * @example spacing.scale.xxs // 2
   */
  scale: primitives,
} as const;

/**
 * Type helper for Props.
 * @example
 * interface CardProps {
 * padding?: Spacing;
 * }
 */
export type Spacing = keyof typeof spacing;
