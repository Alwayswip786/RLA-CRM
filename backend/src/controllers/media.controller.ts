import type { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import {
  fetchCloudinaryMediaLibrary,
  deleteCloudinaryMediaAsset,
  resolveMediaPublicId,
  uploadMediaDirectService,
} from '../services/adminMedia.service.js';

/**
 * @desc    Fetch and search media assets from Cloudinary
 * @route   GET /api/media
 * @access  Private (Admin, Faculty)
 */
export const getMediaLibrary = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await fetchCloudinaryMediaLibrary(req.query as Record<string, unknown>);
  res.status(200).json({
    success: true,
    data: result.data,
    totalCount: result.totalCount,
    nextCursor: result.nextCursor,
  });
});

/**
 * @desc    Upload direct media file (image or pdf) to Cloudinary
 * @route   POST /api/media/upload
 * @access  Private (Admin, Faculty)
 */
export const uploadDirectMedia = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw new ApiError(400, 'No media file provided for upload.');
  }

  const folder = typeof req.body.folder === 'string' && req.body.folder.trim()
    ? req.body.folder.trim()
    : 'rla/uploads';
  const customFilename = typeof req.body.filename === 'string' && req.body.filename.trim()
    ? req.body.filename.trim()
    : undefined;

  const result = await uploadMediaDirectService(req.file, folder, customFilename);

  res.status(201).json({
    success: true,
    message: 'Media asset uploaded successfully to Cloudinary.',
    data: result,
  });
});

/**
 * @desc    Delete media asset from Cloudinary
 * @route   DELETE /api/media/*
 * @access  Private (Admin)
 */
export const deleteMedia = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const publicId = resolveMediaPublicId(req.params as Record<string, any>);
  const resourceType = req.query.resource_type === 'raw' ? 'raw' : 'image';
  await deleteCloudinaryMediaAsset(publicId, resourceType);

  res.status(200).json({
    success: true,
    message: `Asset '${publicId}' permanently deleted from Cloudinary.`,
  });
});
