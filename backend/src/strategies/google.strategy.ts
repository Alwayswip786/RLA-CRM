import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import { BACKEND_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '../config/env.js';
import User, { type IUser } from '../models/user.model.js';
import { getNextRollNumber } from '../models/sequence.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Checks if Google OAuth credentials are configured.
 */
export const isGoogleAuthConfigured = (): boolean => {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
};

/**
 * Finds an existing user by email/googleId or creates a new student account.
 */
export const findOrCreateGoogleUser = async (profile: Profile): Promise<IUser> => {
  const email = profile.emails?.[0]?.value?.toLowerCase().trim();

  if (!email) {
    throw new ApiError(400, 'A verified email address is required to log in with Google.');
  }

  const photoURL = profile.photos?.[0]?.value || '';
  const displayName = profile.displayName?.trim() || email.split('@')[0] || 'Advocate Aspirant';

  // 1. Check if user already exists by email or googleId
  let user = await User.findOne({
    $or: [{ email }, { googleId: profile.id }],
  }).select('+authVersion +refreshTokens');

  if (user) {
    if (user.accountStatus === 'suspended' || user.accountStatus === 'deactivated') {
      throw new ApiError(403, 'This account is currently restricted. Please contact admissions.');
    }

    let hasChanges = false;

    // Link googleId if missing
    if (!user.googleId) {
      user.googleId = profile.id;
      hasChanges = true;
    }

    // Set avatar if user doesn't have one
    if (!user.avatarUrl && photoURL) {
      user.avatarUrl = photoURL;
      hasChanges = true;
    }

    // Ensure email verification is confirmed
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      hasChanges = true;
    }

    if (hasChanges) {
      await user.save();
    }

    return user;
  }

  // 2. If new user, assign official sequential Roll Number (e.g. RLA20260001)
  const rollNo = await getNextRollNumber();

  user = await User.create({
    rollNo,
    name: displayName,
    email,
    googleId: profile.id,
    avatarUrl: photoURL,
    isEmailVerified: true,
    needsOnboarding: true,
    targetExam: 'Delhi Judicial Service (DJS)',
    targetState: 'Delhi / NCR',
    targetYear: '2025-2026',
    academicStatus: 'Full-Time Aspirant',
    themePreference: 'light',
    accountStatus: 'active',
  });

  return user;
};

/**
 * Creates and configures the Passport Google Strategy.
 */
export const createGoogleStrategy = (): GoogleStrategy | null => {
  if (!isGoogleAuthConfigured()) return null;

  return new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await findOrCreateGoogleUser(profile);
        return done(null, user);
      } catch (error: any) {
        return done(error, undefined);
      }
    }
  );
};
