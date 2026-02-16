import {
  ColorValue,
  StyleProp,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import React, { useState } from 'react';
import { AppText, AppTextProps } from './AppText';
import { StyleSheet } from 'react-native-unistyles';
import { typography } from '@/theme/tokens/typography';

interface InputFormProps extends TextInputProps {
  placeholder: string;
  placeholderColor?: AppTextProps['color'];
  placeholderVariant?: AppTextProps['variant'];
  placeholderEmphasis?: AppTextProps['emphasis'];
  formColor?: ColorValue;
  contentContainerStyle?: StyleProp<ViewStyle>;
  outputVariant?: AppTextProps['variant'];
  outputColor?: AppTextProps['color'];
  outputEmphasis?: AppTextProps['emphasis'];
}

const InputForm = ({
  placeholder,
  placeholderColor = 'primary',
  placeholderVariant = 'callout',
  placeholderEmphasis = 'emphasized',
  contentContainerStyle,
  formColor = 'white',
  value,
  style,
  onFocus,
  onBlur,
  outputVariant = 'callout',
  outputColor = 'subtle2',
  outputEmphasis = 'emphasized',
  ...props
}: InputFormProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const showPlaceholder = !isFocused && (!value || value.length === 0);

  return (
    <View style={[styles.inputBox(formColor), contentContainerStyle]}>
      <TextInput
        {...props}
        onFocus={e => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        style={[
          style,
          typography[outputVariant][outputEmphasis],
          styles.outputColor(outputColor),
        ]}
      />
      <View style={styles.placeholderContainer}>
        {showPlaceholder && (
          <AppText
            variant={placeholderVariant}
            emphasis={placeholderEmphasis}
            color={placeholderColor}
          >
            {placeholder}
          </AppText>
        )}
      </View>
    </View>
  );
};

export default InputForm;

const styles = StyleSheet.create(theme => ({
  inputBox: (formColor: ColorValue) => ({
    paddingHorizontal: theme.spacing.s3,
    paddingVertical: theme.spacing.s2,
    boxShadow: theme.elevation.level3,
    backgroundColor: formColor,
    borderRadius: theme.radius.sm,
    position: 'relative',
  }),
  placeholderContainer: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    marginHorizontal: theme.spacing.s4,
    pointerEvents: 'none',
  },
  outputColor: (color: keyof typeof theme.text) => ({
    color: theme.text[color],
  }),
}));
