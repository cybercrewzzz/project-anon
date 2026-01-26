import { colors } from '@/theme/palettes/colors';
import { common } from '@/theme/palettes/common';
import { purple } from '@/theme/palettes/purple';

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
    gradient: [purple[800], purple[500]],
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
    callAction: [common.green[100], common.green[200]],
  },
} as const;

export type AppTheme = typeof userLightTheme;
