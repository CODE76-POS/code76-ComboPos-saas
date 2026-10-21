export const PUBLIC_SITE_META = Object.freeze({
  title: 'CODE76 POS — Point of Sale, Inventory & Business Management',
  description: 'Manage sales, inventory, invoices and business reporting with CODE76 POS. Explore the platform, then sign in or create an account for your business.',
  keywords: 'CODE76 POS, point of sale, inventory management, retail POS, business management, invoicing, sales reporting',
  imagePath: 'code76-social-card.png',
  imageAlt: 'CODE76 POS — Sales, inventory and business management',
  themeColor: '#0d9488',
});

export const PUBLIC_ROBOTS = 'index, follow, max-image-preview:large';
export const PRIVATE_ROBOTS = 'noindex, nofollow';
const START = '<!-- code76:seo:start -->';
const END = '<!-- code76:seo:end -->';

/** Only a valid HTTP(S) root can be canonical. No guessed production domain,
 * credentials, tracking parameters or private route fragments are published.
 */
export function publicSiteUrl(candidate: string | undefined, fallback = '/'): string {
  if (!candidate) return fallback;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return fallback;
    url.pathname = '/';
    url.search = '';
    url.hash = '';
    return url.href;
  } catch { return fallback; }
}

/** Use a configured public origin when available; otherwise reflect a validated request
 * origin. Pin PUBLIC_SITE_URL in production to avoid relying on proxy host headers.
 */
export function requestSiteUrl(headers: { host?: string; forwardedHost?: string; forwardedProto?: string; encrypted?: boolean }, configured?: string): string {
  const configuredUrl = publicSiteUrl(configured, '');
  if (configuredUrl) return configuredUrl;
  const protocol = headers.forwardedProto?.split(',')[0].trim() === 'https' || headers.encrypted ? 'https' : 'http';
  const authority = (value?: string) => {
    const first = value?.split(',')[0].trim();
    return first && /^[a-zA-Z0-9.:[\]-]+$/.test(first) ? first : undefined;
  };
  const host = authority(headers.forwardedHost) || authority(headers.host) || 'localhost';
  return publicSiteUrl(`${protocol}://${host}/`, 'http://localhost/');
}

/** Workspace previews and local servers should not compete with the real site in search. */
export function isPublicIndexable(canonical: string, indexingSetting?: string): boolean {
  if (indexingSetting === 'false') return false;
  try {
    const hostname = new URL(canonical).hostname.toLowerCase();
    return !['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(hostname)
      && !hostname.endsWith('.localhost') && hostname !== 'e2b.app' && !hostname.endsWith('.e2b.app');
  } catch { return false; }
}

export function escapeMarkup(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');
}

export function socialImageUrl(canonical: string): string {
  try { return new URL(PUBLIC_SITE_META.imagePath, canonical).href; }
  catch { return `/${PUBLIC_SITE_META.imagePath}`; }
}

export function publicStructuredData(canonical: string) {
  return {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    name: 'CODE76 POS', applicationCategory: 'BusinessApplication', operatingSystem: 'Web browser',
    url: canonical, description: PUBLIC_SITE_META.description,
    publisher: { '@type': 'Organization', name: 'CODE76 POS' },
  };
}

/** Shared by the HTTP shell and the client so title/canonical/social tags agree. */
export function publicMetaEntries(canonical: string, indexable: boolean): [string, string, string][] {
  return [
    ['name', 'description', PUBLIC_SITE_META.description],
    ['name', 'keywords', PUBLIC_SITE_META.keywords],
    ['name', 'robots', indexable ? PUBLIC_ROBOTS : PRIVATE_ROBOTS],
    ['name', 'theme-color', PUBLIC_SITE_META.themeColor],
    ['property', 'og:site_name', 'CODE76 POS'], ['property', 'og:type', 'website'],
    ['property', 'og:title', PUBLIC_SITE_META.title], ['property', 'og:description', PUBLIC_SITE_META.description],
    ['property', 'og:url', canonical], ['property', 'og:image', socialImageUrl(canonical)],
    ['property', 'og:image:alt', PUBLIC_SITE_META.imageAlt],
    ['property', 'og:image:width', '1200'], ['property', 'og:image:height', '630'],
    ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:title', PUBLIC_SITE_META.title],
    ['name', 'twitter:description', PUBLIC_SITE_META.description], ['name', 'twitter:image', socialImageUrl(canonical)],
    ['name', 'twitter:image:alt', PUBLIC_SITE_META.imageAlt],
  ];
}

export function renderPublicSeo(html: string, canonical: string, indexable: boolean): string {
  const start = html.indexOf(START), end = html.indexOf(END);
  if (start === -1 || end < start) throw new Error('Missing CODE76 SEO markers in index.html');
  const tags = publicMetaEntries(canonical, indexable)
    .map(([attribute, key, value]) => `<meta ${attribute}="${key}" content="${escapeMarkup(value)}" />`).join('\n    ');
  const json = JSON.stringify(publicStructuredData(canonical)).replace(/</g, '\\u003c');
  const block = `${START}\n    <title>${escapeMarkup(PUBLIC_SITE_META.title)}</title>\n    ${tags}\n    <link rel="canonical" href="${escapeMarkup(canonical)}" data-public-site="${escapeMarkup(canonical)}" data-public-indexable="${indexable}" />\n    <script id="code76-structured-data" type="application/ld+json">${json}</script>\n    ${END}`;
  return html.slice(0, start) + block + html.slice(end + END.length);
}

/** Upsert instead of appending: hash navigation must not create duplicate head tags. */
export function applyDocumentSeo(doc: Document, privateRoute: boolean, businessPage = false): void {
  const existing = doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const canonical = publicSiteUrl(existing?.dataset.publicSite || existing?.href, publicSiteUrl(doc.location.href));
  const indexable = !privateRoute && existing?.dataset.publicIndexable !== 'false' && isPublicIndexable(canonical) && isPublicIndexable(doc.location.origin);
  doc.title = privateRoute ? (businessPage ? 'Business Landing Page | CODE76 POS — Private Workspace' : 'CODE76 POS — Private Workspace') : PUBLIC_SITE_META.title;
  for (const [attribute, key, publicValue] of publicMetaEntries(canonical, indexable)) {
    const selector = `meta[${attribute}="${key}"]`;
    const matches = [...doc.head.querySelectorAll<HTMLMetaElement>(selector)];
    const meta = matches.shift() || doc.head.appendChild(doc.createElement('meta'));
    matches.forEach(duplicate => duplicate.remove());
    meta.setAttribute(attribute, key);
    meta.content = privateRoute && (key === 'og:title' || key === 'twitter:title') ? doc.title : publicValue;
  }
  const link = existing || doc.head.appendChild(doc.createElement('link'));
  link.rel = 'canonical'; link.href = canonical;
  link.dataset.publicSite = canonical;
  if (!link.dataset.publicIndexable) link.dataset.publicIndexable = String(isPublicIndexable(canonical));
  doc.head.querySelectorAll('link[rel="canonical"]').forEach(duplicate => { if (duplicate !== link) duplicate.remove(); });
  const script = doc.getElementById('code76-structured-data');
  if (privateRoute) { script?.remove(); }
  else {
    const schema = script || doc.head.appendChild(doc.createElement('script'));
    schema.id = 'code76-structured-data'; schema.setAttribute('type', 'application/ld+json');
    schema.textContent = JSON.stringify(publicStructuredData(canonical)).replace(/</g, '\\u003c');
  }
}
