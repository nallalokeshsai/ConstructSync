import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';
import { upload } from '../middleware/upload';

const router = Router();

// GET /api/grn - List GRNs
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { poId, qualityStatus } = req.query;
    const where: any = {};
    if (poId) where.poId = String(poId);
    if (qualityStatus) where.qualityStatus = String(qualityStatus);

    const grns = await prisma.gRN.findMany({
      where,
      include: {
        purchaseOrder: {
          include: {
            vendor: { select: { companyName: true, category: true } },
            project: { select: { projectName: true, projectCode: true } },
          },
        },
        receivedBy: { select: { id: true, name: true, role: true } },
        items: true,
      },
      orderBy: { receivedDate: 'desc' },
    });

    return res.json({ grns });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch GRNs' });
  }
});

// GET /api/grn/:id - Single GRN details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const grn = await prisma.gRN.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            vendor: true,
            project: true,
            items: true,
          },
        },
        receivedBy: true,
        items: true,
        invoices: true,
      },
    });

    if (!grn) {
      return res.status(404).json({ error: 'GRN not found' });
    }

    return res.json({ grn });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch GRN' });
  }
});

// POST /api/grn - Log material receipt at site
router.post(
  '/',
  authenticateToken,
  upload.array('photos', 5),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        poId,
        deliveryChallanNo,
        vehicleNumber,
        qualityStatus,
        rejectionReason,
        notes,
        itemsJson,
      } = req.body;

      if (!poId) {
        return res.status(400).json({ error: 'Purchase Order ID is required' });
      }

      let items = [];
      try {
        items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : req.body.items || [];
      } catch (err) {
        return res.status(400).json({ error: 'Invalid items JSON structure' });
      }

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'At least one received item is required' });
      }

      // Handle photo URLs from files or input
      const photoUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file: Express.Multer.File) => {
          photoUrls.push(`/uploads/${file.filename}`);
        });
      }
      if (req.body.photoUrls) {
        const extraUrls = Array.isArray(req.body.photoUrls)
          ? req.body.photoUrls
          : [req.body.photoUrls];
        photoUrls.push(...extraUrls);
      }

      // Auto-generate GRN number
      const count = await prisma.gRN.count();
      const grnNumber = `GRN-${new Date().getFullYear()}-${String(count + 43).padStart(4, '0')}`;

      // Check quality status
      let overallQuality = qualityStatus || 'accepted';
      const hasRejection = items.some((it: any) => Number(it.rejectedQuantity) > 0);
      if (hasRejection && overallQuality === 'accepted') {
        overallQuality = 'partial';
      }

      const grn = await prisma.gRN.create({
        data: {
          grnNumber,
          poId,
          receivedById: req.user!.id,
          deliveryChallanNo,
          vehicleNumber,
          qualityStatus: overallQuality,
          rejectionReason,
          notes,
          photoUrls: JSON.stringify(photoUrls),
          items: {
            create: items.map((it: any) => ({
              poItemId: it.poItemId || null,
              materialName: it.materialName,
              orderedQuantity: Number(it.orderedQuantity) || 0,
              receivedQuantity: Number(it.receivedQuantity) || 0,
              acceptedQuantity: Number(it.acceptedQuantity) || 0,
              rejectedQuantity: Number(it.rejectedQuantity) || 0,
              remarks: it.remarks || '',
            })),
          },
        },
        include: { items: true, purchaseOrder: true },
      });

      // Update PO status to 'delivered'
      await prisma.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'delivered' },
      });

      await logAudit({
        userId: req.user!.id,
        action: 'GRN_LOGGED',
        entity: 'GRN',
        entityId: grn.id,
        details: {
          grnNumber: grn.grnNumber,
          poId: grn.poId,
          qualityStatus: grn.qualityStatus,
          challan: deliveryChallanNo,
        },
      });

      return res.status(201).json({ grn });
    } catch (error) {
      console.error('GRN creation error:', error);
      return res.status(500).json({ error: 'Failed to record GRN' });
    }
  }
);

export default router;
