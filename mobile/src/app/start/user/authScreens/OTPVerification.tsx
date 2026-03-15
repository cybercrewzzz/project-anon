import React, { useState, useRef } from 'react';
import { TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { StyleSheet } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { FullWidthButton } from '@/components/FullWidthButton';

interface OTPInputProps {
  value: string;
  onChangeText: (text: string) => void;
  inputRef?: React.RefObject<TextInput | null>;
  onKeyPress?: (e: any) => void;
}

const OTPInput = ({
  value,
  onChangeText,
  inputRef,
  onKeyPress,
}: OTPInputProps) => {
  return (
    <TextInput
      ref={inputRef}
      style={styles.otpInput}
      maxLength={1}
      keyboardType="number-pad"
      value={value}
      onChangeText={onChangeText}
      onKeyPress={onKeyPress}
    />
  );
};

const OTPVerification = () => {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Auto-focus previous input on backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <AppText
          variant="title1"
          color="primary"
          emphasis="emphasized"
          style={styles.title}
        >
          OTP Code Verification 🔒
        </AppText>

        <AppText variant="body" style={styles.description}>
          We have sent a OTP code to your email exa***@gmail.com. Enter the OTP
          code below to verify.
        </AppText>
      </View>

      <View style={styles.otpContainer}>
        <OTPInput
          value={otp[0]}
          onChangeText={text => handleOtpChange(text, 0)}
          inputRef={inputRefs[0]}
          onKeyPress={e => handleKeyPress(e, 0)}
        />
        <OTPInput
          value={otp[1]}
          onChangeText={text => handleOtpChange(text, 1)}
          inputRef={inputRefs[1]}
          onKeyPress={e => handleKeyPress(e, 1)}
        />
        <OTPInput
          value={otp[2]}
          onChangeText={text => handleOtpChange(text, 2)}
          inputRef={inputRefs[2]}
          onKeyPress={e => handleKeyPress(e, 2)}
        />
        <OTPInput
          value={otp[3]}
          onChangeText={text => handleOtpChange(text, 3)}
          inputRef={inputRefs[3]}
          onKeyPress={e => handleKeyPress(e, 3)}
        />
      </View>

      <View>
        <AppText variant="body" style={styles.verifyText}>
          Did not receive the email?
        </AppText>
        <AppText variant="body" style={styles.verifyText}>
          Resend OTP
        </AppText>
      </View>

      <View style={styles.buttonContainer}>
        <FullWidthButton
          onPress={() =>
            router.push('/start/user/authScreens/CreateNewPassword' as any)
          }
        >
          <AppText variant="headline" color="secondary">
            {' '}
            Create new Password{' '}
          </AppText>
        </FullWidthButton>
      </View>
    </View>
  );
};

export default OTPVerification;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.surface.primary,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + theme.spacing.s4,
    paddingRight: rt.insets.right + theme.spacing.s4,
  },
  contentContainer: {
    justifyContent: 'flex-start',
    paddingTop: rt.insets.top + theme.spacing.s6,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: theme.spacing.s8,
  },
  title: {
    paddingLeft: theme.spacing.s1,
  },
  description: {
    textAlign: 'left',
    marginTop: theme.spacing.s5,
    marginLeft: theme.spacing.s1,
    paddingLeft: theme.spacing.s1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.s6,
    paddingTop: rt.insets.top,
  },
  otpInput: {
    width: 80,
    height: 64,
    borderWidth: 2,
    borderColor: theme.border.default,
    backgroundColor: theme.surface.secondary,
    borderRadius: theme.radius.sm,
    textAlign: 'center',
    fontSize: 24,
  },
  verifyText: {
    marginTop: theme.spacing.s5,
    textAlign: 'center',
  },
}));
