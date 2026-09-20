import rateLimit from 'express-rate-limit';

const buildLimiter = (max: number, windowMs = 15 * 60 * 1000, message = 'Too many requests. Please try again later.') =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });

/**
 * Strict limiter for requesting OTP dispatches (5 requests per 15 minutes).
 */
export const otpIssueLimiter = buildLimiter(
  5,
  15 * 60 * 1000,
  'Too many OTP requests from this address. Please wait 15 minutes before requesting again.'
);

/**
 * Limiter for OTP verification attempts (15 attempts per 15 minutes).
 */
export const otpVerifyLimiter = buildLimiter(
  15,
  15 * 60 * 1000,
  'Too many verification attempts. Please wait 15 minutes before trying again.'
);
