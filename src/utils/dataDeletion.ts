/**
 * Registry of the platform databases the merchant can delete independently.
 * Shared by the Data Deletion Center and the user manual so descriptions,
 * counts and warning copy stay in one place.
 */

export type DatasetKey =
  | 'products'
  | 'sales'
  | 'invoices'
  | 'expenses'
  | 'customers'
  | 'vendors'
  | 'transporters'
  | 'marketingTeam'
  | 'companyMembers'
  | 'relatedCompanies'
  | 'salaryPayments'
  | 'reviews'
  | 'landingMetrics'
  | 'teamServiceBriefs'
  | 'auditLogs'
  | 'settings';

export interface DatasetDefinition {
  key: DatasetKey;
  label: string;
  platform: string;
  description: string;
  /** The related platform screen, used for a deep link in the UI. */
  platformId?: string;
  /** Wiping this record type also clears dependent counters. */
  cascades?: DatasetKey[];
  risk: 'low' | 'medium' | 'high';
}

export const DATASET_DEFINITIONS: DatasetDefinition[] = [
  { key: 'products', label: 'Inventory & services', platform: 'Inventory', platformId: 'inventory', description: 'Products, services, pricing, promo flags, stock counts and categories.', risk: 'high' },
  { key: 'sales', label: 'Sales & receipts', platform: 'Sales History', platformId: 'sales_history', description: 'Completed sales, payment splits, debt balances and repayment history.', risk: 'high' },
  { key: 'invoices', label: 'Invoices', platform: 'Invoices', platformId: 'invoices', description: 'Sales invoices and stock-purchase invoices, including their snapshots.', risk: 'high' },
  { key: 'expenses', label: 'Expenses', platform: 'Expenses', platformId: 'expenses', description: 'Operating expenses, supplier bills and salary-linked expense entries.', risk: 'high' },
  { key: 'customers', label: 'Customers', platform: 'Customers', platformId: 'customers', description: 'Customer directory records, contacts and referral counters.', risk: 'medium' },
  { key: 'vendors', label: 'Vendors & suppliers', platform: 'Vendors', platformId: 'vendors', description: 'Supplier companies, branches and their contact records.', risk: 'medium' },
  { key: 'transporters', label: 'Transporters', platform: 'Transporters', platformId: 'transporters', description: 'Drivers, freight companies and transport contacts.', risk: 'medium' },
  { key: 'marketingTeam', label: 'Marketing team', platform: 'Marketing', platformId: 'marketing_team', description: 'Marketers, agencies and attributed referral records.', risk: 'medium' },
  { key: 'companyMembers', label: 'Company members & staff', platform: 'Company Members', platformId: 'company_members', description: 'Staff profiles, dual roles, shift and salary-rate definitions.', risk: 'medium' },
  { key: 'relatedCompanies', label: 'Related companies & branches', platform: 'My Company', platformId: 'my_company', description: 'Utility, supplier and branch companies linked to directories.', risk: 'medium' },
  { key: 'salaryPayments', label: 'Salary payments', platform: 'Company Members', platformId: 'company_members', description: 'Dated payroll payment records. Linked expense entries stay in Expenses.', risk: 'high' },
  { key: 'reviews', label: 'Customer reviews', platform: 'Business page', platformId: 'landing_page_builder', description: 'Captured feedback and the approval flags used on the business page.', risk: 'medium' },
  { key: 'landingMetrics', label: 'Landing page metrics', platform: 'Analytics', platformId: 'analytics', description: 'Visitor, chatbot, lead and referral counters for the merchant page.', risk: 'low' },
  { key: 'teamServiceBriefs', label: 'CODE76 service briefs', platform: 'Settings', description: 'Local drafts created in CODE76 Team Services. Nothing is sent or queued.', risk: 'low' },
  { key: 'auditLogs', label: 'Audit & access logs', platform: 'Audit Logs', platformId: 'audit_logs', description: 'The local access history. Deleting it removes accountability evidence.', risk: 'high' },
  { key: 'settings', label: 'System settings', platform: 'Settings', description: 'Resets payments, receipts, chatbot, landing page, appearance and privileges to defaults. Plan tier and regional preferences are kept.', risk: 'high' },
];

export const DATASET_KEYS = DATASET_DEFINITIONS.map((definition) => definition.key);

export interface DatasetCounts {
  products: number;
  sales: number;
  invoices: number;
  expenses: number;
  customers: number;
  vendors: number;
  transporters: number;
  marketingTeam: number;
  companyMembers: number;
  relatedCompanies: number;
  salaryPayments: number;
  reviews: number;
  landingMetrics: number;
  teamServiceBriefs: number;
  auditLogs: number;
  settings: number;
}

export function countDataset(key: DatasetKey, counts: DatasetCounts): number {
  return counts[key] ?? 0;
}

export function countSelectedDatasets(keys: DatasetKey[], counts: DatasetCounts): number {
  return keys.reduce((total, key) => total + countDataset(key, counts), 0);
}

/** Total records that a selection would remove, including cascaded record types. */
export function expandedSelection(keys: DatasetKey[]): DatasetKey[] {
  const expanded = new Set<DatasetKey>(keys);
  let changed = true;
  while (changed) {
    changed = false;
    for (const definition of DATASET_DEFINITIONS) {
      if (!expanded.has(definition.key)) continue;
      for (const cascade of definition.cascades || []) {
        if (!expanded.has(cascade)) { expanded.add(cascade); changed = true; }
      }
    }
  }
  return DATASET_KEYS.filter((key) => expanded.has(key));
}

export function describeSelection(keys: DatasetKey[]): string {
  if (keys.length === 0) return 'No platform selected';
  if (keys.length === DATASET_KEYS.length) return 'Every platform database';
  const labels = DATASET_DEFINITIONS.filter((definition) => keys.includes(definition.key)).map((definition) => definition.label);
  return labels.length > 4 ? `${labels.slice(0, 4).join(', ')} and ${labels.length - 4} more` : labels.join(', ');
}
