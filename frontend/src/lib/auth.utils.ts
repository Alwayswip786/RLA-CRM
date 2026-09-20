import { API_BASE_URL } from './apiClient';

/**
 * Initiates the Google OAuth authorization flow by redirecting
 * the browser to the backend OAuth entrypoint with a signed CSRF state.
 */
export const loginWithGoogle = (): void => {
  const url = new URL(`${API_BASE_URL}/auth/google`);
  url.searchParams.set('returnTo', window.location.origin);
  window.location.assign(url.toString());
};
