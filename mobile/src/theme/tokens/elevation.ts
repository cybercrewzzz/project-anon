/**
 * Elevation tokens for the app.
 *
 * @example
 * import { elevation } from '@/theme/tokens/elevation';
 *
 * // Basic Card (Level 2)
 * // Note: Shadows usually require a background color to be visible.
 * <View style={{ ...elevation.level2, backgroundColor: '#fff' }}>
 * <Text>Card content</Text>
 * </View>
 *
 * <Icon name="plus" color="#fff" />
 * </View>
 */

export const elevation = {
  // Subtle shadow
  level1: [
    {
      offsetX: 0,
      offsetY: 1,
      blurRadius: 2,
      spreadDistance: 0,
      color: 'rgba(0, 0, 0, 0.06)', // Merged color & opacity
    },
  ],

  // Medium shadow (Card)
  level2: [
    {
      offsetX: 0,
      offsetY: 1,
      blurRadius: 3,
      spreadDistance: 0,
      color: 'rgba(0, 0, 0, 0.08)',
    },
  ],

  // Prominent shadow (Floating / Modal)
  level3: [
    {
      offsetX: 0,
      offsetY: 3,
      blurRadius: 6,
      spreadDistance: 0,
      color: 'rgba(0, 0, 0, 0.12)',
    },
  ],
};
