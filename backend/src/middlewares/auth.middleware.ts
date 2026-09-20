import { type Request, type Response, type NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const protect = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  // 1. Check Authorization header: Bearer <token> or query token (for media/PDF streaming)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    throw new ApiError(401, 'Authentication required. Please log in to access this resource.');
  }

  // 2. Decode and verify Access Token
  let decoded: { id: string; authVersion: number; role?: string };
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired session token. Please log in again.');
  }

  // 3. Find current user and verify authVersion
  const currentUser = await User.findById(decoded.id).select('+authVersion +password');
  if (!currentUser) {
    throw new ApiError(401, 'The account belonging to this token no longer exists.');
  }

  if (currentUser.accountStatus === 'suspended' || currentUser.accountStatus === 'deactivated') {
    throw new ApiError(403, 'This account has been restricted. Please contact academy admissions.');
  }

  // 4. Instant session revocation check
  if ((decoded.authVersion ?? 0) !== (currentUser.authVersion ?? 0)) {
    throw new ApiError(401, 'Your session has expired due to a recent password reset. Please log in again.');
  }

  req.user = currentUser;
  next();
});

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access to specified institutional roles (e.g. 'admin', 'faculty').
 */
export const restrictTo = (...roles: Array<'admin' | 'faculty' | 'student'>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        'Access denied. You do not possess institutional permissions to access this resource.'
      );
    }
    next();
  };
};
