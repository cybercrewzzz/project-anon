import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/AppText';
import { StyleSheet } from 'react-native-unistyles';

interface ToggleProps {
  label: string;
  initialValue?: boolean;
}

export default function Toggle({ label, initialValue = false }: ToggleProps) {
  const [isOn, setIsOn] = useState(initialValue);

  return (
    <View style={styles.wrapper}>
      {/* Label text on the left */}
      <AppText variant="caption1" style={styles.label}>
        {label}
      </AppText>

      {/* Tapping the track flips the toggle */}
      <TouchableOpacity
        onPress={() => setIsOn(prev => !prev)}
        activeOpacity={0.8}
      >
        {/* Track — gray when OFF, purple when ON */}
        <View
          style={[styles.track, isOn ? styles.trackOn : styles.trackOff]}
              >
                  {/* Thumb — slides left when OFF, right when ON */}
          <View style={[styles.thumb, isOn ? styles.thumbOn : styles.thumbOff]} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {},
  track: {
    width: 38,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  trackOff: {
    backgroundColor: theme.surface.muted,
  }, // gray when OFF
    trackOn: { backgroundColor: theme.surface.tertiary },  // purple when ON
    thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.surface.primary,
    },
    thumbOff: { alignSelf: 'flex-start' },  // sits on the LEFT when OFF
  thumbOn:  { alignSelf: 'flex-end' },    // sits on the RIGHT when ON
}));
