import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  Receipt,
  Plus,
  Search,
  Trash2,
  Edit,
  Download,
  DollarSign,
  FileSpreadsheet,
  HelpCircle,
  TrendingDown,
  PieChart,
  X,
  Eye,
  Mail,
} from 'lucide-react';
import { ExpenseItem } from '../../types/index.ts';
import { exportToCSV, printPDFReport } from '../../utils/exportUtils.ts';
import { EmailExportModal } from '../modals/EmailExportModal.tsx';

export const ExpensesPlatform: React.FC = () => {
  const { expenses, addExpense, deleteExpense, company, setHoverHelpPlatform } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewExpense, setViewExpense] = useState<ExpenseItem | null>(null);

  // Email to Party Modal State (.txt, .pdf, and .csv formats)
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedExpenseForEmail, setSelectedExpenseForEmail] = useState<ExpenseItem | null>(null);

  const expenseExportColumns = [
    { header: 'Title', dataKey: 'title' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Amount ($)', dataKey: 'amount' },
    { header: 'Date', dataKey: 'date' },
    { header: 'Vendor / Beneficiary', dataKey: 'vendorName' },
    { header: 'Payment Channel', dataKey: 'paymentMethod' },
    { header: 'Operational Description', dataKey: 'description' },
  ];

  const handleOpenBulkEmail = () => {
    setSelectedExpenseForEmail(null);
    setEmailModalOpen(true);
  };

  const handleOpenRowEmail = (item: ExpenseItem) => {
    setSelectedExpenseForEmail(item);
    setEmailModalOpen(true);
  };

  const [formData, setFormData] = useState<Omit<ExpenseItem, 'id'>>({
    title: '',
    category: 'Rent',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    vendorName: '',
    paymentMethod: 'Bank Transfer',
    description: '',
  });

  const categories = [
    'All',
    'Rent',
    'Utilities',
    'Salaries',
    'Logistics',
    'Marketing',
    'Supplies',
    'Maintenance',
    'Tax',
    'Other',
  ];

  const filtered = expenses.filter((e) => {
    const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQ =
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.vendorName.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const totalExpenseAmount = useMemo(() => {
    return filtered.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filtered]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.amount <= 0) return;
    addExpense(formData);
    setModalOpen(false);
  };

  const handleDelete = (e: ExpenseItem) => {
    if (confirm(`Delete expense "${e.title}" ($${e.amount})?`)) {
      deleteExpense(e.id);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      expenses.map((e) => ({
        Title: e.title,
        Category: e.category,
        Amount: e.amount,
        Date: e.date,
        VendorName: e.vendorName,
        PaymentMethod: e.paymentMethod,
        Description: e.description,
      })),
      'code76_pos_expenses'
    );
  };

  const handleExportSinglePDF = (e: ExpenseItem) => {
    printPDFReport(
      `Expense Payment Voucher - ${e.title}`,
      company,
      [
        { header: 'Detail Field', dataKey: 'k' },
        { header: 'Information', dataKey: 'v' },
      ],
      [
        { k: 'Expense Title', v: e.title },
        { k: 'Cost Category', v: e.category },
        { k: 'Amount Disbursed', v: `$${e.amount.toFixed(2)}` },
        { k: 'Disbursement Date', v: e.date },
        { k: 'Vendor / Beneficiary', v: e.vendorName },
        { k: 'Payment Channel', v: e.paymentMethod },
        { k: 'Operational Notes', v: e.description },
      ]
    );
  };

  const handleExportFullReportPDF = () => {
    printPDFReport(
      'Operational Expenses Audit Report',
      company,
      [
        { header: 'Date', dataKey: 'date' },
        { header: 'Title', dataKey: 'title' },
        { header: 'Category', dataKey: 'category' },
        { header: 'Vendor', dataKey: 'vendor' },
        { header: 'Channel', dataKey: 'method' },
        { header: 'Amount ($)', dataKey: 'amount' },
      ],
      filtered.map((e) => ({
        date: e.date,
        title: e.title,
        category: e.category,
        vendor: e.vendorName,
        method: e.paymentMethod,
        amount: e.amount.toFixed(2),
      }))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Expenses Platform</h1>
            <button
              onClick={() => setHoverHelpPlatform('expenses')}
              title="Click for platform guidance & settings"
              className="p-1 rounded-lg text-teal-400 hover:text-teal-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Audit operational spending across showroom rent, logistics, marketing, and staff salaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            CSV Export
          </button>
          <button
            onClick={handleExportFullReportPDF}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Export
          </button>
          <button
            onClick={handleOpenBulkEmail}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-teal-400" />
            Email Ledger
          </button>
          <button
            onClick={() => {
              setFormData({
                title: '',
                category: 'Rent',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                vendorName: '',
                paymentMethod: 'Bank Transfer',
                description: '',
              });
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-teal-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Top Cost Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-slate-400 text-xs">Total Expenses</div>
          <div className="text-xl font-black text-rose-400 mt-1">
            ${totalExpenseAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{filtered.length} entries shown</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-slate-400 text-xs">Payroll & Salaries</div>
          <div className="text-xl font-bold text-slate-100 mt-1">
            ${(categoryBreakdown['Salaries'] || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Staff compensation</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-slate-400 text-xs">Rent & Facilities</div>
          <div className="text-xl font-bold text-slate-100 mt-1">
            ${(categoryBreakdown['Rent'] || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Premises & utilities</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-slate-400 text-xs">Growth & Marketing</div>
          <div className="text-xl font-bold text-slate-100 mt-1">
            ${(categoryBreakdown['Marketing'] || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Ad campaigns & lead gen</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, vendor, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-teal-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      {/* Notice: ACTION COLUMN ON BOTH START AND END OF TABLE as explicitly required! */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
              <tr>
                {/* START ACTION COLUMN */}
                <th className="py-3 px-3 text-center w-28 text-teal-400">Actions (Start)</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Expense Title</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Vendor / Recipient</th>
                <th className="py-3 px-3">Payment Channel</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-right">Amount ($)</th>
                {/* END ACTION COLUMN */}
                <th className="py-3 px-3 text-center w-28 text-teal-400">Actions (End)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition">
                    {/* START ACTION COLUMN: Delete, Update/Read, PDF Export */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewExpense(e)}
                          title="View Expense Details"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportSinglePDF(e)}
                          title="Export PDF Payment Voucher"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(e)}
                          title="Delete Expense"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">{e.date}</td>

                    <td className="py-2.5 px-3 font-bold text-slate-100">{e.title}</td>

                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {e.category}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-300 font-medium">{e.vendorName}</td>

                    <td className="py-2.5 px-3 text-slate-400">{e.paymentMethod}</td>

                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{e.description}</td>

                    <td className="py-2.5 px-3 text-right font-black text-rose-400 text-sm">
                      ${e.amount.toFixed(2)}
                    </td>

                    {/* END ACTION COLUMN: Delete, Update/Read, PDF Export */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewExpense(e)}
                          title="View Expense Details"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportSinglePDF(e)}
                          title="Export PDF Payment Voucher"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenRowEmail(e)}
                          title="Email expense payment voucher (.txt & .pdf) to admin/staff/vendor"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(e)}
                          title="Delete Expense"
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

      {/* Record Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-4">Record Operational Expense</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broadband Internet Bill"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.amount || ''}
                    placeholder="0.00"
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Vendor / Beneficiary *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FiberISP Africa"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Channel</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description / Receipt Notes</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-md"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Expense Detail Modal */}
      {viewExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white">
            <button
              onClick={() => setViewExpense(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-4">{viewExpense.title}</h3>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="font-semibold text-slate-200">{viewExpense.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-black text-rose-400 text-sm">${viewExpense.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="text-slate-200">{viewExpense.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vendor / Payee:</span>
                <span className="font-semibold text-slate-200">{viewExpense.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Channel:</span>
                <span className="text-slate-200">{viewExpense.paymentMethod}</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block mb-1">Notes:</span>
                <p className="text-slate-300 leading-relaxed">{viewExpense.description}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => handleExportSinglePDF(viewExpense)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Voucher PDF
              </button>
              <button
                onClick={() => setViewExpense(null)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Email Export Modal */}
      <EmailExportModal
        isOpen={emailModalOpen}
        onClose={() => {
          setEmailModalOpen(false);
          setSelectedExpenseForEmail(null);
        }}
        title={
          selectedExpenseForEmail
            ? `Email Expense Voucher: ${selectedExpenseForEmail.title}`
            : 'Email Full Operating Expenses Ledger'
        }
        moduleName="Expenses Platform"
        isSingleRow={!!selectedExpenseForEmail}
        entityName={selectedExpenseForEmail?.title || 'Operational Expenses Ledger'}
        availableFormats={['txt', 'pdf', 'csv']}
        columns={expenseExportColumns}
        data={
          selectedExpenseForEmail
            ? {
                title: selectedExpenseForEmail.title,
                category: selectedExpenseForEmail.category,
                amount: `$${selectedExpenseForEmail.amount.toFixed(2)}`,
                date: selectedExpenseForEmail.date,
                vendorName: selectedExpenseForEmail.vendorName,
                paymentMethod: selectedExpenseForEmail.paymentMethod,
                description: selectedExpenseForEmail.description,
              }
            : filtered.map((e) => ({
                title: e.title,
                category: e.category,
                amount: e.amount.toFixed(2),
                date: e.date,
                vendorName: e.vendorName,
                paymentMethod: e.paymentMethod,
                description: e.description,
              }))
        }
        metadata={
          selectedExpenseForEmail
            ? [
                { label: 'Expense Title', value: selectedExpenseForEmail.title },
                { label: 'Category', value: selectedExpenseForEmail.category },
                { label: 'Amount', value: `$${selectedExpenseForEmail.amount.toFixed(2)}` },
                { label: 'Disbursement Date', value: selectedExpenseForEmail.date },
                { label: 'Vendor / Beneficiary', value: selectedExpenseForEmail.vendorName },
                { label: 'Payment Method', value: selectedExpenseForEmail.paymentMethod },
              ]
            : [
                { label: 'Total Expense Volume', value: `$${totalExpenseAmount.toFixed(2)}` },
                { label: 'Total Entries', value: filtered.length.toString() },
                { label: 'Active Category Filter', value: categoryFilter },
              ]
        }
      />
    </div>
  );
};
