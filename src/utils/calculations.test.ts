import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLineItemTotal,
  calculateCartTotals,
  calculatePaymentsAndDebt,
  calculateFinancialHealth,
  calculateProductProfitMargin,
  generateUniqueInventoryId,
} from './calculations.ts';
import type { CartItem, ExpenseItem, ProductItem, SaleTransaction } from '../types/index.ts';

test('calculateLineItemTotal applies percentage discount correctly', () => {
  const result = calculateLineItemTotal(100, 2, 'percentage', 10);
  assert.equal(result.subtotal, 200);
  assert.equal(result.discount, 20);
  assert.equal(result.total, 180);
});

test('calculateLineItemTotal applies fixed discount correctly', () => {
  const result = calculateLineItemTotal(50, 3, 'fixed', 25);
  assert.equal(result.subtotal, 150);
  assert.equal(result.discount, 25);
  assert.equal(result.total, 125);
});

test('calculateCartTotals computes subtotal, extra charges and taxes', () => {
  const mockProduct: ProductItem = {
    id: 'prod-1',
    sku: 'SKU-1',
    barcode: '123456',
    name: 'Test Item',
    category: 'Hardware',
    type: 'product',
    costPrice: 40,
    sellingPrice: 100,
    stock: 10,
    minStockAlert: 2,
    description: 'A test product',
    imageUrl: '',
    createdAt: new Date().toISOString(),
  };

  const items: CartItem[] = [
    {
      product: mockProduct,
      quantity: 2,
      unitPrice: 100,
      discountType: 'percentage',
      discountValue: 10, // 200 - 20 = 180
      total: 180,
    },
  ];

  const result = calculateCartTotals(
    items,
    'percentage',
    5, // 5% off 180 = 9 -> 171
    [{ id: '1', reason: 'Transportation', amount: 15 }], // 171 + 15 = 186
    10 // 10% tax on 171 = 17.1 -> 186 + 17.1 = 203.1
  );

  assert.equal(result.subtotal, 200);
  assert.equal(result.lineDiscountsTotal, 20);
  assert.equal(result.subtotalAfterLineDiscounts, 180);
  assert.equal(result.overallDiscountTotal, 9);
  assert.equal(result.totalDiscount, 29);
  assert.equal(result.extraChargesTotal, 15);
  assert.equal(result.taxAmount, 17.1);
  assert.equal(result.netTotal, 203.1);
});

test('calculatePaymentsAndDebt tracks remaining debt and change due', () => {
  // Scenario 1: Partial payment -> debt
  const p1 = calculatePaymentsAndDebt(500, [
    { method: 'Cash', amount: 200 },
    { method: 'M-Pesa', amount: 100 },
  ]);
  assert.equal(p1.totalPaid, 300);
  assert.equal(p1.remainingDebt, 200);
  assert.equal(p1.changeDue, 0);
  assert.equal(p1.isFullyPaid, false);

  // Scenario 2: Overpayment -> change
  const p2 = calculatePaymentsAndDebt(250, [
    { method: 'Cash', amount: 300 },
  ]);
  assert.equal(p2.totalPaid, 300);
  assert.equal(p2.remainingDebt, 0);
  assert.equal(p2.changeDue, 50);
  assert.equal(p2.isFullyPaid, true);
});

test('calculateFinancialHealth evaluates P&L, COGS, and profit margin', () => {
  const inventory: ProductItem[] = [
    {
      id: 'p1',
      sku: 'SKU1',
      barcode: '111',
      name: 'Item 1',
      category: 'Electronics',
      type: 'product',
      costPrice: 50,
      sellingPrice: 100,
      stock: 20,
      minStockAlert: 5,
      description: '',
      imageUrl: '',
      createdAt: '',
    },
  ];

  const sales: SaleTransaction[] = [
    {
      id: 's1',
      receiptNo: 'REC-001',
      timestamp: new Date().toISOString(),
      customerId: 'c1',
      customerName: 'Alice',
      cashierId: 'u1',
      cashierName: 'Bob',
      items: [
        {
          product: inventory[0],
          quantity: 4,
          unitPrice: 100,
          discountType: 'percentage',
          discountValue: 0,
          total: 400,
        },
      ],
      subtotal: 400,
      overallDiscountType: 'percentage',
      overallDiscountValue: 0,
      extraCharges: [],
      taxAmount: 0,
      netTotal: 400,
      payments: [{ method: 'Cash', amount: 400 }],
      amountPaid: 400,
      debtAmount: 0,
      status: 'completed',
    },
  ];

  const expenses: ExpenseItem[] = [
    {
      id: 'e1',
      title: 'Office Internet',
      category: 'Utilities',
      amount: 60,
      date: '2026-10-15',
      vendorName: 'FiberISP',
      paymentMethod: 'Bank Transfer',
      description: 'Monthly connection',
    },
  ];

  const result = calculateFinancialHealth(sales, expenses, inventory);
  assert.equal(result.grossRevenue, 400);
  assert.equal(result.cogs, 200); // 4 * 50
  assert.equal(result.grossProfit, 200); // 400 - 200
  assert.equal(result.totalExpenses, 60);
  assert.equal(result.netProfit, 140); // 200 - 60
  assert.equal(result.netProfitMarginPercent, 35); // 140 / 400 * 100
  assert.equal(result.isProfitable, true);
  assert.equal(result.inventoryValuation, 1000); // 20 * 50
});

test('calculateProductProfitMargin detects profit, break-even, and selling at a loss', () => {
  // Scenario 1: Profitable
  const p1 = calculateProductProfitMargin(60, 100);
  assert.equal(p1.diffAmount, 40);
  assert.equal(p1.marginPercent, 40);
  assert.equal(p1.isLoss, false);
  assert.equal(p1.isBreakEven, false);

  // Scenario 2: Break-even
  const p2 = calculateProductProfitMargin(50, 50);
  assert.equal(p2.diffAmount, 0);
  assert.equal(p2.marginPercent, 0);
  assert.equal(p2.isLoss, false);
  assert.equal(p2.isBreakEven, true);

  // Scenario 3: Selling at a Loss
  const p3 = calculateProductProfitMargin(120, 90);
  assert.equal(p3.diffAmount, -30);
  assert.equal(p3.marginPercent, -33.3);
  assert.equal(p3.isLoss, true);
  assert.equal(p3.isBreakEven, false);
});

test('generateUniqueInventoryId generates unique read-only IDs without colliding', () => {
  const existing = ['ITEM-2026-1001', 'ITEM-2026-1002'];
  const generated = generateUniqueInventoryId(existing, 'ITEM-2026');
  assert.ok(generated.startsWith('ITEM-2026-'));
  assert.ok(!existing.includes(generated));
});

