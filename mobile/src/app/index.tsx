import React, { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/store/useAuth';
import { useRole } from '@/store/useRole';
import { fetchVolunteerProfile } from '@/api/volunteer-api';

const AUTH_BYPASS = process.env.EXPO_PUBLIC_AUTH_BYPASS === 'true';

// ── VolunteerGate ─────────────────────────────────────────────────────────────
// Fetches volunteer profile to check verificationStatus before routing.
// On network error → falls back to volunteer home (never blocks the user).
function VolunteerGate() {
  const router = useRouter();

  useEffect(() => {
    fetchVolunteerProfile()
      .then(profile => {
        if (profile.verificationStatus === 'approved') {
          router.replace('/volunteer/home' as any);
        } else {
          // pending or rejected → hold on the pending screen
          router.replace({
            pathname:
              '/volunteer/VerificationPending/verificationPending' as any,
            params: { verificationStatus: profile.verificationStatus },
          });
        }
      })
      .catch(() => {
        // Network error → route to pending screen (don't bypass the gate)
        // VerificationPending will handle the error and let user retry
        router.replace({
          pathname: '/volunteer/VerificationPending/verificationPending' as any,
        });
      });
  }, [router]);

  return null; // blank while the fetch resolves
}

const Index = () => {
  const isAuthenticated = useAuth(state => state.isAuthenticated);
  const userRole = useAuth(state => state.userRole);
  const envRole = useRole(state => state.role);
  const resolvedRole = userRole || envRole;

  // ── Dev bypass: use EXPO_PUBLIC_ROLE to skip auth ──
  if (AUTH_BYPASS) {
    if (envRole === 'volunteer') return <Redirect href="/volunteer/home" />;
    return <Redirect href="/user/home" />;
  }

  // ── Production: auth-aware routing ──
  if (isAuthenticated && resolvedRole) {
    if (resolvedRole === 'volunteer') return <VolunteerGate />;
    return <Redirect href="/user/home" />;
  }

  // Not authenticated → start flow
  return <Redirect href="/start/welcome" />;
};

export default Index;
