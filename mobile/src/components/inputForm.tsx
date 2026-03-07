import {
  ColorValue,
  StyleProp,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  Animated,
  Pressable,
} from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { AppText, AppTextProps } from './AppText';
import { StyleSheet } from 'react-native-unistyles';
import { typography } from '@/theme/tokens/typography';
import { Image } from 'expo-image';

interface InputFormProps extends TextInputProps {
  placeholder: string;
  label?: string;
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
  label,
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
  secureTextEntry,
  ...props
}: InputFormProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasValue = value !== undefined && value.length > 0;
  const isActive = isFocused || hasValue;
  const showEyeToggle = !!secureTextEntry;

  // Animated value for floating label
  const animatedValue = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isActive ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isActive, animatedValue]);

  // Interpolations for the floating label
  const labelTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const labelFontSize = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 11],
  });

  const effectiveSecureTextEntry = showEyeToggle ? !isPasswordVisible : false;

  const displayLabel = label || placeholder;

  return (
    <View
      style={[
        styles.inputBox(formColor, isFocused),
        contentContainerStyle,
      ]}
    >
      {/* Floating Label */}
      <Animated.Text
        style={[
          styles.floatingLabel,
          {
            transform: [{ translateY: labelTranslateY }],
            fontSize: labelFontSize,
          },
        ]}
        numberOfLines={1}
      >
        {displayLabel}
      </Animated.Text>

      {/* Text Input */}
      <TextInput
        {...props}
        value={value}
        secureTextEntry={effectiveSecureTextEntry}
        onFocus={e => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.textInput(showEyeToggle),
          typography[outputVariant][outputEmphasis],
          styles.outputColor(outputColor),
          isActive && styles.textInputActive,
          style,
        ]}
      />

      {/* Eye Icon for password toggle */}
      {showEyeToggle && (
        <Pressable
          onPress={() => setIsPasswordVisible(prev => !prev)}
          style={styles.eyeButton}
          hitSlop={8}
        >
          <Image
            source={
              isPasswordVisible
                ? require('@/assets/icons/eye-openOPT.svg')
                : require('@/assets/icons/eye-closedOPT.svg')
            }
            style={styles.eyeIcon}
            contentFit="contain"
          />
        </Pressable>
      )}
    </View>
  );
};

export default InputForm;

const styles = StyleSheet.create(theme => ({
  inputBox: (formColor: ColorValue, isFocused: boolean) => ({
    paddingHorizontal: theme.spacing.s4,
    paddingTop: theme.spacing.s3,
    paddingBottom: theme.spacing.s2,
    boxShadow: theme.elevation.level3,
    backgroundColor: formColor,
    borderRadius: theme.radius.sm,
    position: 'relative' as const,
    borderWidth: isFocused ? 1.5 : 0,
    borderColor: isFocused ? theme.text.accent : 'transparent',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    minHeight: 52,
  }),
  floatingLabel: {
    position: 'absolute' as const,
    left: theme.spacing.s4,
    top: '50%' as unknown as number,
    color: theme.text.subtle2,
    fontWeight: '600' as const,
  },
  textInput: (hasEye: boolean) => ({
    flex: 1,
    paddingTop: theme.spacing.s3,
    paddingBottom: 0,
    paddingRight: hasEye ? theme.spacing.s7 : 0,
  }),
  textInputActive: {
    paddingTop: theme.spacing.s4,
  },
  outputColor: (color: keyof typeof theme.text) => ({
    color: theme.text[color],
  }),
  eyeButton: {
    position: 'absolute' as const,
    right: theme.spacing.s4,
    top: 0,
    bottom: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  eyeIcon: {
    width: 20,
    height: 20,
    tintColor: theme.text.subtle2,
  },
}));
