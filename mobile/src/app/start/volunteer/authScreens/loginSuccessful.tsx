import { AppText } from '@/components/AppText';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { SuccessAnimation } from '@/components/SuccessAnimation';
import { useAuth } from '@/store/useAuth';

const LoginSuccessful = () => {
  const router = useRouter();
  const userRole = useAuth(state => state.userRole);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Route based on the user's actual role from the auth response
      const target =
        userRole === 'volunteer' ?
          '/volunteer/(tabs)/home'
        : '/user/(tabs)/home';
      router.replace(target as any);
    }, 5000);

    return () => clearTimeout(timer);
  }, [router, userRole]);

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <View style={styles.imageContainer}>
          <SuccessAnimation />
        </View>
        <View>
          <AppText
            variant="title3"
            color="primary"
            emphasis="emphasized"
            style={styles.textLine1}
          >
            Login Successful!
          </AppText>
          <AppText variant="subhead" color="primary" style={styles.textLine2}>
            Please Wait
          </AppText>
          <AppText variant="subhead" color="primary" style={styles.textLine3}>
            You will be directed to the homepage.
          </AppText>
        </View>
      </View>
    </View>
  );
};

export default LoginSuccessful;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background.overlay,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + 16,
    paddingRight: rt.insets.right + 16,
    justifyContent: 'center',
  },

  cardContainer: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.mdSoft,
    width: '100%',
    paddingVertical: theme.spacing.s7,
    paddingHorizontal: theme.spacing.s5,
    alignItems: 'center',
    elevation: 10,
  },

  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: theme.spacing.s6,
  },

  textLine1: {
    justifyContent: 'center',
    textAlign: 'center',
  },

  textLine2: {
    paddingTop: theme.spacing.s6,
    justifyContent: 'center',
    textAlign: 'center',
  },

  textLine3: {
    paddingTop: theme.spacing.s3,
    marginTop: theme.spacing.s3,
    justifyContent: 'center',
    textAlign: 'center',
  },
}));
