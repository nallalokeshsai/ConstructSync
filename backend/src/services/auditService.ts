import prisma from '../config/prisma';

export async function logAudit(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details ? JSON.stringify(params.details) : undefined,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
