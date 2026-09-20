import cloudinary, { assertCloudinaryConfigured, isCloudinaryConfigured } from '../config/cloudinary.js';
import streamifier from 'streamifier';
import { type UploadApiOptions } from 'cloudinary';

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
  resourceType: string;
}

/**
 * Streams an image buffer (JPEG, PNG, WebP) directly to Cloudinary with automated optimization.
 */
export const uploadImageBufferToCloudinary = (
  buffer: Buffer,
  folder: string,
  options: Partial<UploadApiOptions> = {}
): Promise<CloudinaryUploadResult> => {
  assertCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: 'image',
      overwrite: false,
      invalidate: true,
      quality: 'auto:good',
      fetch_format: 'auto',
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url || !result.public_id) {
          reject(new Error('Cloudinary upload completed without required secure URL metadata.'));
          return;
        }
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width || 0,
          height: result.height || 0,
          format: result.format || '',
          bytes: result.bytes || 0,
          resourceType: 'image',
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Streams a raw document buffer (PDF solved papers, judgement digests) directly to Cloudinary.
 */
export const uploadDocumentBufferToCloudinary = (
  buffer: Buffer,
  folder: string,
  filename?: string,
  options: Partial<UploadApiOptions> = {}
): Promise<CloudinaryUploadResult> => {
  assertCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: 'raw',
      overwrite: true,
      invalidate: true,
      ...(filename ? { public_id: filename } : {}),
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url || !result.public_id) {
          reject(new Error('Cloudinary document upload completed without required secure URL.'));
          return;
        }
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format || 'pdf',
          bytes: result.bytes || buffer.length,
          resourceType: 'raw',
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Extracts Cloudinary publicId from a full Cloudinary CDN delivery URL.
 */
export const getCloudinaryPublicId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('cloudinary.com')) return null;
    const uploadIndex = parsed.pathname.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    let publicPath = parsed.pathname.slice(uploadIndex + '/upload/'.length);
    publicPath = publicPath.replace(/^v\d+\//, '');
    // Strip extension only for images, preserve for raw
    if (!publicPath.endsWith('.pdf')) {
      publicPath = publicPath.replace(/\.[a-zA-Z0-9]+$/, '');
    }
    return decodeURIComponent(publicPath.replace(/^\/+/, '')) || null;
  } catch {
    return null;
  }
};

/**
 * Deletes an asset from Cloudinary using its delivery URL.
 */
export const deleteCloudinaryAssetByUrl = async (
  url?: string | null,
  resourceType: 'image' | 'raw' | 'video' = 'image'
): Promise<void> => {
  if (!url || !isCloudinaryConfigured) return;
  const publicId = getCloudinaryPublicId(url);
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
    console.log(`[CLOUDINARY] Cleaned up asset: ${publicId}`);
  } catch (error: any) {
    console.warn(`[CLOUDINARY] Cleanup skipped for ${publicId}: ${error.message}`);
  }
};

/**
 * Deletes an asset from Cloudinary using its unique publicId.
 */
export const deleteCloudinaryAssetByPublicId = async (
  publicId?: string | null,
  resourceType: 'image' | 'raw' | 'video' = 'image'
): Promise<void> => {
  if (!publicId || !isCloudinaryConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
    console.log(`[CLOUDINARY] Cleaned up asset: ${publicId}`);
  } catch (error: any) {
    console.warn(`[CLOUDINARY] Cleanup skipped for ${publicId}: ${error.message}`);
  }
};
