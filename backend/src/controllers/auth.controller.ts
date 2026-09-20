import { type Request, type Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import User, { type IUser } from '../models/user.model.js';
import { generateAuthTokens, verifyRefreshToken } from '../utils/jwt.js';
import {
  beginRegistration,
  completeRegistration,
  resendVerificationOtp,
  beginPasswordReset,
  verifyPasswordResetOtp,
  completePasswordReset,
} from '../services/otpAuth.service.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import OAuthLoginCode from '../models/oauthLoginCode.model.js';
import { hashOAuthCode, buildGoogleOAuthResultUrl } from '../services/googleOAuth.service.js';
import { CLIENT_URL, NODE_ENV } from '../config/env.js';

const isProduction = NODE_ENV === 'production' || CLIENT_URL.startsWith('https://');

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, cookieOptions);
};

const sanitizeUser = (user: IUser | any) => {
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  const hasPassword = Boolean(obj.password || user.password);
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.authVersion;
  return {
    ...obj,
    hasPassword,
  };
};

/**
 * 1. Register candidate via email and dispatch 6-digit OTP
 */
export const registerEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Please provide both email and password.');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long.');
  }

  const result = await beginRegistration({ email, password });

  res.status(202).json({
    success: true,
    requiresVerification: true,
    email: email.toLowerCase().trim(),
    emailMasked: result.emailMasked,
    message: 'Verification code dispatched to your email.',
    redirectTo: '/email-verification',
  });
});

/**
 * 2. Verify Email OTP, create official User, and assign sequential Roll Number
 */
export const verifyEmailOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new ApiError(400, 'Please provide both email and 6-digit verification code.');
  }

  const user = await completeRegistration(email, String(otp).trim());
  const tokens = generateAuthTokens(user._id, user.authVersion, user.role);

  user.refreshTokens.push(tokens.refreshToken);
  user.lastActiveAt = new Date();
  user.lastLoginAt = new Date();
  await user.save();

  setRefreshCookie(res, tokens.refreshToken);

  res.status(201).json({
    success: true,
    message: 'Email verified successfully. Welcome to Rajinder Law Academy!',
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: sanitizeUser(user),
    redirectTo: '/onboarding',
  });
});

/**
 * 3. Resend Email Verification OTP
 */
export const resendEmailOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, 'Email address is required.');
  }

  const result = await resendVerificationOtp(email);

  res.status(200).json({
    success: true,
    message: 'A fresh verification code has been dispatched to your email.',
    emailMasked: result.emailMasked,
  });
});

/**
 * 4. Login with Email or Roll Number + Password
 */
export const login = catchAsync(async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    throw new ApiError(400, 'Please enter your Roll No. or Email, and password.');
  }

  const trimmed = String(identifier).trim();

  // Multi-identifier lookup: matches email (case-insensitive) OR rollNo (uppercase)
  const user = await User.findOne({
    $or: [{ email: trimmed.toLowerCase() }, { rollNo: trimmed.toUpperCase() }],
  }).select('+password +authVersion +refreshTokens');

  if (!user || !user.password) {
    throw new ApiError(401, 'Invalid credentials. Please verify your details and try again.');
  }

  if (user.accountStatus === 'suspended' || user.accountStatus === 'deactivated') {
    throw new ApiError(403, 'This account is currently restricted. Please contact admissions.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials. Please verify your details and try again.');
  }

  const tokens = generateAuthTokens(user._id, user.authVersion, user.role);

  // Keep max 5 active device refresh tokens
  user.refreshTokens = user.refreshTokens.slice(-4);
  user.refreshTokens.push(tokens.refreshToken);
  user.lastLoginAt = new Date();
  user.lastActiveAt = new Date();
  await user.save();

  setRefreshCookie(res, tokens.refreshToken);

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: sanitizeUser(user),
    redirectTo: user.needsOnboarding ? '/onboarding' : '/dashboard',
  });
});

/**
 * 5. Request Password Reset OTP
 */
export const forgotPasswordRequest = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, 'Email address is required.');
  }

  await beginPasswordReset(email);

  res.status(200).json({
    success: true,
    message: 'If an account exists with this email, a 6-digit reset code has been sent.',
  });
});

/**
 * 6. Verify Password Reset OTP
 */
export const forgotPasswordVerify = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new ApiError(400, 'Email and 6-digit OTP are required.');
  }

  const resetToken = await verifyPasswordResetOtp(email, String(otp).trim());

  res.status(200).json({
    success: true,
    message: 'Code verified successfully. Please enter your new password.',
    resetToken,
  });
});

/**
 * 7. Complete Password Reset
 */
export const forgotPasswordReset = catchAsync(async (req: Request, res: Response) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    throw new ApiError(400, 'Reset token and new password are required.');
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long.');
  }

  await completePasswordReset(resetToken, newPassword);

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now log in with your new credentials.',
  });
});

/**
 * 8. Silent Token Refresh (Uses HttpOnly Cookie or Fallback)
 */
export const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) {
    throw new ApiError(401, 'Refresh token missing. Please log in.');
  }

  let decoded: { id: string; authVersion: number; role?: string };
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Refresh session expired. Please log in again.');
  }

  const user = await User.findById(decoded.id).select('+authVersion +refreshTokens');
  if (!user) {
    throw new ApiError(401, 'Account no longer exists.');
  }

  if ((decoded.authVersion ?? 0) !== (user.authVersion ?? 0)) {
    throw new ApiError(401, 'Session invalidated. Please log in again.');
  }

  const tokens = generateAuthTokens(user._id, user.authVersion, user.role);

  // Rotate token
  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  user.refreshTokens.push(tokens.refreshToken);
  user.lastActiveAt = new Date();
  await user.save();

  setRefreshCookie(res, tokens.refreshToken);

  res.status(200).json({
    success: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

/**
 * 9. Logout
 */
export const logout = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (token && req.user) {
    req.user.refreshTokens = req.user.refreshTokens.filter((t: string) => t !== token);
    await req.user.save();
  }

  res.clearCookie('refreshToken', cookieOptions);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

/**
 * 10. Fetch Current Authenticated Student Profile & Theme
 */
export const getMe = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

/**
 * 11. Complete Mandatory Onboarding
 */
export const completeOnboarding = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, 'Unauthorized.');
  }

  const { salutation, name, targetExam, targetState, targetYear, academicStatus } = req.body;

  if (salutation) user.salutation = salutation;
  if (name) user.name = String(name).trim();
  if (targetExam) user.targetExam = targetExam;
  if (targetState) user.targetState = targetState;
  if (targetYear) user.targetYear = targetYear;
  if (academicStatus) user.academicStatus = academicStatus;

  user.needsOnboarding = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Classroom onboarding completed successfully.',
    user: sanitizeUser(user),
  });
});

/**
 * 12. Save Cloud Theme Preference (Light / Dark / System)
 */
export const updateThemePreference = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, 'Unauthorized.');
  }

  const { theme } = req.body;
  if (!['light', 'dark', 'system'].includes(theme)) {
    throw new ApiError(400, 'Invalid theme mode. Expected light, dark, or system.');
  }

  user.themePreference = theme;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Theme preference saved to cloud.',
    themePreference: theme,
  });
});

/**
 * 13. Google OAuth Callback (Invoked by Passport after Google validates identity)
 * Issues single-use ephemeral exchange code and redirects to frontend with code
 */
export const googleCallback = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUser;
  if (!user) {
    throw new ApiError(401, 'Google authentication did not return a valid user profile.');
  }

  const redirectTo = user.needsOnboarding ? '/onboarding' : '/dashboard';
  const code = crypto.randomBytes(32).toString('base64url');

  await OAuthLoginCode.create({
    codeHash: hashOAuthCode(code),
    userId: user._id,
    redirectTo,
    expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2-minute ephemeral TTL
  });

  res.redirect(buildGoogleOAuthResultUrl(req.query.state, { code, redirectTo }));
});

/**
 * 14. Exchange Ephemeral OAuth Code for JWTs & HttpOnly Cookie
 * Atomically consumes the code to prevent replay attacks
 */
export const exchangeGoogleCode = catchAsync(async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    throw new ApiError(400, 'OAuth code is required.');
  }

  const loginCode = await OAuthLoginCode.findOneAndUpdate(
    {
      codeHash: hashOAuthCode(code),
      consumedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    },
    { $set: { consumedAt: new Date() } },
    { new: true }
  );

  if (!loginCode) {
    throw new ApiError(401, 'OAuth code expired or already used. Please try again.');
  }

  const user = await User.findById(loginCode.userId).select('+authVersion +refreshTokens');
  if (!user) {
    throw new ApiError(401, 'Account no longer exists.');
  }

  if (user.accountStatus === 'suspended' || user.accountStatus === 'deactivated') {
    throw new ApiError(403, 'This account is currently restricted. Please contact admissions.');
  }

  const tokens = generateAuthTokens(user._id, user.authVersion, user.role);

  // Keep max 5 active refresh tokens
  user.refreshTokens = user.refreshTokens.slice(-4);
  user.refreshTokens.push(tokens.refreshToken);
  user.lastActiveAt = new Date();
  user.lastLoginAt = new Date();
  await user.save();

  setRefreshCookie(res, tokens.refreshToken);

  res.status(200).json({
    success: true,
    message: 'Google login successful. Welcome to Rajinder Law Academy!',
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: sanitizeUser(user),
    redirectTo: user.needsOnboarding ? '/onboarding' : loginCode.redirectTo || '/dashboard',
  });
});

/**
 * 15. Update Authenticated Student Profile
 */
export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, 'Unauthorized.');
  }

  const { salutation, name, phone, targetExam, targetState, targetYear, academicStatus } = req.body;

  if (salutation && ['Adv.', 'Mr.', 'Ms.', 'Dr.'].includes(salutation)) {
    user.salutation = salutation;
  }
  if (name && typeof name === 'string' && name.trim()) {
    user.name = name.trim();
  }
  if (phone !== undefined && typeof phone === 'string') {
    user.phone = phone.trim();
  }
  if (targetExam && typeof targetExam === 'string') {
    user.targetExam = targetExam.trim();
  }
  if (targetState && typeof targetState === 'string') {
    user.targetState = targetState.trim();
  }
  if (targetYear && typeof targetYear === 'string') {
    user.targetYear = targetYear.trim();
  }
  if (
    academicStatus &&
    ['Full-Time Aspirant', 'Class 11 Student', 'Class 12 Student'].includes(academicStatus)
  ) {
    user.academicStatus = academicStatus;
  }

  user.lastActiveAt = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    user: sanitizeUser(user),
  });
});

/**
 * 16. In-Session Password Change
 */
export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized.');
  }

  const { currentPassword, newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters long.');
  }

  // Fetch full user record with password & refresh tokens
  const user = await User.findById(userId).select('+password +authVersion +refreshTokens');
  if (!user) {
    throw new ApiError(401, 'Account no longer exists.');
  }

  if (user.accountStatus === 'suspended' || user.accountStatus === 'deactivated') {
    throw new ApiError(403, 'This account is currently restricted. Please contact admissions.');
  }

  // If user already has a password set, verify current password
  if (user.password) {
    if (!currentPassword) {
      throw new ApiError(400, 'Please provide your current password.');
    }
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      throw new ApiError(401, 'Current password is incorrect.');
    }
  }

  // Hash new password and update
  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(newPassword, salt);
  user.authVersion = (user.authVersion || 1) + 1; // Invalidate other sessions
  user.lastActiveAt = new Date();

  // Issue fresh tokens for the current session
  const tokens = generateAuthTokens(user._id, user.authVersion, user.role);
  user.refreshTokens = [tokens.refreshToken]; // Invalidate older refresh tokens
  await user.save();

  setRefreshCookie(res, tokens.refreshToken);

  res.status(200).json({
    success: true,
    message: 'Password updated successfully.',
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: sanitizeUser(user),
  });
});
