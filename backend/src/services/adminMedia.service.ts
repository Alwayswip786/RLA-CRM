import ApiError from '../utils/ApiError.js';
import cloudinary, { assertCloudinaryConfigured } from '../config/cloudinary.js';
import {
  uploadImageBufferToCloudinary,
  uploadDocumentBufferToCloudinary,
  type CloudinaryUploadResult,
} from '../utils/cloudinaryUpload.js';

export const sanitizeLuceneString = (value: string): string => {
  return value.replace(/["\\]/g, '\\$&').trim();
};

export const buildCloudinarySearchExpression = (query: Record<string, unknown>): string => {
  const resourceType = String(query.resource_type || query.type || 'all').trim().toLowerCase();
  let expression = '';

  if (resourceType === 'image') {
    expression = 'resource_type:image';
  } else if (resourceType === 'raw' || resourceType === 'document' || resourceType === 'pdf') {
    expression = 'resource_type:raw';
  } else {
    expression = '(resource_type:image OR resource_type:raw)';
  }

  const folder = String(query.folder || '').trim();
  const search = String(query.search || '').trim();

  if (folder && folder !== 'all') {
    expression += ` AND folder="${sanitizeLuceneString(folder)}"`;
  } else {
    expression += ` AND folder:rla*`;
  }

  if (search) {
    expression += ` AND filename:"*${sanitizeLuceneString(search)}*"`;
  }

  return expression;
};

export const resolveMediaPublicId = (params: Record<string, any>): string => {
  const raw = String(params?.[0] || params?.['0'] || params?.publicId || '').trim();
  return decodeURIComponent(raw.replace(/^\/+/, ''));
};

export const fetchCloudinaryMediaLibrary = async (query: Record<string, unknown>) => {
  assertCloudinaryConfigured();
  const expression = buildCloudinarySearchExpression(query);
  const nextCursor = String(query.next_cursor || '');
  const limit = Math.min(Number(query.limit) || 24, 100);

  try {
    const result = await cloudinary.search
      .expression(expression)
      .sort_by('created_at', 'desc')
      .max_results(limit)
      .next_cursor(nextCursor)
      .execute();

    return {
      data: result.resources,
      totalCount: result.total_count,
      nextCursor: result.next_cursor,
    };
  } catch (error: any) {
    throw new ApiError(500, `Cloudinary Search Error: ${error.message}`);
  }
};

export const deleteCloudinaryMediaAsset = async (publicId: string, resourceType: 'image' | 'raw' = 'image') => {
  assertCloudinaryConfigured();
  if (!publicId) {
    throw new ApiError(400, 'Public ID is required to delete media.');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Cloudinary delete returned result: ${result.result}`);
    }
    return { success: true, result: result.result };
  } catch (error: any) {
    throw new ApiError(500, `Cloudinary Delete Error: ${error.message}`);
  }
};

export const uploadMediaDirectService = async (
  file: Express.Multer.File,
  folder: string = 'rla/uploads',
  filename?: string
): Promise<CloudinaryUploadResult> => {
  assertCloudinaryConfigured();
  if (!file || !file.buffer) {
    throw new ApiError(400, 'No file buffer provided for upload.');
  }

  const isPdf = file.mimetype.toLowerCase() === 'application/pdf';
  if (isPdf) {
    return await uploadDocumentBufferToCloudinary(file.buffer, folder, filename);
  } else {
    return await uploadImageBufferToCloudinary(file.buffer, folder);
  }
};
