import { AppTheme } from '@/theme/roles/user/light';
import {
  TextEmphasis,
  TextVariant,
  typography,
} from '@/theme/tokens/typography';
import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: keyof AppTheme['text'];
  emphasis?: TextEmphasis;
  textAlign?: TextStyle['textAlign'];
}

export const AppText = ({
  variant = 'body',
  color = 'primary',
  emphasis = 'regular',
  textAlign,
  style,
  ...props
}: AppTextProps) => {
  return (
    <Text
      style={[
        typography[variant][emphasis],
        { textAlign: textAlign },
        styles.textColor(color),
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create(theme => ({
  textColor: (color: keyof typeof theme.text) => ({
    color: theme.text[color],
  }),
}));
