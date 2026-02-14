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
import { typography, weight } from '@/theme/tokens/typography';
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
<View style={styles.fieldWrapper}>
  <View style={styles.fakeInput}>
    {/* Age label INSIDE the box */}
    <Text style={styles.ageInsideLabel}>Age</Text>

    {['16-20', '21-26', '27+'].map((age) => (
      <Pressable
        key={age}
        onPress={() => setSelectedAge(age)}
        style={[
          styles.ageChip,
          selectedAge === age && styles.ageChipActive,
        ]}
      >
        <Text
          style={[
            styles.ageChipText,
            selectedAge === age && styles.ageChipTextActive,
          ]}
        >
          {age.replace('-', ' - ')}
        </Text>
      </Pressable>
    ))}
  </View>
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
        <Text style={styles.buttonText } onPress={() => router.push("/volunteer/StartedScreen/p2pp2v")}>Create Account</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: common.white,
    padding: spacing.s9,
    justifyContent: 'center',
  },
  

  title: {
    color: common.black,
    fontSize: typography.largeTitle.regular.fontSize,
    lineHeight: typography.largeTitle.regular.lineHeight,
    fontWeight: weight.semiBold,
    textAlign: 'center',
    marginBottom: 30,

  },

  subtitle: {
    fontSize: typography.title1.regular.fontSize,
    lineHeight: typography.title1.regular.lineHeight,
    color:purple[600],
    fontWeight: weight.semiBold,
    textAlign: 'center',
    marginBottom: 24,
  },

  input: {
    height: 48,
    backgroundColor: common.gray[100],
    borderRadius: radius.md,
    paddingHorizontal: spacing.s4,
    marginBottom: 16,
    fontSize: typography.body.regular.fontSize,
    color: common.black,
  },

  ageInsideLabel: {
  fontSize: typography.body.regular.fontSize,
  color: purple[400],
  marginRight: spacing.s2,
},


  fieldWrapper: {
  marginBottom: 16,
},

label: {
  color: purple[400],
  marginBottom: 6,
  fontSize: typography.body.regular.fontSize,
},

fakeInput: {
  paddingVertical: spacing.s2,
  backgroundColor: common.gray[100],
  borderRadius: radius.md,
  paddingHorizontal: spacing.s2,
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.s2,
},



  ageButton: {
    backgroundColor: common.gray[100],
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.mdSoft,
    marginRight: 8,
  },

  ageButtonActive: {
    backgroundColor: purple[700],
  },

  ageText: {
    color:purple[400],
    fontSize: typography.body.regular.fontSize,
    gap: spacing.s8,
    marginRight: spacing.s4,
  },
    ageChip: {
  paddingVertical: spacing.s1,
  paddingHorizontal: spacing.s4,
  borderRadius: radius.mdSoft,
  backgroundColor: common.gray[200],
},

ageChipActive: {
  backgroundColor: purple[700],
},

ageChipText: {
  fontSize: typography.body.regular.fontSize,
  color: purple[400],
},

ageChipTextActive: {
  color: common.white,
  fontWeight: weight.medium,
},


  ageTextActive: {
    color: common.white,
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: typography.body.regular.fontSize,
    lineHeight: typography.body.regular.lineHeight,
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
    fontSize: typography.body.regular.fontSize,
    lineHeight: typography.body.regular.lineHeight,
    marginBottom: spacing.s6,
    color: purple[800],
    fontWeight: weight.medium,
  },

  button: {
    backgroundColor:purple[700],
    paddingVertical: spacing.s5,
    borderRadius: radius.xxlSoft,
    alignItems: 'center',
    marginTop: spacing.s9,
  },

  buttonText: {
    color: common.white,
    fontSize: typography.body.regular.fontSize,
    lineHeight: typography.body.regular.lineHeight,
    fontWeight: weight.semiBold,
    
  },
});