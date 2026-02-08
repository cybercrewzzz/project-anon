import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { AppText } from '@/components/AppText';
import { Button } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { purple } from '@/theme/palettes/purple';
import { common } from '@/theme/palettes/common';
import { Platform, TextStyle } from 'react-native';
import { textStyles, typography, weight } from '@/theme/tokens/typography';
import { colors } from '@/theme/palettes/colors';
import { spacing } from '@/theme/tokens/spacing';
import { radius } from '@/theme/tokens/radius';


export default function P2PP2V() {
  const [selectedAge, setSelectedAge] = useState('21-26');
  const [checked, setChecked] = useState(false);
  const fontFamily = Platform.select({
    ios: undefined,
    android: 'Poppins',
  });

  return (
    <View style={styles.container}>
      
      {/* Top bar with arrow and title */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.arrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>Peer to Peer</Text>
      </View>

      <Text style={styles.star185}> 🌟185 </Text>

      <Text style={styles.ticket}>  🎫 5  </Text>

   


      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: common.white,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // arrow left, title center
    marginBottom: spacing.lg,
  },
  arrow: {
    fontSize: typography.headingLG.fontSize,
    color: common.black,
  },
  title: {
    fontWeight: weight.semiBold,
    fontSize: typography.headingSM.fontSize,
    color: common.black,
    textAlign: 'center',
    width: '100%', // to center the title
    position: 'absolute', // to overlay on top of the arrow
    left: 0,
  },
  star185: {
    flexDirection: 'row',
    fontSize: typography.bodyMD.fontSize,
    color: common.white,
    backgroundColor:purple[500],
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.xlSoft,
    left: 200,
    
  },

  ticket: {
    flexDirection: 'row',
    fontSize: typography.bodyMD.fontSize,
    color: common.white,
    backgroundColor:purple[500],
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.xlSoft,
    left: 270,
    bottom: 30,
    
  },

  

});