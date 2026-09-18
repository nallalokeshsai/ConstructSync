import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/audit - List system audit logs
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { action, entity, limit } = req.query;
    const where: any = {};
    if (action) where.action = String(action);
    if (entity) where.entity = String(entity);

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? Number(limit) : 50,
    });

    const parsed = logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));

    return res.json({ auditLogs: parsed });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
