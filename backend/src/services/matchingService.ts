export interface MatchResult {
  status: 'matched' | 'mismatch';
  discrepancies: {
    type: 'QUANTITY_MISMATCH' | 'PRICE_MISMATCH' | 'TAX_MISMATCH' | 'GRN_MISSING';
    message: string;
    details: any;
  }[];
  summary: {
    poAmount: number;
    grnAcceptedAmount: number;
    invoiceAmount: number;
    gstAmount: number;
    tdsAmount: number;
    netPayable: number;
    variance: number;
  };
}

export function performThreeWayMatch(params: {
  po: any;
  grn?: any;
  invoice: {
    invoiceAmount: number;
    gstAmount: number;
    tdsPercentage?: number;
  };
}): MatchResult {
  const discrepancies: MatchResult['discrepancies'] = [];
  const po = params.po;
  const grn = params.grn;
  const invoice = params.invoice;

  if (!grn) {
    discrepancies.push({
      type: 'GRN_MISSING',
      message: 'No Goods Receipt Note found. Cannot verify physical delivery against site receipts.',
      details: { poId: po.id },
    });
  }

  // Calculate accepted value from GRN
  let totalAcceptedAmount = 0;
  let hasQuantityMismatch = false;

  if (grn && grn.items && grn.items.length > 0) {
    for (const gItem of grn.items) {
      const poItem = po.items?.find((p: any) => p.id === gItem.poItemId || p.materialName === gItem.materialName);
      const rate = poItem ? poItem.unitRate : 0;
      totalAcceptedAmount += gItem.acceptedQuantity * rate;

      if (gItem.rejectedQuantity > 0) {
        hasQuantityMismatch = true;
        discrepancies.push({
          type: 'QUANTITY_MISMATCH',
          message: `Material ${gItem.materialName}: ${gItem.rejectedQuantity} units rejected during inspection. Ordered: ${gItem.orderedQuantity}, Accepted: ${gItem.acceptedQuantity}.`,
          details: {
            materialName: gItem.materialName,
            ordered: gItem.orderedQuantity,
            accepted: gItem.acceptedQuantity,
            rejected: gItem.rejectedQuantity,
            remarks: gItem.remarks,
          },
        });
      }
    }
  } else {
    totalAcceptedAmount = po.totalAmount;
  }

  // Check Invoice amount vs Accepted GRN amount
  const baseCompare = grn ? totalAcceptedAmount : po.totalAmount;
  const variance = invoice.invoiceAmount - baseCompare;

  if (Math.abs(variance) > 5) {
    // Flag price or quantity discrepancy if invoice amount exceeds accepted amount
    discrepancies.push({
      type: 'PRICE_MISMATCH',
      message: `Invoice base amount (₹${invoice.invoiceAmount.toLocaleString()}) does not match GRN accepted amount (₹${baseCompare.toLocaleString()}). Net variance: ₹${variance.toLocaleString()}`,
      details: {
        invoiceAmount: invoice.invoiceAmount,
        acceptedAmount: baseCompare,
        variance,
      },
    });
  }

  // TDS Calculation (Section 194C / 194Q: standard 2% or 1%)
  const tdsPercent = invoice.tdsPercentage !== undefined ? invoice.tdsPercentage : 2.0;
  const tdsAmount = Number(((invoice.invoiceAmount * tdsPercent) / 100).toFixed(2));
  const netPayable = Number((invoice.invoiceAmount + invoice.gstAmount - tdsAmount).toFixed(2));

  return {
    status: discrepancies.length === 0 ? 'matched' : 'mismatch',
    discrepancies,
    summary: {
      poAmount: po.totalAmount,
      grnAcceptedAmount: totalAcceptedAmount,
      invoiceAmount: invoice.invoiceAmount,
      gstAmount: invoice.gstAmount,
      tdsAmount,
      netPayable,
      variance,
    },
  };
}
