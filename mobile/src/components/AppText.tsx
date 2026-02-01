import { AppTheme } from '@/theme/roles/user/light';
import {
  TextEmphasis,
  TextVariant,
  typography,
} from '@/theme/tokens/typography';
import React from 'react';
import { Text, TextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: keyof AppTheme['text'];
  emphasis?: TextEmphasis;
}

export const AppText = ({
  variant = 'body',
  color = 'primary',
  emphasis = 'regular',
  style,
  ...props
}: AppTextProps) => {
  return (
    <Text
      style={[typography[variant][emphasis], styles.textColor(color), style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create(theme => ({
  textColor: (color: keyof typeof theme.text) => ({
    color: theme.text[color],
  }),
}));
