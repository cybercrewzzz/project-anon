import { create } from 'zustand';
import type { Account, AccountRole } from '@/api/types';
import {
  getAccessToken,
  getRefreshToken,
  setTokens as persistTokens,
  clearTokens,
} from '@/api/tokenStorage';
import { removeDeviceToken } from '@/api/account';

type MobileRole = Extract<AccountRole, 'user' | 'volunteer'>;

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  account: Account | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  /** Derived role from account.roles — 'volunteer' if roles include it, else 'user' */
  userRole: MobileRole | null;

  /** Persist tokens + set in-memory state after login/register */
  signIn: (
    accessToken: string,
    refreshToken: string,
    account: Account,
  ) => Promise<void>;

  /** Update in-memory tokens (called by refresh interceptor) */
  setTokens: (accessToken: string, refreshToken: string) => void;

  /** Clear storage + reset in-memory state */
  signOut: () => Promise<void>;

  /** Reset in-memory state only (used by interceptor on refresh failure) */
  reset: () => void;

  /** Read tokens from secure storage on app start */
  hydrate: () => Promise<void>;
}

/** Derive the primary role from the account's roles array */
function deriveRole(roles: AccountRole[]): MobileRole {
  if (roles.includes('volunteer')) return 'volunteer';
  return 'user';
}

const initialState = {
  accessToken: null,
  refreshToken: null,
  account: null,
  isAuthenticated: false,
  isHydrated: false,
  userRole: null,
};

export const useAuth = create<AuthState>()(set => ({
  ...initialState,

  signIn: async (accessToken, refreshToken, account) => {
    await persistTokens(accessToken, refreshToken);
    set({
      accessToken,
      refreshToken,
      account,
      isAuthenticated: true,
      userRole: deriveRole(account.roles),
    });
  },

  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
  },

  signOut: async () => {
    try {
      await removeDeviceToken();
    } catch {
      // Ignore errors from the backend on logout
    }
    await clearTokens();
    set({ ...initialState, isHydrated: true });
  },

  reset: () => {
    set({ ...initialState, isHydrated: true });
  },

  hydrate: async () => {
    try {
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();

      if (accessToken && refreshToken) {
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
          // Note: account and userRole remain null until a full login
          // or profile fetch. Token presence is enough for the gatekeeper.
        });
      }
    } catch {
      await clearTokens().catch(() => {});
    } finally {
      set({ isHydrated: true });
    }
  },
}));
