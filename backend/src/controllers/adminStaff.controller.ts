import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'express-mongo-sanitize';
import User, { type IUser } from '../models/user.model.js';
import AdminRole, { type IAdminRole } from '../models/adminRole.model.js';
import AdminAuditLog from '../models/adminAuditLog.model.js';
import { recordAuditLog } from '../services/auditLog.service.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { checkUserPermission } from '../middlewares/checkPermission.middleware.js';

// System permission taxonomy
export const SYSTEM_MODULES = [
  {
    key: 'overview',
    label: 'Command Center & Executive Operations',
    actions: ['view'],
  },
  {
    key: 'leads',
    label: 'Admissions & Leads CRM',
    actions: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
  },
  {
    key: 'courses',
    label: 'Course & Curriculum CMS',
    actions: ['view', 'create', 'edit', 'delete', 'publish', 'manage'],
  },
  {
    key: 'live_classes',
    label: 'Live Classroom & Streaming',
    actions: ['view', 'create', 'edit', 'delete', 'manage'],
  },
  {
    key: 'timetable',
    label: 'Timetable & Shift Planner',
    actions: ['view', 'create', 'edit', 'delete', 'manage'],
  },
  {
    key: 'daily_digest',
    label: 'Daily Legal Digest CMS',
    actions: ['view', 'create', 'edit', 'delete', 'publish', 'manage'],
  },
  {
    key: 'mains_evaluation',
    label: 'Mains Evaluation Desk',
    actions: ['view', 'evaluate', 'edit', 'export', 'manage'],
  },
  {
    key: 'tests',
    label: 'Prelims Test Series Builder',
    actions: ['view', 'create', 'edit', 'delete', 'publish', 'manage'],
  },
  {
    key: 'vault',
    label: 'Legal Knowledge Vault (Bare Acts, Judgments, PYQs)',
    actions: ['view', 'create', 'edit', 'delete', 'publish', 'manage'],
  },
  {
    key: 'students',
    label: 'Student Directory & Telemetry',
    actions: ['view', 'edit', 'export', 'manage'],
  },
  {
    key: 'doubts',
    label: 'Faculty Doubt Desk',
    actions: ['view', 'reply', 'assign', 'manage'],
  },
  {
    key: 'fees',
    label: 'Fee Installments & Receipts',
    actions: ['view', 'create', 'export', 'manage'],
  },
  {
    key: 'notices',
    label: 'Notice Board Broadcasts',
    actions: ['view', 'create', 'edit', 'delete', 'publish', 'manage'],
  },
  {
    key: 'staff',
    label: 'Staff, Roles & Governance',
    actions: ['view', 'create', 'edit', 'delete', 'audit', 'manage'],
  },
  {
    key: 'settings',
    label: 'System Settings & Admissions Banner CMS',
    actions: ['view', 'edit', 'manage'],
  },
];

const formatRelativeTime = (date?: Date): string => {
  if (!date) return 'Never';
  const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diffSec < 60) return 'Active Now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mins ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

/**
 * 1. Get System Permission Matrix
 */
export const getPermissionsMatrix = catchAsync(async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    modules: SYSTEM_MODULES,
  });
});

/**
 * 2. Get All Administrative Staff
 */
export const getAllStaff = catchAsync(async (req: Request, res: Response) => {
  const { search, role, status } = req.query;

  const query: Record<string, any> = {
    role: { $in: ['admin', 'faculty'] },
  };

  if (status && typeof status === 'string') {
    query.accountStatus = status;
  }

  if (role && typeof role === 'string') {
    query.role = role;
  }

  if (search && typeof search === 'string') {
    const term = search.trim();
    query.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } },
      { rollNo: { $regex: term, $options: 'i' } },
    ];
  }

  const staffUsers = await User.find(query)
    .populate('adminRoleId')
    .sort({ isSuperAdmin: -1, createdAt: 1 });

  const formattedStaff = staffUsers.map((user) => {
    const roleObj = user.adminRoleId as IAdminRole | undefined;
    const rolePerms: string[] = roleObj?.permissions || [];
    const customPerms: string[] = user.customPermissions || [];
    const isSuper = Boolean(user.isSuperAdmin || rolePerms.includes('*'));

    const effectivePerms = isSuper ? ['*'] : Array.from(new Set([...rolePerms, ...customPerms]));
    const roleName = user.adminTitle || roleObj?.name || (user.role === 'faculty' ? 'Academic Mentor' : 'Administrator');
    const tier = user.permissionTier || roleObj?.permissionTier || (isSuper ? 'Full Access' : 'Standard Access');

    return {
      id: String(user._id),
      _id: String(user._id),
      rollNo: user.rollNo,
      name: user.name,
      salutation: user.salutation || 'Adv.',
      email: user.email || '',
      phone: user.phone || '',
      role: roleName,
      adminRole: roleObj
        ? {
            _id: String(roleObj._id),
            name: roleObj.name,
            slug: roleObj.slug,
            permissionTier: roleObj.permissionTier,
            permissions: roleObj.permissions,
          }
        : null,
      adminRoleId: roleObj?._id ? String(roleObj._id) : undefined,
      accessLevel: tier,
      permissionTier: tier,
      isSuperAdmin: Boolean(user.isSuperAdmin),
      lastActive: formatRelativeTime(user.lastActiveAt),
      lastActiveAt: user.lastActiveAt,
      status: user.accountStatus,
      customPermissions: user.customPermissions || [],
      effectivePermissions: effectivePerms,
      createdAt: user.createdAt,
    };
  });

  res.status(200).json({
    success: true,
    total: formattedStaff.length,
    staff: formattedStaff,
  });
});

/**
 * 3. Get Single Staff Member Details
 */
export const getStaffById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await User.findById(id).populate('adminRoleId');

  if (!user || (user.role !== 'admin' && user.role !== 'faculty')) {
    throw new ApiError(404, 'Administrative staff member not found.');
  }

  const roleObj = user.adminRoleId as IAdminRole | undefined;
  const rolePerms: string[] = roleObj?.permissions || [];
  const customPerms: string[] = user.customPermissions || [];
  const isSuper = Boolean(user.isSuperAdmin || rolePerms.includes('*'));

  res.status(200).json({
    success: true,
    staff: {
      id: String(user._id),
      rollNo: user.rollNo,
      name: user.name,
      salutation: user.salutation,
      email: user.email,
      phone: user.phone,
      adminTitle: user.adminTitle,
      role: user.adminTitle || roleObj?.name || 'Administrator',
      adminRole: roleObj,
      permissionTier: user.permissionTier || roleObj?.permissionTier || (isSuper ? 'Full Access' : 'Standard Access'),
      isSuperAdmin: Boolean(user.isSuperAdmin),
      status: user.accountStatus,
      customPermissions: user.customPermissions || [],
      effectivePermissions: isSuper ? ['*'] : Array.from(new Set([...rolePerms, ...customPerms])),
      lastActiveAt: user.lastActiveAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    },
  });
});

/**
 * 4. Create New Admin / Staff Member
 */
export const createStaffAdmin = catchAsync(async (req: Request, res: Response) => {
  const caller = req.user;
  const {
    name,
    email,
    phone,
    salutation = 'Adv.',
    password,
    adminRoleId,
    adminTitle,
    customPermissions = [],
    status = 'active',
    isSuperAdmin = false,
  } = req.body;

  if (!name || !email) {
    throw new ApiError(400, 'Staff full name and email address are required.');
  }

  const cleanEmail = String(email).trim().toLowerCase();

  // Duplicate email check
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    throw new ApiError(400, `An account with email "${cleanEmail}" already exists.`);
  }

  // Privilege escalation protection
  if (isSuperAdmin && !caller?.isSuperAdmin) {
    throw new ApiError(403, 'Privilege Escalation Blocked: Only a Super Admin can appoint another Super Admin.');
  }

  if (Array.isArray(customPermissions) && customPermissions.includes('*') && !caller?.isSuperAdmin) {
    throw new ApiError(403, 'Privilege Escalation Blocked: Wildcard permissions cannot be granted by non-super admins.');
  }

  // Resolve role
  let roleDoc: IAdminRole | null = null;
  if (adminRoleId) {
    roleDoc = await AdminRole.findById(adminRoleId);
    if (!roleDoc) {
      throw new ApiError(404, 'The specified administrative role does not exist.');
    }
  }

  const resolvedTitle = adminTitle || roleDoc?.name || (isSuperAdmin ? 'Director / Super Admin' : 'Administrator');
  const resolvedTier = isSuperAdmin ? 'Full Access' : roleDoc?.permissionTier || 'Standard Access';

  // Secure password hashing
  const rawPassword = password && String(password).trim().length >= 6 ? String(password).trim() : 'Judicial@2025';
  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  // Generate unique Roll No
  const countAdmins = await User.countDocuments({ role: { $in: ['admin', 'faculty'] } });
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const rollNo = `RLA-ADM-${(countAdmins + 1).toString().padStart(3, '0')}-${randomSuffix}`;

  const newAdmin = await User.create({
    rollNo,
    salutation,
    name: String(name).trim(),
    email: cleanEmail,
    phone: phone ? String(phone).trim() : undefined,
    password: hashedPassword,
    role: 'admin',
    adminRoleId: roleDoc?._id,
    adminTitle: resolvedTitle,
    permissionTier: resolvedTier,
    isSuperAdmin: Boolean(isSuperAdmin),
    customPermissions: Array.isArray(customPermissions) ? customPermissions : [],
    accountStatus: status === 'suspended' ? 'suspended' : 'active',
    isEmailVerified: true,
    isPhoneVerified: true,
    needsOnboarding: false,
    themePreference: 'dark',
    authVersion: 1,
  });

  // Increment assignedUsersCount on the role
  if (roleDoc) {
    roleDoc.assignedUsersCount = (roleDoc.assignedUsersCount || 0) + 1;
    await roleDoc.save();
  }

  // Record Audit Log
  await recordAuditLog(req, {
    action: 'admin:create',
    targetResource: 'admin_user',
    targetResourceId: String(newAdmin._id),
    targetName: newAdmin.name,
    description: `Created admin account for ${newAdmin.name} (${cleanEmail}) with title "${resolvedTitle}" and tier "${resolvedTier}"`,
    details: {
      rollNo,
      role: resolvedTitle,
      adminRoleId,
      tier: resolvedTier,
      isSuperAdmin: Boolean(isSuperAdmin),
      status: newAdmin.accountStatus,
      customPermissions,
    },
  });

  res.status(201).json({
    success: true,
    message: `Admin account for ${newAdmin.name} created successfully.`,
    staff: {
      id: String(newAdmin._id),
      rollNo: newAdmin.rollNo,
      name: newAdmin.name,
      email: newAdmin.email,
      phone: newAdmin.phone,
      role: resolvedTitle,
      accessLevel: resolvedTier,
      permissionTier: resolvedTier,
      status: newAdmin.accountStatus,
      isSuperAdmin: newAdmin.isSuperAdmin,
    },
  });
});

/**
 * 5. Update Staff Member / Edit Access
 */
export const updateStaffAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const caller = req.user;
  const {
    name,
    phone,
    salutation,
    adminRoleId,
    adminTitle,
    customPermissions,
    status,
    isSuperAdmin,
    password,
  } = req.body;

  const target = await User.findById(id).select('+authVersion +password').populate('adminRoleId');
  if (!target || (target.role !== 'admin' && target.role !== 'faculty')) {
    throw new ApiError(404, 'Administrative staff member not found.');
  }

  // --- LAST SUPER ADMIN SAFEGUARD ---
  const isDemotingSuper = target.isSuperAdmin && (isSuperAdmin === false || status === 'suspended' || status === 'deactivated');
  if (isDemotingSuper) {
    const activeSuperCount = await User.countDocuments({
      isSuperAdmin: true,
      accountStatus: 'active',
      _id: { $ne: target._id },
    });

    if (activeSuperCount === 0) {
      throw new ApiError(
        400,
        'Security Restriction: Cannot deactivate or demote the academy’s sole active Super Admin. Appoint another Super Admin first.'
      );
    }
  }

  // Privilege escalation check
  if (isSuperAdmin !== undefined && isSuperAdmin !== target.isSuperAdmin && !caller?.isSuperAdmin) {
    throw new ApiError(403, 'Privilege Escalation Blocked: Only Super Admins can grant or revoke Super Admin privileges.');
  }

  const previousRole = (target.adminRoleId as any)?._id?.toString();

  // Handle role change
  if (adminRoleId !== undefined && adminRoleId !== previousRole) {
    if (previousRole) {
      await AdminRole.findByIdAndUpdate(previousRole, { $inc: { assignedUsersCount: -1 } });
    }
    if (adminRoleId) {
      const newRoleDoc = await AdminRole.findById(adminRoleId);
      if (!newRoleDoc) {
        throw new ApiError(404, 'The selected role does not exist.');
      }
      target.adminRoleId = newRoleDoc._id;
      target.permissionTier = newRoleDoc.permissionTier;
      await AdminRole.findByIdAndUpdate(adminRoleId, { $inc: { assignedUsersCount: 1 } });
    } else {
      target.adminRoleId = undefined;
    }
  }

  if (name) target.name = String(name).trim();
  if (phone !== undefined) target.phone = String(phone).trim();
  if (salutation) target.salutation = salutation;
  if (adminTitle !== undefined) target.adminTitle = String(adminTitle).trim();
  if (customPermissions !== undefined && Array.isArray(customPermissions)) {
    target.customPermissions = customPermissions;
  }
  if (status && ['active', 'suspended', 'deactivated'].includes(status)) {
    target.accountStatus = status;
  }
  if (isSuperAdmin !== undefined && caller?.isSuperAdmin) {
    target.isSuperAdmin = Boolean(isSuperAdmin);
    if (target.isSuperAdmin) {
      target.permissionTier = 'Full Access';
    }
  }

  // Password reset if provided
  if (password && String(password).trim().length >= 6) {
    target.password = await bcrypt.hash(String(password).trim(), 12);
  }

  // Instant session revocation on role/permissions/status/password changes
  target.authVersion = (target.authVersion || 1) + 1;

  await target.save();

  // Record Audit Log
  await recordAuditLog(req, {
    action: 'admin:update',
    targetResource: 'admin_user',
    targetResourceId: String(target._id),
    targetName: target.name,
    description: `Updated credentials/clearance for ${target.name} (${target.email}) and bumped authVersion to ${target.authVersion}`,
    details: {
      adminTitle: target.adminTitle,
      adminRoleId: target.adminRoleId,
      permissionTier: target.permissionTier,
      status: target.accountStatus,
      isSuperAdmin: target.isSuperAdmin,
      customPermissions: target.customPermissions,
    },
  });

  res.status(200).json({
    success: true,
    message: `Administrative credentials for ${target.name} updated successfully. Active sessions have been invalidated.`,
    staff: {
      id: String(target._id),
      name: target.name,
      email: target.email,
      phone: target.phone,
      role: target.adminTitle,
      permissionTier: target.permissionTier,
      status: target.accountStatus,
      isSuperAdmin: target.isSuperAdmin,
    },
  });
});

/**
 * 6. Quick Status Toggle (Active / Suspended / Deactivated)
 */
export const toggleStaffStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'suspended', 'deactivated'].includes(status)) {
    throw new ApiError(400, 'Valid status (active, suspended, or deactivated) is required.');
  }

  const target = await User.findById(id).select('+authVersion');
  if (!target) {
    throw new ApiError(404, 'Staff member not found.');
  }

  if (target.isSuperAdmin && status !== 'active') {
    const activeSuperCount = await User.countDocuments({
      isSuperAdmin: true,
      accountStatus: 'active',
      _id: { $ne: target._id },
    });
    if (activeSuperCount === 0) {
      throw new ApiError(400, 'Security Restriction: Cannot suspend or deactivate the sole active Super Admin.');
    }
  }

  target.accountStatus = status;
  target.authVersion = (target.authVersion || 1) + 1;
  await target.save();

  await recordAuditLog(req, {
    action: 'admin:change_status',
    targetResource: 'admin_user',
    targetResourceId: String(target._id),
    targetName: target.name,
    description: `Changed status of ${target.name} to "${status}"`,
    details: { status },
  });

  res.status(200).json({
    success: true,
    message: `Staff status updated to ${status}.`,
    status: target.accountStatus,
  });
});

/**
 * 7. Force-Revoke All Active Sessions
 */
export const revokeStaffSessions = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const target = await User.findById(id).select('+authVersion');

  if (!target) {
    throw new ApiError(404, 'Staff member not found.');
  }

  target.authVersion = (target.authVersion || 1) + 1;
  target.refreshTokens = [];
  await target.save();

  await recordAuditLog(req, {
    action: 'admin:revoke_sessions',
    targetResource: 'admin_user',
    targetResourceId: String(target._id),
    targetName: target.name,
    description: `Revoked all active sessions and refreshed authVersion for ${target.name}`,
  });

  res.status(200).json({
    success: true,
    message: `All active sessions for ${target.name} have been revoked immediately.`,
  });
});

/**
 * 8. Deactivate / Soft Delete Staff Admin
 */
export const deleteStaffAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const target = await User.findById(id).select('+authVersion');
  if (!target) {
    throw new ApiError(404, 'Staff member not found.');
  }

  if (target.isSuperAdmin) {
    const activeSuperCount = await User.countDocuments({
      isSuperAdmin: true,
      accountStatus: 'active',
      _id: { $ne: target._id },
    });
    if (activeSuperCount === 0) {
      throw new ApiError(400, 'Security Restriction: Cannot delete or deactivate the sole active Super Admin.');
    }
  }

  target.accountStatus = 'deactivated';
  target.authVersion = (target.authVersion || 1) + 1;
  target.refreshTokens = [];
  await target.save();

  if (target.adminRoleId) {
    await AdminRole.findByIdAndUpdate(target.adminRoleId, { $inc: { assignedUsersCount: -1 } });
  }

  await recordAuditLog(req, {
    action: 'admin:delete',
    targetResource: 'admin_user',
    targetResourceId: String(target._id),
    targetName: target.name,
    description: `Deactivated administrative account for ${target.name} (${target.email})`,
  });

  res.status(200).json({
    success: true,
    message: `Staff member ${target.name} has been deactivated and cleared from active administration.`,
  });
});

/**
 * 9. Get All Roles
 */
export const getAllRoles = catchAsync(async (_req: Request, res: Response) => {
  const roles = await AdminRole.find().sort({ isSystemRole: -1, name: 1 });

  // Compute live assigned counts
  const countPromises = roles.map(async (role) => {
    const count = await User.countDocuments({
      adminRoleId: role._id,
      accountStatus: 'active',
    });
    return {
      ...role.toObject(),
      assignedUsersCount: count,
    };
  });

  const rolesWithCounts = await Promise.all(countPromises);

  res.status(200).json({
    success: true,
    roles: rolesWithCounts,
  });
});

/**
 * 10. Create Custom Role
 */
export const createCustomRole = catchAsync(async (req: Request, res: Response) => {
  const { name, description, permissionTier = 'Custom Access', permissions = [] } = req.body;

  if (!name || !String(name).trim()) {
    throw new ApiError(400, 'Role name is required.');
  }

  const cleanName = String(name).trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  const existing = await AdminRole.findOne({ slug });
  if (existing) {
    throw new ApiError(400, `A role with slug "${slug}" already exists.`);
  }

  const role = await AdminRole.create({
    name: cleanName,
    slug,
    description: description ? String(description).trim() : '',
    isSystemRole: false,
    permissionTier,
    permissions: Array.isArray(permissions) ? permissions : [],
    createdById: req.user?._id,
    assignedUsersCount: 0,
    isActive: true,
  });

  await recordAuditLog(req, {
    action: 'role:create',
    targetResource: 'admin_role',
    targetResourceId: String(role._id),
    targetName: role.name,
    description: `Created new custom role "${role.name}" with tier "${permissionTier}"`,
    details: { permissions: role.permissions },
  });

  res.status(201).json({
    success: true,
    message: `Custom role "${role.name}" created successfully.`,
    role,
  });
});

/**
 * 11. Update Role Permissions / Tier
 */
export const updateRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, permissionTier, permissions, isActive } = req.body;

  const role = await AdminRole.findById(id);
  if (!role) {
    throw new ApiError(404, 'Role not found.');
  }

  // System roles cannot be renamed or deactivated, but permissions can be adjusted
  if (name && !role.isSystemRole) role.name = String(name).trim();
  if (description !== undefined) role.description = String(description).trim();
  if (permissionTier) role.permissionTier = String(permissionTier).trim();
  if (permissions && Array.isArray(permissions)) role.permissions = permissions;
  if (isActive !== undefined && !role.isSystemRole) role.isActive = Boolean(isActive);

  await role.save();

  // Invalidate tokens for all active admins with this role
  await User.updateMany(
    { adminRoleId: role._id },
    { $inc: { authVersion: 1 } }
  );

  await recordAuditLog(req, {
    action: 'role:update',
    targetResource: 'admin_role',
    targetResourceId: String(role._id),
    targetName: role.name,
    description: `Updated role configuration for "${role.name}" and refreshed sessions for assigned staff`,
    details: { permissions: role.permissions, permissionTier: role.permissionTier },
  });

  res.status(200).json({
    success: true,
    message: `Role "${role.name}" updated successfully.`,
    role,
  });
});

/**
 * 12. Delete Custom Role
 */
export const deleteRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const role = await AdminRole.findById(id);
  if (!role) {
    throw new ApiError(404, 'Role not found.');
  }

  if (role.isSystemRole) {
    throw new ApiError(400, 'Predefined system roles cannot be deleted.');
  }

  const assignedCount = await User.countDocuments({
    adminRoleId: role._id,
    accountStatus: { $ne: 'deactivated' },
  });

  if (assignedCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete role "${role.name}" because it is currently assigned to ${assignedCount} active staff member(s). Please reassign them first.`
    );
  }

  await AdminRole.findByIdAndDelete(id);

  await recordAuditLog(req, {
    action: 'role:delete',
    targetResource: 'admin_role',
    targetResourceId: String(id),
    targetName: role.name,
    description: `Deleted custom role "${role.name}"`,
  });

  res.status(200).json({
    success: true,
    message: `Role "${role.name}" has been removed.`,
  });
});

/**
 * 13. Query Governance Audit Logs
 */
export const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, action, actorId, search } = req.query;

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, any> = {};

  if (action && typeof action === 'string') {
    filter.action = action;
  }

  if (actorId && typeof actorId === 'string') {
    filter.actorId = actorId;
  }

  if (search && typeof search === 'string') {
    const s = search.trim();
    filter.$or = [
      { actorName: { $regex: s, $options: 'i' } },
      { actorEmail: { $regex: s, $options: 'i' } },
      { targetName: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
    ];
  }

  const [logs, total] = await Promise.all([
    AdminAuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum),
    AdminAuditLog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    logs,
  });
});
