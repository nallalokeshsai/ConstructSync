import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// GET /api/projects - List projects with budget tracking metrics
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        projectManager: { select: { id: true, name: true, email: true } },
        purchaseOrders: {
          select: { grandTotal: true, status: true, isMaverick: true },
        },
        _count: {
          select: { indents: true, purchaseOrders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = projects.map((p) => {
      const totalCommitted = p.purchaseOrders
        .filter((po) => po.status !== 'cancelled')
        .reduce((sum, po) => sum + po.grandTotal, 0);

      const maverickSpend = p.purchaseOrders
        .filter((po) => po.isMaverick && po.status !== 'cancelled')
        .reduce((sum, po) => sum + po.grandTotal, 0);

      const budgetUtilization = p.procurementBudget > 0 ? (totalCommitted / p.procurementBudget) * 100 : 0;

      return {
        ...p,
        totalCommitted,
        maverickSpend,
        budgetUtilization: Number(budgetUtilization.toFixed(1)),
        isBudgetExceeded: budgetUtilization >= 100,
        isWarningThreshold: budgetUtilization >= 80 && budgetUtilization < 100,
      };
    });

    return res.json({ projects: enriched });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Single project details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        projectManager: { select: { id: true, name: true, email: true, phone: true } },
        indents: {
          include: { items: true, requestedBy: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        purchaseOrders: {
          include: { vendor: { select: { companyName: true, category: true } }, items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const totalCommitted = project.purchaseOrders
      .filter((po) => po.status !== 'cancelled')
      .reduce((sum, po) => sum + po.grandTotal, 0);

    const budgetUtilization =
      project.procurementBudget > 0 ? (totalCommitted / project.procurementBudget) * 100 : 0;

    return res.json({
      project: {
        ...project,
        totalCommitted,
        budgetUtilization: Number(budgetUtilization.toFixed(1)),
        isWarningThreshold: budgetUtilization >= 80,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// POST /api/projects - Create project
router.post('/', authenticateToken, requireRole(['admin', 'project_director']), async (req: AuthRequest, res: Response) => {
  try {
    const { projectName, projectCode, location, totalBudget, procurementBudget, startDate, expectedEndDate, projectManagerId } = req.body;

    if (!projectName || !projectCode) {
      return res.status(400).json({ error: 'Project name and unique code are required' });
    }

    const project = await prisma.project.create({
      data: {
        projectName,
        projectCode,
        location,
        totalBudget: Number(totalBudget) || 0,
        procurementBudget: Number(procurementBudget) || 0,
        startDate: startDate ? new Date(startDate) : null,
        expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
        projectManagerId: projectManagerId || req.user!.id,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'PROJECT_CREATED',
      entity: 'Project',
      entityId: project.id,
      details: { projectName, projectCode, budget: procurementBudget },
    });

    return res.status(201).json({ project });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Project code already exists' });
    }
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

export default router;
