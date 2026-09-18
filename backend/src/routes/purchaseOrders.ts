import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// GET /api/purchase-orders - List purchase orders
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, vendorId, status, isMaverick } = req.query;

    const where: any = {};
    if (projectId) where.projectId = String(projectId);
    if (vendorId) where.vendorId = String(vendorId);
    if (status) where.status = String(status);
    if (isMaverick !== undefined) where.isMaverick = isMaverick === 'true';

    const pos = await prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: { select: { id: true, companyName: true, category: true, gstin: true, complianceStatus: true } },
        project: { select: { id: true, projectName: true, projectCode: true } },
        createdBy: { select: { id: true, name: true } },
        items: true,
        grns: { select: { id: true, grnNumber: true, qualityStatus: true } },
        invoices: { select: { id: true, invoiceNumber: true, threeWayMatchStatus: true, paymentStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ purchaseOrders: pos });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// GET /api/purchase-orders/:id - Get PO details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        project: { include: { projectManager: true } },
        createdBy: { select: { id: true, name: true, email: true, phone: true } },
        items: true,
        indent: { include: { requestedBy: true, approvedBy: true } },
        grns: { include: { items: true, receivedBy: true } },
        invoices: true,
      },
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    return res.json({ purchaseOrder: po });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch PO' });
  }
});

// POST /api/purchase-orders - Generate PO
router.post(
  '/',
  authenticateToken,
  requireRole(['admin', 'procurement_manager']),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        indentId,
        vendorId,
        projectId,
        deliveryDate,
        paymentTerms,
        notes,
        items,
        isMaverick,
      } = req.body;

      if (!vendorId || !projectId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Vendor, project, and line items are required' });
      }

      // Calculate totals
      let totalAmount = 0;
      let gstAmount = 0;

      const processedItems = items.map((item: any) => {
        const qty = Number(item.quantity);
        const rate = Number(item.unitRate);
        const gstPct = item.gstPercentage !== undefined ? Number(item.gstPercentage) : 18;
        const lineTotal = qty * rate;
        const lineGst = (lineTotal * gstPct) / 100;

        totalAmount += lineTotal;
        gstAmount += lineGst;

        return {
          materialName: item.materialName,
          quantity: qty,
          unit: item.unit,
          unitRate: rate,
          gstPercentage: gstPct,
          totalAmount: lineTotal,
        };
      });

      const grandTotal = totalAmount + gstAmount;

      // Auto PO number
      const count = await prisma.purchaseOrder.count();
      const poNumber = `PO-${new Date().getFullYear()}-${String(count + 85).padStart(4, '0')}`;

      // Check if maverick spend (if no indentId or indent wasn't approved)
      let markedMaverick = Boolean(isMaverick);
      if (!indentId) {
        markedMaverick = true; // Off-contract / direct PO without indent requisition
      }

      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber,
          indentId: indentId || null,
          vendorId,
          projectId,
          totalAmount,
          gstAmount,
          grandTotal,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          paymentTerms: paymentTerms || '30 Days Net from GRN',
          notes,
          status: 'sent',
          isMaverick: markedMaverick,
          createdById: req.user!.id,
          items: {
            create: processedItems,
          },
        },
        include: { vendor: true, project: true, items: true },
      });

      await logAudit({
        userId: req.user!.id,
        action: 'PO_GENERATED',
        entity: 'PurchaseOrder',
        entityId: po.id,
        details: {
          poNumber: po.poNumber,
          vendor: po.vendor.companyName,
          grandTotal,
          isMaverick: markedMaverick,
        },
      });

      return res.status(201).json({ purchaseOrder: po });
    } catch (error) {
      console.error('PO creation error:', error);
      return res.status(500).json({ error: 'Failed to create purchase order' });
    }
  }
);

// PATCH /api/purchase-orders/:id/status - Update PO Status
router.patch(
  '/:id/status',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['draft', 'sent', 'acknowledged', 'delivered', 'closed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status transition' });
      }

      const updated = await prisma.purchaseOrder.update({
        where: { id },
        data: { status },
      });

      await logAudit({
        userId: req.user?.id,
        action: 'PO_STATUS_CHANGED',
        entity: 'PurchaseOrder',
        entityId: id,
        details: { newStatus: status },
      });

      return res.json({ purchaseOrder: updated });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update PO status' });
    }
  }
);

export default router;
