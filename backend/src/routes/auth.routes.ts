import { Router } from 'express';
import {
  registerEmail,
  verifyEmailOtp,
  resendEmailOtp,
  login,
  forgotPasswordRequest,
  forgotPasswordVerify,
  forgotPasswordReset,
  refresh,
  logout,
  getMe,
  completeOnboarding,
  updateThemePreference,
  googleCallback,
  exchangeGoogleCode,
  updateProfile,
  changePassword,
} from '../controllers/auth.controller.js';
import passport from '../config/passport.js';
import { isGoogleAuthConfigured } from '../strategies/google.strategy.js';
import {
  createGoogleOAuthState,
  readGoogleOAuthState,
  getGoogleCallbackUrl,
  buildGoogleOAuthResultUrl,
} from '../services/googleOAuth.service.js';
import { protect } from '../middlewares/auth.middleware.js';
import { otpIssueLimiter, otpVerifyLimiter } from '../middlewares/otpRateLimit.middleware.js';

const router = Router();

// --- Public Authentication Routes ---
router.post('/register-email', otpIssueLimiter, registerEmail);
router.post('/verify-email-otp', otpVerifyLimiter, verifyEmailOtp);
router.post('/resend-email-otp', otpIssueLimiter, resendEmailOtp);
router.post('/login', login);
router.post('/forgot-password/request', otpIssueLimiter, forgotPasswordRequest);
router.post('/forgot-password/verify', otpVerifyLimiter, forgotPasswordVerify);
router.post('/forgot-password/reset', forgotPasswordReset);
router.post('/refresh', refresh);

// --- Google OAuth Routes ---
router.get('/google', (req, res, next) => {
  if (!isGoogleAuthConfigured()) {
    res.redirect(buildGoogleOAuthResultUrl(req.query.returnTo, { error: 'google_not_configured' }));
    return;
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    callbackURL: getGoogleCallbackUrl(req),
    state: createGoogleOAuthState(req.query.returnTo),
  } as any)(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    if (!readGoogleOAuthState(req.query.state)) {
      res.redirect(buildGoogleOAuthResultUrl(req.query.state, { error: 'invalid_oauth_state' }));
      return;
    }
    next();
  },
  (req, res, next) =>
    passport.authenticate(
      'google',
      {
        session: false,
        callbackURL: getGoogleCallbackUrl(req),
      } as any,
      (error: unknown, user: any) => {
        if (error || !user) {
          res.redirect(buildGoogleOAuthResultUrl(req.query.state, { error: 'google_auth_failed' }));
          return;
        }
        req.user = user;
        next();
      }
    )(req, res, next),
  googleCallback
);

router.post('/google/exchange', exchangeGoogleCode);

// --- Protected Authentication & Profile Routes ---
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);
router.patch('/onboarding', protect, completeOnboarding);
router.patch('/theme', protect, updateThemePreference);

export default router;
