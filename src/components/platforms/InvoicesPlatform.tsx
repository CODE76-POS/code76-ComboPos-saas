import { appDialogs } from '../../utils/appDialogs.ts';
import { invoiceDraftTotals } from '../../utils/invoiceDraft.ts';
import { useRegionalFormat } from '../../hooks/useRegionalFormat.ts';
import { PartyPicker } from '../common/PartyPicker.tsx';
import { uniqueParties, directoryName, partyDetails } from '../../utils/directory.ts';
import { PAYMENT_METHODS } from '../../config/paymentMethods.ts';
import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  Download,
  Printer,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Mail,
} from 'lucide-react';
import { InvoiceItem } from '../../types/index.ts';
import { exportToCSV, printPDFReport } from '../../utils/exportUtils.ts';
import { EmailExportModal } from '../modals/EmailExportModal.tsx';

export const InvoicesPlatform: React.FC = () => {
  const regionalFormat = useRegionalFormat();
  const { invoices, addInvoice, updateInvoice, deleteInvoice, company, setHoverHelpPlatform, relatedCompanies, vendors, customers, hasFeature } = usePOS();
  const currency = company.currency || 'USD';

  const [formError,setFormError] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sales' | 'stock_purchase'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<InvoiceItem | null>(null);

  // Email to Party Modal State (.txt and .pdf formats)
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<InvoiceItem | null>(null);

  const invoiceExportColumns = [
    { header: 'Invoice #', dataKey: 'invoiceNo' },
    { header: 'Type', dataKey: 'type' },
    { header: 'Party Name', dataKey: 'partyName' },
    { header: 'Party Type', dataKey: 'partyType' },
    { header: 'Related company details', dataKey: 'relatedCompanyDetails' },
    { header: 'Date', dataKey: 'date' },
    { header: 'Due Date', dataKey: 'dueDate' },
    { header: 'Subtotal', dataKey: 'subtotal' },
    { header: 'Total', dataKey: 'total' },
    { header: 'Amount Paid', dataKey: 'amountPaid' },
    { header: 'Status', dataKey: 'status' },
  ];

  const handleOpenBulkEmail = () => {
    if (!hasFeature('email')) return;
    setSelectedInvoiceForEmail(null);
    setEmailModalOpen(true);
  };

  const handleOpenRowEmail = (inv: InvoiceItem) => {
    if (!hasFeature('email')) return;
    setSelectedInvoiceForEmail(inv);
    setEmailModalOpen(true);
  };

  const [formData, setFormData] = useState<Omit<InvoiceItem, 'id'>>({
    invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
    type: 'sales',
    partyName: '',
    partyType: 'Customer',
    date: regionalFormat.inputDate(new Date()),
    dueDate: regionalFormat.inputDate(new Date(Date.now() + 14 * 86400000)),
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    subtotal: 0,
    tax: 0,
    total: 0,
    amountPaid: 0,
    status: 'paid',
    notes: 'Payment net 14 days.',
  });

  const parties = uniqueParties([relatedCompanies,formData.type==='stock_purchase'?vendors:customers]);

  const filtered = invoices.filter((inv) => {
    const matchType = typeFilter === 'all' || inv.type === typeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQ =
      !q ||
      inv.invoiceNo.toLowerCase().includes(q) ||
      inv.partyName.toLowerCase().includes(q) ||
      inv.notes?.toLowerCase().includes(q);
    return matchType && matchQ;
  });

  const changeItems = (items: InvoiceItem['items'], tax=formData.tax) => {
    const lines=items.map(item=>({...item,total:Math.round(item.quantity*item.unitPrice*100)/100}));
    const subtotal=Math.round(lines.reduce((sum,item)=>sum+item.total,0)*100)/100;
    setFormData({...formData,items:lines,subtotal,tax,total:Math.round((subtotal+tax)*100)/100});
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partyName) return;
    if(formData.items.some(item=>!item.description.trim() || !Number.isFinite(item.quantity) || item.quantity<=0 || !Number.isFinite(item.unitPrice) || item.unitPrice<0)){setFormError('Enter actual item descriptions, positive quantities and non-negative prices.');return;}
    try { addInvoice({...formData,...invoiceDraftTotals(formData.items,formData.tax,formData.amountPaid)}); setModalOpen(false); setFormError(''); } catch(error) { setFormError(error instanceof Error?error.message:'Unable to save invoice.'); }
  };

  const handleDelete = async (inv: InvoiceItem) => {
    const confirmed = await appDialogs.confirm({
      title: 'Delete this invoice?',
      message: `Delete invoice ${inv.invoiceNo}?`,
      detail: 'Linked sale and debt records are not changed automatically. Review them before deleting.',
      confirmLabel: 'Delete invoice',
      destructive: true,
    });
    if (confirmed) deleteInvoice(inv.id);
  };

  const handleExportCSV = () => {
    exportToCSV(
      invoices.map((inv) => ({
        InvoiceNo: inv.invoiceNo,
        Type: inv.type,
        Party: inv.partyName,
        PartyType: inv.partyType,
        RelatedCompanyDetails: partyDetails(inv.partySnapshot),
        Date: inv.date,
        DueDate: inv.dueDate,
        Subtotal: inv.subtotal,
        Tax: inv.tax,
        Total: inv.total,
        AmountPaid: inv.amountPaid,
        Status: inv.status,
      })),
      'code76_pos_invoices'
    );
  };

  const handleExportSinglePDF = (inv: InvoiceItem) => {
    printPDFReport(
      `Official Commercial Invoice - ${inv.invoiceNo}`,
      company,
      [
        { header: 'Item Description', dataKey: 'desc' },
        { header: 'Qty', dataKey: 'qty' },
        { header: 'Unit Price', dataKey: 'unit' },
        { header: 'Line Total', dataKey: 'lineTot' },
      ],
      inv.items.map((i) => ({
        desc: i.description,
        qty: i.quantity,
        unit: i.unitPrice.toFixed(2),
        lineTot: i.total.toFixed(2),
      })),
      [
        { label: 'Invoice No', value: inv.invoiceNo },
        { label: 'Type', value: inv.type === 'sales' ? 'Customer Sales Receivable' : 'Stock Purchase Payable' },
        { label: 'Billed To / From', value: `${inv.partyName} (${inv.partyType})` },
        ...(inv.partySnapshot ? [{label:'Related company / branch details (saved at entry)',value:partyDetails(inv.partySnapshot)}] : []),
        { label: 'Issue Date', value: regionalFormat.date(inv.date) },
        { label: 'Due Date', value: regionalFormat.date(inv.dueDate) },
        { label: 'Total Due', value: `${company.currency} ${inv.total.toFixed(2)}` },
        { label: 'Paid', value: `${company.currency} ${inv.amountPaid.toFixed(2)}` },
        { label: 'Status', value: inv.status.toUpperCase() },
      ]
    );
  };

  const handleExportFullLedgerPDF = () => {
    printPDFReport(
      'Full Invoices & Accounts Billing Ledger',
      company,
      [
        { header: 'Invoice #', dataKey: 'no' },
        { header: 'Type', dataKey: 'type' },
        { header: 'Party Name', dataKey: 'party' },
        { header: 'Saved company details', dataKey: 'partyDetails' },
        { header: 'Date', dataKey: 'date' },
        { header: 'Due Date', dataKey: 'due' },
        { header: 'Total', dataKey: 'total' },
        { header: 'Paid', dataKey: 'paid' },
        { header: 'Status', dataKey: 'status' },
      ],
      filtered.map((inv) => ({
        no: inv.invoiceNo,
        type: inv.type === 'sales' ? 'Sales' : 'Stock Purchase',
        party: inv.partyName,
        partyDetails: partyDetails(inv.partySnapshot),
        date: inv.date,
        due: inv.dueDate,
        total: inv.total.toFixed(2),
        paid: inv.amountPaid.toFixed(2),
        status: inv.status,
      }))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <p className="mb-2 text-[10px] text-slate-400">Operating currency: {currency}. Currency changes do not convert existing amounts.</p>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Invoices Platform</h1>
            <button
              onClick={() => setHoverHelpPlatform('invoices')}
              title="Click for platform guidance & settings"
              className="p-1 rounded-lg text-teal-400 hover:text-teal-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Billing management for both customer Sales Invoices and vendor Stock Purchase Invoices.
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
            onClick={handleExportFullLedgerPDF}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Ledger
          </button>
          {hasFeature('email') && (<button
            onClick={handleOpenBulkEmail}
            className="px-3 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Email all invoice records in .txt and .pdf format to customer, vendor, marketer, or company member"
          >
            <Mail className="w-3.5 h-3.5 text-teal-300" />
            <span>Email Invoices (.txt & .pdf)</span>
          </button>)}
          <button
            onClick={() => {
              setFormData({
                invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
                type: 'sales',
                partyName: '',
                partyType: 'Customer',
                date: regionalFormat.inputDate(new Date()),
                dueDate: regionalFormat.inputDate(new Date(Date.now() + 14 * 86400000)),
                items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
                subtotal: 0,
                tax: 0,
                total: 0,
                amountPaid: 0,
                status: 'paid',
                notes: 'Payment net 14 days.',
              });
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-teal-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search invoice #, customer, or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-teal-600 text-white font-semibold shadow-xs'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => setTypeFilter('sales')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              typeFilter === 'sales'
                ? 'bg-teal-600 text-white font-semibold shadow-xs'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            Sales Invoices (Customers)
          </button>
          <button
            onClick={() => setTypeFilter('stock_purchase')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              typeFilter === 'stock_purchase'
                ? 'bg-teal-600 text-white font-semibold shadow-xs'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            Stock Purchases (Vendors)
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      {/* Notice: ACTION COLUMN ON BOTH START AND END OF TABLE as explicitly required! */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
              <tr>
                {/* START ACTION COLUMN */}
                <th className="py-3 px-3 text-center w-28 text-teal-400">Actions (Start)</th>
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Classification</th>
                <th className="py-3 px-3">Billed Party</th>
                <th className="py-3 px-3">Issue Date</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-right">Amount Paid</th>
                <th className="py-3 px-3 text-center">Status</th>
                {/* END ACTION COLUMN */}
                <th className="py-3 px-3 text-center w-28 text-teal-400">Actions (End)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    No invoice records found.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    {/* START ACTION COLUMN: Delete, Update/Read, PDF Export */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewInvoice(inv)}
                          title="View Invoice Details"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportSinglePDF(inv)}
                          title="Print / Export Invoice PDF"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {hasFeature('email') && (<button
                          onClick={() => handleOpenRowEmail(inv)}
                          title="Email invoice (.txt & .pdf) to client, vendor, or staff"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>)}
                        <button
                          onClick={() => handleDelete(inv)}
                          title="Delete Invoice"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-slate-100">{inv.invoiceNo}</td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.type === 'sales'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {inv.type === 'sales' ? 'Sales Receivable' : 'Stock Purchase'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      {inv.partyName}
                      <span className="text-[10px] text-slate-400 ml-1">({inv.partyType})</span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{regionalFormat.date(inv.date)}</td>

                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{regionalFormat.date(inv.dueDate)}</td>

                    <td className="py-2.5 px-3 text-right text-slate-400">{currency} {inv.subtotal.toFixed(2)}</td>

                    <td className="py-2.5 px-3 text-right font-black text-slate-100 text-sm">
                      {currency} {inv.total.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                      {currency} {inv.amountPaid.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : inv.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    {/* END ACTION COLUMN: Delete, Update/Read, PDF Export */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewInvoice(inv)}
                          title="View Invoice Details"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportSinglePDF(inv)}
                          title="Print / Export Invoice PDF"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {hasFeature('email') && (<button
                          onClick={() => handleOpenRowEmail(inv)}
                          title="Email invoice (.txt & .pdf) to client, vendor, or staff"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>)}
                        <button
                          onClick={() => handleDelete(inv)}
                          title="Delete Invoice"
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

      {/* Create Invoice Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-4">Generate Commercial Invoice</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              {formError && <p role="alert" className="text-sm text-amber-300">{formError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    required
                    aria-label="Invoice number" value={formData.invoiceNo}
                    onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Invoice Type</label>
                  <select
                    aria-label="Invoice type" value={formData.type}
                    onChange={(e) => {
                      const t = e.target.value as any;
                      setFormData({
                        ...formData,
                        type: t,
                        partyType: t === 'sales' ? 'Customer' : 'Vendor', relatedCompanyId:undefined, partyName:'',
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="sales">Sales Invoice (Customer)</option>
                    <option value="stock_purchase">Stock Purchase (Vendor PO)</option>
                  </select>
                </div>
              </div>

              <PartyPicker label="Invoice company / branch / contact" value={formData.relatedCompanyId} parties={parties} onChange={party=>setFormData({...formData,relatedCompanyId:party?.id,partyName:party?directoryName(party):''})}/>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Billed Party ({formData.partyType}) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Supermarket Group"
                  aria-label="Invoice party name" readOnly={!!formData.relatedCompanyId} value={formData.partyName}
                  onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>

              <fieldset className="rounded-xl border border-slate-700 p-3 space-y-3"><legend className="px-2 text-sm font-bold text-teal-400">Actual invoice items</legend>
                {formData.items.map((item,index)=><div key={index} className="grid sm:grid-cols-12 gap-2 items-end">
                  <label className="sm:col-span-5 text-xs text-slate-400">Description<input aria-label={`Invoice item ${index+1} description`} required value={item.description} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm" onChange={event=>changeItems(formData.items.map((line,i)=>i===index?{...line,description:event.target.value}:line))}/></label>
                  <label className="sm:col-span-2 text-xs text-slate-400">Quantity<input aria-label={`Invoice item ${index+1} quantity`} required type="number" min="1" step="1" value={item.quantity} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm" onChange={event=>changeItems(formData.items.map((line,i)=>i===index?{...line,quantity:Number(event.target.value)}:line))}/></label>
                  <label className="sm:col-span-3 text-xs text-slate-400">Unit price<input aria-label={`Invoice item ${index+1} unit price`} required type="number" min="0" step="0.01" value={item.unitPrice} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm" onChange={event=>changeItems(formData.items.map((line,i)=>i===index?{...line,unitPrice:Number(event.target.value)}:line))}/></label>
                  <button aria-label={`Remove invoice item ${index+1}`} type="button" disabled={formData.items.length===1} className="sm:col-span-2 rounded-lg border border-slate-700 px-2 py-2 text-xs disabled:opacity-30" onClick={()=>changeItems(formData.items.filter((_,i)=>i!==index))}>Remove</button>
                </div>)}
                <button type="button" className="rounded-lg border border-teal-800 px-3 py-2 text-xs" onClick={()=>changeItems([...formData.items,{description:'',quantity:1,unitPrice:0,total:0}])}>Add invoice item</button>
                <label className="block text-xs text-slate-400">Tax amount (if applicable)<input aria-label="Invoice tax amount" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm" type="number" min="0" step="0.01" value={formData.tax} onChange={event=>changeItems(formData.items,Number(event.target.value))}/></label>
                <p className="text-[11px] text-slate-400">Stock purchase invoices add these physical quantities to inventory when issued. New SKU pricing uses the existing cost-plus default; review its selling price in Inventory. Services are not restocked.</p>
              </fieldset>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Calculated total</label>
                  <input aria-label="Calculated invoice total" type="number" readOnly value={formData.total} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Initial amount paid</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    aria-label="Initial invoice amount paid" value={formData.amountPaid}
                    onChange={(e) => {
                      const paid = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        amountPaid: paid,
                        status: paid >= formData.total ? 'paid' : 'pending',
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Terms & Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
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
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Detail Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white">
            <button
              onClick={() => setViewInvoice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs uppercase font-bold text-teal-400">Invoice Details</span>
                <h3 className="text-xl font-bold">{viewInvoice.invoiceNo}</h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  viewInvoice.status === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {viewInvoice.status}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Classification:</span>
                <span className="font-semibold text-slate-200">
                  {viewInvoice.type === 'sales' ? 'Sales Receivable (Customer)' : 'Stock Purchase (Vendor PO)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Party:</span>
                <span className="font-semibold text-slate-200">{viewInvoice.partyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issue Date:</span>
                <span className="text-slate-200">{regionalFormat.date(viewInvoice.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Due Date:</span>
                <span className="text-slate-200">{regionalFormat.date(viewInvoice.dueDate)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-sm">
                <span className="text-slate-200">Total Billed:</span>
                <span className="text-emerald-400">{currency} {viewInvoice.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="text-emerald-400 font-semibold">{currency} {viewInvoice.amountPaid.toFixed(2)}</span>
              </div>
              {viewInvoice.total > viewInvoice.amountPaid && (
                <div className="flex justify-between text-xs text-rose-400 font-bold">
                  <span>Balance Outstanding:</span>
                  <span>{currency} {(viewInvoice.total - viewInvoice.amountPaid).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => handleExportSinglePDF(viewInvoice)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Print / PDF
              </button>
              <button
                onClick={() => setViewInvoice(null)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Export Modal for Invoices (.txt and .pdf formats) */}
      {emailModalOpen && (
        <EmailExportModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          title={
            selectedInvoiceForEmail
              ? `Invoice Document: #${selectedInvoiceForEmail.invoiceNo}`
              : 'Complete Commercial Invoices Ledger'
          }
          moduleName="Invoices"
          isSingleRow={Boolean(selectedInvoiceForEmail)}
          entityName={
            selectedInvoiceForEmail
              ? `#${selectedInvoiceForEmail.invoiceNo} (${selectedInvoiceForEmail.partyName})`
              : undefined
          }
          availableFormats={['txt', 'pdf']}
          data={selectedInvoiceForEmail ? {...selectedInvoiceForEmail,relatedCompanyDetails:partyDetails(selectedInvoiceForEmail.partySnapshot)} : filtered.map(i=>({...i,relatedCompanyDetails:partyDetails(i.partySnapshot)}))}
          columns={invoiceExportColumns}
          metadata={[
            { label: 'Invoice Type Filter', value: typeFilter },
            {
              label: 'Total Invoices',
              value: selectedInvoiceForEmail ? '1 Document' : `${filtered.length} Invoices`,
            },
          ]}
        />
      )}
    </div>
  );
};
