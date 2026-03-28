import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { FullWidthButton } from '@/components/FullWidthButton';
import { useAuth } from '@/store/useAuth';
import { fetchVolunteerProfile } from '@/api/volunteer-api';

type VerificationStatus = 'pending' | 'approved' | 'rejected';

const isValidVerificationStatus = (
  value: unknown,
): value is VerificationStatus => {
  return value === 'pending' || value === 'approved' || value === 'rejected';
};

const getVerificationStatus = (value: unknown): VerificationStatus => {
  return isValidVerificationStatus(value) ? value : 'pending';
};

export default function VerificationPending() {
  const router = useRouter();
  const params = useLocalSearchParams<{ verificationStatus?: string }>();
  const signOut = useAuth(state => state.signOut);
  const accountName = useAuth(state => state.account?.name ?? '');

  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>(
      getVerificationStatus(params.verificationStatus),
    );
  const [isInitialLoading, setIsInitialLoading] = useState(
    !params.verificationStatus,
  );
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [autoCheckError, setAutoCheckError] = useState(false);

  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Mount: automatic status check ──────────────────────────────────────────
  useEffect(() => {
    // If verificationStatus was passed as param, skip the initial fetch
    if (params.verificationStatus) {
      setIsInitialLoading(false);
      return;
    }

    fetchVolunteerProfile()
      .then(profile => {
        const status = getVerificationStatus(profile.verificationStatus);
        if (status === 'approved') {
          router.replace('/volunteer/home' as any);
        } else {
          setVerificationStatus(status);
          setIsInitialLoading(false);
        }
      })
      .catch(() => {
        // Network error → safe fallback: show pending UI
        setVerificationStatus('pending');
        setAutoCheckError(true);
        setIsInitialLoading(false);
      });

    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, [router, params.verificationStatus]);

  // ── Manual: Check Status button ─────────────────────────────────────────────
  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    setStatusMessage(null);

    try {
      const profile = await fetchVolunteerProfile();
      const status = getVerificationStatus(profile.verificationStatus);

      if (status === 'approved') {
        router.replace('/volunteer/home' as any);
      } else if (status === 'rejected') {
        setVerificationStatus('rejected');
        setIsCheckingStatus(false);
      } else {
        // still pending
        setStatusMessage(
          'Your application is still under review. Please check back later.',
        );
        setIsCheckingStatus(false);
        // auto-clear after 3 seconds
        if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
        messageTimerRef.current = setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      }
    } catch {
      setStatusMessage('Could not check status. Please try again.');
      setIsCheckingStatus(false);
    }
  };

  // ── Sign out ────────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut();
    router.replace('/start/welcome' as any);
  };

  // ── Full-screen initial loader ──────────────────────────────────────────────
  if (isInitialLoading) {
    return (
      <View style={styles.fullScreenLoader}>
        <LinearGradient
          colors={['#F0E7FF', '#F9FBFF', '#BCDCF0']}
          style={styles.gradient}
          start={{ x: 0.05, y: 0.2 }}
          end={{ x: 1, y: 0.5 }}
          locations={[0.2, 0.5, 1]}
        />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ── Rejected state ──────────────────────────────────────────────────────────
  if (verificationStatus === 'rejected') {
    return (
      <View style={styles.screen}>
        <LinearGradient
          colors={['#F0E7FF', '#F9FBFF', '#BCDCF0']}
          style={styles.gradient}
          start={{ x: 0.05, y: 0.2 }}
          end={{ x: 1, y: 0.5 }}
          locations={[0.2, 0.5, 1]}
        />
        <View style={styles.content}>
          <View style={styles.mainSection}>
            <AppText
              variant="largeTitle"
              emphasis="emphasized"
              textAlign="center"
              color="accent"
            >
              Application Rejected
            </AppText>
            <AppText
              variant="body"
              textAlign="center"
              color="primary"
              style={styles.bodyText}
            >
              Unfortunately your application was not approved. Please contact
              support for more information.
            </AppText>
          </View>

          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <AppText variant="headline" emphasis="emphasized" color="secondary">
              Sign Out
            </AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Pending state ───────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#F0E7FF', '#F9FBFF', '#BCDCF0']}
        style={styles.gradient}
        start={{ x: 0.05, y: 0.2 }}
        end={{ x: 1, y: 0.5 }}
        locations={[0.2, 0.5, 1]}
      />
      <View style={styles.content}>
        <View style={styles.mainSection}>
          {accountName ?
            <AppText
              variant="subhead"
              emphasis="emphasized"
              textAlign="center"
              color="muted"
            >
              Signed in as {accountName}
            </AppText>
          : null}

          <ActivityIndicator size="large" style={styles.loader} />

          <AppText
            variant="largeTitle"
            emphasis="emphasized"
            textAlign="center"
            color="accent"
          >
            Application Under Review
          </AppText>

          <AppText
            variant="body"
            textAlign="center"
            color="primary"
            style={styles.bodyText}
          >
            Your volunteer application has been submitted.We will notify you
            once an admin has reviewed it. This usually takes 1–2 business days.
          </AppText>

          {autoCheckError && (
            <AppText
              variant="caption1"
              textAlign="center"
              style={styles.autoCheckErrorText}
            >
              Could not verify status. Tap Check Status to retry.
            </AppText>
          )}
        </View>

        <View style={styles.actionsSection}>
          <View style={styles.checkButtonWrapper}>
            <FullWidthButton
              onPress={handleCheckStatus}
              disabled={isCheckingStatus}
              style={{
                opacity: isCheckingStatus ? 0.7 : 1,
              }}
            >
              {isCheckingStatus ?
                <ActivityIndicator size="small" color="#fff" />
              : <AppText
                  variant="headline"
                  emphasis="emphasized"
                  color="secondary"
                >
                  Check Status
                </AppText>
              }
            </FullWidthButton>

            {statusMessage && (
              <AppText
                variant="caption1"
                textAlign="center"
                style={styles.statusMessageText}
              >
                {statusMessage}
              </AppText>
            )}
          </View>

          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <AppText variant="headline" emphasis="emphasized" color="secondary">
              Sign Out
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  fullScreenLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screen: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    inset: 0,
  },
  content: {
    flex: 1,
    paddingTop: rt.insets.top + theme.spacing.s7,
    paddingBottom: rt.insets.bottom + theme.spacing.s6,
    paddingHorizontal: theme.spacing.s5,
    justifyContent: 'space-between',
  },
  mainSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s4,
  },
  loader: {
    marginVertical: theme.spacing.s3,
  },
  bodyText: {
    maxWidth: 320,
  },
  autoCheckErrorText: {
    color: theme.state.error,
    marginTop: theme.spacing.s2,
  },
  actionsSection: {
    gap: theme.spacing.s4,
  },
  checkButtonWrapper: {
    gap: theme.spacing.s2,
  },
  statusMessageText: {
    color: theme.text.muted,
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: '#DC2626',
    paddingVertical: theme.spacing.s3,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
