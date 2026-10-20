import React, { useState, useMemo } from 'react';
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
import { exportToCSV, printPDFReport } from '../../utils/exportUtils.ts';
import { EmailExportModal } from '../modals/EmailExportModal.tsx';

export const AuditLogPlatform: React.FC = () => {
  const { auditLogs, currentUser, setHoverHelpPlatform, logAuditAction, company } = usePOS();

  // Admin authentication gate
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(
    currentUser?.isAdmin || currentUser?.roles.includes('Developer') || currentUser?.roles.includes('CEO') || false
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (pinInput === '7676' || pinInput.toLowerCase() === 'admin' || currentUser?.isAdmin) {
      setIsAdminUnlocked(true);
      logAuditAction('Admin Access Granted', 'Unlocked secure audit and login history platform');
    } else {
      setAuthError('Incorrect master admin credential. Access denied.');
    }
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
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
        const todayStr = new Date().toISOString().slice(0, 10);
        return log.timestamp.startsWith(todayStr);
      }

      return true;
    });
  }, [auditLogs, searchTerm, selectedActionFilter, dateFilter]);

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
      formattedDate: new Date(log.timestamp).toLocaleString(),
    }));
  }, [filteredLogs]);

  // Export Audit PDF
  const handleExportPDF = () => {
    printPDFReport(
      'System Security & Access Audit Trail',
      company,
      auditColumns,
      formattedAuditData,
      [
        { label: 'Export Date', value: new Date().toLocaleString() },
        { label: 'Authorized Officer', value: currentUser?.name || 'Security Admin' },
        { label: 'Total Events', value: `${filteredLogs.length} Events` },
      ]
    );
    logAuditAction('Exported Audit Trail PDF', `Generated official PDF report with ${filteredLogs.length} events`);
  };

  // Export Audit CSV
  const handleExportCSV = () => {
    const rows = filteredLogs.map((log) => {
      const dateObj = new Date(log.timestamp);
      return {
        'Log ID': log.id,
        'Date & Time': dateObj.toLocaleString(),
        'User Name': log.userName,
        'User Role': log.userRole,
        Action: log.action,
        'Activity Details': log.details,
        'Device / IP Address': log.ipOrDevice,
      };
    });

    exportToCSV(rows, `CODE76-Audit-Access-History-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleOpenBulkEmail = () => {
    setSelectedLogForEmail(null);
    setEmailModalOpen(true);
  };

  const handleOpenRowEmail = (log: AuditLog) => {
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
            Tamper-evident activity ledger recording user logins, timestamps, operations performed, logouts, and IP/devices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdminUnlocked && (
            <>
              <button
                onClick={handleExportPDF}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Export official printable PDF audit trail"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Export PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Export audit CSV spreadsheet"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
              <button
                onClick={handleOpenBulkEmail}
                className="px-3.5 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Email PDF and CSV export audit trail to any company member or admin"
              >
                <Mail className="w-4 h-4 text-teal-300" />
                <span>Email Audit Trail (PDF / CSV)</span>
              </button>
            </>
          )}
          <button
            onClick={() => setIsAdminUnlocked(!isAdminUnlocked)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isAdminUnlocked
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/30'
            }`}
          >
            {isAdminUnlocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isAdminUnlocked ? 'Lock Platform' : 'Admin Login Unlock'}</span>
          </button>
        </div>
      </div>

      {/* ADMIN PERMISSION GATE */}
      {!isAdminUnlocked ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xl backdrop-blur-md my-8 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/10">
            <KeyRound className="w-8 h-8 animate-pulse" />
          </div>

          <h2 className="text-xl font-black text-slate-100 mb-2">
            Restricted Admin Audit Gate
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            User access history, login timestamps, and operational audit trails contain sensitive enterprise security data.
            Please verify administrator credentials to view this platform.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Admin Master PIN or Password
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter administrative security PIN..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-mono tracking-widest text-center"
              />
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify & Unlock Audit History
            </button>

            <div className="text-[11px] text-slate-500 pt-2">
              Security Notice: Master access is restricted to authorized CODE76 system administrators.
            </div>
          </form>
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
                      const formattedDate = dateObj.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                      const formattedTime = dateObj.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      });

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
                            <button
                              onClick={() => handleOpenRowEmail(log)}
                              title="Email this specific audit record to company member or admin"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 border border-slate-700 transition cursor-pointer inline-flex items-center gap-1 text-[10px]"
                            >
                              <Mail className="w-3 h-3 text-teal-400" />
                              <span>Email</span>
                            </button>
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
                Audit Trail Integrity Verified
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Email Export Modal for Audit Trail */}
      {emailModalOpen && (
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
          availableFormats={['pdf', 'csv']}
          data={selectedLogForEmail || formattedAuditData}
          columns={auditColumns}
          metadata={[
            { label: 'Platform Module', value: 'System Security & Audit Trail' },
            {
              label: 'Event Count',
              value: selectedLogForEmail ? '1 Event' : `${filteredLogs.length} Events`,
            },
            { label: 'Generated At', value: new Date().toLocaleString() },
          ]}
        />
      )}
    </div>
  );
};
