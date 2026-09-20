import passport from 'passport';
import { createGoogleStrategy } from '../strategies/google.strategy.js';

const googleStrategy = createGoogleStrategy();
if (googleStrategy) {
  passport.use(googleStrategy);
  console.log('🛡️ Google OAuth Strategy Initialized.');
} else {
  console.warn('⚠️ Google OAuth disabled: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.');
}

export default passport;
