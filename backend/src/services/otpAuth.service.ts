import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import OtpRecord, { type OtpPurpose } from '../models/otp.model.js';
import PendingRegistration from '../models/pendingRegistration.model.js';
import User from '../models/user.model.js';
import { getNextRollNumber } from '../models/sequence.model.js';
import ApiError from '../utils/ApiError.js';
import { JWT_SECRET } from '../config/env.js';
import { sendOtpEmail } from './email.service.js';

const OTP_TTL_MS = 10 * 60 * 1000;       // 10 minutes
const RESET_TTL_MS = 15 * 60 * 1000;     // 15 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;    // 60 seconds

const normalizeEmail = (email: unknown): string => String(email || '').toLowerCase().trim();

const hashSecret = (value: string): string =>
  crypto.createHmac('sha256', JWT_SECRET).update(value).digest('hex');

const generateOtp = (): string => crypto.randomInt(100000, 1000000).toString();

export const maskEmail = (email: string): string => {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const visible = name.slice(0, 2);
  const masked = '*'.repeat(Math.max(2, name.length - 2));
  return `${visible}${masked}@${domain}`;
};

/**
 * Issues and emails an OTP code. Enforces resend cooldown and marks previous codes consumed.
 */
const issueOtp = async (email: string, purpose: OtpPurpose, enforceCooldown = false) => {
  const existing = await OtpRecord.findOne({ email, purpose, consumed: false }).sort({ createdAt: -1 });

  if (enforceCooldown && existing && Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    const secondsRemaining = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt.getTime())) / 1000);
    throw new ApiError(429, `Please wait ${secondsRemaining} seconds before requesting another code.`);
  }

  const otp = generateOtp();
  const record = await OtpRecord.create({
    email,
    purpose,
    otpHash: hashSecret(otp),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    lastSentAt: new Date(),
  });

  try {
    await sendOtpEmail({
      email,
      otp,
      purpose,
    });
  } catch (error) {
    await OtpRecord.deleteOne({ _id: record._id }).catch(() => undefined);
    throw error;
  }

  // Retire prior active codes for this email and purpose
  await OtpRecord.updateMany(
    { _id: { $ne: record._id }, email, purpose, consumed: false },
    { $set: { consumed: true } }
  );
};

/**
 * Verifies an OTP code using timing-safe comparison and handles attempt lockout.
 */
const verifyOtp = async (email: string, otp: string, purpose: OtpPurpose) => {
  const record = await OtpRecord.findOne({ email, purpose, consumed: false })
    .select('+otpHash')
    .sort({ createdAt: -1 });

  if (!record || record.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(400, 'This verification code has expired. Please request a new code.');
  }

  if (record.attempts >= 5) {
    throw new ApiError(429, 'Too many incorrect attempts. Please request a new verification code.');
  }

  const expectedHash = hashSecret(otp);
  const isValid =
    /^\d{6}$/.test(otp) &&
    crypto.timingSafeEqual(Buffer.from(record.otpHash), Buffer.from(expectedHash));

  if (!isValid) {
    record.attempts += 1;
    await record.save();
    throw new ApiError(400, 'Incorrect verification code. Please check and try again.');
  }

  return record;
};

/**
 * Stages a new email registration into PendingRegistration (24h TTL) and dispatches OTP.
 */
export const beginRegistration = async (input: { email: string; password: string }) => {
  const email = normalizeEmail(input.email);

  // Check if active user already exists
  if (await User.exists({ email })) {
    throw new ApiError(409, 'This email address is already registered. Please log in.');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  // Stage into PendingRegistration with 24-hour expiration
  await PendingRegistration.findOneAndUpdate(
    { email },
    {
      email,
      passwordHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    { upsert: true, new: true, runValidators: true }
  );

  // Dispatch OTP
  await issueOtp(email, 'email_verification');

  return { emailMasked: maskEmail(email) };
};

/**
 * Resends verification OTP to an active pending registration.
 */
export const resendVerificationOtp = async (emailInput: string) => {
  const email = normalizeEmail(emailInput);

  const pending = await PendingRegistration.exists({ email });
  if (!pending) {
    throw new ApiError(404, 'Pending registration expired or not found. Please start registration again.');
  }

  await issueOtp(email, 'email_verification', true);
  return { emailMasked: maskEmail(email) };
};

/**
 * Verifies email OTP, creates the official User document, and assigns a sequential Roll No.
 */
export const completeRegistration = async (emailInput: string, otp: string) => {
  const email = normalizeEmail(emailInput);

  // 1. Verify OTP
  const record = await verifyOtp(email, otp, 'email_verification');

  // 2. Retrieve staged registration
  const pending = await PendingRegistration.findOne({ email }).select('+passwordHash');
  if (!pending || pending.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(400, 'Registration session expired. Please register again.');
  }

  if (await User.exists({ email })) {
    throw new ApiError(409, 'This email address is already registered.');
  }

  // 3. Atomically issue next sequential Roll Number (RLA20260001)
  const rollNo = await getNextRollNumber();

  // 4. Create the official user document
  const user = await User.create({
    rollNo,
    name: email.split('@')[0],
    email,
    password: pending.passwordHash,
    isEmailVerified: true,
    needsOnboarding: true,
    themePreference: 'light',
  });

  // 5. Clean up pending records
  await Promise.all([record.deleteOne(), pending.deleteOne()]);

  return user;
};

/**
 * Initiates password reset by sending an OTP code.
 */
export const beginPasswordReset = async (emailInput: string) => {
  const email = normalizeEmail(emailInput);
  const exists = await User.exists({ email });
  if (!exists) {
    // Avoid email enumeration: return gracefully
    return;
  }

  const recent = await OtpRecord.findOne({ email, purpose: 'password_reset', consumed: false }).sort({ createdAt: -1 });
  if (recent && Date.now() - recent.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    return;
  }

  await issueOtp(email, 'password_reset');
};

/**
 * Verifies password reset OTP and generates a single-use reset token.
 */
export const verifyPasswordResetOtp = async (emailInput: string, otp: string): Promise<string> => {
  const email = normalizeEmail(emailInput);
  const record = await verifyOtp(email, otp, 'password_reset');

  const token = crypto.randomBytes(32).toString('base64url');
  record.consumed = true;
  record.verifiedAt = new Date();
  record.resetTokenHash = hashSecret(token);
  record.resetTokenExpiresAt = new Date(Date.now() + RESET_TTL_MS);
  record.expiresAt = record.resetTokenExpiresAt;
  await record.save();

  return token;
};

/**
 * Completes password reset with the verified single-use reset token and increments authVersion.
 */
export const completePasswordReset = async (token: string, newPassword: string) => {
  const record = await OtpRecord.findOne({
    purpose: 'password_reset',
    consumed: true,
    resetTokenHash: hashSecret(token),
    resetTokenExpiresAt: { $gt: new Date() },
  }).select('+resetTokenHash');

  if (!record) {
    throw new ApiError(400, 'Password reset session is invalid or has expired.');
  }

  const user = await User.findOne({ email: record.email }).select('+password +authVersion');
  if (!user) {
    throw new ApiError(400, 'User associated with reset token no longer exists.');
  }

  // Update password and invalidate all previous active JWT sessions
  user.password = await bcrypt.hash(newPassword, 12);
  user.refreshTokens = [];
  user.authVersion = (user.authVersion || 0) + 1;
  await user.save();

  await record.deleteOne();
};
