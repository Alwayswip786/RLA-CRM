import dotenv from 'dotenv';

dotenv.config();

/**
 * Helper to safely read and default string environment variables.
 */
const getEnv = (key: string, fallback = ''): string => {
    return process.env[key] || fallback;
};

/**
 * Helper to safely read and parse integer environment variables.
 */
const getEnvNumber = (key: string, fallback: number): number => {
    const raw = process.env[key];
    if (!raw) return fallback;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Helper to safely read and parse boolean environment variables.
 */
const getEnvBoolean = (key: string, fallback = false): boolean => {
    const raw = process.env[key];
    if (!raw) return fallback;
    return raw.trim().toLowerCase() === 'true';
};

/**
 * Helper to safely read comma-separated environment variables into an array.
 */
const getEnvArray = (key: string, fallback = ''): string[] => {
    const raw = process.env[key] || fallback;
    return raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

// --- Core Environment & Networking ---
export const NODE_ENV = getEnv('NODE_ENV', 'development');
export const PORT = getEnvNumber('PORT', 8000);
export const MONGODB_URI = getEnv('MONGODB_URI', 'mongodb://localhost:27017/rla_crm');
export const MONGO_URI = MONGODB_URI;
export const CORS_ORIGIN = getEnvArray(
    'CORS_ORIGIN',
    'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174'
);
export const BACKEND_URL = getEnv('BACKEND_URL', 'http://localhost:8000');
export const CLIENT_URL = getEnv('CLIENT_URL', 'http://localhost:5173');
export const ADMIN_URL = getEnv('ADMIN_URL', 'http://localhost:5174');

// --- Email Service (Resend) ---
export const RESEND_API_KEY = getEnv('RESEND_API_KEY', '');
export const EMAIL_FROM = getEnv('EMAIL_FROM', 'Rajinder Law Academy <onboarding@resend.dev>');

// --- Authentication & Tokens ---
export const JWT_SECRET = getEnv('JWT_SECRET', 'rla_crm_secret_jwt_access_token_2026_super_secure_key');
export const JWT_REFRESH_SECRET = getEnv('JWT_REFRESH_SECRET', 'rla_crm_secret_jwt_refresh_token_2026_super_secure_key');

// --- Google OAuth ---
export const GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID', '');
export const GOOGLE_CLIENT_SECRET = getEnv('GOOGLE_CLIENT_SECRET', '');

// --- Cloudinary CDN & Media Storage ---
export const CLOUDINARY_CLOUD_NAME = getEnv('CLOUDINARY_CLOUD_NAME', '');
export const CLOUDINARY_API_KEY = getEnv('CLOUDINARY_API_KEY', '');
export const CLOUDINARY_API_SECRET = getEnv('CLOUDINARY_API_SECRET', '');

