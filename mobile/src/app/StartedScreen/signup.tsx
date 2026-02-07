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


export default function SignUp() {
  const [selectedAge, setSelectedAge] = useState('21-26');
  const [checked, setChecked] = useState(false);
  const fontFamily = Platform.select({
  ios: undefined,
  android: 'Poppins',
  


});
  

  
  return (
    <View style={styles.container}>

      {/* Title */}
      <Text style={[styles.title]}>Project Anon</Text>
      <Text style={styles.subtitle}>Sign Up</Text>

      {/* Name */}
      <TextInput
        placeholder="Name"
        placeholderTextColor={purple[400]}
        style={styles.input}
      />

      {/* Age */}
    
      <View style={styles.ageContainer}>
        <Text style={styles.ageText1}>Age
            </Text>
        <Pressable
          style={[
            styles.ageButton,
            selectedAge === '16-20' && styles.ageButtonActive,
          ]}
          onPress={() => setSelectedAge('16-20')}
        >
          <Text
            style={[
              styles.ageText,
              selectedAge === '16-20' && styles.ageTextActive,
            ]}
          >
            16 - 20
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.ageButton,
            selectedAge === '21-26' && styles.ageButtonActive,
          ]}
          onPress={() => setSelectedAge('21-26')}
        >
          <Text
            style={[
              styles.ageText,
              selectedAge === '21-26' && styles.ageTextActive,
            ]}
          >
            21 - 26
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.ageButton,
            selectedAge === '27+' && styles.ageButtonActive,
          ]}
          onPress={() => setSelectedAge('27+')}
        >
          <Text
            style={[
              styles.ageText,
              selectedAge === '27+' && styles.ageTextActive,
            ]}
          >
            27+
          </Text>
          
        </Pressable>
      </View>
      

      {/* Email */}
      <TextInput
        placeholder="Email"
        placeholderTextColor={purple[400]}
        style={styles.input}
        keyboardType="email-address"
      />

      {/* Password */}
      <TextInput
        placeholder="Password"
        placeholderTextColor={purple[400]}
        style={styles.input}
        secureTextEntry
      />

      {/* Confirm Password */}
      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor={purple[400]}
        style={styles.input}
        secureTextEntry
      />

      {/* Checkbox */}
      <Pressable
        style={styles.checkboxContainer}
        onPress={() => setChecked(!checked)}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
        <Text style={styles.checkboxText}>
          Yes, I want to receive discounts and updates
        </Text>
      </Pressable>

      {/* Button */}
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Create Account</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: common.white,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  

  title: {
    color: common.black,
    fontSize: typography.headingXL.fontSize,
    lineHeight: typography.headingXL.lineHeight,
    fontWeight: weight.semiBold,
    textAlign: 'center',
    marginBottom: 30,

  },

  subtitle: {
    fontSize: typography.headingMD.fontSize,
    lineHeight: typography.headingMD.lineHeight,
    color:purple[600],
    fontWeight: weight.medium,
    textAlign: 'center',
    marginBottom: 24,
  },

  input: {
    height: 48,
    backgroundColor: common.gray[100],
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    marginBottom: 16,
    fontSize: typography.bodyMD.fontSize,
    color: common.black,
  },

  ageContainer: {
    flexDirection: 'row',
    marginBottom: 14,
  },

  ageButton: {
    backgroundColor: common.gray[100],
    paddingVertical:spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.mdSoft,
    marginRight: 8,
  },

  ageButtonActive: {
    backgroundColor: purple[700],
  },

  ageText: {
    color:purple[400],
    fontSize: typography.bodyMD.fontSize,
    gap: spacing.xl,
    marginRight: spacing.md,
  },
    ageText1: {
    color: purple[400],
    backgroundColor:common.gray[100],
    paddingVertical:spacing.sm,
    paddingHorizontal: spacing.md,

  },

  ageTextActive: {
    color: common.white,
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: typography.bodyXS.fontSize,
    lineHeight: typography.bodyXS.lineHeight,
  },

  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: purple[700],
    marginRight: 8,
  },

  checkboxChecked: {
    backgroundColor: purple[700],
  },

  checkboxText: {
    fontSize: typography.bodyMD.fontSize,
    lineHeight: typography.bodyLG.lineHeight,
    marginBottom: spacing.lg,
    color: purple[800],
    fontWeight: weight.medium,
  },

  button: {
    backgroundColor:purple[700],
    paddingVertical: spacing.lg,
    borderRadius: radius.xxlSoft,
    alignItems: 'center',
    lineHeight: typography.bodySM.lineHeight,
    marginBottom: spacing.xl,
  },

  buttonText: {
    color: common.white,
    fontSize: typography.bodyLG.fontSize,
    lineHeight: typography.bodySM.lineHeight,
    fontWeight: weight.semiBold,
    
  },
});