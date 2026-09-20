import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const finalBaseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

export const API_BASE_URL = finalBaseUrl;

let inMemoryAccessToken: string | null = null;

export const setAdminAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAdminAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

export const apiClient = axios.create({
  baseURL: finalBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (inMemoryAccessToken && config.headers) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const requestUrl = String(originalRequest?.url || '');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !requestUrl.includes('/auth/refresh') &&
      !requestUrl.includes('/auth/login')
    ) {
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
        const { data } = await axios.post(
          `${finalBaseUrl}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = data.accessToken;
        setAdminAccessToken(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        refreshSubscribers.forEach(({ resolve }) => resolve(newAccessToken));
        refreshSubscribers = [];

        return apiClient(originalRequest);
      } catch (refreshErr) {
        setAdminAccessToken(null);
        refreshSubscribers.forEach(({ reject }) => reject(refreshErr));
        refreshSubscribers = [];
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
