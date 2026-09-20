import { v2 as cloudinary } from 'cloudinary';
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from './env.js';

export const isCloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME &&
  CLOUDINARY_API_KEY &&
  CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log(`[CLOUDINARY] Connected to cloud: ${CLOUDINARY_CLOUD_NAME}`);
} else {
  console.warn('[CLOUDINARY] Credentials not provided. Media upload features will fallback to local storage.');
}

/**
 * Asserts that Cloudinary is configured before attempting remote uploads.
 */
export const assertCloudinaryConfigured = (): void => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured. Please verify your Cloudinary environment keys in .env.');
  }
};

export default cloudinary;
