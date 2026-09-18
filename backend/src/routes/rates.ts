import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/rates/compare - Compare quotes for material
router.get('/compare', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { materialName, category } = req.query;

    const where: any = {};
    if (materialName) {
      where.materialName = { contains: String(materialName) };
    }
    if (category) {
      where.materialCategory = String(category);
    }

    const quotes = await prisma.vendorQuote.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true,
            performanceScore: true,
            complianceStatus: true,
            city: true,
          },
        },
      },
      orderBy: { unitRate: 'asc' },
    });

    // Also fetch historical PO unit rates for this material
    const poItems = await prisma.pOItem.findMany({
      where: materialName ? { materialName: { contains: String(materialName) } } : {},
      include: {
        purchaseOrder: {
          select: {
            poNumber: true,
            createdAt: true,
            vendor: { select: { companyName: true } },
          },
        },
      },
      orderBy: { purchaseOrder: { createdAt: 'asc' } },
      take: 20,
    });

    const historicalRates = poItems.map((item) => ({
      date: item.purchaseOrder.createdAt,
      poNumber: item.purchaseOrder.poNumber,
      vendor: item.purchaseOrder.vendor.companyName,
      materialName: item.materialName,
      unitRate: item.unitRate,
      unit: item.unit,
    }));

    // Determine recommended best quote: composite scoring = lowest price (60%) + vendor rating (40%)
    let bestQuote = null;
    if (quotes.length > 0) {
      const minRate = Math.min(...quotes.map((q) => q.unitRate));
      const ranked = quotes.map((q) => {
        const priceScore = (minRate / q.unitRate) * 5; // 5 if lowest, lower if higher
        const vendorScore = q.vendor.performanceScore;
        const compositeValue = priceScore * 0.6 + vendorScore * 0.4;
        return { ...q, compositeValue };
      });
      ranked.sort((a, b) => b.compositeValue - a.compositeValue);
      bestQuote = ranked[0];
    }

    return res.json({
      quotes,
      bestQuote,
      historicalRates,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch rate comparisons' });
  }
});

// POST /api/rates/quotes - Add new quote
router.post('/quotes', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { vendorId, materialName, materialCategory, unitRate, unit, validTill, minimumOrderQuantity, leadTimeDays, notes } = req.body;

    if (!vendorId || !materialName || !unitRate || !unit) {
      return res.status(400).json({ error: 'Vendor, material name, rate, and unit are required' });
    }

    const quote = await prisma.vendorQuote.create({
      data: {
        vendorId,
        materialName,
        materialCategory: materialCategory || 'General',
        unitRate: Number(unitRate),
        unit,
        validTill: validTill ? new Date(validTill) : null,
        minimumOrderQuantity: minimumOrderQuantity ? Number(minimumOrderQuantity) : null,
        leadTimeDays: leadTimeDays ? Number(leadTimeDays) : null,
        notes,
      },
      include: { vendor: true },
    });

    return res.status(201).json({ quote });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create quote' });
  }
});

export default router;
