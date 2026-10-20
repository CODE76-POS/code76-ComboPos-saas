import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseAppRoute, PLATFORM_IDS, resolveAppSurface, viewUrl } from '../../src/utils/appRouting.ts';
import { escapeMarkup, isPublicIndexable, PRIVATE_ROBOTS, PUBLIC_ROBOTS, PUBLIC_SITE_META, publicMetaEntries, publicSiteUrl, publicStructuredData, renderPublicSeo, requestSiteUrl, socialImageUrl } from '../../src/utils/siteSeo.ts';

const source = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const template = source('index.html');
const canonical = 'https://shop.example.com/';

for (const authenticated of [false, true]) test(`base URL stays public with authenticated=${authenticated}`, () => {
  assert.deepEqual(parseAppRoute(''), { view: 'landing', platform: 'selling' });
  assert.equal(resolveAppSurface(parseAppRoute(''), authenticated), 'code76');
});
for (const anchor of ['#about', '#features', '#portal-access', '#contact', '#reviews', '#/']) test(`public marketing anchor ${anchor} never opens a merchant screen`, () => {
  assert.equal(resolveAppSurface(parseAppRoute(anchor), true), 'code76');
});
for (const platform of PLATFORM_IDS) test(`/${platform}: explicit internal route, round trip and authentication guard`, () => {
  const route = parseAppRoute(`#/pos/${platform}`);
  assert.deepEqual(route, { view: 'pos', platform });
  assert.equal(resolveAppSurface(route, false), 'code76');
  assert.equal(resolveAppSurface(route, true), platform === 'landing_page_builder' ? 'business' : 'pos');
  const url = new URL(viewUrl('pos', `${canonical}?view=storefront`, platform));
  assert.deepEqual(parseAppRoute(url.hash), route);
  assert.equal(url.searchParams.has('view'), false);
});
for (const hash of ['#/storefront', '#storefront', '#/landing_page_builder', '#/pos/storefront', '#/pos/landing_page_builder/extra', '#//pos/settings', '#/POS/settings', '#/pos/%6canding_page_builder']) test(`invalid or obsolete route ${hash} is public only`, () => {
  assert.equal(resolveAppSurface(parseAppRoute(hash), true), 'code76');
});
test('legacy query links cannot open a standalone merchant page, even with an authenticated user', () => {
  for (const view of ['storefront', 'landing', 'pos', 'landing_page_builder']) {
    const url = new URL(`${canonical}?view=${view}`);
    assert.equal(resolveAppSurface(parseAppRoute(url.hash), true), 'code76');
  }
});
test('return-to-site URL removes both the private hash and the obsolete view parameter', () => {
  const url = new URL(viewUrl('landing', 'https://example.com/preview/?locale=en&view=storefront#/pos/settings'));
  assert.equal(url.pathname, '/preview/'); assert.equal(url.search, '?locale=en'); assert.equal(url.hash, '');
});
test('internal builder is the only business-page JSX entry and has the shared workspace guard', () => {
  const app = source('src/App.tsx');
  assert.match(app, /const authenticatedWorkspace = !!currentUser && activeView === 'pos'/);
  assert.match(app, /authenticatedWorkspace \? renderActivePlatform\(\) : <LandingPage/);
  assert.match(app, /case 'landing_page_builder':\s*return <BusinessStorefrontLandingPage/);
  assert.equal((app.match(/<BusinessStorefrontLandingPage/g) || []).length, 1);
  assert.ok(!app.includes("activeView === 'storefront'"));
  assert.match(app, /authenticatedWorkspace && <>/);
});
test('merchant component checks auth again and cannot count anonymous visits', () => {
  const page = source('src/components/landing/BusinessStorefrontLandingPage.tsx');
  assert.match(page, /if \(!currentUser\) return null/);
  assert.match(page, /if \(!currentUser\) return;\s*setLandingMetrics/);
  assert.ok(!page.includes("viewUrl('storefront'"));
  assert.ok(!page.includes('Share this public store catalog'));
  assert.match(page, /viewUrl\('pos', window.location.href, 'landing_page_builder'\)/);
});
test('all eight merchant section links scroll without overwriting the private hash route', () => {
  const page = source('src/components/landing/BusinessStorefrontLandingPage.tsx');
  const links = page.match(/href="#[^"]+"/g) || [];
  assert.equal(links.length, 8);
  assert.equal((page.match(/href="#[^"]+" onClick=\{scrollToSection\}/g) || []).length, links.length);
});
test('public page has metadata and no guest merchant launch controls', () => {
  const page = source('src/components/landing/LandingPage.tsx');
  assert.match(page, /<PublicLandingMetadata protectedEntry=\{requiresSignIn\}/);
  assert.ok(!page.includes('Storefront Showcase')); assert.ok(!page.includes('View Business Page'));
  assert.ok(!page.includes('https://code76pos.com'));
});
test('router listens to hash and browser history; saved merchant records are not authentication', () => {
  const context = source('src/context/POSContext.tsx');
  assert.match(context, /addEventListener\('hashchange', readRoute\)/);
  assert.match(context, /addEventListener\('popstate', readRoute\)/);
  assert.ok(!context.includes('initial?.currentUser'));
  assert.ok(!context.includes('window.location.search'));
});

for (const url of ['https://shop.example.com/?utm_source=test#/pos/landing_page_builder', 'https://shop.example.com/index.html', 'https://shop.example.com/private/page']) test(`canonical normalization: ${url}`, () => {
  assert.equal(publicSiteUrl(url), canonical);
});
for (const url of [undefined, 'MY_APP_URL', '/', 'javascript:alert(1)', 'file:///etc/passwd', 'https://user:secret@shop.example.com/']) test(`invalid canonical rejected: ${url}`, () => {
  assert.equal(publicSiteUrl(url), '/');
  assert.equal(publicSiteUrl(url, canonical), canonical);
});
for (const url of ['http://localhost:3000/', 'http://127.0.0.1:3000/', 'http://[::1]:3000/', 'https://3000-workspace.e2b.app/']) test(`local or workspace preview is noindex: ${url}`, () => {
  assert.equal(isPublicIndexable(url), false);
});
test('production site may be indexed, but explicit staging opt-out wins', () => {
  assert.equal(isPublicIndexable(canonical), true);
  assert.equal(isPublicIndexable(canonical, 'false'), false);
});
test('proxy-aware fallback never guesses a production domain', () => {
  assert.equal(requestSiteUrl({ host: '127.0.0.1:3000', forwardedHost: '3000-demo.e2b.app', forwardedProto: 'https' }), 'https://3000-demo.e2b.app/');
  assert.equal(requestSiteUrl({ host: 'localhost:3000' }), 'http://localhost:3000/');
  assert.equal(requestSiteUrl({ host: 'localhost:3000' }, canonical), canonical);
});
test('invalid host headers cannot inject markup or credentials into SEO metadata', () => {
  assert.equal(requestSiteUrl({ host: 'localhost:3000', forwardedHost: '\"><script>alert(1)</script>' }), 'http://localhost:3000/');
  assert.equal(requestSiteUrl({ host: 'localhost:3000', forwardedHost: 'user:pass@evil.example' }), 'http://localhost:3000/');
});
test('public head has one canonical, aligned title/description/social tags and correct robots', () => {
  const html = renderPublicSeo(template, canonical, true);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.ok(html.includes(`href="${canonical}"`));
  assert.ok(html.includes(escapeMarkup(PUBLIC_SITE_META.title)));
  for (const [attribute, key, value] of publicMetaEntries(canonical, true)) {
    assert.equal((html.match(new RegExp(`<meta ${attribute}="${key}" `, 'g')) || []).length, 1);
    assert.ok(html.includes(`content="${escapeMarkup(value)}"`), key);
  }
  assert.ok(html.includes(PUBLIC_ROBOTS));
});
test('workspace/staging metadata is noindex and never canonicalizes a private route', () => {
  const html = renderPublicSeo(template, canonical, false);
  assert.ok(html.includes(PRIVATE_ROBOTS));
  assert.ok(!html.includes('#/pos')); assert.ok(!html.includes('landing_page_builder'));
  assert.ok(html.includes('data-public-indexable="false"'));
});
test('structured data describes the actual web app without invented pricing or native-platform claims', () => {
  const schema = publicStructuredData(canonical);
  assert.equal(schema.url, canonical); assert.equal(schema.operatingSystem, 'Web browser');
  assert.equal('offers' in schema, false);
  const html = renderPublicSeo(template, canonical, true);
  const json = html.match(/id="code76-structured-data" type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
  assert.ok(json); assert.deepEqual(JSON.parse(json), schema);
});
test('sharing image is a real local 1200 by 630 PNG, not an external image dependency', () => {
  assert.equal(socialImageUrl(canonical), `${canonical}code76-social-card.png`);
  const image = readFileSync(new URL('../../public/code76-social-card.png', import.meta.url));
  assert.equal(image.subarray(1, 4).toString(), 'PNG'); assert.equal(image.readUInt32BE(16), 1200); assert.equal(image.readUInt32BE(20), 630);
});
test('SEO renderer escapes attributes and rejects an unmarked template', () => {
  assert.equal(escapeMarkup('<a href="x&y">'), '&lt;a href=&quot;x&amp;y&quot;&gt;');
  assert.throws(() => renderPublicSeo('<html></html>', canonical, true), /Missing CODE76 SEO markers/);
});
test('root and index have explicit HTTP handlers, API misses are not swallowed, preview host is allowed', () => {
  const server = source('server.ts');
  assert.match(server, /app.get\(\['\/', '\/index.html'\], sendIndex\)/);
  assert.match(server, /app.use\('\/api', \(_req, res\) => \{ res.status\(404\).json/);
  assert.match(server, /index: false, redirect: false/);
  assert.match(source('vite.config.ts'), /'\.e2b.app'/);
});
