import { Pressable, PressableProps } from 'react-native';
import React from 'react';
import { AppText, AppTextProps } from './AppText';
import { StyleSheet } from 'react-native-unistyles';

interface ButtonProps extends PressableProps {
  text: string;
  textVariant?: AppTextProps['variant'];
  textColor?: AppTextProps['color'];
  textAlign?: AppTextProps['textAlign'];
}

const Button = ({
  text,
  textVariant = 'headline',
  textColor = 'secondary',
  textAlign = 'center',
  ...props
}: ButtonProps) => {
  return (
    <Pressable style={styles.container} {...props}>
      <AppText variant={textVariant} color={textColor} textAlign={textAlign}>
        {text}
      </AppText>
    </Pressable>
  );
};

export default Button;

const styles = StyleSheet.create(theme => ({
  container: {
    backgroundColor: theme.background.accent,
    borderRadius: theme.radius.full,
    padding: theme.spacing.s4,
    marginHorizontal: theme.spacing.s5,
    alignSelf: 'stretch',
  },
}));
