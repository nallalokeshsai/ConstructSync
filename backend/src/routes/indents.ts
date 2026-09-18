import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// GET /api/indents - List indents with escalation metrics & filters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, approvalStatus, priority } = req.query;

    const where: any = {};
    if (projectId) where.projectId = String(projectId);
    if (approvalStatus) where.approvalStatus = String(approvalStatus);
    if (priority) where.priority = String(priority);

    const indents = await prisma.indent.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        requestedBy: { select: { id: true, name: true, role: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
        items: true,
        purchaseOrders: { select: { id: true, poNumber: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const enriched = indents.map((indent) => {
      const estimatedTotal = indent.items.reduce(
        (sum, item) => sum + item.quantity * (item.estimatedRate || 0),
        0
      );

      const hoursPending =
        indent.approvalStatus === 'pending'
          ? (now.getTime() - new Date(indent.createdAt).getTime()) / (1000 * 60 * 60)
          : 0;

      // Auto-escalation trigger: pending for > 24 hours
      const isEscalated = indent.approvalStatus === 'pending' && hoursPending >= 24;

      return {
        ...indent,
        estimatedTotal,
        requiresDirectorApproval: estimatedTotal >= 100000,
        hoursPending: Math.round(hoursPending),
        isEscalated,
      };
    });

    return res.json({ indents: enriched });
  } catch (error) {
    console.error('Error fetching indents:', error);
    return res.status(500).json({ error: 'Failed to fetch indents' });
  }
});

// GET /api/indents/:id - Get indent details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const indent = await prisma.indent.findUnique({
      where: { id },
      include: {
        project: true,
        requestedBy: { select: { id: true, name: true, email: true, phone: true } },
        approvedBy: { select: { id: true, name: true, email: true, designation: true } },
        items: true,
        purchaseOrders: { include: { vendor: true } },
      },
    });

    if (!indent) {
      return res.status(404).json({ error: 'Indent not found' });
    }

    const estimatedTotal = indent.items.reduce(
      (sum, item) => sum + item.quantity * (item.estimatedRate || 0),
      0
    );

    return res.json({
      indent: {
        ...indent,
        estimatedTotal,
        requiresDirectorApproval: estimatedTotal >= 100000,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch indent' });
  }
});

// POST /api/indents - Create digital indent (supports offline sync)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, requiredDate, priority, notes, items } = req.body;

    if (!projectId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Project and at least one material item are required' });
    }

    // Auto-generate Indent Number
    const count = await prisma.indent.count();
    const indentNumber = `IND-${new Date().getFullYear()}-${String(count + 101).padStart(5, '0')}`;

    const indent = await prisma.indent.create({
      data: {
        indentNumber,
        projectId,
        requestedById: req.user!.id,
        requiredDate: requiredDate ? new Date(requiredDate) : null,
        priority: priority || 'normal',
        approvalStatus: 'pending',
        notes,
        items: {
          create: items.map((item: any) => ({
            materialName: item.materialName,
            materialCategory: item.materialCategory,
            quantity: Number(item.quantity),
            unit: item.unit,
            estimatedRate: item.estimatedRate ? Number(item.estimatedRate) : null,
            notes: item.notes,
          })),
        },
      },
      include: { items: true, project: true },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'INDENT_CREATED',
      entity: 'Indent',
      entityId: indent.id,
      details: { indentNumber: indent.indentNumber, priority: indent.priority, itemsCount: items.length },
    });

    return res.status(201).json({ indent });
  } catch (error) {
    console.error('Error creating indent:', error);
    return res.status(500).json({ error: 'Failed to create indent' });
  }
});

// POST /api/indents/batch-sync - Sync multiple indents created while offline
router.post('/batch-sync', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { indents } = req.body;
    if (!Array.isArray(indents) || indents.length === 0) {
      return res.status(400).json({ error: 'Array of indents required for batch sync' });
    }

    const synced: any[] = [];
    for (const data of indents) {
      const count = await prisma.indent.count();
      const indentNumber = `IND-${new Date().getFullYear()}-${String(count + 101).padStart(5, '0')}`;

      const created = await prisma.indent.create({
        data: {
          indentNumber,
          projectId: data.projectId,
          requestedById: req.user!.id,
          requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
          priority: data.priority || 'normal',
          notes: data.notes ? `${data.notes} [Synced from Offline Queue]` : '[Synced from Offline Queue]',
          items: {
            create: data.items.map((item: any) => ({
              materialName: item.materialName,
              materialCategory: item.materialCategory,
              quantity: Number(item.quantity),
              unit: item.unit,
              estimatedRate: item.estimatedRate ? Number(item.estimatedRate) : null,
              notes: item.notes,
            })),
          },
        },
        include: { items: true },
      });
      synced.push(created);
    }

    return res.json({ syncedCount: synced.length, indents: synced });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to sync offline indents' });
  }
});

// POST /api/indents/:id/approve - Multi-level approval with value threshold enforcement
router.post(
  '/:id/approve',
  authenticateToken,
  requireRole(['admin', 'project_director', 'procurement_manager']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;

      const indent = await prisma.indent.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!indent) {
        return res.status(404).json({ error: 'Indent not found' });
      }

      if (indent.approvalStatus !== 'pending') {
        return res.status(400).json({ error: `Indent is already ${indent.approvalStatus}` });
      }

      const totalValue = indent.items.reduce(
        (sum, item) => sum + item.quantity * (item.estimatedRate || 0),
        0
      );

      // Value threshold rule: > ₹1,00,000 requires Project Director or Admin
      if (totalValue >= 100000 && req.user!.role === 'procurement_manager') {
        return res.status(403).json({
          error: `Approval threshold breach: Total value of ₹${totalValue.toLocaleString()} requires Project Director (Meena) or Admin approval.`,
        });
      }

      const updated = await prisma.indent.update({
        where: { id },
        data: {
          approvalStatus: 'approved',
          approvedById: req.user!.id,
          approvedAt: new Date(),
          approvalComments: comments || 'Approved',
        },
        include: { approvedBy: { select: { name: true, role: true } } },
      });

      await logAudit({
        userId: req.user!.id,
        action: 'INDENT_APPROVED',
        entity: 'Indent',
        entityId: updated.id,
        details: { indentNumber: updated.indentNumber, totalValue, approvedBy: req.user!.name },
      });

      return res.json({ indent: updated });
    } catch (error) {
      console.error('Indent approval error:', error);
      return res.status(500).json({ error: 'Failed to approve indent' });
    }
  }
);

// POST /api/indents/:id/reject - Reject indent
router.post(
  '/:id/reject',
  authenticateToken,
  requireRole(['admin', 'project_director', 'procurement_manager']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;

      const updated = await prisma.indent.update({
        where: { id },
        data: {
          approvalStatus: 'rejected',
          approvedById: req.user!.id,
          approvedAt: new Date(),
          approvalComments: comments || 'Rejected by approver',
        },
      });

      await logAudit({
        userId: req.user!.id,
        action: 'INDENT_REJECTED',
        entity: 'Indent',
        entityId: updated.id,
        details: { indentNumber: updated.indentNumber, comments },
      });

      return res.json({ indent: updated });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to reject indent' });
    }
  }
);

export default router;
