import { useRegionalFormat } from '../../hooks/useRegionalFormat.ts';
import { accessHistoryPermissions, assertAccessHistoryExport, accessHistoryCsv, accessHistoryText, downloadReport } from '../../utils/accessHistory.ts';
import { accessHistoryPdf } from '../../utils/accessHistoryPdf.ts';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Mail,
  Download,
  Clock,
  User,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  LogIn,
  ShoppingBag,
  Settings,
  HelpCircle,
  Laptop,
} from 'lucide-react';
import { AuditLog } from '../../types/index.ts';
import { EmailExportModal } from '../modals/EmailExportModal.tsx';

export const AuditLogPlatform: React.FC = () => {
  const regionalFormat = useRegionalFormat();
  const { auditLogs, currentUser, setHoverHelpPlatform, logAuditAction, company, settings, hasFeature } = usePOS();

  const permissions = accessHistoryPermissions(currentUser, settings);
  const live = useRef({ user: currentUser, settings });
  live.current = { user: currentUser, settings };
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [exportStatus, setExportStatus] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Filtered logs
  const filteredLogs = useMemo(() => {
    if (!permissions.canView) return [];
    return auditLogs.filter((log) => {
      // Search
      const matchesSearch =
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipOrDevice.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Action type filter
      if (selectedActionFilter !== 'all') {
        const actionLower = log.action.toLowerCase();
        if (selectedActionFilter === 'logins' && !actionLower.includes('logged in') && !actionLower.includes('sign in')) {
          return false;
        }
        if (selectedActionFilter === 'logouts' && !actionLower.includes('logged out') && !actionLower.includes('sign out')) {
          return false;
        }
        if (selectedActionFilter === 'sales' && !actionLower.includes('sale') && !actionLower.includes('cart')) {
          return false;
        }
        if (
          selectedActionFilter === 'admin' &&
          !actionLower.includes('admin') &&
          !actionLower.includes('settings') &&
          !actionLower.includes('privilege') &&
          !actionLower.includes('wipe') &&
          !actionLower.includes('demo')
        ) {
          return false;
        }
        if (selectedActionFilter === 'leads' && !actionLower.includes('lead') && !actionLower.includes('inquire')) {
          return false;
        }
      }

      // Date filter
      if (dateFilter === 'today') {
        return new Date(log.timestamp).toDateString() === new Date().toDateString();
      }

      return true;
    });
  }, [auditLogs, searchTerm, selectedActionFilter, dateFilter, permissions.canView]);

  // Email Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedLogForEmail, setSelectedLogForEmail] = useState<AuditLog | null>(null);

  const auditColumns = [
    { header: 'Date & Time', dataKey: 'formattedDate' },
    { header: 'User', dataKey: 'userName' },
    { header: 'Role', dataKey: 'userRole' },
    { header: 'Action', dataKey: 'action' },
    { header: 'Activity Details', dataKey: 'details' },
    { header: 'Device / IP', dataKey: 'ipOrDevice' },
  ];

  const formattedAuditData = useMemo(() => {
    return filteredLogs.map((log) => ({
      ...log,
      formattedDate: regionalFormat.dateTime(log.timestamp),
    }));
  }, [filteredLogs]);

  const reportName = (extension: string) => `CODE76-Access-History-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`;
  const handleExportPDF = async () => {
    const session = live.current;
    try {
      assertAccessHistoryExport(session.user, session.settings);
      setPdfBusy(true); setExportStatus('Preparing the filtered PDF report…');
      const bytes = await accessHistoryPdf(filteredLogs, session.user?.name || 'Authorized user');
      // Do not finish a pending download after logout, navigation or privilege revocation.
      if (!mounted.current || live.current.user?.id !== session.user?.id) return;
      assertAccessHistoryExport(live.current.user, live.current.settings);
      downloadReport(bytes.slice().buffer, 'application/pdf', reportName('pdf'));
      setExportStatus('PDF download requested. Check your browser downloads.');
      logAuditAction('Exported Access History PDF', `Downloaded ${filteredLogs.length} filtered records`);
    } catch (error) { if (mounted.current) setExportStatus(error instanceof Error ? error.message : 'Unable to create the PDF.'); }
    finally { if (mounted.current) setPdfBusy(false); }
  };
  const handleExportFile = (format: 'csv' | 'txt') => {
    try {
      assertAccessHistoryExport(live.current.user, live.current.settings);
      const content = format === 'csv' ? accessHistoryCsv(filteredLogs) : accessHistoryText(filteredLogs, currentUser?.name || 'Authorized user');
      downloadReport(content, format === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8', reportName(format));
      setExportStatus(`${format.toUpperCase()} download requested. Check your browser downloads.`);
      logAuditAction(`Exported Access History ${format.toUpperCase()}`, `Downloaded ${filteredLogs.length} filtered records`);
    } catch (error) { setExportStatus(error instanceof Error ? error.message : 'Export permission is required.'); }
  };
  const handleExportCSV = () => handleExportFile('csv');
  const handleExportTXT = () => handleExportFile('txt');

  const handleOpenBulkEmail = () => {
    if (!permissions.canExport) return;
    setSelectedLogForEmail(null);
    setEmailModalOpen(true);
  };

  const handleOpenRowEmail = (log: AuditLog) => {
    if (!permissions.canExport) return;
    setSelectedLogForEmail(log);
    setEmailModalOpen(true);
  };

  const getActionBadgeClass = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('logged in') || act.includes('sign in')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    if (act.includes('logged out') || act.includes('sign out')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
    if (act.includes('sale') || act.includes('payment') || act.includes('receipt')) {
      return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
    }
    if (act.includes('lead') || act.includes('inquire') || act.includes('quote')) {
      return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    }
    if (act.includes('admin') || act.includes('wipe') || act.includes('settings') || act.includes('privilege')) {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('logged in') || act.includes('sign in')) {
      return <LogIn className="w-3.5 h-3.5 text-emerald-400" />;
    }
    if (act.includes('logged out') || act.includes('sign out')) {
      return <LogOut className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (act.includes('sale') || act.includes('receipt')) {
      return <ShoppingBag className="w-3.5 h-3.5 text-teal-400" />;
    }
    if (act.includes('settings') || act.includes('admin')) {
      return <Settings className="w-3.5 h-3.5 text-purple-400" />;
    }
    return <Activity className="w-3.5 h-3.5 text-slate-400" />;
  };

  // Login metrics
  const totalLogins = auditLogs.filter((l) => l.action.toLowerCase().includes('logged in')).length;
  const totalLogouts = auditLogs.filter((l) => l.action.toLowerCase().includes('logged out')).length;
  const totalSalesLogs = auditLogs.filter((l) => l.action.toLowerCase().includes('sale')).length;
  const totalAdminLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes('admin') ||
      l.action.toLowerCase().includes('settings') ||
      l.action.toLowerCase().includes('wipe')
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
              User Access History & Security Audit Logs
            </h1>
            <button
              onClick={() => setHoverHelpPlatform('audit_logs')}
              title="Click for platform guidance & settings"
              className="p-1 rounded-lg text-teal-400 hover:text-teal-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browser-local activity records: user sign-ins, operations and sign-outs. Filter the results before downloading a report.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {permissions.canExport && (
            <>
              <button
                onClick={handleExportPDF}
                disabled={pdfBusy} aria-label="Download access history PDF"
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Download the filtered access-history PDF file"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Export PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
              <button
                onClick={handleExportCSV} aria-label="Download access history CSV"
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Export audit CSV spreadsheet"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
              <button onClick={handleExportTXT} aria-label="Download access history TXT" className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"><FileText className="w-4 h-4 text-teal-400" /> TXT</button>
              {hasFeature('email') && (<button
                onClick={handleOpenBulkEmail}
                className="px-3.5 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Email PDF and CSV export audit trail to any company member or admin"
              >
                <Mail className="w-4 h-4 text-teal-300" />
                <span>Email Audit Trail (PDF / CSV)</span>
              </button>)}
            </>
          )}
        </div>
      </div>

      {exportStatus && <p role="status" className="mb-4 rounded-xl border border-teal-800 bg-teal-950/30 p-3 text-sm text-teal-200">{exportStatus}</p>}
      {permissions.canView && !permissions.canExport && <p className="mb-4 text-sm text-amber-300">You have read-only history access. PDF, TXT, CSV and email exports also require the Export Reports privilege.</p>}
      {!permissions.canView ? (
        <div role="alert" className="max-w-lg mx-auto rounded-2xl border border-amber-800 bg-slate-900 p-7 text-center">
          <Lock className="w-10 h-10 mx-auto mb-3 text-amber-400" />
          <h2 className="font-bold text-xl">Access history is restricted</h2>
          <p className="mt-3 text-sm text-slate-400">An administrator must grant your role Audit Logs access. Downloads additionally require Export Reports. A PIN or a UI unlock button cannot override these permissions.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Audit Metrics Scorecards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Total Actions Logged</span>
                <Activity className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">{auditLogs.length}</div>
              <div className="text-[10px] text-teal-400 mt-0.5">Continuous security trail</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>User Logins Recorded</span>
                <LogIn className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{totalLogins}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Authenticated sessions</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>User Logouts Recorded</span>
                <LogOut className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{totalLogouts}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Gracefully closed sessions</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Sales / Admin Events</span>
                <Settings className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400">{totalSalesLogs + totalAdminLogs}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Business & config updates</div>
            </div>
          </div>

          {/* Search, Action Filter, and Date Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by user name, action, role, details, device or IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedActionFilter}
                onChange={(e) => setSelectedActionFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all">All Action Categories</option>
                <option value="logins">Logins Only</option>
                <option value="logouts">Logouts Only</option>
                <option value="sales">Sales & Checkouts</option>
                <option value="leads">Captured Leads & Quotes</option>
                <option value="admin">Admin & System Changes</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all">All Recorded Dates</option>
                <option value="today">Today's Activity Only</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">User & Role</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Activity Description</th>
                    <th className="py-3 px-4">Device & IP</th>
                    <th className="py-3 px-4 text-center">Action / Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">No audit logs matching criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const dateObj = new Date(log.timestamp);
                      const formattedDate = regionalFormat.date(log.timestamp);
                      const formattedTime = regionalFormat.time(log.timestamp);

                      return (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                            <div>{formattedDate}</div>
                            <div className="text-[10px] text-teal-400">{formattedTime}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-800 text-teal-300 font-bold flex items-center justify-center text-[10px] border border-slate-700">
                                {log.userName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-200">{log.userName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">Role: {log.userRole}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getActionBadgeClass(
                                log.action
                              )}`}
                            >
                              {getActionIcon(log.action)}
                              <span>{log.action}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-200 max-w-md">
                            <div className="line-clamp-2">{log.details}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Laptop className="w-3.5 h-3.5 text-slate-500" />
                              <span className="truncate max-w-[200px]" title={log.ipOrDevice}>
                                {log.ipOrDevice}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            {hasFeature('email') && (<button
                              onClick={() => handleOpenRowEmail(log)} disabled={!permissions.canExport}
                              title="Email this specific audit record to company member or admin"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 border border-slate-700 transition cursor-pointer inline-flex items-center gap-1 text-[10px]"
                            >
                              <Mail className="w-3 h-3 text-teal-400" />
                              <span>Email</span>
                            </button>)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Displaying <strong>{filteredLogs.length}</strong> of <strong>{auditLogs.length}</strong> recorded logs
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Browser-local audit records
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Email Export Modal for Audit Trail */}
      {emailModalOpen && permissions.canExport && (
        <EmailExportModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          title={
            selectedLogForEmail
              ? `Audit Log Record #${selectedLogForEmail.id}`
              : 'System Security & Access Audit Trail'
          }
          moduleName="Audit Trail"
          isSingleRow={Boolean(selectedLogForEmail)}
          entityName={
            selectedLogForEmail
              ? `${selectedLogForEmail.action} (${selectedLogForEmail.userName})`
              : undefined
          }
          availableFormats={['pdf', 'csv', 'txt']}
          data={selectedLogForEmail || formattedAuditData}
          columns={auditColumns}
          metadata={[
            { label: 'Platform Module', value: 'System Security & Audit Trail' },
            {
              label: 'Event Count',
              value: selectedLogForEmail ? '1 Event' : `${filteredLogs.length} Events`,
            },
            { label: 'Generated At', value: regionalFormat.dateTime(new Date()) },
          ]}
        />
      )}
    </div>
  );
};
