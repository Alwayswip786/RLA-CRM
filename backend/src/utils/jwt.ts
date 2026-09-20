import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { JWT_SECRET, JWT_REFRESH_SECRET } from '../config/env.js';

export interface TokenPayload {
  id: string;
  authVersion: number;
  role?: string;
}

/**
 * Generates an Access Token (15m) and Refresh Token (7d).
 */
export const generateAuthTokens = (
  userId: mongoose.Types.ObjectId | string,
  authVersion: number = 1,
  role: string = 'student'
) => {
  const payload: TokenPayload = {
    id: userId.toString(),
    authVersion,
    role,
  };

  // 1. Access Token (Short-lived 15 minutes)
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
  });

  // 2. Refresh Token (Long-lived 7 days)
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

  return { accessToken, refreshToken };
};

/**
 * Verifies and decodes an Access Token.
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

/**
 * Verifies and decodes a Refresh Token.
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};
