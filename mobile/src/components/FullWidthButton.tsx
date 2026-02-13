import { AppText } from '@/components/AppText';
import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface FullWidthButtonProps extends PressableProps {
  children: string;
}

export const FullWidthButton = ({
  children,
  ...pressableProps
}: FullWidthButtonProps) => {
  return (
    <Pressable style={styles.button} {...pressableProps}>
      <AppText style={styles.buttonText}>{children}</AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create(theme => ({
  button: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 64,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    alignSelf: 'stretch',
    backgroundColor: theme.action.secondary,
    borderRadius: 999,
  },
  buttonText: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: 600,
    color: theme.action.onPrimary,
  },
}));
