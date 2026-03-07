import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { setTokens as persistTokens, clearTokens } from './tokenStorage';
import type { TokenPair } from './types';
import { useAuth } from '@/store/useAuth';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// --- Request interceptor: attach Bearer token ---

apiClient.interceptors.request.use(config => {
  const token = useAuth.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: 401 handling with refresh queue ---

type QueueEntry = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueueEntry[] = [];

function processQueue(error: unknown, token: string | null): void {
  for (const entry of failedQueue) {
    if (error || !token) {
      entry.reject(error);
    } else {
      entry.resolve(token);
    }
  }
  failedQueue = [];
}

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(newToken => {
        originalRequest._retry = true;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      });
    }

    // First 401 — initiate refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = useAuth.getState().refreshToken;
      if (!refreshToken) throw new Error('No refresh token');

      // Use plain axios to avoid interceptor recursion
      const { data } = await axios.post<TokenPair>(
        `${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`,
        { refreshToken },
      );

      await persistTokens(data.accessToken, data.refreshToken);
      useAuth.getState().setTokens(data.accessToken, data.refreshToken);

      processQueue(null, data.accessToken);

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuth.getState().reset();
      await clearTokens().catch(() => {});

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
