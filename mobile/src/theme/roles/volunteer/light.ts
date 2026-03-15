/**
 * Volunteer role light theme configuration.
 *
 * Defines semantic color mappings for the VOLUNTEER role in light mode.
 * Uses the cyan palette instead of purple for brand colors.
 */

import { colors } from '@/theme/palettes/colors';
import { common } from '@/theme/palettes/common';
import { cyan } from '@/theme/palettes/cyan';
import { elevation } from '@/theme/tokens/elevation';
import { radius } from '@/theme/tokens/radius';
import { spacing } from '@/theme/tokens/spacing';

export const volunteerLightTheme = {
  background: {
    default: common.white,
    secondary: cyan[50],
    accent: cyan[500],
    overlay: 'rgba(51, 51, 51, 0.8)',
  },
  surface: {
    primary: common.white,
    secondary: cyan[50],
    tertiary: cyan[100],
    muted: common.gray[100],
    chatSurface: colors.blue[100],
    chatBubbleIncoming: cyan[800],
    chatTimerTrack: common.gray[200],
    highlightedGradient: [cyan[800], cyan[500]],
  },
  text: {
    primary: common.black,
    secondary: common.white,
    muted: common.gray[400],
    gray: common.gray[600],
    accent: cyan[500],
    subtle1: cyan[600],
    subtle2: cyan[400],
  },
  border: {
    default: cyan[200],
    focusGradient: [cyan[800], cyan[500]],
  },
  action: {
    primary: cyan[700],
    secondary: cyan[500],
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
    background: [cyan[100], colors.blue[50], colors.blue[300]],
    backgroundPrimary: [cyan[100], colors.blue[50], colors.blue[200]],
    backgroundSecondary: [colors.blue[100], cyan[50]],
    textGradient: [cyan[800], cyan[500]],
    callAction: [common.green[100], common.green[200]],
  },
  radius,
  spacing,
  elevation,
} as const;

export type VolunteerTheme = typeof volunteerLightTheme;
