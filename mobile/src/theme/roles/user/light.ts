import { purple } from '@/src/theme/palettes/purple';
import { common } from '@/src/theme/palettes/common';

/**
 * User role – Light theme colors.
 *
 * Defines semantic color roles for the **Normal User** interface in light mode.
 * This file maps raw palette colors to meaningful UI roles such as:
 * - backgrounds
 * - surfaces
 * - text
 * - borders
 * - actions
 * - system states
 *
 * Components and screens MUST consume colors from this file
 * via the active ThemeProvider.
 *
 * Naming conventions:
 * - `background.*` → page-level backgrounds
 * - `surface.*` → cards, sheets, sections
 * - `text.*` → all typography colors
 * - `border.*` → outlines and focus states
 * - `action.*` → buttons and interactive elements
 * - `state.*` → error, warning, success, info
 *
 * @example
 * import { useTheme } from '@/theme/ThemeProvider';
 *
 * const theme = useTheme();
 *
 * <View style={{ backgroundColor: theme.background.default }}>
 *   <Text style={{ color: theme.text.primary }}>Hello</Text>
 * </View>
 *
 */

export const userLightTheme = {
  background: {
    default: common.white,
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
    subtle: purple[600],
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
    backgroundPrimary: ['#D2ECFE', '#F9FBFF', purple[100]],
    backgroundSecondary: ['#EEF2FF', '#FAF5FF'],
    callAction: ['#D8FDD2', '#9FFF8F'],
  },
};
