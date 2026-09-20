import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const finalBaseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

export const API_BASE_URL = finalBaseUrl;
const REFRESH_FALLBACK_KEY = 'rla.refresh.fallback.v1';

// Safari & WebKit Third-Party Cookie Check
const isWebKitAuthRisk = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return isIOS || isSafari;
};

export const shouldUseRefreshFallback = () => isWebKitAuthRisk();

export const setFallbackRefreshToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (!shouldUseRefreshFallback()) return;
  if (token) window.localStorage.setItem(REFRESH_FALLBACK_KEY, token);
  else window.localStorage.removeItem(REFRESH_FALLBACK_KEY);
};

export const getFallbackRefreshToken = () => {
  if (typeof window === 'undefined' || !shouldUseRefreshFallback()) return null;
  return window.localStorage.getItem(REFRESH_FALLBACK_KEY);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// IN-MEMORY ACCESS TOKEN (Immune to XSS)
// ============================================================================
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

// ============================================================================
// CONCURRENCY-SAFE REFRESH ENGINE (GoMed Pattern)
// ============================================================================
let isRefreshing = false;
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
};

const onTokenRefreshFailed = (error: unknown) => {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
};

export const requestSilentRefresh = async () => {
  const retryDelays = [0, 500, 1200];
  let lastError: unknown;

  for (const delay of retryDelays) {
    if (delay > 0) await wait(delay);
    try {
      return await axios.post(
        `${finalBaseUrl}/auth/refresh`,
        { refreshToken: getFallbackRefreshToken() },
        {
          withCredentials: true,
          headers: shouldUseRefreshFallback() ? { 'X-RLA-Token-Fallback': '1' } : undefined,
        }
      );
    } catch (error: any) {
      lastError = error;
      const status = error?.response?.status;
      const retryable = !error?.response || status === 502 || status === 503 || status === 504;
      if (!retryable) throw error;
    }
  }

  throw lastError;
};

// ============================================================================
// AXIOS INSTANCE
// ============================================================================
export const apiClient = axios.create({
  baseURL: finalBaseUrl,
  withCredentials: true, // Sends HttpOnly refreshToken cookie automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach in-memory JWT
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (inMemoryAccessToken && config.headers) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  }
  if (shouldUseRefreshFallback() && config.headers) {
    config.headers['X-RLA-Token-Fallback'] = '1';
  }
  return config;
});

// Response Interceptor: Silent Refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const requestUrl = String(originalRequest?.url || '');

    // Check for 401 Unauthorized (Expired Access Token)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !requestUrl.includes('/auth/refresh') &&
      !requestUrl.includes('/auth/login') &&
      !requestUrl.includes('/auth/register-email')
    ) {
      // If a refresh is already in flight, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await requestSilentRefresh();
        const newAccessToken = data.accessToken;

        setAccessToken(newAccessToken);
        if (data.refreshToken) {
          setFallbackRefreshToken(data.refreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        onTokenRefreshed(newAccessToken);

        return apiClient(originalRequest);
      } catch (refreshError: any) {
        setAccessToken(null);
        setFallbackRefreshToken(null);
        onTokenRefreshFailed(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
