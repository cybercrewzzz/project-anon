import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';

interface AuthButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  //variant?: 'primary' | 'secondary';
  color?: string;
}

/**
 * A full-width auth action button for Login and Sign Up screens.
 *
 * @component
 * @example
 * // Theme-based colors
 * <AuthButton label="Login" variant="secondary" onPress={handleLogin} />
 * <AuthButton label="Sign Up" variant="primary" onPress={handleSignUp} />
 *
 * // Custom colors (overrides variant)
 * <AuthButton label="Login" color="#00A9D3" onPress={handleLogin} />
 * <AuthButton label="Sign Up" color="#0669B8" onPress={handleSignUp} />
 *
 * @param {string} label - Button text
 * @param {'primary' | 'secondary'} variant - 'primary' uses action.primary (dark purple),
 *   'secondary' uses action.secondary (brand purple). Defaults to 'secondary'.
 * @param {string} color - Optional custom background color. Overrides variant when provided.
 * @param {PressableProps} pressableProps - All other Pressable props (onPress, disabled, etc.)
 */
export const AuthButton = ({
  label,
  //variant = 'secondary',
  color,
  ...pressableProps
}: AuthButtonProps) => {
  const { theme } = useUnistyles();

  const backgroundColor =
    color;
    //?? (variant === 'primary' ? theme.action.primary : theme.action.secondary);

  return (
    <Pressable
      style={{
        paddingVertical: theme.spacing.s4,
        paddingHorizontal: theme.spacing.s5,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
        borderRadius: theme.radius.full,
        backgroundColor,
      }}
      {...pressableProps}
    >
      <AppText variant="headline" color="secondary">
        {label}
      </AppText>
    </Pressable>
  );
};
