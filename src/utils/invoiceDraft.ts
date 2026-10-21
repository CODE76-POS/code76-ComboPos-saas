import type { InvoiceItem } from '../types/index.ts';
/** Build totals from actual line items, not an unrelated placeholder total. */
export function invoiceDraftTotals(items: InvoiceItem['items'], tax: number, amountPaid: number) {
  if (!items.length || items.some(item => !item.description.trim() || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) throw new Error('Enter actual item descriptions, positive quantities and non-negative unit prices.');
  if (!Number.isFinite(tax) || tax < 0 || !Number.isFinite(amountPaid) || amountPaid < 0) throw new Error('Tax and amount paid must be non-negative numbers.');
  const lines = items.map(item => ({...item,total:Math.round(item.quantity*item.unitPrice*100)/100}));
  const subtotal = Math.round(lines.reduce((sum,item)=>sum+item.total,0)*100)/100;
  const total = Math.round((subtotal+tax)*100)/100;
  if (amountPaid > total) throw new Error('Amount paid cannot exceed the invoice total.');
  return { items:lines,subtotal,total,tax,amountPaid,status:amountPaid>=total?'paid' as const:'pending' as const };
}
