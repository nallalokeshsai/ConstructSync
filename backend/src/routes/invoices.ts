import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { logAudit } from '../services/auditService';
import { performThreeWayMatch } from '../services/matchingService';

const router = Router();

// GET /api/invoices - List invoices with 3-way match status
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { vendorId, poId, threeWayMatchStatus, paymentStatus } = req.query;
    const where: any = {};
    if (vendorId) where.vendorId = String(vendorId);
    if (poId) where.poId = String(poId);
    if (threeWayMatchStatus) where.threeWayMatchStatus = String(threeWayMatchStatus);
    if (paymentStatus) where.paymentStatus = String(paymentStatus);

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        vendor: { select: { id: true, companyName: true, category: true, gstin: true } },
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            grandTotal: true,
            project: { select: { projectName: true, projectCode: true } },
          },
        },
        grn: { select: { id: true, grnNumber: true, qualityStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsed = invoices.map((inv) => ({
      ...inv,
      matchDiscrepancies: inv.matchDiscrepancies ? JSON.parse(inv.matchDiscrepancies) : null,
    }));

    return res.json({ invoices: parsed });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET /api/invoices/:id - Single invoice with full 3-way match breakdown
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        purchaseOrder: {
          include: {
            items: true,
            project: true,
            createdBy: { select: { name: true } },
          },
        },
        grn: {
          include: {
            items: true,
            receivedBy: { select: { name: true } },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.json({
      invoice: {
        ...invoice,
        matchDiscrepancies: invoice.matchDiscrepancies
          ? JSON.parse(invoice.matchDiscrepancies)
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// POST /api/invoices - Create invoice & perform automated 3-way match
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      invoiceNumber,
      vendorId,
      poId,
      grnId,
      invoiceAmount,
      gstAmount,
      tdsPercentage,
      invoiceDate,
      dueDate,
      notes,
    } = req.body;

    if (!invoiceNumber || !vendorId || !poId || invoiceAmount === undefined) {
      return res.status(400).json({ error: 'Invoice number, vendor, PO, and amount are required' });
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });

    if (!po) {
      return res.status(404).json({ error: 'Referenced PO not found' });
    }

    let grn = null;
    if (grnId) {
      grn = await prisma.gRN.findUnique({
        where: { id: grnId },
        include: { items: true },
      });
    }

    // Execute 3-way matching engine
    const matchResult = performThreeWayMatch({
      po,
      grn,
      invoice: {
        invoiceAmount: Number(invoiceAmount),
        gstAmount: Number(gstAmount) || 0,
        tdsPercentage: tdsPercentage !== undefined ? Number(tdsPercentage) : 2.0,
      },
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        vendorId,
        poId,
        grnId: grnId || null,
        invoiceAmount: Number(invoiceAmount),
        gstAmount: Number(gstAmount) || 0,
        tdsPercentage: tdsPercentage !== undefined ? Number(tdsPercentage) : 2.0,
        tdsAmount: matchResult.summary.tdsAmount,
        netPayable: matchResult.summary.netPayable,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        paymentStatus: matchResult.status === 'matched' ? 'approved' : 'disputed',
        threeWayMatchStatus: matchResult.status,
        matchDiscrepancies:
          matchResult.discrepancies.length > 0
            ? JSON.stringify(matchResult.discrepancies)
            : null,
        notes,
      },
      include: { vendor: true, purchaseOrder: true },
    });

    await logAudit({
      userId: req.user!.id,
      action: matchResult.status === 'matched' ? '3WAY_MATCH_VERIFIED' : '3WAY_MATCH_DISCREPANCY_FLAGGED',
      entity: 'Invoice',
      entityId: invoice.id,
      details: {
        invoiceNumber,
        status: matchResult.status,
        discrepanciesCount: matchResult.discrepancies.length,
        netPayable: invoice.netPayable,
      },
    });

    return res.status(201).json({
      invoice: {
        ...invoice,
        matchDiscrepancies: matchResult.discrepancies,
      },
      matchSummary: matchResult.summary,
    });
  } catch (error) {
    console.error('Invoice creation error:', error);
    return res.status(500).json({ error: 'Failed to record invoice' });
  }
});

// PATCH /api/invoices/:id/payment-status - Update payment status
router.patch(
  '/:id/payment-status',
  authenticateToken,
  requireRole(['admin', 'finance_controller']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { paymentStatus, notes } = req.body;

      const validStatuses = ['pending', 'approved', 'paid', 'disputed'];
      if (!validStatuses.includes(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status' });
      }

      const updated = await prisma.invoice.update({
        where: { id },
        data: {
          paymentStatus,
          notes: notes !== undefined ? notes : undefined,
        },
      });

      await logAudit({
        userId: req.user!.id,
        action: 'INVOICE_PAYMENT_STATUS_UPDATED',
        entity: 'Invoice',
        entityId: id,
        details: { paymentStatus, notes },
      });

      return res.json({ invoice: updated });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update payment status' });
    }
  }
);

export default router;
