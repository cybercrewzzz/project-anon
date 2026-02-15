import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface FullWidthButtonProps extends PressableProps {
  children: React.ReactNode;
}

/**
 * A full-width primary action button component.
 *
 * @component
 * @example
 * <FullWidthButton onPress={handleContinue}>
 *   <AppText style={styles.buttonText}>Continue</AppText>
 * </FullWidthButton>
 *
 * @param {React.ReactNode} children - Button content (typically AppText component)
 * @param {PressableProps} props - All other Pressable props (onPress, disabled, etc.)
 */
export const FullWidthButton = ({
  children,
  ...pressableProps
}: FullWidthButtonProps) => {
  return (
    <Pressable style={styles.button} {...pressableProps}>
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create(theme => ({
  button: {
    paddingVertical: theme.spacing.s3 + theme.spacing.s2,
    paddingHorizontal: theme.spacing.s5,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: theme.action.secondary,
    borderRadius: theme.radius.full,
  },

}));
