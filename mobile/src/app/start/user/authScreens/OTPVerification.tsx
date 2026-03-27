import React, { useState, useRef } from 'react';
import { TextInput, View, Alert, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/AppText';
import { StyleSheet } from 'react-native-unistyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FullWidthButton } from '@/components/FullWidthButton';
import { useMutation } from '@tanstack/react-query';
import { verifyOtp, forgotPassword } from '@/api/auth';
import { parseApiError } from '@/api/errors';

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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.otpInputContainer(isFocused)}>
      <TextInput
        ref={inputRef}
        style={styles.otpInputText}
        maxLength={1}
        keyboardType="number-pad"
        value={value}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

const OTPVerification = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || '';

  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const { mutate: verify, isPending: isVerifying } = useMutation({
    mutationFn: () => verifyOtp(email, otp.join('')),
    onSuccess: data => {
      router.push({
        pathname: '/start/user/authScreens/CreateNewPassword',
        params: { email, resetToken: data.resetToken },
      } as any);
    },
    onError: error => {
      Alert.alert('Verification Failed', parseApiError(error).message);
    },
  });

  const { mutate: resend, isPending: isResending } = useMutation({
    mutationFn: () => forgotPassword(email),
    onSuccess: () => {
      Alert.alert('Success', 'A new OTP has been sent to your email.');
    },
    onError: error => {
      Alert.alert('Error', parseApiError(error).message);
    },
  });

  const handleVerify = () => {
    if (otp.join('').length < 4) {
      Alert.alert('Validation Error', 'Please enter the complete 4-digit OTP.');
      return;
    }
    verify();
  };

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
          We have sent an OTP code to your email{' '}
          {email ? email : 'your address'}. Enter the OTP code below to verify.
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
        <TouchableOpacity
          onPress={() => resend()}
          disabled={isResending || !email}
        >
          <AppText
            variant="body"
            style={styles.verifyTextAction}
            color="primary"
          >
            {isResending ? 'Resending...' : 'Resend OTP'}
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <FullWidthButton
          onPress={handleVerify}
          disabled={isVerifying || !email}
        >
          <AppText variant="headline" color="secondary">
            {isVerifying ? 'Verifying...' : 'Verify OTP'}
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
  otpInputContainer: (isFocused: boolean) => ({
    width: 70,
    height: 64,
    justifyContent: 'center',
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.sm,
    borderWidth: isFocused ? 1.5 : 0,
    borderColor: isFocused ? theme.text.accent : 'transparent',
    boxShadow: theme.elevation.level3,
  }),
  otpInputText: {
    textAlign: 'center',
    fontSize: 24,
    color: theme.text.primary,
  },
  verifyText: {
    marginTop: theme.spacing.s5,
    textAlign: 'center',
  },
  verifyTextAction: {
    marginTop: theme.spacing.s2,
    textAlign: 'center',
    fontWeight: 'bold',
  },
}));
