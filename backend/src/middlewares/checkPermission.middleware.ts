import { type Request, type Response, type NextFunction } from 'express';
import ApiError from '../utils/ApiError.js';
import { type IUser } from '../models/user.model.js';
import { type IAdminRole } from '../models/adminRole.model.js';

/**
 * Checks whether a given user holds the requested permission.
 * Resolves wildcard rules:
 * - isSuperAdmin === true -> Full access
 * - '*' in permissions -> Full access
 * - '<module>:*' in permissions -> Full access to all actions in that module
 * - '<module>:manage' -> Implies view, create, edit, delete, publish in that module
 * - '<module>:<action>' -> Specific action match
 */
export const checkUserPermission = (user: IUser | any, requiredPermission: string): boolean => {
  if (!user) return false;

  // 1. Super Admin has unrestricted institutional access
  if (user.isSuperAdmin === true) return true;

  // 2. Gather permissions from assigned role and custom individual overrides
  const role = user.adminRoleId as IAdminRole | undefined;
  const rolePermissions: string[] = role?.permissions || [];
  const customPermissions: string[] = user.customPermissions || [];
  const allPermissions = Array.from(new Set([...rolePermissions, ...customPermissions]));

  // 3. Global wildcard check
  if (allPermissions.includes('*')) return true;

  // If exact permission matches
  if (allPermissions.includes(requiredPermission)) return true;

  // Parse required module and action
  const [moduleKey, action] = requiredPermission.split(':');

  // Check module-level wildcard: e.g. "courses:*"
  if (allPermissions.includes(`${moduleKey}:*`)) return true;

  // Check module-level manage permission: e.g. "courses:manage"
  if (allPermissions.includes(`${moduleKey}:manage`)) return true;

  // Allow "view" if user has any action permission in that module
  if (action === 'view') {
    const hasAnyModuleAction = allPermissions.some((perm) => perm.startsWith(`${moduleKey}:`));
    if (hasAnyModuleAction) return true;
  }

  return false;
};

/**
 * Express middleware requiring the authenticated admin to hold at least one of the specified permissions.
 */
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required. Please log in.');
    }

    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      throw new ApiError(403, 'Institutional Clearance Denied: Only Academy Staff may access this resource.');
    }

    const hasClearance = requiredPermissions.some((perm) => checkUserPermission(req.user, perm));

    if (!hasClearance) {
      throw new ApiError(
        403,
        `Institutional Clearance Denied. Required permission: [${requiredPermissions.join(' or ')}]. Please contact the Director / Super Admin.`
      );
    }

    next();
  };
};

/**
 * Express middleware strictly requiring Super Admin status.
 */
export const requireSuperAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required. Please log in.');
  }

  if (req.user.isSuperAdmin !== true) {
    throw new ApiError(
      403,
      'Executive Clearance Denied: This operation is strictly reserved for the Academy Director / Super Admin.'
    );
  }

  next();
};
