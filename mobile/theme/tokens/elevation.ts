import { Platform } from "react-native";

/**
 * Elevation tokens for the app.
 *
 * Provides platform-aware elevation / shadow levels for components.
 *
 * Android uses `elevation` values.
 * iOS uses `shadowColor`, `shadowOffset`, `shadowOpacity`, and `shadowRadius`.
 *
 * The purpose of these tokens is to represent **surface hierarchy** and **depth** consistently across platforms.
 *
 * @example
 * import { elevation } from '@/theme/tokens/elevation';
 *
 * // Card with level 2 elevation
 * <View style={{ ...elevation.level2, backgroundColor: '#fff', padding: 16 }}>
 *   <Text>Card content</Text>
 * </View>
 *
 * // Floating button with level 3 elevation
 * <View style={{ ...elevation.level3, borderRadius: 24, backgroundColor: '#7A3EFF', width: 48, height: 48 }} />
 */

/**
 * Elevation levels for iOS/Android
 *
 * level0 - Flat surface, no shadow
 * level1 - Subtle shadow / low elevation
 * level2 - Medium shadow / card or surface ("enhanced")
 * level3 - Prominent shadow / floating elements, modals, buttons
 */

const ios = {
  level0: {},
  level1: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  level2: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  level3: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
};

const android = {
  level0: { elevation: 0 },
  level1: { elevation: 1 },
  level2: { elevation: 3 }, // matches the "enhanced" shadow style used in Figma
  level3: { elevation: 6 },
};

export const elevation = Platform.OS === "ios" ? ios : android;
