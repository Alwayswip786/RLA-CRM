import { type Request } from 'express';
import AdminAuditLog from '../models/adminAuditLog.model.js';

export interface AuditLogOptions {
  action: string;
  targetResource: string;
  targetResourceId?: string;
  targetName?: string;
  description: string;
  details?: Record<string, any>;
  actorOverride?: {
    id: any;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Persists an immutable administrative audit log record.
 * Fails safely without disrupting the primary business flow.
 */
export const recordAuditLog = async (req: Request, options: AuditLogOptions) => {
  try {
    const user = req.user;
    const actorId = options.actorOverride?.id || user?._id;
    const actorName = options.actorOverride?.name || user?.name || 'Chamber System';
    const actorEmail = options.actorOverride?.email || user?.email || 'system@rajinderlawacademy.com';
    const actorRole =
      options.actorOverride?.role ||
      (user as any)?.adminTitle ||
      (user?.isSuperAdmin ? 'Director / Super Admin' : user?.role || 'Administrator');

    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      '';

    const userAgent = (req.headers['user-agent'] as string) || 'Internal Client';

    await AdminAuditLog.create({
      actorId,
      actorName,
      actorEmail,
      actorRole,
      action: options.action,
      targetResource: options.targetResource,
      targetResourceId: options.targetResourceId,
      targetName: options.targetName,
      description: options.description,
      details: options.details || {},
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('⚠️ Failed to record AdminAuditLog:', err);
  }
};
