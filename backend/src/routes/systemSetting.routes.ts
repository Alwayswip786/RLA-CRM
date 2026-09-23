import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/checkPermission.middleware.js';
import {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings,
} from '../controllers/systemSetting.controller.js';

export const publicSettingRoutes = Router();
publicSettingRoutes.get('/public', getPublicSettings);

export const adminSettingRoutes = Router();
adminSettingRoutes.use(protect);
adminSettingRoutes.get('/', requirePermission('settings:view'), getAdminSettings);
adminSettingRoutes.put('/', requirePermission('settings:edit'), updateAdminSettings);
