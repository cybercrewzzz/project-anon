import { elevation } from './tokens/elevation';
import { radius } from './tokens/radius';
import { spacing } from './tokens/spacing';

export interface AppTheme {
  readonly background: {
    readonly default: string;
    readonly secondary: string;
    readonly accent: string;
    readonly overlay: string;
  };
  readonly surface: {
    readonly primary: string;
    readonly secondary: string;
    readonly tertiary: string;
    readonly muted: string;
    readonly chatSurface: string;
    readonly chatBubbleIncoming: string;
    readonly chatTimerTrack: string;
    readonly highlightedGradient: readonly [string, string, ...string[]];
  };
  readonly text: {
    readonly primary: string;
    readonly secondary: string;
    readonly muted: string;
    readonly gray: string;
    readonly accent: string;
    readonly subtle1: string;
    readonly subtle2: string;
  };
  readonly border: {
    readonly default: string;
    readonly focusGradient: readonly [string, string, ...string[]];
  };
  readonly action: {
    readonly primary: string;
    readonly secondary: string;
    readonly muted: string;
    readonly onPrimary: string;
  };
  readonly state: {
    readonly error: string;
    readonly warning: string;
    readonly success: string;
    readonly info: string;
  };
  readonly gradient: {
    readonly background: readonly [string, string, ...string[]];
    readonly backgroundPrimary: readonly [string, string, ...string[]];
    readonly backgroundSecondary: readonly [string, string, ...string[]];
    readonly textGradient: readonly [string, string, ...string[]];
    readonly callAction: readonly [string, string, ...string[]];
  };
  readonly radius: typeof radius;
  readonly spacing: typeof spacing;
  readonly elevation: typeof elevation;
}
