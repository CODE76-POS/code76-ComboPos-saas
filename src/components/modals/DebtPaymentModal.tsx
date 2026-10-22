import React, { useEffect, useRef, useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { useRegionalFormat } from '../../hooks/useRegionalFormat.ts';
import { acceptedPaymentMethods } from '../../config/paymentMethods.ts';
import { outstandingBalance } from '../../utils/debt.ts';
import { printPDFReport } from '../../utils/exportUtils.ts';
import type { SaleTransaction } from '../../types/index.ts';
import { X, Wallet, Printer, CheckCircle2, Plus, Trash2, UserCheck, ShieldCheck } from 'lucide-react';
import { directoryName } from '../../utils/directory.ts';

type SplitRow = { id: string; amount: string; method: string; reference: string; note: string; };

export const DebtPaymentModal: React.FC<{ sale: SaleTransaction | null; onClose: () => void }> = ({ sale, onClose }) => {
  const { sales, settleDebt, settleDebtMultiple, assignDebtHandler, hasFeature, settings, company, setReceiptModalSale, companyMembers, relatedCompanies } = usePOS();
  const format = useRegionalFormat();
  const [error, setError] = useState('');
  const [recorded, setRecorded] = useState<SaleTransaction | null>(null);
  const paymentId = useRef(crypto.randomUUID());
  const [splits, setSplits] = useState<SplitRow[]>([{ id: 'row-1', amount: '', method: 'Cash', reference: '', note: '' }]);
  const [handlerId, setHandlerId] = useState('');
  const [handlerMsg, setHandlerMsg] = useState('');
  const live = sales.find(item => item.id === sale?.id) || sale;
  let balance = 0;
  let balanceError = '';
  if (live) {
    try { balance = outstandingBalance(live); } catch (value) { balanceError = value instanceof Error ? value.message : 'Review this balance.'; }
  }
  const methods = acceptedPaymentMethods(settings.payments.acceptedMethods, false);
  const currency = company.currency || settings.payments.defaultCurrency;

  useEffect(() => {
    if (sale) {
      setError(''); setRecorded(null); paymentId.current = crypto.randomUUID();
      const initialMethod = methods.includes('Cash') ? 'Cash' : methods[0] || 'Other';
      setSplits([{ id: `row-${Date.now()}`, amount: sale.debtAmount.toFixed(2), method: initialMethod, reference: '', note: '' }]);
      setHandlerId(sale.debtHandlerId || ''); setHandlerMsg('');
    }
  }, [sale?.id]);

  if (!live || !hasFeature('debts')) return null;

  const totalSplits = splits.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const remainAfter = Math.max(0, balance - totalSplits);
  const isValidTotal = totalSplits > 0 && totalSplits <= balance && splits.every(r => Number(r.amount) > 0);

  const handleAssign = () => {
    try {
      if (!handlerId) { assignDebtHandler(live.id, null); setHandlerMsg('Handler removed.'); }
      else { const updated = assignDebtHandler(live.id, handlerId); setHandlerMsg(`Responsible: ${updated.debtHandlerName} assigned.`); }
      setTimeout(() => setHandlerMsg(''), 2500);
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not assign handler.'); }
  };

  const addSplit = () => {
    if (splits.length >= 6) return;
    setSplits(prev => [...prev, { id: `row-${Date.now()}-${prev.length}`, amount: '', method: methods.includes('Cash') ? 'Cash' : methods[0] || 'Other', reference: '', note: '' }]);
  };
  const removeSplit = (id: string) => { if (splits.length <= 1) return; setSplits(prev => prev.filter(r => r.id !== id)); };

  const collect = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const handlerName = handlerId ? (() => {
        const m = companyMembers.find(x => x.id === handlerId) || relatedCompanies.find(x => x.id === handlerId);
        return m ? directoryName(m) : undefined;
      })() : undefined;
      let updated: SaleTransaction;
      if (splits.length === 1) {
        updated = settleDebt(live.id, Number(splits[0].amount), splits[0].method, { paymentId: paymentId.current, reference: splits[0].reference, handlerId: handlerId || undefined, handlerName, note: splits[0].note });
      } else {
        const mapped = splits.map(r => ({ amount: Number(r.amount), method: r.method, reference: r.reference, note: r.note }));
        updated = settleDebtMultiple(live.id, mapped, { basePaymentId: paymentId.current, handlerId: handlerId || undefined, handlerName });
      }
      setRecorded(updated); setError('');
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not record the payment.'); }
  };

  const lastPayments = recorded?.debtPayments?.slice(-splits.length) || (recorded?.debtPayments?.find(p => p.id === paymentId.current) ? [recorded.debtPayments.find(p => p.id === paymentId.current)!] : []);

  const voucher = () => {
    if (!recorded || !lastPayments.length) return;
    const rows = lastPayments.map((p, idx) => [
      { field: `Payment ${idx + 1} amount`, value: `${currency} ${p.amount.toFixed(2)}` },
      { field: `Payment ${idx + 1} channel`, value: p.method },
      { field: `Reference`, value: p.reference || 'Not supplied' },
      { field: `Handler`, value: p.handlerName || recorded.debtHandlerName || '—' },
      { field: `Recorded at`, value: format.dateTime(p.timestamp) },
      { field: `Recorded by`, value: p.recordedBy },
      { field: `Balance before`, value: `${currency} ${p.balanceBefore.toFixed(2)}` },
      { field: `Balance after`, value: `${currency} ${p.balanceAfter.toFixed(2)}` },
    ]).flat();
    printPDFReport(`Debt payment voucher — ${recorded.receiptNo}`, company, [{ header: 'Field', dataKey: 'field' }, { header: 'Recorded value', dataKey: 'value' }], [
      { field: 'Sale receipt', value: recorded.receiptNo },
      { field: 'Customer', value: recorded.customerName },
      ...rows,
      { field: 'Remaining balance', value: `${currency} ${recorded.debtAmount.toFixed(2)}` },
      { field: 'Status', value: recorded.debtAmount === 0 ? 'DEBT CLEARED — fully settled' : 'Partial — balance remains' },
      { field: 'Important', value: 'Bookkeeping record only. This app did not move funds or verify bank settlement.' }
    ]);
  };

  const input = 'mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm';
  const handlerOptions = [...companyMembers, ...relatedCompanies].filter(p => p.email1 || p.email2 || p.tel1).slice(0, 100);

  const hasRecorded = recorded && lastPayments.length > 0;
  const showForm = !hasRecorded && balance > 0 && !balanceError;
  const showCleared = !hasRecorded && balance === 0 && !balanceError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="debt-title" className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 text-slate-100">
        <button type="button" aria-label="Close debt payment" className="absolute right-3 top-3 p-2" onClick={onClose}><X size={20} /></button>
        <h2 id="debt-title" className="text-xl font-bold">Record a received debt payment</h2>
        <p className="mt-2 text-sm text-slate-400">{live.receiptNo} · {live.customerName || 'Customer'} · {live.debtDueDate ? `Due ${live.debtDueDate}` : 'No due date set'}</p>
        <p className="mt-2 text-xs text-amber-300">Record only money already received. This is not a bank transfer, card charge, customer notification or settlement verification.</p>

        <div className="my-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl border border-slate-700 p-3">Sale total<strong className="mt-1 block">{currency} {live.netTotal.toFixed(2)}</strong></div>
          <div className="rounded-xl border border-slate-700 p-3">Amount applied<strong className="mt-1 block">{currency} {live.amountPaid.toFixed(2)}</strong></div>
          <div className="rounded-xl border border-slate-700 p-3">Current balance<strong className="mt-1 block text-amber-300">{currency} {balance.toFixed(2)}</strong></div>
        </div>
        {balanceError ? <p role="alert" className="mb-4 text-sm text-amber-300">{balanceError}</p> : null}

        <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800/60 p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300"><UserCheck size={16} /> Company member responsible</div>
          <p className="mt-1 text-[11px] text-slate-400">Assign a handler who will follow up this debt. Visible in history and email reminders.</p>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <select aria-label="Debt handler" className={input + ' flex-1 !mt-0'} value={handlerId} onChange={e => setHandlerId(e.target.value)}>
              <option value="">No handler assigned</option>
              {handlerOptions.map(person => <option key={person.id} value={person.id}>{directoryName(person)} · {person.email1 || person.tel1 || person.category}</option>)}
            </select>
            <button type="button" onClick={handleAssign} className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-600">Assign</button>
          </div>
          {live.debtHandlerName ? <p className="mt-2 text-xs text-teal-300">Current: {live.debtHandlerName} {live.debtAssignedAt ? `· assigned ${format.dateTime(live.debtAssignedAt)} by ${live.debtAssignedBy}` : ''}</p> : null}
          {handlerMsg ? <p role="status" className="mt-2 text-xs text-emerald-300">{handlerMsg}</p> : null}
        </div>

        {hasRecorded ? (
          <div className="space-y-4">
            <p role="status" className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${recorded!.debtAmount === 0 ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300' : 'border-teal-800 text-teal-300'}`}>
              {recorded!.debtAmount === 0 ? <ShieldCheck size={20} /> : <CheckCircle2 size={20} />}
              <span>
                {recorded!.debtAmount === 0
                  ? `Debt cleared! Recorded ${currency} ${lastPayments.reduce((a, p) => a + p.amount, 0).toFixed(2)} — no remaining balance. Thank you.`
                  : `Recorded ${currency} ${lastPayments.reduce((a, p) => a + p.amount, 0).toFixed(2)} across ${lastPayments.length} split(s). Remaining: ${currency} ${recorded!.debtAmount.toFixed(2)}.`}
                {' '}No money was transferred by the app.
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-lg border border-teal-700 px-3 py-2 text-sm" onClick={voucher}><Printer size={15} className="inline mr-2" />Print payment voucher</button>
              <button className="rounded-lg border border-slate-700 px-3 py-2 text-sm" onClick={() => { setReceiptModalSale(recorded!); onClose(); }}>Open updated receipt</button>
              {recorded!.debtAmount > 0 ? <button className="rounded-lg border border-slate-700 px-3 py-2 text-sm" onClick={() => { setRecorded(null); setSplits([{ id: `row-${Date.now()}`, amount: recorded!.debtAmount.toFixed(2), method: methods.includes('Cash') ? 'Cash' : methods[0] || 'Other', reference: '', note: '' }]); paymentId.current = crypto.randomUUID(); }}>Record another received payment</button> : null}
            </div>
          </div>
        ) : null}

        {showForm ? (
          <form onSubmit={collect} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Payment splits (multi-payment)</h3>
              <button type="button" onClick={addSplit} disabled={splits.length >= 6} className="flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-xs disabled:opacity-40"><Plus size={14} /> Add split</button>
            </div>
            <p className="text-xs text-slate-400">Paying the debt in up to 6 parts (e.g. Cash + M-Pesa). Total must not exceed balance.</p>
            <div className="space-y-3">
              {splits.map((row, idx) => (
                <div key={row.id} className="rounded-xl border border-slate-700 p-3 bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Split {idx + 1}</span>
                    {splits.length > 1 ? <button type="button" onClick={() => removeSplit(row.id)} className="text-rose-400 hover:text-rose-300"><Trash2 size={14} /></button> : null}
                  </div>
                  <div className="mt-2 grid sm:grid-cols-2 gap-3">
                    <div className="block text-xs text-slate-400">
                      <span>Amount ({currency})</span>
                      <input aria-label={'Debt split amount ' + (idx + 1)} type="number" required min="0.01" max={balance} step="0.01" className={input} value={row.amount} onChange={e => setSplits(prev => prev.map(p => p.id === row.id ? { ...p, amount: e.target.value } : p))} />
                    </div>
                    <div className="block text-xs text-slate-400">
                      <span>Channel</span>
                      <select aria-label={'Debt split channel ' + (idx + 1)} className={input} value={row.method} onChange={e => setSplits(prev => prev.map(p => p.id === row.id ? { ...p, method: e.target.value } : p))}>{methods.map(value => <option key={value}>{value}</option>)}</select>
                    </div>
                  </div>
                  <div className="mt-2 grid sm:grid-cols-2 gap-3">
                    <div className="block text-xs text-slate-400">
                      <span>Reference (optional)</span>
                      <input aria-label={'Debt split reference ' + (idx + 1)} maxLength={120} className={input} value={row.reference} onChange={e => setSplits(prev => prev.map(p => p.id === row.id ? { ...p, reference: e.target.value } : p))} />
                    </div>
                    <div className="block text-xs text-slate-400">
                      <span>Note (optional)</span>
                      <input aria-label={'Debt split note ' + (idx + 1)} maxLength={280} placeholder="e.g. Cash collected in shop" className={input} value={row.note} onChange={e => setSplits(prev => prev.map(p => p.id === row.id ? { ...p, note: e.target.value } : p))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-700 p-3 text-xs">
              <div className="flex justify-between"><span>Total to record</span><strong>{currency} {totalSplits.toFixed(2)}</strong></div>
              <div className="flex justify-between mt-1"><span>Balance after</span><strong className={remainAfter === 0 ? 'text-emerald-400' : 'text-amber-300'}>{currency} {remainAfter.toFixed(2)}</strong></div>
              {remainAfter === 0 && totalSplits > 0 ? <p className="mt-2 text-emerald-300 font-semibold">This collection will clear the debt — status becomes Completed.</p> : null}
            </div>
            {error ? <p role="alert" className="rounded-lg border border-amber-800 p-3 text-sm text-amber-300">{error}</p> : null}
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="rounded-lg border border-slate-700 px-4 py-2 text-sm" onClick={onClose}>Cancel</button>
              <button type="submit" disabled={!isValidTotal} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"><Wallet size={15} className="inline mr-2" />Record debt payment{totalSplits > 0 ? ' · ' + currency + ' ' + totalSplits.toFixed(2) : ''}</button>
            </div>
          </form>
        ) : null}

        {showCleared ? <p role="status" className="rounded-xl border border-emerald-800 p-4 text-sm text-emerald-300">This sale has no remaining debt — it is cleared. {live.debtClearedAt ? `Cleared on ${format.dateTime(live.debtClearedAt)}.` : 'Status is Completed.'}</p> : null}

        {live.debtPayments?.length ? <div className="mt-6 border-t border-slate-700 pt-4"><h3 className="font-bold">Recorded repayment history</h3><div className="mt-3 space-y-2">{live.debtPayments.map(payment => <p className="rounded-lg border border-slate-800 p-3 text-xs" key={payment.id}>{format.dateTime(payment.timestamp)} · {currency} {payment.amount.toFixed(2)} · {payment.method} · {payment.reference || 'No reference'}{payment.handlerName ? ` · handler ${payment.handlerName}` : ''}{payment.note ? ` · ${payment.note}` : ''}<br />Balance {currency} {payment.balanceBefore.toFixed(2)} → {payment.balanceAfter.toFixed(2)} · {payment.recordedBy}</p>)}</div></div> : null}
        {live.debtReminderHistory?.length ? <div className="mt-4 border-t border-slate-700 pt-4"><h3 className="font-bold text-sm">Reminder history</h3><div className="mt-2 space-y-1">{live.debtReminderHistory.map(r => <p key={r.id} className="rounded-lg border border-slate-800 p-2 text-xs">{format.dateTime(r.sentAt)} · to {r.recipientName}&lt;{r.recipientEmail}&gt; · {r.subject}</p>)}</div></div> : null}
      </section>
    </div>
  );
};
