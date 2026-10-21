import React, { useMemo, useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { useRegionalFormat } from '../../hooks/useRegionalFormat.ts';
import { receivablesSummary, DEBT_AGING_BUCKETS } from '../../utils/debt.ts';
import { exportToCSV } from '../../utils/exportUtils.ts';
import { appDialogs } from '../../utils/appDialogs.ts';
import { Activity, BarChart3, Clock3, Download, PieChart, TrendingUp, Wallet } from 'lucide-react';

type Period = '7' | '30' | '90' | 'all';

const PERIODS: { id: Period; label: string; days: number | null }[] = [
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '90', label: 'Last 90 days', days: 90 },
  { id: 'all', label: 'All recorded', days: null },
];

const palettes = ['bg-teal-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-emerald-500'];

export const OperationalInsights: React.FC = () => {
  const { sales, expenses, products, company, settings, logAuditAction } = usePOS();
  const format = useRegionalFormat();
  const currency = company.currency || 'USD';
  const [period, setPeriod] = useState<Period>('30');
  const [mixMode, setMixMode] = useState<'payments' | 'categories'>('payments');

  const scoped = useMemo(() => {
    const definition = PERIODS.find((entry) => entry.id === period)!;
    if (!definition.days) return sales;
    const cutoff = Date.now() - definition.days * 86_400_000;
    return sales.filter((sale) => Date.parse(sale.timestamp) >= cutoff);
  }, [sales, period]);

  const metrics = useMemo(() => {
    let revenue = 0, cogs = 0, tax = 0, discount = 0, units = 0;
    const paymentMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};
    const productMap: Record<string, { name: string; revenue: number; units: number; type: string }> = {};
    const hourMap: number[] = Array.from({ length: 24 }, () => 0);
    for (const sale of scoped) {
      revenue += sale.netTotal;
      tax += sale.taxAmount || 0;
      for (const item of sale.items) {
        const unitCost = Number(item.product?.costPrice) || 0;
        cogs += unitCost * item.quantity;
        units += item.quantity;
        discount += Math.max(0, item.unitPrice * item.quantity - item.total);
        const category = item.product?.category || 'General';
        categoryMap[category] = (categoryMap[category] || 0) + item.total;
        const key = item.product?.id || item.product?.name || 'unknown';
        const record = productMap[key] || { name: item.product?.name || 'Item', revenue: 0, units: 0, type: item.product?.type || 'product' };
        record.revenue += item.total; record.units += item.quantity;
        productMap[key] = record;
      }
      for (const payment of sale.payments) {
        if (payment.method === 'Credit / Debt') continue;
        paymentMap[payment.method] = (paymentMap[payment.method] || 0) + payment.amount;
      }
      const hour = new Date(sale.timestamp).getHours();
      if (Number.isFinite(hour)) hourMap[hour] += sale.netTotal;
    }
    const grossProfit = revenue - cogs;
    return {
      revenue, cogs, grossProfit, tax, discount, units,
      margin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      averageBasket: scoped.length ? revenue / scoped.length : 0,
      paymentMix: Object.entries(paymentMap).sort((a, b) => b[1] - a[1]),
      categoryMix: Object.entries(categoryMap).sort((a, b) => b[1] - a[1]),
      topProducts: Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      hourMap,
    };
  }, [scoped]);

  const receivables = useMemo(() => receivablesSummary(sales, format.inputDate(new Date())), [sales, format]);

  const maxHour = Math.max(1, ...metrics.hourMap);
  const mixTotal = (mixMode === 'payments' ? metrics.paymentMix : metrics.categoryMix).reduce((sum, [, amount]) => sum + amount, 0) || 1;
  const mix = mixMode === 'payments' ? metrics.paymentMix : metrics.categoryMix;

  const expenseTotal = useMemo(() => {
    if (period === 'all') return expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const cutoff = Date.now() - Number(period) * 86_400_000;
    return expenses.filter((expense) => Date.parse(expense.date) >= cutoff || Date.parse(`${expense.date}T00:00:00`) >= cutoff).reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses, period]);

  const exportSummary = () => {
    const rows = [
      { metric: 'Period', value: PERIODS.find((entry) => entry.id === period)!.label },
      { metric: 'Transactions', value: scoped.length },
      { metric: 'Recorded revenue', value: metrics.revenue.toFixed(2) },
      { metric: 'Estimated COGS (current cost price)', value: metrics.cogs.toFixed(2) },
      { metric: 'Gross profit estimate', value: metrics.grossProfit.toFixed(2) },
      { metric: 'Gross margin %', value: metrics.margin.toFixed(1) },
      { metric: 'Average basket', value: metrics.averageBasket.toFixed(2) },
      { metric: 'Units sold', value: metrics.units },
      { metric: 'Operating expenses in period', value: expenseTotal.toFixed(2) },
      { metric: 'Outstanding receivables (all time)', value: receivables.outstanding.toFixed(2) },
      { metric: 'Overdue receivables (all time)', value: receivables.overdueAmount.toFixed(2) },
      ...metrics.paymentMix.map(([method, amount]) => ({ metric: `Payment: ${method}`, value: amount.toFixed(2) })),
      ...metrics.topProducts.map((product) => ({ metric: `Top item: ${product.name}`, value: `${product.units} × · ${product.revenue.toFixed(2)}` })),
    ];
    exportToCSV(rows, `code76-insights-${period}-days`);
    logAuditAction('Analytics summary exported', `Exported the ${PERIODS.find((entry) => entry.id === period)!.label} operational summary as CSV.`);
    appDialogs.toast('Insights summary exported as CSV.', 'success');
  };

  const card = 'rounded-2xl border border-slate-800 bg-slate-900 p-4';

  return (
    <section aria-label="Operational insights" className="mb-8 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-black text-slate-100"><Activity className="h-4 w-4 text-teal-400" />Operational insights</h2>
          <p className="mt-0.5 text-[11px] text-slate-400">A quick, filterable read of the same recorded sales, expenses and receivables. COGS uses the product’s current saved cost price; historical sales keep their own line totals.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {PERIODS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setPeriod(entry.id)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${period === entry.id ? 'bg-teal-600 text-white' : 'border border-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              {entry.label}
            </button>
          ))}
          <button type="button" onClick={exportSummary} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-slate-800">
            <Download className="h-3.5 w-3.5" />CSV
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className={card}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Recorded revenue</p>
          <p className="mt-1 text-lg font-black text-slate-100">{currency} {metrics.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-500">{scoped.length} transaction{scoped.length === 1 ? '' : 's'} · {metrics.units} unit(s)</p>
        </div>
        <div className={card}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Gross profit estimate</p>
          <p className={`mt-1 text-lg font-black ${metrics.grossProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{currency} {metrics.grossProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-500">{metrics.margin.toFixed(1)}% margin · COGS {currency} {metrics.cogs.toFixed(0)}</p>
        </div>
        <div className={card}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Average basket</p>
          <p className="mt-1 text-lg font-black text-sky-300">{currency} {metrics.averageBasket.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-500">Discounts given {currency} {metrics.discount.toFixed(2)}</p>
        </div>
        <div className={card}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Receivables (all time)</p>
          <p className="mt-1 text-lg font-black text-amber-300">{currency} {receivables.outstanding.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500">{receivables.overdueCount} overdue · {currency} {receivables.overdueAmount.toFixed(0)} past due</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className={card}>
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-200"><PieChart className="h-3.5 w-3.5 text-violet-400" />Mix</p>
            <div className="flex gap-1">
              {(['payments', 'categories'] as const).map((mode) => (
                <button key={mode} type="button" onClick={() => setMixMode(mode)} className={`rounded px-2 py-0.5 text-[10px] font-bold ${mixMode === mode ? 'bg-slate-700 text-slate-100' : 'text-slate-500'}`}>{mode === 'payments' ? 'Payments' : 'Categories'}</button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-800">
            {mix.map(([label, amount], index) => <span key={label} title={`${label}: ${currency} ${amount.toFixed(2)}`} className={palettes[index % palettes.length]} style={{ width: `${(amount / mixTotal) * 100}%` }} />)}
          </div>
          <ul className="mt-2 space-y-1 text-[11px]">
            {mix.slice(0, 6).map(([label, amount], index) => (
              <li key={label} className="flex items-center justify-between gap-2 text-slate-300">
                <span className="flex min-w-0 items-center gap-1.5"><span className={`h-2 w-2 shrink-0 rounded-full ${palettes[index % palettes.length]}`} /><span className="truncate">{label}</span></span>
                <span className="shrink-0 text-slate-400">{currency} {amount.toFixed(2)}</span>
              </li>
            ))}
            {!mix.length && <li className="text-slate-500">No recorded values in this period.</li>}
          </ul>
        </div>

        <div className={card}>
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-200"><TrendingUp className="h-3.5 w-3.5 text-emerald-400" />Top items by revenue</p>
          <ul className="mt-2 space-y-1.5 text-[11px]">
            {metrics.topProducts.map((product) => (
              <li key={`${product.name}-${product.type}`}>
                <div className="flex items-center justify-between gap-2 text-slate-300"><span className="truncate">{product.name} <span className="text-slate-500">({product.units})</span></span><span className="shrink-0 font-bold">{currency} {product.revenue.toFixed(0)}</span></div>
                <div className="mt-0.5 h-1 rounded bg-slate-800"><div className="h-1 rounded bg-emerald-500" style={{ width: `${Math.max(2, (product.revenue / Math.max(1, metrics.topProducts[0]?.revenue || 1)) * 100)}%` }} /></div>
              </li>
            ))}
            {!metrics.topProducts.length && <li className="text-slate-500">No items sold in this period.</li>}
          </ul>
        </div>

        <div className={card}>
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-200"><Clock3 className="h-3.5 w-3.5 text-amber-400" />Checkout hours</p>
          <div className="mt-3 flex h-20 items-end gap-0.5" aria-label="Revenue by hour of day">
            {metrics.hourMap.map((amount, hour) => (
              <div key={hour} className="group relative flex-1" title={`${String(hour).padStart(2, '0')}:00 · ${currency} ${amount.toFixed(2)}`}>
                <div className={`w-full rounded-t ${amount > 0 ? 'bg-teal-500' : 'bg-slate-800'}`} style={{ height: `${amount > 0 ? Math.max(6, (amount / maxHour) * 76) : 3}px` }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-slate-500"><span>00h</span><span>12h</span><span>23h</span></div>
          <p className="mt-1 text-[10px] text-slate-500">Peak: {metrics.hourMap.indexOf(Math.max(...metrics.hourMap))}:00 local device time. Times are stored in UTC but displayed in the company timezone.</p>
        </div>
      </div>

      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-200"><Wallet className="h-3.5 w-3.5 text-amber-400" />Receivables aging (all open receipts)</p>
          <button type="button" onClick={() => exportToCSV(Object.entries(receivables.buckets).map(([bucket, value]) => ({ bucket, receipts: value.count, amount: value.amount.toFixed(2), currency })), 'code76-receivables-aging')} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-800"><BarChart3 className="h-3 w-3" />Export aging</button>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {DEBT_AGING_BUCKETS.map((bucket) => {
            const value = receivables.buckets[bucket.id];
            return (
              <div key={bucket.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                <p className="text-[10px] font-bold text-slate-400">{bucket.label}</p>
                <p className="mt-0.5 text-sm font-black text-slate-100">{currency} {value.amount.toFixed(0)}</p>
                <p className="text-[10px] text-slate-500">{value.count} receipt(s)</p>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] text-slate-500">Expenses in this period: {currency} {expenseTotal.toFixed(2)}. Aging and receivables cover all open receipts, not only the selected period.</p>
      </div>
    </section>
  );
};
