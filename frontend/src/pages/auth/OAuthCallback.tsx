import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Scale, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, setAccessToken, setFallbackRefreshToken } from '../../lib/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

interface OAuthExchangeResponse {
  success: boolean;
  message?: string;
  accessToken: string;
  refreshToken?: string;
  user: any;
  redirectTo?: string;
}

// Memory request cache to prevent React 18 StrictMode double-mounting
// from consuming a single-use OAuth code twice.
const oauthExchangeRequests = new Map<string, Promise<OAuthExchangeResponse>>();

const exchangeOAuthCodeOnce = (code: string): Promise<OAuthExchangeResponse> => {
  const existing = oauthExchangeRequests.get(code);
  if (existing) return existing;

  const request = apiClient
    .post<OAuthExchangeResponse>('/auth/google/exchange', { code })
    .then((res) => res.data);

  oauthExchangeRequests.set(code, request);
  return request;
};

const resolveOAuthErrorMessage = (errorKey: string | null): string => {
  switch (errorKey) {
    case 'google_not_configured':
      return 'Google Sign-In is not configured yet on this server. Please use Email & Password.';
    case 'invalid_oauth_state':
      return 'Authentication session expired or was already used. Please try again.';
    case 'google_auth_failed':
      return 'Google sign-in was cancelled or encountered an error. Please try again.';
    default:
      return 'Could not complete Google sign-in. Please try again.';
  }
};

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const setTheme = useThemeStore((state) => state.setTheme);
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const code = searchParams.get('code');
    const oauthError = searchParams.get('error');
    const fallbackRedirect = searchParams.get('redirectTo') || '/dashboard';

    const handleExchange = async () => {
      if (oauthError) {
        toast.error(resolveOAuthErrorMessage(oauthError));
        navigate('/login', { replace: true });
        return;
      }

      if (!code) {
        toast.error('No authorization code received from Google.');
        navigate('/login', { replace: true });
        return;
      }

      try {
        const data = await exchangeOAuthCodeOnce(code);

        if (data.accessToken) {
          setAccessToken(data.accessToken);
        }
        if (data.refreshToken) {
          setFallbackRefreshToken(data.refreshToken);
        }

        login(data.user, data.accessToken);

        if (data.user?.themePreference) {
          setTheme(data.user.themePreference);
        }

        // Clean up URL query parameters
        window.history.replaceState({}, document.title, '/auth/success');

        toast.success('Signed in with Google!', {
          description: `Welcome to Rajinder Law Academy, ${data.user?.name || 'Student'}!`,
        });

        const targetDestination = data.user?.needsOnboarding
          ? '/onboarding'
          : data.redirectTo || fallbackRedirect;

        navigate(targetDestination, { replace: true });
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Google sign-in failed. Please try again.';
        toast.error(errorMsg);
        navigate('/login', { replace: true });
      }
    };

    handleExchange();
  }, [searchParams, navigate, login, setTheme]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Academy Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/5">
          <Scale className="w-8 h-8" />
        </div>

        {/* Status Indicator */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Authorizing Portal Session</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 font-serif">
            Rajinder Law Academy
          </h2>
          <p className="text-sm text-slate-400">
            Securely verifying your Google credentials and preparing your judicial classroom...
          </p>
        </div>

        {/* Progress Bar Animation */}
        <div className="w-48 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full animate-pulse w-2/3 mx-auto" />
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
