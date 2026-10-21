import type {PaymentMethod,SaleTransaction} from '../types/index.ts';
import {PAYMENT_METHODS,canonicalPaymentMethod} from '../config/paymentMethods.ts';
export interface DebtPaymentRecord {id:string;amount:number;method:PaymentMethod;reference:string;timestamp:string;recordedBy:string;balanceBefore:number;balanceAfter:number}
export interface DebtPaymentOptions {paymentId?:string;reference?:string;recordedBy?:string;timestamp?:string}
const toCents=(n:number)=>{if(!Number.isFinite(n)||n<0||!Number.isSafeInteger(Math.round(n*100)))throw new Error('The amount is outside the supported range.');return Math.round(n*100);};
export function outstandingBalance(sale:SaleTransaction):number {
 const total=toCents(sale.netTotal),paid=toCents(sale.amountPaid),stored=toCents(sale.debtAmount);
 const remaining=Math.max(0,total-paid);
 if(Math.abs(stored-remaining)>1)throw new Error('This historical balance disagrees with its total/amount paid. Review the source record before collecting another payment.');
 return remaining/100;
}
/** Validate first, then return a new immutable transaction. No funds are moved. */
export function applyDebtPayment(sale:SaleTransaction,amount:number,method:string,options:DebtPaymentOptions={}):{sale:SaleTransaction;payment:DebtPaymentRecord;duplicate:boolean}{
 const id=options.paymentId||crypto.randomUUID();const previous=sale.debtPayments?.find(payment=>payment.id===id);
 if(previous)return {sale,payment:previous,duplicate:true};
 const remaining=outstandingBalance(sale),cents=toCents(amount);
 if(cents<=0)throw new Error('Enter a paid amount greater than zero.');
 if(remaining<=0)throw new Error('This transaction has no outstanding debt.');
 if(cents>toCents(remaining))throw new Error('Payment cannot exceed the current outstanding balance.');
 if(!PAYMENT_METHODS.includes(method as PaymentMethod)&&method!=='Card'&&method!=='Bank Wire')throw new Error('Select a supported payment channel.');
 const channel=canonicalPaymentMethod(method);if(channel==='Credit / Debt')throw new Error('Credit/debt cannot repay an existing debt. Select an actual payment channel.');
 const reference=(options.reference||'').trim();if(reference.length>120)throw new Error('Keep the payment reference within 120 characters.');
 const timestamp=options.timestamp||new Date().toISOString();if(!Number.isFinite(Date.parse(timestamp)))throw new Error('The payment timestamp is invalid.');
 const paid=(toCents(sale.amountPaid)+cents)/100,balanceAfter=(toCents(remaining)-cents)/100;
 const payment:DebtPaymentRecord={id,amount:cents/100,method:channel,reference,timestamp,recordedBy:options.recordedBy||'User',balanceBefore:remaining,balanceAfter};
 return {duplicate:false,payment,sale:{...sale,amountPaid:paid,debtAmount:balanceAfter,status:balanceAfter===0?'completed':'debt_partial',debtSettledDate:balanceAfter===0?timestamp:undefined,payments:[...sale.payments,{method:channel,amount:cents/100,referenceNo:reference||undefined}],debtPayments:[...(sale.debtPayments||[]),payment]}};
}

// ---------------------------------------------------------------------------
// Receivables aging & statements (bookkeeping only; no funds move).
// ---------------------------------------------------------------------------
export type DebtAgingBucket = 'current' | 'due_soon' | 'overdue_1_30' | 'overdue_31_60' | 'overdue_61_plus' | 'no_due_date';

export const DEBT_AGING_BUCKETS: { id: DebtAgingBucket; label: string; description: string; tone: 'emerald' | 'sky' | 'amber' | 'rose' | 'slate' }[] = [
  { id: 'current', label: 'Current', description: 'Due in more than 7 days.', tone: 'emerald' },
  { id: 'due_soon', label: 'Due within 7 days', description: 'An agreed due date is approaching.', tone: 'sky' },
  { id: 'overdue_1_30', label: '1–30 days overdue', description: 'Past the agreed due date.', tone: 'amber' },
  { id: 'overdue_31_60', label: '31–60 days overdue', description: 'Needs a follow-up call.', tone: 'rose' },
  { id: 'overdue_61_plus', label: 'Over 60 days overdue', description: 'Escalate for review.', tone: 'rose' },
  { id: 'no_due_date', label: 'No due date', description: 'No credit terms were recorded.', tone: 'slate' },
];

const DAY_MS = 86_400_000;
const startOfDay = (value: string) => Date.parse(`${value.slice(0, 10)}T00:00:00Z`);

/** Days past the agreed due date (negative = still to come). */
export function daysPastDue(sale: Pick<SaleTransaction, 'debtDueDate'>, todayISO: string): number | null {
  if (!sale.debtDueDate || !/^\d{4}-\d{2}-\d{2}$/.test(sale.debtDueDate)) return null;
  const due = startOfDay(sale.debtDueDate);
  const today = startOfDay(todayISO);
  if (!Number.isFinite(due) || !Number.isFinite(today)) return null;
  return Math.round((today - due) / DAY_MS);
}

export function debtAgingBucket(sale: Pick<SaleTransaction, 'debtAmount' | 'debtDueDate'>, todayISO: string): DebtAgingBucket | null {
  if (!(sale.debtAmount > 0)) return null;
  const days = daysPastDue(sale, todayISO);
  if (days === null) return 'no_due_date';
  if (days <= 0) return Math.abs(days) <= 7 ? 'due_soon' : 'current';
  if (days <= 30) return 'overdue_1_30';
  if (days <= 60) return 'overdue_31_60';
  return 'overdue_61_plus';
}

export interface ReceivablesSummary {
  outstanding: number;
  count: number;
  overdueAmount: number;
  overdueCount: number;
  dueSoonAmount: number;
  noDueDateAmount: number;
  averageBalance: number;
  buckets: Record<DebtAgingBucket, { amount: number; count: number }>;
  customers: { name: string; amount: number; count: number }[];
}

export function receivablesSummary(sales: SaleTransaction[], todayISO: string): ReceivablesSummary {
  const buckets = Object.fromEntries(DEBT_AGING_BUCKETS.map((entry) => [entry.id, { amount: 0, count: 0 }])) as ReceivablesSummary['buckets'];
  const customerMap = new Map<string, { name: string; amount: number; count: number }>();
  let outstanding = 0; let count = 0; let overdueAmount = 0; let overdueCount = 0; let dueSoonAmount = 0; let noDueDateAmount = 0;
  for (const sale of sales) {
    const balance = Math.max(0, Number(sale.debtAmount) || 0);
    if (balance <= 0) continue;
    const bucket = debtAgingBucket({ debtAmount: balance, debtDueDate: sale.debtDueDate }, todayISO);
    if (!bucket) continue;
    outstanding += balance; count += 1;
    buckets[bucket].amount += balance; buckets[bucket].count += 1;
    if (bucket === 'due_soon') dueSoonAmount += balance;
    if (bucket === 'no_due_date') noDueDateAmount += balance;
    if (bucket.startsWith('overdue')) { overdueAmount += balance; overdueCount += 1; }
    const name = sale.customerName || 'Walk-in Customer';
    const existing = customerMap.get(name) || { name, amount: 0, count: 0 };
    existing.amount += balance; existing.count += 1;
    customerMap.set(name, existing);
  }
  const customers = [...customerMap.values()].sort((a, b) => b.amount - a.amount);
  return {
    outstanding: Math.round(outstanding * 100) / 100,
    count,
    overdueAmount: Math.round(overdueAmount * 100) / 100,
    overdueCount,
    dueSoonAmount: Math.round(dueSoonAmount * 100) / 100,
    noDueDateAmount: Math.round(noDueDateAmount * 100) / 100,
    averageBalance: count ? Math.round((outstanding / count) * 100) / 100 : 0,
    buckets,
    customers,
  };
}

/** Plain-text customer statement suitable for TXT download, email or WhatsApp. */
export function buildCustomerStatement(input: {
  customerName: string;
  sales: SaleTransaction[];
  companyName: string;
  currency: string;
  issuedAt: string;
  credit?: string;
}): string {
  const rows = input.sales.filter((sale) => (sale.debtAmount || 0) > 0);
  const total = rows.reduce((sum, sale) => sum + sale.debtAmount, 0);
  const line = '-'.repeat(46);
  const out: string[] = [];
  out.push(`${input.companyName} — CUSTOMER STATEMENT`);
  out.push(`Customer: ${input.customerName}`);
  out.push(`Issued: ${input.issuedAt}`);
  out.push(line);
  out.push('Receipt      Issued        Total        Paid       Balance    Due');
  for (const sale of rows) {
    out.push(`${sale.receiptNo.padEnd(12)} ${sale.timestamp.slice(0, 10).padEnd(12)} ${sale.netTotal.toFixed(2).padStart(10)} ${sale.amountPaid.toFixed(2).padStart(10)} ${sale.debtAmount.toFixed(2).padStart(10)} ${(sale.debtDueDate || '—').padEnd(10)}`);
  }
  out.push(line);
  out.push(`Open receipts: ${rows.length}`);
  out.push(`Outstanding balance: ${input.currency} ${total.toFixed(2)}`);
  out.push('');
  out.push('This statement lists records saved in this browser workspace. It is not a bank statement,');
  out.push('a payment demand or evidence that funds were received. Review it before sharing.');
  if (input.credit) { out.push(''); out.push(input.credit); }
  return `${out.join('\n')}\n`;
}
