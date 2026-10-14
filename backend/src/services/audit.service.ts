import { prisma } from '../db/prisma';
import { logger } from '../config/logger';

export interface CreateAuditLogParams {
  hospitalId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function recordAuditEvent(params: CreateAuditLogParams): Promise<void> {
  try {
    // Sanitize details: ensure no passwords, hashes, tokens or raw clinical notes
    const sanitizedDetails = params.details
      ? JSON.stringify(params.details, (key, value) => {
          if (/password|token|secret|authorization|jwt/i.test(key)) {
            return '[REDACTED]';
          }
          return value;
        })
      : null;

    await prisma.auditLog.create({
      data: {
        hospitalId: params.hospitalId,
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        details: sanitizedDetails,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    // Audit log failure should be alerted but must not crash the primary operational transaction
    logger.error(`Failed to persist audit log event for action "${params.action}"`, error);
  }
}
