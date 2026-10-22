import { appDialogs } from '../../utils/appDialogs.ts';
import { CODE76_CREDIT_TEXT } from '../../config/code76Brand.ts';
import { useRegionalFormat } from '../../hooks/useRegionalFormat.ts';
import { copyTextToClipboard } from '../../utils/clipboard.ts';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  Mail,
  Send,
  Download,
  Copy,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Users,
  Building,
  Truck,
  TrendingUp,
  ShieldCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { PersonRecord } from '../../types/index.ts';
import { exportToCSV, printPDFReport } from '../../utils/exportUtils.ts';

export type ExportFormatType = 'pdf' | 'txt' | 'csv' | 'both_pdf_csv' | 'both_pdf_txt';

export interface EmailExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  moduleName: string;
  isSingleRow: boolean;
  entityName?: string;
  availableFormats?: ('txt' | 'pdf' | 'csv')[];
  data: any; // Single record or Array of records
  columns?: { header: string; dataKey: string }[];
  metadata?: { label: string; value: string }[];
}

export const EmailExportModal: React.FC<EmailExportModalProps> = ({
  isOpen,
  onClose,
  title,
  moduleName,
  isSingleRow,
  entityName,
  availableFormats = ['txt', 'pdf'],
  data,
  columns = [],
  metadata = [],
}) => {
  const regionalFormat = useRegionalFormat();
  const {
    company,
    companyMembers,
    customers,
    vendors,
    transporters,
    marketingTeam,
    currentUser,
    logAuditAction,
    hasFeature,
  } = usePOS();

  // Selected recipient category & email
  const [recipientType, setRecipientType] = useState<
    'company_member' | 'admin' | 'marketer' | 'customer' | 'vendor' | 'transporter' | 'custom'
  >('company_member');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');

  // Selected format
  const defaultFormat: ExportFormatType = availableFormats.includes('csv') && availableFormats.includes('pdf')
    ? 'both_pdf_csv'
    : 'both_pdf_txt';
  const [selectedFormat, setSelectedFormat] = useState<ExportFormatType>(defaultFormat);

  // Email content
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailMessage, setEmailMessage] = useState<string>('');
  const [copiedText, setCopiedText] = useState(false);
  const [copyNotice, setCopyNotice] = useState('');
  const previewRef = useRef<HTMLPreElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Get recipient lists
  const admins = useMemo(() => {
    return companyMembers.filter((m) =>
      m.roles?.some((r) => r === 'CEO' || r === 'Manager' || r === 'Director' || r === 'Developer')
    );
  }, [companyMembers]);

  // Determine current active recipient list
  const currentRecipientList = useMemo((): PersonRecord[] => {
    switch (recipientType) {
      case 'admin':
        return admins;
      case 'marketer':
        return marketingTeam;
      case 'customer':
        return customers;
      case 'vendor':
        return vendors;
      case 'transporter':
        return transporters;
      case 'company_member':
      default:
        return companyMembers;
    }
  }, [recipientType, admins, marketingTeam, customers, vendors, transporters, companyMembers]);

  // Set default person when switching category or on mount
  useEffect(() => {
    if (recipientType !== 'custom' && currentRecipientList.length > 0) {
      setSelectedPersonId(currentRecipientList[0].id);
    }
  }, [recipientType, currentRecipientList]);

  // Selected recipient person object
  const selectedPerson = useMemo(() => {
    return currentRecipientList.find((p) => p.id === selectedPersonId) || null;
  }, [currentRecipientList, selectedPersonId]);

  // Final effective email and display name
  const effectiveEmail = recipientType === 'custom' ? customEmail : (selectedPerson?.email1 || selectedPerson?.email2 || '');
  const effectiveName = recipientType === 'custom' ? (customName || 'Valued Recipient') : `${selectedPerson?.firstName || ''} ${selectedPerson?.secondName || ''}`.trim() || 'Colleague';

  // Generate plain text document representation
  const generatedTextDocument = useMemo(() => {
    const divider = '='.repeat(64);
    const subDivider = '-'.repeat(64);
    const dateStr = regionalFormat.dateTime(new Date());

    let text = `${divider}\n`;
    text += `${company.name.toUpperCase()} - WORKSPACE REPORT\n`;
    text += `${company.slogan || 'Business Solutions & Point of Sale'}\n`;
    text += `Location: ${company.address}, ${company.location}, ${company.country}\n`;
    text += `Contact: Tel: ${company.tel1} | Email: ${company.email}\n`;
    text += `${divider}\n`;
    text += `DOCUMENT: ${title.toUpperCase()}\n`;
    text += `MODULE:   ${moduleName}\n`;
    text += `DATE:     ${dateStr}\n`;
    text += `TARGET:   ${effectiveName} <${effectiveEmail}>\n`;
    if (metadata.length > 0) {
      text += `${subDivider}\nMETADATA:\n`;
      metadata.forEach((m) => {
        text += `• ${m.label.padEnd(20)}: ${m.value}\n`;
      });
    }
    text += `${subDivider}\n\n`;

    if (isSingleRow && data && typeof data === 'object') {
      text += `--- DETAILS OF RECORD: ${entityName || 'ITEM'} ---\n`;
      Object.entries(data).forEach(([key, val]) => {
        if (key === 'imageUrl') return;
        let displayVal = val;
        if (val === null || val === undefined) displayVal = 'N/A';
        else if (typeof val === 'object') displayVal = JSON.stringify(val);
        text += `${key.padEnd(24)}: ${displayVal}\n`;
      });
    } else if (Array.isArray(data)) {
      text += `TOTAL RECORDS IN TABLE: ${data.length}\n\n`;
      if (columns.length > 0) {
        // Table header
        const headerRow = columns.map((c) => c.header.slice(0, 18).padEnd(20)).join(' | ');
        text += `${headerRow}\n${'-'.repeat(headerRow.length)}\n`;
        // Rows
        data.forEach((row, i) => {
          const rowText = columns
            .map((c) => {
              let val = row[c.dataKey];
              if (val === null || val === undefined) val = '-';
              if (typeof val === 'boolean') val = val ? 'Yes' : 'No';
              if (Array.isArray(val)) val = val.join(', ');
              return String(val).slice(0, 18).padEnd(20);
            })
            .join(' | ');
          text += `${rowText}\n`;
        });
      } else {
        data.forEach((item, idx) => {
          text += `[#${idx + 1}] ${JSON.stringify(item)}\n`;
        });
      }
    }

    text += `\n${divider}\n`;
    text += `Generated by CODE76 POS Enterprise System.\n`;
    text += `Prepared from workspace records. No delivery or digital verification is implied.\n`;
    text += `${divider}\n`;
    return text+`\n${CODE76_CREDIT_TEXT}\n`;
  }, [company, title, moduleName, effectiveName, effectiveEmail, metadata, isSingleRow, data, entityName, columns]);

  // Set default subject and message on initial load
  useEffect(() => {
    if (isOpen) {
      const entityStr = entityName ? ` - ${entityName}` : '';
      setEmailSubject(`[${company.name}] ${title}${entityStr}`);
      setEmailMessage(
        `Dear ${effectiveName},\n\nPlease review the requested ${moduleName} ${
          isSingleRow ? 'document' : 'full ledger export'
        } from ${company.name} generated via CODE76 POS.\n\nSummary:\n• Module: ${moduleName}\n• Records: ${
          isSingleRow ? 'Single Document' : `${Array.isArray(data) ? data.length : 1} Table Records`
        }\n• Prepared by: ${currentUser?.name || 'Authorized Admin'}\n• Timestamp: ${regionalFormat.dateTime(new Date())}\n\nReport text is included below. Download and attach any additional files yourself before sending. Contact us if you have any questions.\n\nBest regards,\n${currentUser?.name || 'CODE76 Admin Team'}\n${company.name}`
      );
      setSendSuccess(false);
      setIsSending(false);
    }
  }, [isOpen, title, entityName, moduleName, isSingleRow, data, effectiveName, currentUser, company]);

  if (!isOpen || !hasFeature('email')) return null;

  // Handlers for direct downloads
  const handleDownloadTxt = () => {
    const filename = `${company.name.replace(/\s+/g, '_')}_${moduleName.replace(/\s+/g, '_')}_${isSingleRow ? (entityName || 'record').replace(/\s+/g, '_') : 'ledger'}_${new Date().toISOString().slice(0, 10)}.txt`;
    const blob = new Blob([generatedTextDocument], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(()=>URL.revokeObjectURL(url),30_000);
    logAuditAction('Downloaded Text Export', `Generated .TXT export for ${title} (${moduleName})`);
  };

  const handleDownloadPdf = () => {
    if (isSingleRow && data && typeof data === 'object') {
      const rows = Object.entries(data)
        .filter(([k]) => k !== 'imageUrl')
        .map(([k, v]) => ({
          Property: k.toUpperCase(),
          Value: typeof v === 'object' ? JSON.stringify(v) : String(v ?? '-'),
        }));
      printPDFReport(
        `${title}: ${entityName || 'Record'}`,
        company,
        [
          { header: 'Specification / Field', dataKey: 'Property' },
          { header: 'Value / Details', dataKey: 'Value' },
        ],
        rows,
        [
          { label: 'Recipient', value: `${effectiveName} (${effectiveEmail || 'Direct'})` },
          { label: 'Prepared By', value: currentUser?.name || 'Administrator' },
          ...metadata,
        ]
      );
    } else if (Array.isArray(data) && columns.length > 0) {
      printPDFReport(
        title,
        company,
        columns,
        data,
        [
          { label: 'Recipient', value: `${effectiveName} (${effectiveEmail || 'Direct'})` },
          { label: 'Prepared By', value: currentUser?.name || 'Administrator' },
          ...metadata,
        ]
      );
    }
    logAuditAction('Generated PDF Export', `Printed / saved PDF for ${title} (${moduleName})`);
  };

  const handleDownloadCsv = () => {
    const filename = `${company.name.replace(/\s+/g, '_')}_${moduleName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    if (Array.isArray(data)) {
      exportToCSV(data, filename);
    } else if (data && typeof data === 'object') {
      exportToCSV([data], filename);
    }
    logAuditAction('Downloaded CSV Export', `Exported CSV for ${title} (${moduleName})`);
  };

  const handleCopyClipboard = async () => {
    const result = await copyTextToClipboard(generatedTextDocument);
    setCopiedText(result.ok);
    setCopyNotice(result.ok ? 'Preview copied to clipboard.' : 'Clipboard access is blocked. The preview is selected: press Ctrl+C or Command+C to copy.');
    if (!result.ok && previewRef.current) {
      previewRef.current.focus();
      const range = document.createRange(); range.selectNodeContents(previewRef.current);
      const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
    }
    if (result.ok) setTimeout(() => setCopiedText(false), 2000);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasFeature('email')) return;
    if (!effectiveEmail) {
      void appDialogs.alert({ title: 'Recipient required', message: 'Please select or specify a valid recipient email address.', tone: 'warning' });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromName: currentUser?.name || company.name || 'CODE76 Operator',
          fromEmail: currentUser?.email || 'code76pos@gmail.com',
          to: effectiveEmail,
          subject: emailSubject,
          message: `${emailMessage}\n\n================ ATTACHED REPORT TEXT ================\n\n${generatedTextDocument}`,
          company: company.name,
          category: 'export_report',
        }),
      });
      const data = await res.json();
      setSendSuccess(true);
      logAuditAction('Dispatched Report Email', `Dispatched ${moduleName} export to ${effectiveEmail} (${data.jobId || 'MSG'}).`);
    } catch {
      setSendSuccess(true);
      logAuditAction('Email Draft Prepared', `Prepared ${moduleName} ${isSingleRow ? 'record' : 'ledger'} export for ${effectiveName}.`);
    } finally {
      setIsSending(false);
    }
  };

  const handleMailtoClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(effectiveEmail)}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(
      `${emailMessage}\n\n================ ATTACHED REPORT TEXT ================\n\n${generatedTextDocument}`
    )}`;
    window.location.href = mailtoUrl;
    logAuditAction('Opened Email Client', `Pre-filled native email draft to ${effectiveEmail}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-teal-500/40 shadow-2xl p-4 sm:p-6 text-white max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/40 shrink-0">
            <Mail className="w-5 h-5 text-teal-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60">
                {moduleName} Files & Email Draft
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {isSingleRow ? 'Single Row Document' : `Entire Table (${Array.isArray(data) ? data.length : 1} Records)`}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 truncate mt-0.5">
              {title}
            </h3>
          </div>
        </div>

        {sendSuccess ? (
          <div className="bg-emerald-950/70 border border-emerald-600 rounded-2xl p-6 text-center my-4 animate-in zoom-in-95">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2 animate-bounce" />
            <h4 className="text-base font-black text-emerald-200">Email draft prepared</h4>
            <p className="text-xs text-emerald-300 mt-1 max-w-md mx-auto">
              Prepared <strong>{title}</strong> in <strong>{selectedFormat.toUpperCase()}</strong> format to{' '}
              <span className="font-mono text-white underline">{effectiveEmail}</span> ({effectiveName}). No message has been sent. Open your email app below to review and send; attach downloaded files yourself.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <button
                onClick={handleMailtoClient}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Outlook / Gmail / Apple Mail</span>
              </button>
              <button
                onClick={() => setSendSuccess(false)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Prepare another draft
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
            {/* 1. Recipient Category Tabs */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Select Recipient Category:</span>
                <span className="text-[10px] text-teal-400 font-mono">Verified CRM & Staff Directory</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                {[
                  { id: 'company_member', label: 'Staff / Members', icon: Users },
                  { id: 'admin', label: 'System Admins', icon: ShieldCheck },
                  { id: 'marketer', label: 'Marketing Team', icon: TrendingUp },
                  { id: 'customer', label: 'Customers', icon: User },
                  { id: 'vendor', label: 'Vendors', icon: Building },
                  { id: 'transporter', label: 'Transporters', icon: Truck },
                  { id: 'custom', label: 'Custom / Other', icon: Mail },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isSel = recipientType === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setRecipientType(cat.id as any)}
                      className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer text-[11px] ${
                        isSel
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Recipient Selector or Custom Input */}
            {recipientType === 'custom' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Recipient Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe, Operations Director"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Recipient Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="recipient@company.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-400">
                    Choose from {recipientType.replace('_', ' ').toUpperCase()} list:
                  </label>
                  <span className="text-[10px] text-slate-500">{currentRecipientList.length} Available</span>
                </div>
                {currentRecipientList.length === 0 ? (
                  <p className="text-xs text-amber-400 italic">
                    No records found in this directory. Switch to &quot;Custom / Other&quot; to type an email.
                  </p>
                ) : (
                  <select
                    value={selectedPersonId}
                    onChange={(e) => setSelectedPersonId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    {currentRecipientList.map((p) => {
                      const name = `${p.firstName} ${p.secondName}`.trim();
                      const roleDesc = p.roles ? ` [${p.roles.join(', ')}]` : '';
                      const emailDesc = p.email1 || p.email2 || 'No Email';
                      return (
                        <option key={p.id} value={p.id}>
                          {name} ({emailDesc}){roleDesc}
                        </option>
                      );
                    })}
                  </select>
                )}
                {selectedPerson && (
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 border-t border-slate-800/80">
                    <span>
                      Email: <strong className="text-teal-300 font-mono">{effectiveEmail || 'None'}</strong>
                    </span>
                    <span>
                      Phone: <strong className="text-slate-200">{selectedPerson.tel1 || selectedPerson.whatsappNo || 'N/A'}</strong>
                    </span>
                    {selectedPerson.roles && (
                      <span>
                        Roles: <strong className="text-amber-300">{selectedPerson.roles.join(' & ')}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. Export Format Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                Attachment Format & Output Document:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* PDF */}
                {availableFormats.includes('pdf') && (
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('pdf')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      selectedFormat === 'pdf'
                        ? 'bg-rose-950/40 border-rose-500 text-rose-300 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                      <FileText className="w-3.5 h-3.5 text-rose-400" />
                      <span>.PDF Document</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Styled A4 Document with Company Header
                    </span>
                  </button>
                )}

                {/* TXT */}
                {availableFormats.includes('txt') && (
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('txt')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      selectedFormat === 'txt'
                        ? 'bg-teal-950/40 border-teal-500 text-teal-300 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                      <FileText className="w-3.5 h-3.5 text-teal-400" />
                      <span>.TXT Ledger</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Lightweight structured plain text spec
                    </span>
                  </button>
                )}

                {/* CSV */}
                {availableFormats.includes('csv') && (
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('csv')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      selectedFormat === 'csv'
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>.CSV Spreadsheet</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Raw table data for Excel / Sheets
                    </span>
                  </button>
                )}

                {/* BOTH (PDF + TXT or PDF + CSV) */}
                {availableFormats.includes('pdf') && availableFormats.includes('txt') && (
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('both_pdf_txt')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      selectedFormat === 'both_pdf_txt'
                        ? 'bg-purple-950/40 border-purple-500 text-purple-300 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Both (.PDF & .TXT)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Download each file and attach it yourself if needed
                    </span>
                  </button>
                )}

                {availableFormats.includes('pdf') && availableFormats.includes('csv') && (
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('both_pdf_csv')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      selectedFormat === 'both_pdf_csv'
                        ? 'bg-purple-950/40 border-purple-500 text-purple-300 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Both (.PDF & .CSV)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Printable PDF view and CSV data export
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* 4. Subject and Message Fields */}
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Email Message Body
                </label>
                <textarea
                  rows={3}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>
            </div>

            {/* 5. Document Content Preview Collapsible */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Attachment Text Preview:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyClipboard}
                    className="text-[10px] text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedText ? 'Copied!' : 'Copy Preview'}</span>
                  </button>
                </div>
              </div>
              <pre ref={previewRef} tabIndex={0} className="max-h-28 overflow-y-auto text-[10px] font-mono text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 scrollbar-thin">
                {generatedTextDocument}
              </pre>
              {copyNotice && <p role="status" className="mt-2 text-xs text-teal-300">{copyNotice}</p>}
            </div>

            {/* 6. Direct Download Buttons Bar */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 font-medium">
                Want to download the file directly to your device?
              </span>
              <div className="flex items-center gap-2">
                {availableFormats.includes('pdf') && (
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold text-[11px] border border-rose-500/30 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-rose-400" />
                    <span>Download PDF</span>
                  </button>
                )}
                {availableFormats.includes('txt') && (
                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-[11px] border border-teal-500/30 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-teal-400" />
                    <span>Download .TXT</span>
                  </button>
                )}
                {availableFormats.includes('csv') && (
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-[11px] border border-emerald-500/30 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>Download .CSV</span>
                  </button>
                )}
              </div>
            </div>

            {/* 7. Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleMailtoClient}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Launch default email app (Outlook, Thunderbird, Apple Mail)"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Mail App (mailto)</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || !effectiveEmail}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Preparing email draft…</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Prepare email draft</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
