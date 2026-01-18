import React from 'react';
import { Text, TextProps } from 'react-native';
import { StyleSheet, UnistylesThemes } from 'react-native-unistyles';
import { textStyles, TextStyleKey } from '@/src/theme/tokens/typography';

interface AppTextProps extends TextProps {
  variant?: TextStyleKey;
  color?: keyof UnistylesThemes['textTest']['colors']['text'];
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
  textColor: (color: keyof typeof theme.colors.text) => ({
    color: theme.colors.text[color],
  }),
}));
