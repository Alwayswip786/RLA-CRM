export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | 'auto:good' | 'auto:best' | 'auto:eco' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  crop?: 'limit' | 'fill' | 'thumb' | 'fit' | 'scale';
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dmua0zbzx';

/**
 * Checks if a string is a Cloudinary CDN URL.
 */
export const isCloudinaryUrl = (url?: string | null): boolean => {
  if (!url) return false;
  return url.includes('res.cloudinary.com');
};

/**
 * Generates an optimized Cloudinary delivery URL with on-the-fly transformations.
 */
export const getOptimizedImageUrl = (
  publicIdOrUrl?: string | null,
  options: ImageTransformOptions = {}
): string => {
  if (!publicIdOrUrl) return '';

  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'limit',
  } = options;

  const transformParts: string[] = [`f_${format}`, `q_${quality}`];
  if (width) transformParts.push(`w_${width}`);
  if (height) transformParts.push(`h_${height}`);
  if (width || height) transformParts.push(`c_${crop}`);

  const transformString = transformParts.join(',');

  // If already a Cloudinary URL, inject transformations
  if (isCloudinaryUrl(publicIdOrUrl)) {
    if (publicIdOrUrl.includes('/upload/')) {
      return publicIdOrUrl.replace('/upload/', `/upload/${transformString}/`);
    }
    return publicIdOrUrl;
  }

  // If it's an external HTTP/HTTPS URL or local endpoint, return as-is
  if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://') || publicIdOrUrl.startsWith('/api/')) {
    return publicIdOrUrl;
  }

  // Clean public ID
  const cleanId = publicIdOrUrl.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformString}/${cleanId}`;
};

/**
 * Generates direct raw delivery URL for documents like PDFs.
 */
export const getCloudinaryRawUrl = (publicIdOrUrl?: string | null): string => {
  if (!publicIdOrUrl) return '';
  if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://') || publicIdOrUrl.startsWith('/api/')) {
    return publicIdOrUrl;
  }
  const cleanId = publicIdOrUrl.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${cleanId}`;
};

/**
 * Resolves thumbnail URL supporting Cloudinary URLs, local API endpoints, or fallback image.
 */
export const resolveMediaUrl = (
  urlOrPublicId?: string | null,
  fallback: string = '/placeholder-document.png'
): string => {
  if (!urlOrPublicId) return fallback;
  if (isCloudinaryUrl(urlOrPublicId)) {
    return getOptimizedImageUrl(urlOrPublicId, { width: 400, quality: 'auto' });
  }
  return urlOrPublicId;
};
