import axios from 'axios';
import { secureStorage } from './secureStorage';
import { router } from 'expo-router';
import { useAuthStore } from '@/features/auth/store';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_URL,
});

// ── Request interceptor — attach access token ─────────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.getAccessToken();
  const unauthRoutes = ['/auth/login', '/auth/register-company', '/auth/refresh'];
  const isPublic = unauthRoutes.some(r => config.url?.includes(r));
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (!isPublic) {
    const controller = new AbortController();
    config.signal = controller.signal;
    controller.abort('No auth token available');
  }
  return config;
});

// ── Response interceptor — silent refresh on 401 ──────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (e: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  refreshQueue = [];
};

const logoutUser = async () => {
  await secureStorage.clearTokens();
  useAuthStore.getState().clearAuth();
  router.replace('/(auth)/login');
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.data?.code === 'MUST_CHANGE_PASSWORD') {
      router.replace('/(auth)/change-password');
      return Promise.reject(error);
    }

    // Attempt silent refresh on 401 (but not on the refresh endpoint itself)
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue concurrent requests until refresh completes
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = await secureStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await apiClient.post('/auth/refresh', { refreshToken });
        await secureStorage.setTokens(data.accessToken, data.refreshToken);

        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await logoutUser();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
