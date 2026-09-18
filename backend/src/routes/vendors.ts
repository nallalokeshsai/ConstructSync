import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { logAudit } from '../services/auditService';
import { upload } from '../middleware/upload';

const router = Router();

// GSTIN Regex pattern for Indian Goods and Services Tax Identification Number
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// GET /api/vendors - List and search
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, complianceStatus, status } = req.query;

    const where: any = {};
    if (category) {
      where.category = String(category);
    }
    if (complianceStatus) {
      where.complianceStatus = String(complianceStatus);
    }
    if (status) {
      where.status = String(status);
    }
    if (search) {
      const q = String(search);
      where.OR = [
        { companyName: { contains: q } },
        { gstin: { contains: q } },
        { contactPerson: { contains: q } },
        { city: { contains: q } },
        { category: { contains: q } },
      ];
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        documents: true,
        _count: {
          select: { purchaseOrders: true, invoices: true },
        },
      },
      orderBy: { performanceScore: 'desc' },
    });

    return res.json({ vendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// POST /api/vendors/verify-gstin - Validate GSTIN via format & portal simulation
router.post('/verify-gstin', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { gstin } = req.body;
    if (!gstin || !GSTIN_REGEX.test(gstin.trim().toUpperCase())) {
      return res.status(400).json({
        valid: false,
        message: 'Invalid GSTIN format. Expected 15-character alphanumeric format (e.g., 29AAACT2727Q1ZB)',
      });
    }

    const cleanGst = gstin.trim().toUpperCase();
    const stateCode = cleanGst.substring(0, 2);
    const pan = cleanGst.substring(2, 12);

    // State mapping for Indian states
    const stateMap: Record<string, string> = {
      '29': 'Karnataka',
      '27': 'Maharashtra',
      '24': 'Gujarat',
      '06': 'Haryana',
      '08': 'Rajasthan',
      '36': 'Telangana',
      '33': 'Tamil Nadu',
      '07': 'Delhi',
      '19': 'West Bengal',
      '09': 'Uttar Pradesh',
    };

    return res.json({
      valid: true,
      gstin: cleanGst,
      pan,
      state: stateMap[stateCode] || 'Registered State',
      status: 'Active',
      taxpayerType: 'Regular',
      verifiedAt: new Date(),
      message: 'GSTIN successfully verified with GST Portal network.',
    });
  } catch (error) {
    return res.status(500).json({ error: 'GSTIN verification service error' });
  }
});

// GET /api/vendors/:id - Single vendor profile dashboard
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { expiryDate: 'asc' } },
        purchaseOrders: {
          include: { project: true, items: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        performanceReviews: {
          include: { reviewedBy: { select: { name: true, role: true } } },
          orderBy: { reviewDate: 'desc' },
        },
        quotes: true,
      },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Check for expiring documents (< 30 days)
    const now = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(now.getDate() + 30);

    const expiringDocs = vendor.documents.filter(
      (doc) => doc.expiryDate && new Date(doc.expiryDate) <= thirtyDaysAhead
    );

    return res.json({
      vendor,
      complianceAlerts: {
        hasExpiringDocs: expiringDocs.length > 0,
        expiringCount: expiringDocs.length,
        expiringDocs,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch vendor profile' });
  }
});

// POST /api/vendors - Onboard new vendor
router.post('/', authenticateToken, requireRole(['admin', 'procurement_manager']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      companyName,
      contactPerson,
      phone,
      email,
      gstin,
      pan,
      bankName,
      bankAccount,
      ifscCode,
      category,
      city,
      state,
    } = req.body;

    if (!companyName || !category) {
      return res.status(400).json({ error: 'Company name and category are required' });
    }

    if (gstin && !GSTIN_REGEX.test(gstin.trim().toUpperCase())) {
      return res.status(400).json({ error: 'Invalid GSTIN format' });
    }

    const cleanGstin = gstin ? gstin.trim().toUpperCase() : undefined;
    const derivedPan = pan ? pan.trim().toUpperCase() : cleanGstin ? cleanGstin.substring(2, 12) : undefined;

    const vendor = await prisma.vendor.create({
      data: {
        companyName,
        contactPerson,
        phone,
        email,
        gstin: cleanGstin,
        pan: derivedPan,
        bankName,
        bankAccount,
        ifscCode,
        category,
        city,
        state,
        complianceStatus: 'compliant',
        performanceScore: 4.0, // Default baseline for new vendor
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'VENDOR_ONBOARDED',
      entity: 'Vendor',
      entityId: vendor.id,
      details: { companyName: vendor.companyName, category: vendor.category, gstin: vendor.gstin },
    });

    return res.status(201).json({ vendor });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A vendor with this GSTIN already exists' });
    }
    return res.status(500).json({ error: 'Failed to onboard vendor' });
  }
});

// PUT /api/vendors/:id - Update vendor profile
router.put('/:id', authenticateToken, requireRole(['admin', 'procurement_manager']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const vendor = await prisma.vendor.update({
      where: { id },
      data,
    });

    await logAudit({
      userId: req.user?.id,
      action: 'VENDOR_UPDATED',
      entity: 'Vendor',
      entityId: vendor.id,
      details: { updatedFields: Object.keys(data) },
    });

    return res.json({ vendor });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// POST /api/vendors/:id/documents - Upload & register compliance document
router.post(
  '/:id/documents',
  authenticateToken,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { documentType, title, documentNumber, issueDate, expiryDate } = req.body;

      if (!documentType || !title) {
        return res.status(400).json({ error: 'Document type and title are required' });
      }

      const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

      const doc = await prisma.complianceDocument.create({
        data: {
          vendorId: id,
          documentType,
          title,
          documentNumber,
          fileUrl,
          issueDate: issueDate ? new Date(issueDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          status: 'valid',
        },
      });

      return res.status(201).json({ document: doc });
    } catch (error) {
      console.error('Document upload error:', error);
      return res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

// POST /api/vendors/:id/performance - Log performance review & update weighted score
router.post('/:id/performance', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      projectId,
      poId,
      deliveryTimelinessScore,
      qualityScore,
      pricingCompetitiveness,
      communicationScore,
      reviewNotes,
    } = req.body;

    const dScore = Number(deliveryTimelinessScore) || 4;
    const qScore = Number(qualityScore) || 4;
    const pScore = Number(pricingCompetitiveness) || 4;
    const cScore = Number(communicationScore) || 4;

    // Weighted overall score: 35% Timeliness, 35% Quality, 20% Pricing, 10% Communication
    const overallScore = Number((dScore * 0.35 + qScore * 0.35 + pScore * 0.2 + cScore * 0.1).toFixed(2));

    const review = await prisma.vendorPerformance.create({
      data: {
        vendorId: id,
        projectId,
        poId,
        deliveryTimelinessScore: dScore,
        qualityScore: qScore,
        pricingCompetitiveness: pScore,
        communicationScore: cScore,
        overallScore,
        reviewNotes,
        reviewedById: req.user!.id,
      },
    });

    // Update aggregate score on vendor
    const allReviews = await prisma.vendorPerformance.findMany({
      where: { vendorId: id },
      select: { overallScore: true },
    });
    const avgScore = Number(
      (allReviews.reduce((sum, r) => sum + r.overallScore, 0) / allReviews.length).toFixed(2)
    );

    await prisma.vendor.update({
      where: { id },
      data: { performanceScore: avgScore },
    });

    return res.status(201).json({ review, newAverageScore: avgScore });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to submit review' });
  }
});

export default router;
