import type { ExpenseItem, PayBasis, PersonRecord, SalaryPayment, SalaryPaymentDraft } from '../types/index.ts';
import { directoryName, snapshotParty } from './directory.ts';
export const WEEK_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const PAY_BASES: { value: PayBasis; label: string }[] = [{value:'month',label:'Per month'},{value:'week',label:'Per week'},{value:'day',label:'Per day'},{value:'hour',label:'Per hour'},{value:'task',label:'Per completed task'},{value:'delivery',label:'Per delivery'},{value:'session',label:'Per session'},{value:'project',label:'Per project'}];
export const SHIFT_PRESETS = [
  { id: 'weekdays', label: 'Full day · weekdays', start: '08:00', end: '17:00', days: WEEK_DAYS.slice(0,5) },
  { id: 'morning', label: 'Half day · morning to noon', start: '08:00', end: '12:00', days: WEEK_DAYS.slice(0,5) },
  { id: 'afternoon', label: 'Half day · noon to evening', start: '12:00', end: '18:00', days: WEEK_DAYS.slice(0,5) },
  { id: 'night', label: 'Night shift · overnight', start: '18:00', end: '06:00', days: WEEK_DAYS.slice(0,5) },
  { id: 'weekends', label: 'Weekends only', start: '08:00', end: '17:00', days: WEEK_DAYS.slice(5) },
  { id: 'holidays', label: 'Holidays only', start: '08:00', end: '17:00', days: [] },
  { id: 'daily', label: 'Every day', start: '08:00', end: '17:00', days: WEEK_DAYS },
] as const;
export function applyShiftPreset(id: string) {
  const preset = SHIFT_PRESETS.find(p => p.id === id); if (!preset) throw new Error('Unknown shift preset.');
  return { shiftPreset: preset.id, shiftStart: preset.start, shiftEnd: preset.end, workingHours: `${preset.start} – ${preset.end}`, workingDays: [...preset.days], offDays: preset.id === 'holidays' ? [] : WEEK_DAYS.filter(day => !(preset.days as readonly string[]).includes(day)) };
}
export function setOffDays(days: string[]) { const offDays = WEEK_DAYS.filter(day => days.includes(day)); return { offDays, workingDays: WEEK_DAYS.filter(day => !offDays.includes(day)), shiftPreset: 'custom' }; }
export function prepareSalaryPayment(draft: SalaryPaymentDraft, member: PersonRecord, currency: string, actor: string): { payment: SalaryPayment; expense?: ExpenseItem } {
  if (member.entityType === 'company' || member.entityType === 'branch') throw new Error('Salary payments belong to individual company members, not company records.');
  if (!draft.id || !Number.isFinite(draft.amount) || draft.amount <= 0 || !Number.isSafeInteger(Math.round(draft.amount * 100))) throw new Error('Enter a positive supported paid amount.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.paidOn) || !Number.isFinite(Date.parse(draft.paidOn)) || new Date(draft.paidOn).toISOString().slice(0,10) !== draft.paidOn) throw new Error('Enter a valid payment date.');
  if (!PAY_BASES.some(b => b.value === draft.basis)) throw new Error('Select a pay basis.');
  if (!draft.method || draft.method === 'Credit / Debt') throw new Error('Select the actual salary payment channel, not credit/debt.');
  const expenseId = draft.recordExpense ? `salary-expense-${draft.id}` : undefined;
  const amount = Math.round(draft.amount * 100) / 100;
  const payment: SalaryPayment = { ...draft, amount, memberId: member.id, memberName: directoryName(member), currency, recordedAt: new Date().toISOString(), recordedBy: actor, expenseId };
  const expense: ExpenseItem | undefined = expenseId ? { id: expenseId, partySnapshot:snapshotParty(member), relatedCompanyId:member.id, salaryPaymentId: draft.id, title: `Salary payment — ${payment.memberName}`, category: 'Salaries', amount, date: draft.paidOn, vendorName: payment.memberName, paymentMethod: draft.method, description: [draft.paidFor, `Paid ${draft.basis}`, draft.reference && `Reference: ${draft.reference}`].filter(Boolean).join(' · ') } : undefined;
  return { payment, expense };
}
