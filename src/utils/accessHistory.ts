import { CODE76_CREDIT_TEXT, CODE76_EXPORT_FIELDS, withBackupCredit } from '../config/code76Brand.ts';
import { hasPlanFeature, planTier } from './plans.ts';
import type { AppSettings, AuditLog, AuthUser } from '../types/index.ts';

/** Match the app's existing union-of-active-roles policy. A UI unlock toggle,
 * a master PIN, or membership of a named role alone cannot grant access.
 */
export function accessHistoryPermissions(user: AuthUser | null, settings: AppSettings) {
  const paidAccess = hasPlanFeature(planTier(settings),'audit');
  const granted = (key: 'canViewAuditLogs' | 'canExportPdf') => paidAccess && !!user && (user.isAdmin === true || user.roles.some(role => settings.privileges[role]?.[key] === true));
  const canView = granted('canViewAuditLogs');
  return { canView, canExport: canView && granted('canExportPdf') };
}
export function assertAccessHistoryExport(user: AuthUser | null, settings: AppSettings): void {
  if (!accessHistoryPermissions(user, settings).canExport) throw new Error('Access-history export requires an administrator or both Audit Logs and Export Reports privileges.');
}

export const AUDIT_EXPORT_HEADERS = ['Log ID', 'Timestamp (ISO)', 'User', 'Role', 'Action', 'Details', 'Device / IP'] as const;
export function auditExportRows(logs: readonly AuditLog[]): string[][] {
  return logs.map(log => [log.id, log.timestamp, log.userName, log.userRole, log.action, log.details, log.ipOrDevice].map(value => String(value ?? '')));
}
/** Quote RFC 4180 cells, including newlines, and prevent spreadsheet formula execution. */
export function safeCsvCell(value: string): string {
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function accessHistoryCsv(logs: readonly AuditLog[]): string {
  return '\uFEFF' + [[...AUDIT_EXPORT_HEADERS,...Object.keys(CODE76_EXPORT_FIELDS)], ...auditExportRows(logs).map(row=>[...row,...Object.values(CODE76_EXPORT_FIELDS)])].map(row => row.map(safeCsvCell).join(',')).join('\r\n') + '\r\n';
}
export function accessHistoryText(logs: readonly AuditLog[], officer: string, generatedAt = new Date().toISOString()): string {
  const header = `CODE76 POS — User access history\nGenerated: ${generatedAt}\nExported by: ${JSON.stringify(officer)}\nFiltered records: ${logs.length}\nBrowser-local activity records; not a tamper-proof server audit.\n`;
  return header + auditExportRows(logs).map((row, index) => `\n--- Record ${index + 1} ---\n` + AUDIT_EXPORT_HEADERS.map((label, i) => `${label}: ${JSON.stringify(row[i])}`).join('\n')).join('\n') + `\n\n${CODE76_CREDIT_TEXT}\n`;
}

export function downloadReport(data: BlobPart, mime: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  // Do not revoke immediately: browsers may still be reading the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Full JSON backups must not become a parallel access-history export bypass. */
export function permittedBackup(serialized: string, user: AuthUser | null, settings: AppSettings): string {
  const state = JSON.parse(serialized);
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw new Error('The saved backup is not a valid POS object.');
  if (!accessHistoryPermissions(user, settings).canExport) delete state.auditLogs;
  const canAdminister = user && (user.isAdmin || user.roles.some(role=>settings.privileges[role]?.canModifySettings));
  if(!canAdminister)delete state.teamServiceBriefs;
  const canManage = user && (user.isAdmin || user.roles.some(role=>settings.privileges[role]?.canManagePeople));
  if (!canManage) { delete state.salaryPayments; for (const key of ['customers','vendors','transporters','marketingTeam','companyMembers','relatedCompanies']) if(Array.isArray(state[key])) state[key]=state[key].map(({salaryRate,salaryBasis,...record}:Record<string,unknown>)=>record); }
  const canViewExpenses = user && (user.isAdmin || user.roles.some(role=>settings.privileges[role]?.canViewExpenses));
  if(!canManage && !canViewExpenses && Array.isArray(state.expenses)) state.expenses=state.expenses.filter((expense:{category?:string;salaryPaymentId?:string})=>expense.category!=='Salaries'&&!expense.salaryPaymentId);
  return JSON.stringify(withBackupCredit(state), null, 2);
}
