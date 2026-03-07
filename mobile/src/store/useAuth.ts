import { create } from 'zustand';
import type { Account } from '@/api/types';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '@/api/tokenStorage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  account: Account | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

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

const initialState = {
  accessToken: null,
  refreshToken: null,
  account: null,
  isAuthenticated: false,
  isHydrated: false,
};

export const useAuth = create<AuthState>()(set => ({
  ...initialState,

  signIn: async (accessToken, refreshToken, account) => {
    await setTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken, account, isAuthenticated: true });
  },

  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
  },

  signOut: async () => {
    await clearTokens();
    set({ ...initialState, isHydrated: true });
  },

  reset: () => {
    set({ ...initialState, isHydrated: true });
  },

  hydrate: async () => {
    const [accessToken, refreshToken] = await Promise.all([
      getAccessToken(),
      getRefreshToken(),
    ]);

    if (accessToken && refreshToken) {
      set({
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isHydrated: true,
      });
    } else {
      set({ ...initialState, isHydrated: true });
    }
  },
}));
