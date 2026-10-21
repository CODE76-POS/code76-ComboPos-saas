/**
 * Sitemap.xml Generator Utility for CODE76 POS
 * Dynamically identifies public application routes to improve SEO ranking for the CODE76 POS landing page.
 */

export interface PublicRouteDefinition {
  path: string;
  hash: string;
  title: string;
  description: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export const PUBLIC_APPLICATION_ROUTES: readonly PublicRouteDefinition[] = [
  {
    path: '/',
    hash: '',
    title: 'CODE76 POS – Enterprise Point of Sale & ERP Software',
    description: 'High-velocity POS and ERP software suite for retail, supermarkets, restaurants, and wholesale distributors with multi-split checkouts.',
    changefreq: 'daily',
    priority: 1.0,
  },
  {
    path: '/',
    hash: '#benefits',
    title: 'Why Choose CODE76 POS – Core Product Benefits & Features',
    description: 'Explore why businesses choose CODE76 POS: sub-second multi-split payments, unified inventory, dual-role staff HR, and live P&L.',
    changefreq: 'weekly',
    priority: 0.9,
  },
  {
    path: '/',
    hash: '#platforms',
    title: '18 Integrated POS Platforms & Modules',
    description: 'Overview of all 18 built-in platforms: selling counter, inventory management, invoicing, expenses, analytics, and CRM directory.',
    changefreq: 'weekly',
    priority: 0.9,
  },
  {
    path: '/',
    hash: '#hardware',
    title: 'POS Hardware Compatibility & Terminals',
    description: 'Hardware compatibility details for touchscreen countertop terminals, 80mm/58mm thermal receipt printers, barcode scanners, and mobile floor tablets.',
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    path: '/',
    hash: '#plans',
    title: 'Pricing Plans & Lifetime Software License',
    description: 'Transparent pricing: Free, Starter, Pro, Max, and Lifetime perpetual license with zero recurring monthly fees.',
    changefreq: 'weekly',
    priority: 0.9,
  },
  {
    path: '/',
    hash: '#contact',
    title: 'Contact Official CODE76 POS Sales & Support Desk',
    description: 'Direct sales inquiries, multi-branch licensing consultations, and technical deployments at code76pos@gmail.com.',
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    path: '/',
    hash: '#portal-access',
    title: 'CODE76 POS Portal Sign In & Business Registration',
    description: 'Secure enterprise authentication and instant business account creation portal.',
    changefreq: 'monthly',
    priority: 0.7,
  },
] as const;

/**
 * Generates standard XML sitemap compliant with sitemaps.org schema
 */
export function generateSitemapXml(baseUrl: string): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const today = new Date().toISOString().split('T')[0];

  const urlEntries = PUBLIC_APPLICATION_ROUTES.map((route) => {
    const loc = route.hash ? `${cleanBaseUrl}/${route.hash}` : `${cleanBaseUrl}/`;
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;
}

/**
 * Escapes characters for safe inclusion in XML
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Client-side utility to download the generated sitemap.xml
 */
export function downloadSitemapXml(baseUrl?: string): void {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://code76pos.com');
  const xml = generateSitemapXml(origin);
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sitemap.xml';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
