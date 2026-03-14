import React from 'react';
import { Stack } from 'expo-router';

const AuthLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signUp" />
      <Stack.Screen name="signIn" />
      <Stack.Screen name="signupNlogin" />
      <Stack.Screen name="ResetPassword" />
      <Stack.Screen name="CreateNewPassword" />
      <Stack.Screen name="enterEmail" />
      <Stack.Screen name="OTPVerification" />
      <Stack.Screen name="loginSuccessful" />
    </Stack>
  );
};

export default AuthLayout;
