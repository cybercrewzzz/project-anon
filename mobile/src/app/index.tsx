import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/store/useAuth';
import { useRole } from '@/store/useRole';

const AUTH_BYPASS = process.env.EXPO_PUBLIC_AUTH_BYPASS === 'true';

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
    if (resolvedRole === 'volunteer')
      return <Redirect href="/volunteer/home" />;
    return <Redirect href="/user/home" />;
  }

  // Not authenticated → start flow
  return <Redirect href="/start/welcome" />;
};

export default Index;
