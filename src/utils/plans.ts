import type { AppSettings, PlanTier, PlatformId, SettingsSection } from '../types/index.ts';

export const PLAN_TIERS: PlanTier[] = ['free', 'starter', 'pro', 'lifetime'];
export const PLAN_INFO = {
  free: { name: 'Free', term: 'Basic operations', detail: 'Selling, receipts, read-only debt balances in history, inventory without marketing/exports, limited settings and guides.' },
  starter: { name: 'Starter', term: 'Demo paid tier', detail: 'Pro operations except inventory marketing, Business Landing Page, chatbot, messaging and email.' },
  pro: { name: 'Pro', term: 'Monthly subscription model', detail: 'All current workspace features, still subject to role privileges.' },
  lifetime: { name: 'Lifetime', term: 'One-time access model', detail: 'All current features and future feature releases/updates, still subject to role privileges.' },
} as const;
export const FEATURES = [
  'selling', 'receipts', 'sales_history', 'inventory', 'appearance', 'payments', 'regional', 'delete_data', 'about',
  'debts', 'expenses', 'invoices', 'analytics', 'directory', 'company_profile', 'payroll', 'audit', 'data_export', 'inventory_export', 'backup', 'imports', 'privileges',
  'inventory_marketing', 'business_landing', 'chatbot', 'messaging', 'email',
] as const;
export type Feature = typeof FEATURES[number];
const FREE = new Set<Feature>(['selling', 'receipts', 'sales_history', 'inventory', 'appearance', 'payments', 'regional', 'delete_data', 'about']);
const STARTER_EXCLUSIONS = new Set<Feature>(['inventory_marketing', 'business_landing', 'chatbot', 'messaging', 'email']);
export function planTier(settings?: Pick<AppSettings, 'planTier'>): PlanTier {
  return PLAN_TIERS.includes(settings?.planTier as PlanTier) ? settings!.planTier! : 'pro'; // Legacy workspaces keep their existing access.
}
export function hasPlanFeature(tier: PlanTier, feature: Feature): boolean {
  if (!FEATURES.includes(feature)) return false;
  if (tier === 'free') return FREE.has(feature);
  if (tier === 'starter') return !STARTER_EXCLUSIONS.has(feature);
  return tier === 'pro' || tier === 'lifetime'; // Future declared features are automatically included in these plans.
}
export const PLATFORM_FEATURE: Record<PlatformId, Feature> = {
  selling: 'selling', sales_history: 'sales_history', inventory: 'inventory', expenses: 'expenses', invoices: 'invoices', analytics: 'analytics',
  customers: 'directory', vendors: 'directory', transporters: 'directory', marketing_team: 'directory', company_members: 'directory',
  my_company: 'company_profile', messaging: 'messaging', landing_page_builder: 'business_landing', settings: 'appearance', audit_logs: 'audit', about: 'about',
};
export function canOpenPlatform(settings: AppSettings, platform: PlatformId): boolean { return hasPlanFeature(planTier(settings), PLATFORM_FEATURE[platform]); }
export function canOpenSettings(settings: AppSettings, section: SettingsSection): boolean {
  const feature: Record<SettingsSection, Feature> = { payments: 'payments', textSizing: 'appearance', appearance: 'appearance', font: 'appearance', receipts: 'receipts', regional: 'regional', plans: 'appearance', dataEraser: 'delete_data', landingPage: 'business_landing', backup: 'backup', privileges: 'privileges', pdfExcel: 'imports', emailTemplates: 'email', auditLogs: 'audit' };
  return hasPlanFeature(planTier(settings), feature[section]);
}
export function requirePlanFeature(settings: AppSettings, feature: Feature): void {
  if (!hasPlanFeature(planTier(settings), feature)) throw new Error(`${feature.replace(/_/g, ' ')} is not included in the ${PLAN_INFO[planTier(settings)].name} demo plan.`);
}
