import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLineItemTotal, calculateCartTotals, calculatePaymentsAndDebt, calculateFinancialHealth, calculateProductProfitMargin } from '../src/utils/calculations.ts';
import { exportToCSV, parseCSV, printPDFReport } from '../src/utils/exportUtils.ts';

// Read-only regression checks. No app data, network, credentials, or real payment APIs.
const product: any = { id: 'qa-item', name: 'QA Fixture', type: 'product', costPrice: 50, sellingPrice: 100, stock: 10 };
const item = (quantity = 1, unitPrice = 100, total = quantity * unitPrice): any => ({ product: { ...product }, quantity, unitPrice, total, discountType: 'percentage', discountValue: 0 });

function captureCSV(data: Record<string, any>[]): string {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  let href = '';
  const link = { setAttribute: (name: string, value: string) => { if (name === 'href') href = value; }, click: () => {} };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: () => link, body: { appendChild: () => {}, removeChild: () => {} } } });
  try {
    exportToCSV(data, 'qa-only');
    return decodeURIComponent(href.split(',').slice(1).join(','));
  } finally {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete (globalThis as any).document;
  }
}

test('Line total clamps negative quantities to zero', () => {
  assert.equal(calculateLineItemTotal(100, -3).total, 0);
});
test('Line total clamps negative unit prices to zero', () => {
  assert.equal(calculateLineItemTotal(-100, 3).total, 0);
});
test('Percentage discount above 100 cannot create a negative sale', () => {
  assert.equal(calculateLineItemTotal(100, 2, 'percentage', 150).total, 0);
});
test('Fixed discount above subtotal is capped', () => {
  assert.equal(calculateLineItemTotal(50, 2, 'fixed', 999).discount, 100);
});
test('Negative line discount does not increase the pure utility total', () => {
  assert.equal(calculateLineItemTotal(50, 2, 'percentage', -10).total, 100);
});
test('Empty cart totals are all zero', () => {
  assert.ok(Object.values(calculateCartTotals([])).every(value => value === 0));
});
test('Fractional money is rounded to two decimal places', () => {
  assert.equal(calculateLineItemTotal(0.1, 3).total, 0.3);
});
test('Cart-wide fixed discount cannot exceed the discounted subtotal', () => {
  assert.equal(calculateCartTotals([item()], 'fixed', 999).netTotal, 0);
});
test('Negative extra charges cannot reduce the total', () => {
  assert.equal(calculateCartTotals([item()], 'percentage', 0, [{ id: 'qa', reason: 'Delivery', amount: -50 }]).netTotal, 100);
});
test('Tax uses discounted merchandise and not delivery charges', () => {
  const total = calculateCartTotals([item(1, 100, 90)], 'percentage', 10, [{ id: 'qa', reason: 'Delivery', amount: 10 }], 16);
  assert.equal(total.taxAmount, 12.96);
  assert.equal(total.netTotal, 103.96);
});
test('Cash and M-Pesa split reconcile exactly', () => {
  const paid = calculatePaymentsAndDebt(89, [{ method: 'Cash', amount: 20 }, { method: 'M-Pesa', amount: 69 }]);
  assert.equal(paid.remainingDebt, 0);
  assert.equal(paid.isFullyPaid, true);
});
test('Overpayment reports change rather than negative debt', () => {
  const paid = calculatePaymentsAndDebt(89, [{ method: 'Cash', amount: 100 }]);
  assert.equal(paid.changeDue, 11);
  assert.equal(paid.remainingDebt, 0);
});
test('Negative payments are excluded from reconciliation', () => {
  assert.equal(calculatePaymentsAndDebt(100, [{ method: 'Cash', amount: -5 }]).totalPaid, 0);
});
test('Zero revenue has a finite zero margin', () => {
  const report = calculateFinancialHealth([], [], []);
  assert.equal(report.netProfitMarginPercent, 0);
  assert.equal(Number.isFinite(report.netProfitMarginPercent), true);
});
test('Zero selling price reports a loss without divide-by-zero', () => {
  const margin = calculateProductProfitMargin(50, 0);
  assert.equal(margin.marginPercent, -100);
  assert.equal(margin.isLoss, true);
});
test('CSV round-trip preserves commas and quotation marks', () => {
  const records = [{ name: 'Widget, large', notes: 'A "quoted" description' }];
  assert.deepEqual(parseCSV(captureCSV(records)), records);
});

// The remaining checks intentionally enforce release criteria; failures are open defects.
test('[QA-CSV-01] CSV round-trip preserves quoted multiline fields', () => {
  const records = [{ name: 'Widget', notes: 'Line one\nLine two' }];
  assert.deepEqual(parseCSV(captureCSV(records)), records);
});
test('[QA-CSV-02] CSV neutralizes formula-like user content', () => {
  const csv = captureCSV([{ customer: '=1+1' }]);
  assert.ok(csv.includes("\"'=1+1\""), 'Formula-like values must be neutralized, e.g. with a leading apostrophe.');
});
test('[QA-SEC-03] Printable reports escape user-provided HTML', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  let html = '';
  const fakeWindow = { document: { open: () => {}, write: (value: string) => { html = value; }, close: () => {} } };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { open: () => fakeWindow } });
  try {
    printPDFReport('QA report', { name: 'QA Company' } as any, [{ header: 'Name', dataKey: 'name' }], [{ name: '<em data-qa="inert">Customer</em>' }]);
    assert.ok(html.includes('&lt;em'), 'An inert HTML marker was interpolated as markup instead of escaped text.');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else delete (globalThis as any).window;
  }
});
test('[QA-FIN-01] Historical COGS stays fixed when inventory cost changes', () => {
  const historicalSale: any = { netTotal: 400, items: [item(4)] };
  const currentInventory: any[] = [{ ...product, costPrice: 80 }];
  const financial = calculateFinancialHealth([historicalSale], [], currentInventory);
  assert.equal(financial.cogs, 200, 'Four units sold at a recorded cost of 50 should retain COGS 200, not use current replacement cost 80.');
});
