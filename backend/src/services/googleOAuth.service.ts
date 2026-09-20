import crypto from 'crypto';
import type { Request } from 'express';
import { CLIENT_URL, CORS_ORIGIN, JWT_SECRET } from '../config/env.js';

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface GoogleOAuthState {
  returnTo: string;
  expiresAt: number;
  nonce: string;
}

const encode = (value: string) => Buffer.from(value).toString('base64url');
const sign = (payload: string) =>
  crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');

export const hashOAuthCode = (code: string): string => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

const normalizeOrigin = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const allowedFrontendOrigins = new Set(
  [CLIENT_URL, ...CORS_ORIGIN]
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin))
);

export const resolveGoogleFrontendOrigin = (value?: unknown): string => {
  const origin = normalizeOrigin(value);
  return origin && allowedFrontendOrigins.has(origin) ? origin : new URL(CLIENT_URL).origin;
};

export const createGoogleOAuthState = (returnTo?: unknown): string => {
  const state: GoogleOAuthState = {
    returnTo: resolveGoogleFrontendOrigin(returnTo),
    expiresAt: Date.now() + STATE_TTL_MS,
    nonce: crypto.randomBytes(16).toString('base64url'),
  };
  const payload = encode(JSON.stringify(state));
  return `${payload}.${sign(payload)}`;
};

export const readGoogleOAuthState = (state: unknown): GoogleOAuthState | null => {
  if (typeof state !== 'string') return null;
  const [payload, signature] = state.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as GoogleOAuthState;
    if (!decoded.expiresAt || decoded.expiresAt <= Date.now()) return null;
    return { ...decoded, returnTo: resolveGoogleFrontendOrigin(decoded.returnTo) };
  } catch {
    return null;
  }
};

export const getGoogleCallbackUrl = (req: Request): string => {
  const forwardedProtocol = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProtocol || req.protocol;
  const host = req.get('host');
  if (!host) throw new Error('Unable to determine the Google OAuth callback host.');
  return `${protocol}://${host}/api/auth/google/callback`;
};

export const buildGoogleOAuthResultUrl = (state: unknown, params: Record<string, string>): string => {
  const frontendOrigin = readGoogleOAuthState(state)?.returnTo || resolveGoogleFrontendOrigin();
  const callbackUrl = new URL('/auth/success', frontendOrigin);
  Object.entries(params).forEach(([key, value]) => callbackUrl.searchParams.set(key, value));
  return callbackUrl.toString();
};
