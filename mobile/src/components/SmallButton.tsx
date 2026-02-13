import { AppText } from '@/components/AppText';
import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface SmallButtonProps extends PressableProps {
  selected?: boolean;
  children: string;
}

export const SmallButton = ({
  selected = false,
  children,
  ...pressableProps
}: SmallButtonProps) => {
  return (
    <Pressable
      style={selected ? styles.selected : styles.selection}
      {...pressableProps}
    >
      <AppText color={selected ? 'secondary' : 'subtle1'}>{children}</AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create(theme => ({
  selected: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    backgroundColor: theme.action.primary,
    borderRadius: 9999,
  },
  selection: {
    paddingVertical: 4,
    paddingHorizontal: 18,
    borderRadius: 9999,
    borderColor: theme.action.primary,
    borderWidth: 2,
  },
}));
