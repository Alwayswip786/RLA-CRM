import SystemSetting, { type ISystemSetting } from '../models/systemSetting.model.js';

/**
 * Get or initialize platform system settings (Singleton)
 */
export const getSystemSettingsService = async (): Promise<ISystemSetting> => {
  let settings: any = await SystemSetting.findOne().lean();

  if (!settings) {
    const created = await SystemSetting.create({});
    settings = created.toObject();
  }

  return settings as ISystemSetting;
};

/**
 * Update system settings (Singleton Upsert)
 */
export const updateSystemSettingsService = async (
  updates: Record<string, any>
): Promise<ISystemSetting> => {
  // Prevent altering immutable identifiers
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;

  const updatedSettings = await SystemSetting.findOneAndUpdate(
    {},
    { $set: updates },
    {
      new: true,
      runValidators: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  return updatedSettings as unknown as ISystemSetting;
};

/**
 * Get public client-safe settings (No admin keys/secrets)
 */
export const getPublicSettingsService = async () => {
  const settings = await getSystemSettingsService();

  return {
    appName: settings.appName,
    tagline: settings.tagline,
    appVersion: settings.appVersion,
    supportEmail: settings.supportEmail,
    contactPhone: settings.contactPhone,
    campusAddress: settings.campusAddress,
    currentAcademicYear: settings.currentAcademicYear,
    announcementBanner: settings.announcementBanner,
    supportedExams: settings.supportedExams,
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    featureFlags: settings.featureFlags,
  };
};
