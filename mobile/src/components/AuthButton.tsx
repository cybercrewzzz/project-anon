import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';

interface AuthButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: 'primary' | 'secondary';
}

/**
 * A full-width auth action button for Login and Sign Up screens.
 *
 * @component
 * @example
 * <AuthButton label="Login" variant="secondary" onPress={handleLogin} />
 * <AuthButton label="Sign Up" variant="primary" onPress={handleSignUp} />
 *
 * @param {string} label - Button text
 * @param {'primary' | 'secondary'} variant - 'primary' uses action.primary (dark purple),
 *   'secondary' uses action.secondary (brand purple). Defaults to 'secondary'.
 * @param {PressableProps} pressableProps - All other Pressable props (onPress, disabled, etc.)
 */
export const AuthButton = ({
  label,
  variant = 'secondary',
  ...pressableProps
}: AuthButtonProps) => {
  return (
    <Pressable style={styles.button(variant)} {...pressableProps}>
      <AppText variant="headline" color="secondary">
        {label}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create(theme => ({
  button: (variant: 'primary' | 'secondary') => ({
    paddingVertical: theme.spacing.s4,
    paddingHorizontal: theme.spacing.s5,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor:
      variant === 'primary' ? theme.action.primary : theme.action.secondary,
    borderRadius: theme.radius.full,
  }),
}));
