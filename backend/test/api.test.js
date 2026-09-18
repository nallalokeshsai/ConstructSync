const { test, describe } = require('node:test');
const assert = require('node:assert');
const { performThreeWayMatch } = require('../dist/services/matchingService');

describe('ConstructSync 3-Way Matching Engine Tests', () => {
  const mockPo = {
    id: 'po-101',
    poNumber: 'PO-2026-0001',
    totalAmount: 100000,
    items: [
      { id: 'item-1', materialName: 'Fe550D TMT Rebar (16mm)', quantity: 20, unitRate: 5000 },
    ],
  };

  test('Should pass 3-way match when PO, GRN, and Invoice match completely', () => {
    const mockGrn = {
      id: 'grn-101',
      items: [
        {
          poItemId: 'item-1',
          materialName: 'Fe550D TMT Rebar (16mm)',
          orderedQuantity: 20,
          receivedQuantity: 20,
          acceptedQuantity: 20,
          rejectedQuantity: 0,
        },
      ],
    };

    const result = performThreeWayMatch({
      po: mockPo,
      grn: mockGrn,
      invoice: {
        invoiceAmount: 100000,
        gstAmount: 18000,
        tdsPercentage: 2.0,
      },
    });

    assert.strictEqual(result.status, 'matched');
    assert.strictEqual(result.discrepancies.length, 0);
    assert.strictEqual(result.summary.tdsAmount, 2000);
    assert.strictEqual(result.summary.netPayable, 116000);
  });

  test('Should flag QUANTITY_MISMATCH discrepancy when GRN has rejected damaged materials', () => {
    const mockGrn = {
      id: 'grn-102',
      items: [
        {
          poItemId: 'item-1',
          materialName: 'Fe550D TMT Rebar (16mm)',
          orderedQuantity: 20,
          receivedQuantity: 20,
          acceptedQuantity: 15,
          rejectedQuantity: 5,
          remarks: '5 MT rejected due to deep water corrosion',
        },
      ],
    };

    const result = performThreeWayMatch({
      po: mockPo,
      grn: mockGrn,
      invoice: {
        invoiceAmount: 100000, // Invoiced for full 20 MT instead of accepted 15 MT
        gstAmount: 18000,
      },
    });

    assert.strictEqual(result.status, 'mismatch');
    const hasQtyMismatch = result.discrepancies.some((d) => d.type === 'QUANTITY_MISMATCH');
    assert.strictEqual(hasQtyMismatch, true);
    // Overbilled by 5 * 5000 = 25,000
    assert.strictEqual(result.summary.variance, 25000);
  });

  test('Should flag PRICE_MISMATCH when invoice exceeds agreed PO rates', () => {
    const mockGrn = {
      id: 'grn-103',
      items: [
        {
          poItemId: 'item-1',
          materialName: 'Fe550D TMT Rebar (16mm)',
          orderedQuantity: 20,
          receivedQuantity: 20,
          acceptedQuantity: 20,
          rejectedQuantity: 0,
        },
      ],
    };

    const result = performThreeWayMatch({
      po: mockPo,
      grn: mockGrn,
      invoice: {
        invoiceAmount: 110000, // Vendor arbitrarily increased price by 10,000
        gstAmount: 19800,
      },
    });

    assert.strictEqual(result.status, 'mismatch');
    const hasPriceMismatch = result.discrepancies.some((d) => d.type === 'PRICE_MISMATCH');
    assert.strictEqual(hasPriceMismatch, true);
    assert.strictEqual(result.summary.variance, 10000);
  });
});
