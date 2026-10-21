import { CODE76_BRAND, CODE76_CREDIT_TEXT, withExportCredit } from '../config/code76Brand.ts';
import { serializeCsvRows } from './csv.ts';
import { dateTime } from './regional.ts';
import { serviceUnitLabel } from './serviceUnits.ts';
import type { AppSettings, CompanyData, ReceiptFormat, SaleTransaction } from '../types/index.ts';

export interface ReceiptDocumentInput {
  sale: SaleTransaction;
  company: CompanyData;
  settings: AppSettings;
}

export interface ReceiptDocument {
  fileNameBase: string;
  /** 42-column plain-text receipt, also reused by SMS/WhatsApp sharing. */
  text: string;
  csv: string;
  json: string;
  html: string;
  /** Plain wrapped lines used by the client-side PDF renderer. */
  lines: string[];
  totals: { subtotal: number; discount: number; tax: number; extras: number; netTotal: number; amountPaid: number; debt: number };
}

export const money = (amount: number, currency: string) => `${currency} ${Number(amount || 0).toFixed(2)}`;
const pad = (value: string, width: number) => value.length <= width ? value.padEnd(width, ' ') : `${value.slice(0, width - 1)}…`;

function discountLabel(sale: SaleTransaction): number {
  const lineDiscounts = sale.items.reduce((sum, item) => {
    const gross = item.unitPrice * item.quantity;
    return sum + Math.max(0, gross - item.total);
  }, 0);
  const cartDiscount = sale.overallDiscountType === 'percentage'
    ? sale.subtotal * (Math.min(100, Math.max(0, sale.overallDiscountValue)) / 100)
    : Math.min(sale.subtotal, Math.max(0, sale.overallDiscountValue));
  return Math.round((lineDiscounts + cartDiscount) * 100) / 100;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}

export function buildReceiptDocument({ sale, company, settings }: ReceiptDocumentInput): ReceiptDocument {
  const currency = company.currency || settings.payments.defaultCurrency || 'USD';
  const issued = dateTime(sale.timestamp, settings);
  const extras = sale.extraCharges.reduce((sum, charge) => sum + Math.max(0, charge.amount), 0);
  const discount = discountLabel(sale);
  const totals = {
    subtotal: sale.subtotal,
    discount,
    tax: sale.taxAmount,
    extras,
    netTotal: sale.netTotal,
    amountPaid: sale.amountPaid,
    debt: sale.debtAmount,
  };
  const safeName = (company.name || 'business').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'business';
  const fileNameBase = `${safeName}-receipt-${sale.receiptNo.replace(/[^a-z0-9]+/gi, '-')}`;

  // ----- plain text (42 columns) -----
  const row = (left: string, right: string, width = 42) => `${left}${' '.repeat(Math.max(1, width - left.length - right.length))}${right}`;
  const textLines: string[] = [];
  const rule = '-'.repeat(42);
  textLines.push(settings.receipts.headerTitle || company.name || 'RECEIPT');
  textLines.push(company.name || '');
  if (company.slogan) textLines.push(company.slogan);
  if (company.address || company.location) textLines.push([company.address, company.location, company.country].filter(Boolean).join(', '));
  if (company.tel1) textLines.push(`Tel: ${company.tel1}`);
  if (company.email) textLines.push(company.email);
  if (settings.receipts.showTaxPin && company.taxPin) textLines.push(`TAX PIN: ${company.taxPin}`);
  textLines.push(rule);
  textLines.push(row('Receipt', sale.receiptNo));
  textLines.push(row('Issued', issued));
  textLines.push(row('Cashier', sale.cashierName || 'Cashier'));
  textLines.push(row('Customer', sale.customerName || 'Walk-in Customer'));
  if (sale.customerContact) textLines.push(row('Contact', sale.customerContact));
  if (sale.debtDueDate) textLines.push(row('Due date', sale.debtDueDate));
  textLines.push(rule);
  sale.items.forEach((item) => {
    textLines.push(item.product.name);
    if (item.product.type === 'service' && item.product.serviceUnit) textLines.push(`  (${serviceUnitLabel(item.product)})`);
    textLines.push(row(`  ${item.quantity} x ${money(item.unitPrice, currency)}`, money(item.total, currency)));
    if (item.discountValue > 0) textLines.push(`  Discount applied: ${item.discountType === 'percentage' ? `${item.discountValue}%` : money(item.discountValue, currency)}`);
  });
  textLines.push(rule);
  textLines.push(row('Subtotal', money(totals.subtotal, currency)));
  if (totals.discount > 0) textLines.push(row('Discounts', `-${money(totals.discount, currency)}`));
  if (totals.tax > 0) textLines.push(row(`Tax (${settings.payments.taxRatePercentage}%)`, money(totals.tax, currency)));
  sale.extraCharges.forEach((charge) => textLines.push(row(`Extra (${charge.reason})`, `+${money(charge.amount, currency)}`)));
  textLines.push(row('TOTAL', money(totals.netTotal, currency)));
  textLines.push(rule);
  sale.payments.filter((payment) => payment.method !== 'Credit / Debt').forEach((payment) => {
    textLines.push(row(`${payment.method}${payment.referenceNo ? ` (${payment.referenceNo})` : ''}`, money(payment.amount, currency)));
  });
  textLines.push(row('Amount paid', money(totals.amountPaid, currency)));
  if (totals.debt > 0) textLines.push(row('Balance (debt)', money(totals.debt, currency)));
  textLines.push(rule);
  if (settings.receipts.paymentInstructions) textLines.push(...wrap(settings.receipts.paymentInstructions, 42));
  if (settings.receipts.footerNotice) textLines.push(...wrap(settings.receipts.footerNotice, 42));
  if (settings.receipts.returnPolicy) textLines.push(...wrap(settings.receipts.returnPolicy, 42));
  textLines.push('');
  textLines.push(...wrap(CODE76_CREDIT_TEXT, 42));
  const text = `${textLines.join('\n')}\n`;

  // ----- CSV -----
  const csvRows = sale.items.map((item, index) => withExportCredit({
    receiptNo: sale.receiptNo,
    line: index + 1,
    item: item.product.name,
    type: item.product.type,
    serviceUnit: item.product.serviceUnit || '',
    quantity: item.quantity,
    unitPrice: item.unitPrice.toFixed(2),
    discountType: item.discountType,
    discountValue: item.discountValue,
    lineTotal: item.total.toFixed(2),
    currency,
    issued,
    customer: sale.customerName || 'Walk-in Customer',
    subtotal: totals.subtotal.toFixed(2),
    tax: totals.tax.toFixed(2),
    netTotal: totals.netTotal.toFixed(2),
    amountPaid: totals.amountPaid.toFixed(2),
    debt: totals.debt.toFixed(2),
  }));
  const csvHeaders = Object.keys(csvRows[0] || {});
  const csv = serializeCsvRows(
    csvHeaders,
    csvRows.map((record) => csvHeaders.map((header) => (record as Record<string, unknown>)[header])),
  );

  // ----- JSON -----
  const json = `${JSON.stringify({
    receiptNo: sale.receiptNo,
    issued,
    merchant: {
      name: company.name, slogan: company.slogan, address: company.address, location: company.location,
      country: company.country, tel: company.tel1, email: company.email, taxPin: settings.receipts.showTaxPin ? company.taxPin : '',
    },
    customer: { name: sale.customerName, contact: sale.customerContact || '' },
    cashier: sale.cashierName,
    items: sale.items.map((item) => ({
      name: item.product.name, type: item.product.type, serviceUnit: item.product.serviceUnit || null,
      quantity: item.quantity, unitPrice: item.unitPrice, discountType: item.discountType,
      discountValue: item.discountValue, total: item.total,
    })),
    totals: { ...totals, currency },
    payments: sale.payments,
    debtPayments: sale.debtPayments || [],
    status: sale.status,
    _code76: { credit: CODE76_BRAND.credit, email: CODE76_BRAND.email, youtube: CODE76_BRAND.youtube, cta: CODE76_BRAND.cta },
  }, null, 2)}\n`;

  // ----- HTML -----
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(sale.receiptNo)} · ${escapeHtml(company.name)}</title>
<style>
 @page{size:80mm auto;margin:6mm}body{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#111;max-width:420px;margin:0 auto;padding:16px}
 h1{font-size:15px;text-align:center;margin:0 0 4px}h2{font-size:12px;text-align:center;margin:0;color:#555}
 .muted{color:#666}.rule{border-top:1px dashed #999;margin:8px 0}.row{display:flex;justify-content:space-between;gap:8px}
 table{width:100%;border-collapse:collapse;font-size:11px}td,th{padding:3px 0;text-align:left}th:last-child,td:last-child{text-align:right}
 .total{font-size:14px;font-weight:700}.debt{color:#b91c1c;font-weight:700}.credit{margin-top:16px;border-top:1px solid #ccc;padding-top:8px;font-size:9px;color:#555}
 .actions{display:flex;gap:8px;margin-bottom:12px}button{padding:8px 12px;border:0;border-radius:6px;background:#0f766e;color:#fff;font-weight:700;cursor:pointer}
 @media print{.actions{display:none}}
</style></head><body>
<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
<h1>${escapeHtml(settings.receipts.headerTitle || company.name)}</h1>
<h2>${escapeHtml(company.name)}${company.slogan ? ` · ${escapeHtml(company.slogan)}` : ''}</h2>
<p class="muted" style="text-align:center;margin:4px 0">${escapeHtml([company.address, company.location, company.country].filter(Boolean).join(', '))}<br/>${escapeHtml(company.tel1)} ${company.email ? `· ${escapeHtml(company.email)}` : ''}${settings.receipts.showTaxPin && company.taxPin ? `<br/>TAX PIN: ${escapeHtml(company.taxPin)}` : ''}</p>
<div class="rule"></div>
<div class="row"><span class="muted">Receipt</span><strong>${escapeHtml(sale.receiptNo)}</strong></div>
<div class="row"><span class="muted">Issued</span><span>${escapeHtml(issued)}</span></div>
<div class="row"><span class="muted">Cashier</span><span>${escapeHtml(sale.cashierName)}</span></div>
<div class="row"><span class="muted">Customer</span><span>${escapeHtml(sale.customerName || 'Walk-in Customer')}</span></div>
<div class="rule"></div>
<table><thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead><tbody>
${sale.items.map((item) => `<tr><td>${escapeHtml(item.product.name)}${item.product.type === 'service' && item.product.serviceUnit ? `<br/><span class="muted">${escapeHtml(serviceUnitLabel(item.product))}</span>` : ''}</td><td>${item.quantity}</td><td>${escapeHtml(money(item.total, currency))}</td></tr>`).join('')}
</tbody></table>
<div class="rule"></div>
<div class="row"><span>Subtotal</span><span>${escapeHtml(money(totals.subtotal, currency))}</span></div>
${totals.discount > 0 ? `<div class="row"><span>Discounts</span><span>-${escapeHtml(money(totals.discount, currency))}</span></div>` : ''}
${totals.tax > 0 ? `<div class="row"><span>Tax</span><span>${escapeHtml(money(totals.tax, currency))}</span></div>` : ''}
${sale.extraCharges.map((charge) => `<div class="row"><span>${escapeHtml(charge.reason)}</span><span>+${escapeHtml(money(charge.amount, currency))}</span></div>`).join('')}
<div class="row total"><span>Total</span><span>${escapeHtml(money(totals.netTotal, currency))}</span></div>
<div class="row"><span>Paid</span><span>${escapeHtml(money(totals.amountPaid, currency))}</span></div>
${totals.debt > 0 ? `<div class="row debt"><span>Balance</span><span>${escapeHtml(money(totals.debt, currency))}</span></div>` : ''}
<div class="rule"></div>
${settings.receipts.paymentInstructions ? `<p class="muted">${escapeHtml(settings.receipts.paymentInstructions)}</p>` : ''}
<p class="muted">${escapeHtml(settings.receipts.footerNotice)}<br/>${escapeHtml(settings.receipts.returnPolicy)}</p>
<div class="credit"><strong>${escapeHtml(CODE76_BRAND.credit)}</strong><br/>email: ${escapeHtml(CODE76_BRAND.email)}<br/>youtube: ${escapeHtml(CODE76_BRAND.youtube)}<br/>${escapeHtml(CODE76_BRAND.cta)}</div>
</body></html>`;

  // ----- PDF lines -----
  const lines = text.split('\n');

  return { fileNameBase, text, csv, json, html, lines, totals };
}

function wrap(value: string, width: number): string[] {
  const words = String(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current) current = word;
    else if (`${current} ${word}`.length <= width) current = `${current} ${word}`;
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines;
}

export function receiptShareMessage(
  { sale, company, settings }: ReceiptDocumentInput,
  template?: string,
): string {
  const currency = company.currency || settings.payments.defaultCurrency || 'USD';
  return (template || settings.receipts.sendMessageTemplate || '')
    .replaceAll('{customer}', sale.customerName || 'customer')
    .replaceAll('{company}', company.name || 'the business')
    .replaceAll('{receipt}', sale.receiptNo)
    .replaceAll('{total}', sale.netTotal.toFixed(2))
    .replaceAll('{currency}', currency)
    .replaceAll('{date}', dateTime(sale.timestamp, settings))
    .trim();
}

export function receiptFileName(document: ReceiptDocument, format: ReceiptFormat): string {
  const extension = format === 'pdf' ? 'pdf' : format;
  return `${document.fileNameBase}.${extension}`;
}

export const AVAILABLE_RECEIPT_FORMATS: ReceiptFormat[] = ['pdf', 'txt', 'csv', 'json', 'html'];
