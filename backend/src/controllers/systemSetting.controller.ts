import { type Request, type Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import {
  getSystemSettingsService,
  updateSystemSettingsService,
  getPublicSettingsService,
} from '../services/systemSetting.service.js';
import { recordAuditLog } from '../services/auditLog.service.js';

/**
 * @desc    Get Public System Settings (Banner, App Info, Supported Exams)
 * @route   GET /api/settings/public
 * @access  Public
 */
export const getPublicSettings = catchAsync(async (_req: Request, res: Response): Promise<void> => {
  const publicSettings = await getPublicSettingsService();
  res.status(200).json({
    success: true,
    data: publicSettings,
  });
});

/**
 * @desc    Get Full System Settings (Chamber Administration)
 * @route   GET /api/admin/settings
 * @access  Private (Admin / Super Admin)
 */
export const getAdminSettings = catchAsync(async (_req: Request, res: Response): Promise<void> => {
  const settings = await getSystemSettingsService();
  res.status(200).json({
    success: true,
    data: settings,
  });
});

/**
 * @desc    Update System Settings & Admissions Banner
 * @route   PUT /api/admin/settings
 * @access  Private (Admin / Super Admin)
 */
export const updateAdminSettings = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const updatedSettings = await updateSystemSettingsService(req.body);

  // Record administrative audit trail
  await recordAuditLog(req, {
    action: 'settings:update',
    targetResource: 'system_settings',
    targetResourceId: String(updatedSettings._id),
    targetName: 'Global Platform Settings & Admissions Banner',
    description: `Administrator updated system configuration and announcement banner`,
    details: { updates: req.body },
  });

  res.status(200).json({
    success: true,
    message: 'System settings and announcement banner updated successfully.',
    data: updatedSettings,
  });
});
