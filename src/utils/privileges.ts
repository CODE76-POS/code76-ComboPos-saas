import { ALL_ROLES, type AppSettings, type UserRole } from '../types/index.ts';

export type PrivilegeKey = keyof AppSettings['privileges'][UserRole];

export interface PrivilegeDefinition {
  key: PrivilegeKey;
  label: string;
  shortLabel: string;
  group: 'Selling & receipts' | 'Catalog & money' | 'People & access' | 'Growth & content' | 'System & data';
  description: string;
  /** Group used when deciding a legacy default for an older saved workspace. */
  legacyFallback: PrivilegeKey;
  /** Default for a brand-new role entry when no data exists at all. */
  defaultForNewRole: boolean;
}

export const PRIVILEGE_DEFINITIONS: PrivilegeDefinition[] = [
  { key: 'canSell', label: 'Sell & open the POS terminal', shortLabel: 'Sell', group: 'Selling & receipts', description: 'Build carts, complete sales and create invoices from the terminal.', legacyFallback: 'canSell', defaultForNewRole: false },
  { key: 'canSendReceipts', label: 'Send / download customer receipts', shortLabel: 'Receipts', group: 'Selling & receipts', description: 'Send receipts by email, WhatsApp or SMS and export PDF/TXT/CSV/JSON copies.', legacyFallback: 'canSell', defaultForNewRole: false },
  { key: 'canSettleDebt', label: 'Record customer debt repayments', shortLabel: 'Debt pay', group: 'Selling & receipts', description: 'Post partial or full debt payments against an existing sale or invoice.', legacyFallback: 'canViewInvoices', defaultForNewRole: false },
  { key: 'canViewInventory', label: 'View inventory & services', shortLabel: 'View stock', group: 'Catalog & money', description: 'Open the inventory platform and read product/service pricing and stock.', legacyFallback: 'canViewInventory', defaultForNewRole: false },
  { key: 'canEditInventory', label: 'Create or edit inventory items', shortLabel: 'Edit stock', group: 'Catalog & money', description: 'Add products/services, change prices, descriptions and promotions.', legacyFallback: 'canEditInventory', defaultForNewRole: false },
  { key: 'canAdjustStock', label: 'Adjust stock counts', shortLabel: 'Stock adjust', group: 'Catalog & money', description: 'Post stock adjustments with a reason; falls back to Edit inventory when unset.', legacyFallback: 'canEditInventory', defaultForNewRole: false },
  { key: 'canViewExpenses', label: 'View expenses', shortLabel: 'Expenses', group: 'Catalog & money', description: 'Open the expenses platform and read spending records.', legacyFallback: 'canViewExpenses', defaultForNewRole: false },
  { key: 'canEditExpenses', label: 'Create or edit expenses', shortLabel: 'Edit expense', group: 'Catalog & money', description: 'Record and change expenses, including salary-posted expenses.', legacyFallback: 'canEditExpenses', defaultForNewRole: false },
  { key: 'canViewInvoices', label: 'View invoices & sales history', shortLabel: 'Invoices', group: 'Catalog & money', description: 'Open invoices and sales history, including debt balances.', legacyFallback: 'canViewInvoices', defaultForNewRole: false },
  { key: 'canViewAnalytics', label: 'View analytics & reports', shortLabel: 'Analytics', group: 'Catalog & money', description: 'Open analytics dashboards, forecasts and the debt aging report.', legacyFallback: 'canViewAnalytics', defaultForNewRole: false },
  { key: 'canManagePeople', label: 'Manage people & companies', shortLabel: 'People', group: 'People & access', description: 'Add or edit customers, vendors, transporters, marketers and staff.', legacyFallback: 'canManagePeople', defaultForNewRole: false },
  { key: 'canManageSchedules', label: 'Manage shifts & schedules', shortLabel: 'Schedules', group: 'People & access', description: 'Edit shift presets, working days, off days and holiday-only schedules.', legacyFallback: 'canManagePeople', defaultForNewRole: false },
  { key: 'canViewAuditLogs', label: 'View audit & access logs', shortLabel: 'Audit', group: 'People & access', description: 'Open the audit trail and login history.', legacyFallback: 'canViewAuditLogs', defaultForNewRole: false },
  { key: 'canModifySettings', label: 'Modify system settings', shortLabel: 'Settings', group: 'System & data', description: 'Change payment, receipt, appearance and regional settings.', legacyFallback: 'canModifySettings', defaultForNewRole: false },
  { key: 'canImportCsv', label: 'Import CSV / Excel data', shortLabel: 'Import', group: 'System & data', description: 'Use the validated CSV import pipeline for inventory, people and expenses.', legacyFallback: 'canImportCsv', defaultForNewRole: false },
  { key: 'canExportPdf', label: 'Export reports & backups', shortLabel: 'Export', group: 'System & data', description: 'Download PDF/TXT/CSV reports, access history and JSON backups.', legacyFallback: 'canExportPdf', defaultForNewRole: false },
  { key: 'canEditLandingPage', label: 'Edit the business landing page', shortLabel: 'Page edit', group: 'Growth & content', description: 'Open the merchant business page builder and change its content.', legacyFallback: 'canModifySettings', defaultForNewRole: false },
  { key: 'canManageChatbot', label: 'Configure the business chatbot', shortLabel: 'Chatbot', group: 'Growth & content', description: 'Change the assistant greeting, tone, quick prompts and handoff contact.', legacyFallback: 'canModifySettings', defaultForNewRole: false },
  { key: 'canDeleteData', label: 'Delete platform data', shortLabel: 'Delete data', group: 'System & data', description: 'Wipe one platform database or all business records. Administrators always keep this right.', legacyFallback: 'canModifySettings', defaultForNewRole: false },
];

export const PRIVILEGE_GROUPS = ['Selling & receipts', 'Catalog & money', 'People & access', 'Growth & content', 'System & data'] as const;

/** Reads a privilege, falling back to its documented legacy control when unset. */
export function privilegeValue(
  record: AppSettings['privileges'][UserRole] | undefined,
  key: PrivilegeKey,
): boolean {
  if (!record) return false;
  const direct = record[key];
  if (typeof direct === 'boolean') return direct;
  const definition = PRIVILEGE_DEFINITIONS.find((entry) => entry.key === key);
  if (!definition) return false;
  const fallback = record[definition.legacyFallback];
  return typeof fallback === 'boolean' ? fallback : false;
}

/** Fills in missing role records and missing newer privileges on load. */
export function normalizePrivileges(privileges: AppSettings['privileges'] | undefined): AppSettings['privileges'] {
  const normalized = {} as AppSettings['privileges'];
  for (const role of ALL_ROLES) {
    const existing = privileges?.[role];
    const base = existing
      ? { ...existing }
      : Object.fromEntries(PRIVILEGE_DEFINITIONS.map((definition) => [definition.key, definition.defaultForNewRole]));
    for (const definition of PRIVILEGE_DEFINITIONS) {
      if (typeof (base as Record<string, unknown>)[definition.key] !== 'boolean') {
        (base as Record<string, unknown>)[definition.key] = privilegeValue(base as AppSettings['privileges'][UserRole], definition.key);
      }
    }
    normalized[role] = base as AppSettings['privileges'][UserRole];
  }
  return normalized;
}

export function privilegeDefinition(key: PrivilegeKey): PrivilegeDefinition {
  return PRIVILEGE_DEFINITIONS.find((entry) => entry.key === key)!;
}
