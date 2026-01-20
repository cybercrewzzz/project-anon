import { AppTheme } from '@/theme/roles/user/light';
import { TextStyleKey, textStyles } from '@/theme/tokens/typography';
import React from 'react';
import { Text, TextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface AppTextProps extends TextProps {
  variant?: TextStyleKey;
  color?: keyof AppTheme['text'];
}

export const AppText = ({
  variant = 'body',
  color = 'primary',
  style,
  ...props
}: AppTextProps) => {
  return (
    <Text
      style={[textStyles[variant], styles.textColor(color), style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create(theme => ({
  textColor: (color: keyof typeof theme.text) => ({
    color: theme.text[color],
  }),
}));
