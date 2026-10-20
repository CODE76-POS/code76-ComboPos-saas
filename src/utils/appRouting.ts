import type { PlatformId } from '../types/index.ts';

export type AppView = 'landing' | 'pos';
export interface AppRoute { view: AppView; platform: PlatformId }

export const PLATFORM_IDS: readonly PlatformId[] = [
  'selling', 'sales_history', 'inventory', 'expenses', 'invoices', 'analytics',
  'customers', 'vendors', 'transporters', 'marketing_team', 'company_members',
  'my_company', 'messaging', 'landing_page_builder', 'settings', 'audit_logs', 'about',
];

/** The base URL is ALWAYS public, regardless of the current authentication state.
 * Only explicit /pos hashes request an internal screen. Legacy ?view=storefront
 * and ordinary marketing section anchors cannot select a merchant page.
 */
export function parseAppRoute(hash: string): AppRoute {
  const path = hash.replace(/^#/, '').split('?')[0].replace(/\/+$/, '');
  if (path === '/pos') return { view: 'pos', platform: 'selling' };
  const platform = /^\/pos\/([^/]+)$/.exec(path)?.[1] as PlatformId | undefined;
  if (platform && PLATFORM_IDS.includes(platform)) return { view: 'pos', platform };
  return { view: 'landing', platform: 'selling' };
}

/** This is an application rendering guard, not server-side authentication. */
export function resolveAppSurface(route: AppRoute, authenticated: boolean): 'code76' | 'pos' | 'business' {
  if (route.view !== 'pos' || !authenticated) return 'code76';
  return route.platform === 'landing_page_builder' ? 'business' : 'pos';
}

/** Keep deployment paths and unrelated parameters; never generate a public storefront URL. */
export function viewUrl(view: AppView, href: string, platform: PlatformId = 'selling'): string {
  const url = new URL(href);
  url.searchParams.delete('view');
  url.hash = view === 'pos' ? `/pos${platform === 'selling' ? '' : `/${platform}`}` : '';
  return url.toString();
}
