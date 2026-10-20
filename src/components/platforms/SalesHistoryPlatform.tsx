import { calendarDate } from '../../utils/regional.ts';
import { useRegionalFormat } from '../../hooks/useRegionalFormat.ts';
import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  History,
  FileText,
  DollarSign,
  Star,
  Mail,
  Printer,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  HelpCircle,
  Search,
  ArrowUpDown,
  Download,
  ShoppingBag,
} from 'lucide-react';
import { SaleTransaction } from '../../types/index.ts';
import { DebtPaymentModal } from '../modals/DebtPaymentModal.tsx';
import { SendEmailReminderModal } from '../modals/SendEmailReminderModal.tsx';
import { printPDFReport } from '../../utils/exportUtils.ts';
import { EmailExportModal } from '../modals/EmailExportModal.tsx';

export const SalesHistoryPlatform: React.FC = () => {
  const regionalFormat = useRegionalFormat();
  const { sales, setSales, company, setReceiptModalSale, setReviewModalSale, setHoverHelpPlatform, logAuditAction, hasFeature, settings } = usePOS();
  const currency = company.currency || 'USD';

  const [selectedSaleDetail, setSelectedSaleDetail] = useState<SaleTransaction | null>(null);
  const [debtModalSale, setDebtModalSale] = useState<SaleTransaction | null>(null);
  const [emailModalSale, setEmailModalSale] = useState<SaleTransaction | null>(null);

  // Universal Email Export Modal State (.txt, .pdf, and .csv formats)
  const [universalEmailModalOpen, setUniversalEmailModalOpen] = useState(false);
  const [selectedSaleForUniversalEmail, setSelectedSaleForUniversalEmail] = useState<SaleTransaction | null>(null);

  const salesExportColumns = [
    { header: 'Receipt #', dataKey: 'receiptNo' },
    { header: 'Category', dataKey: 'saleCategory' },
    { header: 'Date', dataKey: 'date' },
    { header: 'Customer', dataKey: 'customer' },
    { header: 'Cashier', dataKey: 'cashier' },
    { header: 'Net Total ($)', dataKey: 'netTotal' },
    { header: 'Paid ($)', dataKey: 'paid' },
    { header: 'Debt ($)', dataKey: 'debt' },
    { header: 'Status', dataKey: 'status' },
  ];

  const handleOpenBulkEmail = () => {
    if (!hasFeature('email')) return;
    setSelectedSaleForUniversalEmail(null);
    setUniversalEmailModalOpen(true);
  };

  const handleOpenRowEmail = (sale: SaleTransaction) => {
    if (!hasFeature('email')) return;
    setSelectedSaleForUniversalEmail(sale);
    setUniversalEmailModalOpen(true);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'normal_sale' | 'sales_invoice'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'debt_pending' | 'debt_partial' | 'outstanding' | 'overdue'>('all');

  const filteredSales = sales.filter((s) => {
    const matchesCategory =
      categoryFilter === 'all' ||
      (categoryFilter === 'sales_invoice' && s.saleType === 'sales_invoice') ||
      (categoryFilter === 'normal_sale' && s.saleType !== 'sales_invoice');

    const matchesStatus=statusFilter==='all'||(statusFilter==='outstanding'?s.debtAmount>0:statusFilter==='overdue'?s.debtAmount>0&&!!s.debtDueDate&&s.debtDueDate<calendarDate(new Date(),settings):s.status===statusFilter);
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      s.receiptNo.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.cashierName.toLowerCase().includes(q) ||
      (s.invoiceId && s.invoiceId.toLowerCase().includes(q)) ||
      (s.notes && s.notes.toLowerCase().includes(q)) ||
      (s.saleType && s.saleType.toLowerCase().replace('_', ' ').includes(q)) ||
      (q === 'invoice' && s.saleType === 'sales_invoice') ||
      (q === 'sales invoice' && s.saleType === 'sales_invoice') ||
      (q === 'normal' && s.saleType !== 'sales_invoice') ||
      (q === 'normal sale' && s.saleType !== 'sales_invoice');

    return matchesCategory && matchesStatus && matchesQuery;
  });

  const handleDeleteSale = (sale: SaleTransaction) => {
    if(!hasFeature('debts')&&sale.debtAmount>0){alert('Debt changes are not included in this plan. The record is retained.');return;}
    if(sale.debtPayments?.length){alert('This sale has repayment history. Retain the original financial record and review corrections with your administrator.');return;}
    if (confirm(`Are you sure you want to delete transaction ${sale.receiptNo}?`)) {
      setSales((prev) => prev.filter((s) => s.id !== sale.id));
      logAuditAction('Deleted Sale Transaction', `Removed sale #${sale.receiptNo} from system records`);
    }
  };

  const handleExportSinglePDF = (sale: SaleTransaction) => {
    printPDFReport(
      `Sales Transaction Voucher - ${sale.receiptNo}`,
      company,
      [
        { header: 'Product / Service', dataKey: 'productName' },
        { header: 'Quantity', dataKey: 'quantity' },
        { header: 'Unit Price ($)', dataKey: 'unitPrice' },
        { header: 'Discount', dataKey: 'discount' },
        { header: 'Total ($)', dataKey: 'total' },
      ],
      sale.items.map((i) => ({
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toFixed(2),
        discount: i.discountValue > 0 ? `${i.discountValue}${i.discountType === 'percentage' ? '%' : '$'}` : '-',
        total: i.total.toFixed(2),
      })),
      [
        { label: 'Receipt No', value: sale.receiptNo },
        { label: 'Customer', value: sale.customerName },
        { label: 'Cashier', value: sale.cashierName },
        { label: 'Net Total', value: `$${sale.netTotal.toFixed(2)}` },
        { label: 'Amount Paid', value: `$${sale.amountPaid.toFixed(2)}` },
        { label: 'Debt Remaining', value: `$${sale.debtAmount.toFixed(2)}` },
        { label: 'Status', value: sale.status.toUpperCase() },
      ]
    );
  };

  const handleExportFullHistoryPDF = () => {
    if (!hasFeature('data_export')) return;
    printPDFReport(
      'Complete Sales History Ledger',
      company,
      [
        { header: 'Receipt No', dataKey: 'receiptNo' },
        { header: 'Category / Type', dataKey: 'saleCategory' },
        { header: 'Date', dataKey: 'date' },
        { header: 'Customer', dataKey: 'customer' },
        { header: 'Cashier', dataKey: 'cashier' },
        { header: 'Referred By', dataKey: 'referrer' },
        { header: 'Net Total ($)', dataKey: 'netTotal' },
        { header: 'Paid ($)', dataKey: 'paid' },
        { header: 'Debt ($)', dataKey: 'debt' },
        { header: 'Status', dataKey: 'status' },
      ],
      filteredSales.map((s) => ({
        receiptNo: s.receiptNo,
        saleCategory: s.saleType === 'sales_invoice' ? 'Sales Invoice' : 'Normal Sale',
        date: regionalFormat.date(s.timestamp),
        customer: s.customerName,
        cashier: s.cashierName,
        referrer: s.referredBy?.role || 'Direct',
        netTotal: s.netTotal.toFixed(2),
        paid: s.amountPaid.toFixed(2),
        debt: s.debtAmount.toFixed(2),
        status: s.saleType === 'sales_invoice' ? (s.status === 'completed' ? 'Paid' : 'Debt') : s.status,
      }))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Sales History & Debt Platform</h1>
            <button
              onClick={() => setHoverHelpPlatform('sales_history')}
              title="Click for platform guidance & settings"
              className="p-1 rounded-lg text-teal-400 hover:text-teal-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Audit past transactions, view products sold, collect debt balances, capture customer testimonials, and send polite appreciation emails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasFeature('data_export') && (<button
            onClick={handleExportFullHistoryPDF}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export History PDF
          </button>)}
          {hasFeature('email') && (<button
            onClick={handleOpenBulkEmail}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Mail className="w-4 h-4 text-teal-400" />
            Email Ledger
          </button>)}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-5"><div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-400">Recorded sales (not cash receipts)</p><strong className="mt-2 block text-xl">{currency} {sales.reduce((sum,sale)=>sum+sale.netTotal,0).toFixed(2)}</strong></div><div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-400">Amount applied to sales</p><strong className="mt-2 block text-xl">{currency} {sales.reduce((sum,sale)=>sum+Math.min(sale.netTotal,sale.amountPaid),0).toFixed(2)}</strong></div><div className="rounded-xl border border-amber-900 bg-slate-900 p-4"><p className="text-xs text-slate-400">Recorded outstanding balance</p><strong className="mt-2 block text-xl text-amber-300">{currency} {sales.reduce((sum,sale)=>sum+sale.debtAmount,0).toFixed(2)}</strong></div></div>
      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col lg:flex-row gap-3 justify-between items-center">
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search receipt #, customer, cashier, invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Category Filter Pills (Normal Sale vs Sales Invoice) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 px-2 hidden sm:inline">Category:</span>
          {(
            [
              { id: 'all', label: 'All Types' },
              { id: 'normal_sale', label: 'Normal Sales' },
              { id: 'sales_invoice', label: 'Sales Invoices' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                categoryFilter === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto">
          {(
            [
              { id: 'all', label: 'All statuses' },
              { id: 'outstanding', label: 'All outstanding' },
              { id: 'overdue', label: 'Past due date' },
              { id: 'completed', label: 'Paid / Completed' },
              { id: 'debt_pending', label: 'Pending Debt' },
              { id: 'debt_partial', label: 'Partial Debt' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                statusFilter === st.id
                  ? 'bg-teal-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Transactions Table */}
      {/* Notice: ACTION COLUMN ON BOTH START AND END OF TABLE as explicitly required! */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1100px]">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
              <tr>
                {/* START ACTION COLUMN */}
                <th className="py-3 px-3 text-center w-28 text-teal-400">Actions (Start)</th>
                <th className="py-3 px-3">Receipt / Inv #</th>
                <th className="py-3 px-3 text-center">Category / Type</th>
                <th className="py-3 px-3">Date / Time</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-3">Referred By</th>
                <th className="py-3 px-3 text-right">Net Total</th>
                <th className="py-3 px-3 text-right">Paid</th>
                <th className="py-3 px-3 text-right">Debt</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Follow-ups</th>
                {/* END ACTION COLUMN */}
                <th className="py-3 px-3 text-center w-28 text-teal-400">Actions (End)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-500">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/40 transition">
                    {/* START ACTION COLUMN */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedSaleDetail(sale)}
                          title="View Sold Items Breakdown"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportSinglePDF(sale)}
                          title="Export Single PDF Voucher"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale)}
                          title="Delete Transaction"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-slate-100">
                      <div>{sale.receiptNo}</div>
                      {sale.saleType === 'sales_invoice' && (
                        <div className="text-[10px] text-indigo-400 font-mono">Invoice B2B</div>
                      )}
                    </td>

                    {/* Category Column */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {sale.saleType === 'sales_invoice' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs">
                          <FileText className="w-3 h-3 text-indigo-400" />
                          Sales Invoice
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-xs">
                          <ShoppingBag className="w-3 h-3 text-teal-400" />
                          Normal Sale
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {regionalFormat.date(sale.timestamp)} {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      {sale.customerName}
                    </td>

                    <td className="py-2.5 px-3 text-slate-400">
                      {sale.cashierName}
                    </td>

                    <td className="py-2.5 px-3 text-[11px] text-amber-300">
                      {sale.referredBy?.role || 'Direct Sale'}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-slate-100">
                      {currency} {sale.netTotal.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                      {currency} {sale.amountPaid.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {sale.debtAmount > 0 ? (
                        <span className="text-rose-400 font-bold bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/40">
                          {currency} {sale.debtAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-500">$0.00</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sale.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : sale.status === 'debt_partial'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {sale.saleType === 'sales_invoice'
                          ? sale.status === 'completed'
                            ? 'Paid (Invoice)'
                            : sale.status === 'debt_partial'
                            ? 'Debt (Partial)'
                            : 'Debt (Unpaid)'
                          : sale.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Follow-up actions: Debt, Review, Appreciation Email */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {hasFeature('debts') && sale.debtAmount > 0 && (
                          <button
                            onClick={() => setDebtModalSale(sale)}
                            title="Collect Debt Payment"
                            className="px-2 py-1 rounded-md bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <DollarSign className="w-3 h-3" />
                            Pay Debt
                          </button>
                        )}

                        {hasFeature('business_landing') && (<button
                          onClick={() => setReviewModalSale(sale)}
                          title="Capture Customer Review / Testimonial"
                          className="p-1 rounded-md bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 cursor-pointer"
                        >
                          <Star className={`w-3.5 h-3.5 ${sale.hasReview ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>)}

                        {hasFeature('email') && (<button
                          onClick={() => setEmailModalSale(sale)}
                          title="Send Polite Appreciation & Review Request Email"
                          className="p-1 rounded-md bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 border border-sky-500/30 cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>)}
                      </div>
                    </td>

                    {/* END ACTION COLUMN */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setReceiptModalSale(sale)}
                          title="Print Thermal Receipt"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportSinglePDF(sale)}
                          title="Export Single PDF Voucher"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {hasFeature('email') && (<button
                          onClick={() => handleOpenRowEmail(sale)}
                          title="Email sale transaction (.txt & .pdf) to customer/marketer/staff/transporter"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>)}
                        <button
                          onClick={() => handleDeleteSale(sale)}
                          title="Delete Transaction"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sold Items Drilldown Modal */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
              <div>
                <span className="text-xs uppercase font-bold text-teal-400">Sold Items Breakdown</span>
                <h3 className="text-lg font-bold">Transaction: {selectedSaleDetail.receiptNo}</h3>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="text-slate-400 hover:text-white text-xs p-1 rounded"
              >
                Close [x]
              </button>
            </div>

            <div className="divide-y divide-slate-800 max-h-64 overflow-y-auto mb-4">
              {selectedSaleDetail.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-100">{item.product.name}</div>
                    <div className="text-[10px] text-slate-400">
                      Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                      {item.discountValue > 0 && ` (Disc: -${item.discountValue}${item.discountType === 'percentage' ? '%' : '$'})`}
                    </div>
                  </div>
                  <div className="font-bold text-emerald-400">{currency} {item.total.toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>{currency} {selectedSaleDetail.subtotal.toFixed(2)}</span>
              </div>
              {selectedSaleDetail.overallDiscountValue > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Cart Discount:</span>
                  <span>
                    -{selectedSaleDetail.overallDiscountValue}
                    {selectedSaleDetail.overallDiscountType === 'percentage' ? '%' : '$'}
                  </span>
                </div>
              )}
              {selectedSaleDetail.extraCharges.map((ch) => (
                <div key={ch.id} className="flex justify-between text-slate-400">
                  <span>{ch.reason}:</span>
                  <span>+${ch.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1">
                <span>Net Total:</span>
                <span className="text-emerald-400">{currency} {selectedSaleDetail.netTotal.toFixed(2)}</span>
              </div>
            </div>

            {!!selectedSaleDetail.debtPayments?.length&&<section className="mt-4 rounded-xl border border-teal-900 p-3"><h4 className="font-bold text-sm">Recorded repayments</h4>{selectedSaleDetail.debtPayments.map(payment=><p key={payment.id} className="mt-2 text-xs text-slate-400">{regionalFormat.dateTime(payment.timestamp)} · {currency} {payment.amount.toFixed(2)} · {payment.method} · {payment.reference||'No reference'} · Balance after: {currency} {payment.balanceAfter.toFixed(2)}</p>)}</section>}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setReceiptModalSale(selectedSaleDetail);
                  setSelectedSaleDetail(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Open Receipt
              </button>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debt Payment Modal */}
      {debtModalSale && (
        <DebtPaymentModal
          sale={debtModalSale}
          onClose={() => setDebtModalSale(null)}
        />
      )}

      {/* Send Email Reminder Modal */}
      {emailModalSale && (
        <SendEmailReminderModal
          sale={emailModalSale}
          onClose={() => setEmailModalSale(null)}
        />
      )}

      {/* Universal Email Export Modal */}
      <EmailExportModal
        isOpen={universalEmailModalOpen}
        onClose={() => {
          setUniversalEmailModalOpen(false);
          setSelectedSaleForUniversalEmail(null);
        }}
        title={
          selectedSaleForUniversalEmail
            ? `Email Sales Voucher: #${selectedSaleForUniversalEmail.receiptNo}`
            : 'Email Complete Sales History Ledger'
        }
        moduleName="Sales History Platform"
        isSingleRow={!!selectedSaleForUniversalEmail}
        entityName={selectedSaleForUniversalEmail ? `Sale #${selectedSaleForUniversalEmail.receiptNo}` : 'Sales History Ledger'}
        availableFormats={['txt', 'pdf', 'csv']}
        columns={salesExportColumns}
        data={
          selectedSaleForUniversalEmail
            ? {
                receiptNo: selectedSaleForUniversalEmail.receiptNo,
                saleCategory: selectedSaleForUniversalEmail.saleType === 'sales_invoice' ? 'Sales Invoice' : 'Normal Sale',
                date: regionalFormat.dateTime(selectedSaleForUniversalEmail.timestamp),
                customer: selectedSaleForUniversalEmail.customerName,
                cashier: selectedSaleForUniversalEmail.cashierName,
                netTotal: `$${selectedSaleForUniversalEmail.netTotal.toFixed(2)}`,
                paid: `$${selectedSaleForUniversalEmail.amountPaid.toFixed(2)}`,
                debt: `$${selectedSaleForUniversalEmail.debtAmount.toFixed(2)}`,
                status: selectedSaleForUniversalEmail.status.toUpperCase(),
              }
            : filteredSales.map((s) => ({
                receiptNo: s.receiptNo,
                saleCategory: s.saleType === 'sales_invoice' ? 'Sales Invoice' : 'Normal Sale',
                date: regionalFormat.date(s.timestamp),
                customer: s.customerName,
                cashier: s.cashierName,
                netTotal: s.netTotal.toFixed(2),
                paid: s.amountPaid.toFixed(2),
                debt: s.debtAmount.toFixed(2),
                status: s.status,
              }))
        }
        metadata={
          selectedSaleForUniversalEmail
            ? [
                { label: 'Receipt No', value: selectedSaleForUniversalEmail.receiptNo },
                { label: 'Customer', value: selectedSaleForUniversalEmail.customerName },
                { label: 'Cashier Staff', value: selectedSaleForUniversalEmail.cashierName },
                { label: 'Net Total', value: `$${selectedSaleForUniversalEmail.netTotal.toFixed(2)}` },
                { label: 'Amount Paid', value: `$${selectedSaleForUniversalEmail.amountPaid.toFixed(2)}` },
                { label: 'Outstanding Balance', value: `$${selectedSaleForUniversalEmail.debtAmount.toFixed(2)}` },
                { label: 'Status', value: selectedSaleForUniversalEmail.status.toUpperCase() },
              ]
            : [
                { label: 'Total Filtered Sales', value: filteredSales.length.toString() },
                {
                  label: 'Gross Volume ($)',
                  value: `$${filteredSales.reduce((acc, curr) => acc + curr.netTotal, 0).toFixed(2)}`,
                },
                {
                  label: 'Total Collected ($)',
                  value: `$${filteredSales.reduce((acc, curr) => acc + curr.amountPaid, 0).toFixed(2)}`,
                },
              ]
        }
      />
    </div>
  );
};
