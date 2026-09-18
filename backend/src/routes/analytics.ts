import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/analytics/dashboard - Executive overview metrics
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.query;
    const poWhere: any = { status: { not: 'cancelled' } };
    if (projectId) poWhere.projectId = String(projectId);

    // 1. Core KPIs
    const allPOs = await prisma.purchaseOrder.findMany({
      where: poWhere,
      include: {
        vendor: { select: { category: true, companyName: true, complianceStatus: true } },
        project: { select: { projectName: true, totalBudget: true, procurementBudget: true } },
      },
    });

    const totalSpend = allPOs.reduce((sum, po) => sum + po.grandTotal, 0);

    const pendingApprovalsCount = await prisma.indent.count({
      where: { approvalStatus: 'pending' },
    });

    // Budget Health
    const allProjects = await prisma.project.findMany({
      include: {
        purchaseOrders: { where: { status: { not: 'cancelled' } }, select: { grandTotal: true } },
      },
    });

    const totalProcurementBudget = allProjects.reduce((sum, p) => sum + p.procurementBudget, 0);
    const totalCommittedAllProjects = allProjects.reduce(
      (sum, p) => sum + p.purchaseOrders.reduce((s, po) => s + po.grandTotal, 0),
      0
    );
    const overallBudgetUtilization =
      totalProcurementBudget > 0 ? (totalCommittedAllProjects / totalProcurementBudget) * 100 : 0;

    // Vendor compliance alerts count
    const nonCompliantVendorsCount = await prisma.vendor.count({
      where: { complianceStatus: { in: ['non_compliant', 'expiring'] } },
    });

    // 2. Spend by Material Category (Donut Chart)
    const categoryMap: Record<string, number> = {};
    allPOs.forEach((po) => {
      const cat = po.vendor.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + po.grandTotal;
    });

    const spendByCategory = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: Math.round(value),
    }));

    // 3. Spend by Vendor (Bar Chart)
    const vendorMap: Record<string, number> = {};
    allPOs.forEach((po) => {
      const vName = po.vendor.companyName;
      vendorMap[vName] = (vendorMap[vName] || 0) + po.grandTotal;
    });

    const spendByVendor = Object.entries(vendorMap)
      .map(([name, spend]) => ({ name, spend: Math.round(spend) }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 6);

    // 4. Budget vs. Actual Tracker by Project (Stacked Bar Chart)
    const budgetVsActual = allProjects.map((p) => {
      const committed = p.purchaseOrders.reduce((s, po) => s + po.grandTotal, 0);
      const remaining = Math.max(0, p.procurementBudget - committed);
      return {
        projectName: p.projectName,
        projectCode: p.projectCode,
        budget: p.procurementBudget,
        actualSpend: Math.round(committed),
        remainingBudget: Math.round(remaining),
        utilizationPct: Number(
          (p.procurementBudget > 0 ? (committed / p.procurementBudget) * 100 : 0).toFixed(1)
        ),
        isAlert: committed >= p.procurementBudget * 0.8,
      };
    });

    // 5. Vendor Scorecard Radar Data (Timeliness, Quality, Pricing, Communication)
    const vendorReviews = await prisma.vendorPerformance.findMany({
      include: { vendor: { select: { companyName: true, category: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Aggregate averages across all evaluated vendors
    let totalTime = 0,
      totalQual = 0,
      totalPrice = 0,
      totalComm = 0;
    const reviewCount = vendorReviews.length || 1;

    vendorReviews.forEach((r) => {
      totalTime += r.deliveryTimelinessScore;
      totalQual += r.qualityScore;
      totalPrice += r.pricingCompetitiveness;
      totalComm += r.communicationScore;
    });

    const vendorRadarData = [
      { subject: 'Delivery Timeliness', score: Number((totalTime / reviewCount).toFixed(2)), fullMark: 5 },
      { subject: 'Quality Adherence', score: Number((totalQual / reviewCount).toFixed(2)), fullMark: 5 },
      { subject: 'Pricing Competitiveness', score: Number((totalPrice / reviewCount).toFixed(2)), fullMark: 5 },
      { subject: 'Communication & Responsiveness', score: Number((totalComm / reviewCount).toFixed(2)), fullMark: 5 },
      { subject: 'Compliance Readiness', score: 4.5, fullMark: 5 },
    ];

    // 6. Procurement Cycle Time Stages (Hours/Days)
    const cycleTimeData = [
      { stage: 'Indent Creation → Approval', averageDays: 0.8, targetDays: 0.5, status: 'on_track' },
      { stage: 'Approval → PO Release', averageDays: 1.2, targetDays: 1.0, status: 'warning' },
      { stage: 'PO Release → Site Delivery (GRN)', averageDays: 3.5, targetDays: 2.5, status: 'bottleneck' },
      { stage: 'GRN → 3-Way Match & Invoice', averageDays: 1.1, targetDays: 1.0, status: 'on_track' },
    ];

    // 7. Maverick Spend Summary
    const maverickPOs = allPOs.filter((po) => po.isMaverick);
    const maverickSpendTotal = maverickPOs.reduce((sum, po) => sum + po.grandTotal, 0);
    const maverickPct = totalSpend > 0 ? (maverickSpendTotal / totalSpend) * 100 : 0;

    return res.json({
      kpis: {
        totalSpend: Math.round(totalSpend),
        pendingApprovalsCount,
        overallBudgetUtilization: Number(overallBudgetUtilization.toFixed(1)),
        nonCompliantVendorsCount,
        maverickSpendTotal: Math.round(maverickSpendTotal),
        maverickPct: Number(maverickPct.toFixed(1)),
      },
      spendByCategory,
      spendByVendor,
      budgetVsActual,
      vendorRadarData,
      cycleTimeData,
      maverickSpendSummary: {
        totalAmount: Math.round(maverickSpendTotal),
        percentageOfTotal: Number(maverickPct.toFixed(1)),
        ordersCount: maverickPOs.length,
        orders: maverickPOs.map((po) => ({
          poNumber: po.poNumber,
          vendor: po.vendor.companyName,
          amount: po.grandTotal,
          notes: po.notes,
          date: po.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return res.status(500).json({ error: 'Failed to generate analytics dashboard' });
  }
});

// GET /api/analytics/compliance-report - GST & TDS reconciliation summary
router.get('/compliance-report', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        vendor: { select: { companyName: true, gstin: true, pan: true, complianceStatus: true } },
        purchaseOrder: { select: { poNumber: true, project: { select: { projectName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalGstClaimed = 0;
    let totalTdsDeducted = 0;
    let disputedGst = 0;

    const items = invoices.map((inv) => {
      totalGstClaimed += inv.gstAmount;
      totalTdsDeducted += inv.tdsAmount;
      if (inv.threeWayMatchStatus === 'mismatch') {
        disputedGst += inv.gstAmount;
      }

      return {
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        vendor: inv.vendor.companyName,
        gstin: inv.vendor.gstin,
        pan: inv.vendor.pan,
        project: inv.purchaseOrder.project.projectName,
        invoiceAmount: inv.invoiceAmount,
        gstAmount: inv.gstAmount,
        tdsPercentage: inv.tdsPercentage,
        tdsAmount: inv.tdsAmount,
        netPayable: inv.netPayable,
        matchStatus: inv.threeWayMatchStatus,
        paymentStatus: inv.paymentStatus,
      };
    });

    return res.json({
      summary: {
        totalInvoicesCount: invoices.length,
        totalGstClaimed: Math.round(totalGstClaimed),
        totalTdsDeducted: Math.round(totalTdsDeducted),
        disputedGst: Math.round(disputedGst),
        complianceRate: invoices.length > 0 ? ((invoices.length - disputedGst > 0 ? 1 : 0) / invoices.length) * 100 : 100,
      },
      invoices: items,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

export default router;
