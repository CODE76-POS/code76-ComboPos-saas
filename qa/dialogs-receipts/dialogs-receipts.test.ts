import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appDialogs,
  getDialogSnapshot,
  subscribeToDialogs,
} from '../../src/utils/appDialogs.ts';
import { buildReceiptDocument, receiptShareMessage } from '../../src/utils/receiptDocument.ts';
import {
  DATASET_DEFINITIONS,
  DATASET_KEYS,
  countSelectedDatasets,
  describeSelection,
  expandedSelection,
  type DatasetCounts,
} from '../../src/utils/dataDeletion.ts';
import { buildCustomerStatement, debtAgingBucket, receivablesSummary } from '../../src/utils/debt.ts';
import { normalizePrivileges, privilegeValue } from '../../src/utils/privileges.ts';
import { INITIAL_SETTINGS } from '../../src/data/initialData.ts';
import type { SaleTransaction } from '../../src/types/index.ts';

const sale = (patch: Partial<SaleTransaction> = {}): SaleTransaction => ({
  id: 'TEST-sale', receiptNo: 'REC-TEST-1', timestamp: '2026-10-20T10:00:00.000Z',
  customerId: 'c1', customerName: 'TEST Customer', customerContact: '+254700000000',
  cashierId: 'u1', cashierName: 'TEST Cashier',
  items: [{
    product: { id: 'p1', name: 'TEST Service', type: 'service', serviceUnit: 'day', costPrice: 20, sellingPrice: 100, stock: 0 } as any,
    quantity: 2, unitPrice: 100, discountType: 'percentage', discountValue: 0, total: 200,
  }],
  subtotal: 200, overallDiscountType: 'percentage', overallDiscountValue: 0, extraCharges: [],
  taxAmount: 0, netTotal: 200, payments: [{ method: 'Cash', amount: 150 }], amountPaid: 150,
  debtAmount: 50, debtDueDate: '2026-09-01', status: 'debt_partial', ...patch,
});

const company: any = {
  name: 'TEST Shop', slogan: 'QA only', address: '1 Test Road', location: 'Nairobi',
  country: 'Kenya', tel1: '+254700000000', email: 'qa@example.test', taxPin: 'TESTPIN',
  currency: 'KES', isDemo: true, isConfiguredByMerchant: true,
};

test('dialogs queue in order and resolve through the in-app host', async () => {
  appDialogs.reset();
  const seen = new Set<string>();
  const unsubscribe = subscribeToDialogs(() => {
    const active = getDialogSnapshot().queue[0];
    if (active) seen.add(active.kind);
  });
  const first = appDialogs.alert({ title: 'One', message: 'first' });
  const second = appDialogs.confirm({ title: 'Two', message: 'second' });
  assert.equal(getDialogSnapshot().queue.length, 2);
  appDialogs.settle(getDialogSnapshot().queue[0].id, true);
  await first;
  assert.equal(getDialogSnapshot().queue.length, 1);
  appDialogs.settle(getDialogSnapshot().queue[0].id, false);
  assert.equal(await second, false);
  unsubscribe();
  assert.deepEqual([...seen].sort(), ['alert', 'confirm']);
  appDialogs.reset();
});

test('choice dialogs resolve with an action id and prompts with text', async () => {
  appDialogs.reset();
  const choice = appDialogs.choice({
    title: 'Share receipt?',
    message: 'Pick one',
    actions: [{ id: 'send', label: 'Send' }, { id: 'download', label: 'Download' }],
  });
  appDialogs.settle(getDialogSnapshot().queue[0].id, 'download');
  assert.equal(await choice, 'download');

  const prompt = appDialogs.prompt({ title: 'Name', message: 'Type a name', defaultValue: 'QA' });
  appDialogs.settle(getDialogSnapshot().queue[0].id, 'TEST name');
  assert.equal(await prompt, 'TEST name');
  appDialogs.reset();
});

test('toasts are dismissible and never require a browser notification permission', () => {
  appDialogs.reset();
  const id = appDialogs.toast('Saved locally', 'success', 0);
  assert.equal(getDialogSnapshot().toasts.length, 1);
  appDialogs.dismissToast(id);
  assert.equal(getDialogSnapshot().toasts.length, 0);
});

test('receipt document builds text, CSV, JSON and HTML with honest totals', () => {
  const document = buildReceiptDocument({ sale: sale(), company, settings: INITIAL_SETTINGS });
  assert.match(document.text, /TEST Shop/);
  assert.match(document.text, /REC-TEST-1/);
  assert.match(document.text, /Per day/);
  assert.match(document.text, /Balance \(debt\)/);
  assert.match(document.text, /Website created by CODE76/);
  assert.equal(document.totals.netTotal, 200);
  assert.equal(document.totals.debt, 50);
  assert.ok(document.csv.includes('TEST Service'));
  const parsed = JSON.parse(document.json);
  assert.equal(parsed.totals.currency, 'KES');
  assert.equal(parsed.items[0].serviceUnit, 'day');
  assert.equal(parsed._code76.credit, 'Website created by CODE76.');
  assert.match(document.html, /<!doctype html>/i);
  assert.match(document.fileNameBase, /receipt/);
});

test('receipt message template replaces documented tokens only', () => {
  const message = receiptShareMessage(
    { sale: sale(), company, settings: INITIAL_SETTINGS },
    'Hi {customer}, {receipt} at {company} totals {currency} {total} on {date}.',
  );
  assert.match(message, /Hi TEST Customer/);
  assert.match(message, /REC-TEST-1/);
  assert.match(message, /TEST Shop/);
  assert.match(message, /KES 200\.00/);
  assert.ok(!message.includes('{'));
});

test('platform deletion registry counts, describes and preserves untouched keys', () => {
  const counts = Object.fromEntries(DATASET_KEYS.map((key) => [key, key === 'products' ? 3 : key === 'sales' ? 5 : 0])) as unknown as DatasetCounts;
  assert.equal(countSelectedDatasets(['products', 'sales'], counts), 8);
  assert.equal(DATASET_DEFINITIONS.length, DATASET_KEYS.length);
  assert.match(describeSelection(['products']), /Inventory & services/);
  assert.match(describeSelection(DATASET_KEYS), /Every platform database/);
  assert.deepEqual(expandedSelection(['products']), ['products']);
  for (const definition of DATASET_DEFINITIONS) {
    assert.ok(definition.description.length > 20);
    assert.ok(['low', 'medium', 'high'].includes(definition.risk));
  }
});

test('debt aging buckets classify due dates without inventing terms', () => {
  const today = '2026-10-20';
  assert.equal(debtAgingBucket({ debtAmount: 10, debtDueDate: '2026-10-25' }, today), 'due_soon');
  assert.equal(debtAgingBucket({ debtAmount: 10, debtDueDate: '2026-12-25' }, today), 'current');
  assert.equal(debtAgingBucket({ debtAmount: 10, debtDueDate: '2026-10-10' }, today), 'overdue_1_30');
  assert.equal(debtAgingBucket({ debtAmount: 10, debtDueDate: '2026-09-10' }, today), 'overdue_31_60');
  assert.equal(debtAgingBucket({ debtAmount: 10, debtDueDate: '2026-01-10' }, today), 'overdue_61_plus');
  assert.equal(debtAgingBucket({ debtAmount: 10 }, today), 'no_due_date');
  assert.equal(debtAgingBucket({ debtAmount: 0, debtDueDate: '2026-01-10' }, today), null);
});

test('receivables summary totals only open balances and ranks customers', () => {
  const summary = receivablesSummary([
    sale({ id: 'a', debtAmount: 50, debtDueDate: '2026-09-01' }),
    sale({ id: 'b', debtAmount: 25, debtDueDate: '2026-12-01', customerName: 'TEST Other' }),
    sale({ id: 'c', debtAmount: 0, debtDueDate: '2026-01-01' }),
  ], '2026-10-20');
  assert.equal(summary.outstanding, 75);
  assert.equal(summary.count, 2);
  assert.equal(summary.overdueAmount, 50);
  assert.equal(summary.overdueCount, 1);
  assert.equal(summary.customers[0].name, 'TEST Customer');
  assert.equal(summary.buckets.overdue_31_60.amount, 50);
  assert.equal(summary.buckets.current.amount, 25);
});

test('customer statement lists open receipts and disclaims bank settlement', () => {
  const text = buildCustomerStatement({
    customerName: 'TEST Customer', sales: [sale()], companyName: 'TEST Shop',
    currency: 'KES', issuedAt: '20/10/2026 12:00', credit: 'Website created by CODE76',
  });
  assert.match(text, /CUSTOMER STATEMENT/);
  assert.match(text, /REC-TEST-1/);
  assert.match(text, /Outstanding balance: KES 50\.00/);
  assert.match(text, /not a bank statement/);
  assert.match(text, /Website created by CODE76/);
});

test('legacy privileges fall back and new roles receive complete records', () => {
  const normalized = normalizePrivileges({
    Cashier: { canSell: true, canViewInventory: true, canEditInventory: false, canViewExpenses: false, canEditExpenses: false, canViewInvoices: true, canViewAnalytics: false, canManagePeople: false, canExportPdf: false, canImportCsv: false, canViewAuditLogs: false, canModifySettings: false },
  } as any);
  assert.equal(privilegeValue(normalized.Cashier, 'canSendReceipts'), true); // falls back to canSell
  assert.equal(privilegeValue(normalized.Cashier, 'canSettleDebt'), true); // falls back to canViewInvoices
  assert.equal(privilegeValue(normalized.Cashier, 'canDeleteData'), false); // falls back to canModifySettings
  assert.equal(typeof normalized.Manager.canSell, 'boolean');
  assert.equal(Object.keys(normalized).length >= 20, true);
});
