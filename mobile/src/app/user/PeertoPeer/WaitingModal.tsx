import { AppText } from '@/components/AppText';
import { purple } from '@/theme/palettes/purple';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface WaitingModalProps {
  visible: boolean;
  onDismiss?: () => void;
}

export function WaitingModal({ visible, onDismiss }: WaitingModalProps) {
  const pulseAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.8,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [visible, pulseAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Animated.View
            style={[styles.dot, { transform: [{ scale: pulseAnim }] }]}
          />
          <AppText
            variant="headline"
            emphasis="emphasized"
            color="primary"
            textAlign="center"
          >
            Connecting You
          </AppText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s5,
  },
  card: {
    backgroundColor: theme.background.default,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.s7,
    paddingHorizontal: theme.spacing.s5,
    alignItems: 'center',
    gap: theme.spacing.s6,
    width: '100%',
    boxShadow: theme.elevation.level2,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.full,
    backgroundColor: purple[700],
  },
}));
