import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/checkPermission.middleware.js';
import {
  getPermissionsMatrix,
  getAllStaff,
  getStaffById,
  createStaffAdmin,
  updateStaffAdmin,
  toggleStaffStatus,
  revokeStaffSessions,
  deleteStaffAdmin,
  getAllRoles,
  createCustomRole,
  updateRole,
  deleteRole,
  getAuditLogs,
} from '../controllers/adminStaff.controller.js';

const router = Router();

// All administrative governance routes require valid session token
router.use(protect);

// 1. System Taxonomy & Permissions Matrix
router.get('/permissions/matrix', requirePermission('staff:view'), getPermissionsMatrix);

// 2. Staff Management Endpoints
router.get('/staff', requirePermission('staff:view'), getAllStaff);
router.get('/staff/:id', requirePermission('staff:view'), getStaffById);
router.post('/staff', requirePermission('staff:create'), createStaffAdmin);
router.put('/staff/:id', requirePermission('staff:edit'), updateStaffAdmin);
router.patch('/staff/:id/status', requirePermission('staff:edit'), toggleStaffStatus);
router.post('/staff/:id/revoke-sessions', requirePermission('staff:manage'), revokeStaffSessions);
router.delete('/staff/:id', requirePermission('staff:delete'), deleteStaffAdmin);

// 3. Role & Access Tier Endpoints
router.get('/roles', requirePermission('staff:view'), getAllRoles);
router.post('/roles', requirePermission('staff:manage'), createCustomRole);
router.put('/roles/:id', requirePermission('staff:manage'), updateRole);
router.delete('/roles/:id', requirePermission('staff:manage'), deleteRole);

// 4. Governance & Security Audit Trail
router.get('/audit-logs', requirePermission('staff:audit'), getAuditLogs);

export default router;
