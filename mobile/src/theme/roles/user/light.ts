/**
 * User role light theme configuration.
 *
 * Defines semantic color mappings for the USER role in light mode.
 * Maps raw color tokens from palettes to semantic UI roles.
 *
 * Theme structure:
 * - background: Page/screen backgrounds
 * - surface: Card, modal, and component surfaces
 * - text: All text color variants
 * - border: Border colors for inputs, dividers, etc.
 * - action: Interactive elements (buttons, links)
 * - state: System feedback colors
 * - gradient: Multi-color gradient definitions
 *
 * @example
 * // Use via theme context
 * const { theme } = useTheme();
 * backgroundColor: theme.background.default
 *
 * @remarks
 * - Always consume colors through this semantic layer
 * - Never reference palette colors directly in components
 * - Gradient arrays define color stops (start to end)
 * - Changing a palette value automatically updates all themes
 *
 * @see {@link common} - Neutral color palette
 * @see {@link purple} - Brand purple palette
 * @see {@link colors} - Blue color palette
 */

import { colors } from '@/theme/palettes/colors';
import { common } from '@/theme/palettes/common';
import { purple } from '@/theme/palettes/purple';

/**
 * Light theme for user role.
 *
 * @property {Object} background - Background color definitions
 * @property {string} background.default - Main background (white)
 * @property {string} background.secondary - Secondary background (light purple)
 * @property {string} background.accent - Accent background (brand purple)
 * @property {string} background.overlay - Modal/overlay background with transparency
 *
 * @property {Object} surface - Surface color definitions for elevated components
 * @property {string} surface.primary - Primary surface (white)
 * @property {string} surface.secondary - Secondary surface (light purple)
 * @property {string} surface.tertiary - Tertiary surface (lighter purple)
 * @property {string} surface.muted - Muted surface (light gray)
 * @property {string[]} surface.highlightedGradient - Gradient for emphasized surfaces
 *
 * @property {Object} text - Text color definitions
 * @property {string} text.primary - Primary text (black)
 * @property {string} text.secondary - Secondary text (white)
 * @property {string} text.muted - Muted/disabled text
 * @property {string} text.accent - Accent text (brand purple)
 * @property {string} text.subtle1 - Subtle text variant 1 (darker purple)
 * @property {string} text.subtle2 - Subtle text variant 2 (lighter purple)
 * @property {string[]} text.gradient - Gradient for text effects
 *
 * @property {Object} border - Border color definitions
 * @property {string} border.default - Default border color
 * @property {string[]} border.focusGradient - Gradient for focused borders
 *
 * @property {Object} action - Interactive element colors
 * @property {string} action.primary - Primary action color (dark purple)
 * @property {string} action.secondary - Secondary action color (brand purple)
 * @property {string} action.muted - Muted action color
 * @property {string} action.onPrimary - Text on primary actions (white)
 *
 * @property {Object} state - System state colors
 * @property {string} state.error - Error state (red)
 * @property {string} state.warning - Warning state (yellow)
 * @property {string} state.success - Success state (green)
 * @property {string} state.info - Info state (blue)
 *
 * @property {Object} gradient - Gradient definitions
 * @property {string[]} gradient.backgroundPrimary - Primary background gradient
 * @property {string[]} gradient.backgroundSecondary - Secondary background gradient
 * @property {string[]} gradient.callAction - Call-to-action gradient (green)
 */
export const userLightTheme = {
  background: {
    default: 'common.white',
    secondary: purple[50],
    accent: purple[500],
    overlay: 'rgba(149, 0, 255, 0.8)',
  },

  surface: {
    primary: common.white,
    secondary: purple[50],
    tertiary: purple[100],
    muted: common.gray[100],
    highlightedGradient: [purple[800], purple[500]],
  },

  text: {
    primary: common.black,
    secondary: common.white,
    muted: common.gray[400],
    accent: purple[500],
    subtle1: purple[600],
    subtle2: purple[400],
  },

  border: {
    default: purple[200],
    focusGradient: [purple[800], purple[500]],
  },

  action: {
    primary: purple[700],
    secondary: purple[500],
    muted: common.gray[100],
    onPrimary: common.white,
  },

  state: {
    error: common.red[500],
    warning: common.yellow[500],
    success: common.green[500],
    info: common.blue[500],
  },

  gradient: {
    backgroundPrimary: [colors.blue[200], colors.blue[50], purple[100]],
    backgroundSecondary: [colors.blue[100], purple[50]],
    textGradient: [purple[800], purple[500]],
    callAction: [common.green[100], common.green[200]],
  },
} as const;

/**
 * Type definition for the app theme.
 *
 * Infers the type structure from the userLightTheme object,
 * ensuring type safety across the application.
 *
 * @remarks
 * This type can be used to enforce consistent theme structure
 * across different theme variants (light/dark, different roles).
 */
export type AppTheme = typeof userLightTheme;
