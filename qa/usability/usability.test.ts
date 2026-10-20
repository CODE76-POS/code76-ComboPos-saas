import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applicationUrl, copyTextToClipboard, isWorkspacePreview } from '../../src/utils/clipboard.ts';
import { DEFAULT_SERVICE_UNIT, parseServiceUnit, quantityWithUnit, SERVICE_UNITS, serviceUnitLabel } from '../../src/utils/serviceUnits.ts';
import { emptyStarterProduct, makeStarterProduct } from '../../src/utils/onboarding.ts';
import { accessHistoryPermissions, assertAccessHistoryExport, accessHistoryCsv, accessHistoryText, permittedBackup, safeCsvCell } from '../../src/utils/accessHistory.ts';
import { accessHistoryPdf } from '../../src/utils/accessHistoryPdf.ts';
import { CODE76_PLATFORMS } from '../../src/config/code76Platforms.ts';
import { INITIAL_SETTINGS } from '../../src/data/initialData.ts';
import type { AppSettings, AuditLog, AuthUser } from '../../src/types/index.ts';

const source = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const user: AuthUser = { id: 'TEST-user', name: 'TEST Wanjikũ', email: 'qa@example.test', roles: ['Cashier', 'Associate'], isAdmin: false };
const settings = (): AppSettings => {
  const copy = structuredClone(INITIAL_SETTINGS);
  for (const privilege of Object.values(copy.privileges)) { privilege.canViewAuditLogs = false; privilege.canExportPdf = false; }
  return copy;
};
const logs: AuditLog[] = [{ id: 'TEST-1', userId: 'TEST-user', timestamp: '2026-10-20T09:00:00.000Z', userName: 'TEST José – Wanjikũ', userRole: 'Cashier', action: 'User Logged In', details: 'TEST quoted "value", line one\nline two', ipOrDevice: 'TEST browser' }];

test('clipboard success is awaited and fallback is not called', async () => {
  let finish!: () => void, settled = false, fallback = 0;
  const pending = copyTextToClipboard('TEST link', { write: () => new Promise<void>(resolve => { finish = resolve; }), fallback: () => { fallback++; return true; } }).then(result => { settled = true; return result; });
  await Promise.resolve(); assert.equal(settled, false); finish();
  assert.deepEqual(await pending, { ok: true, method: 'clipboard' }); assert.equal(fallback, 0);
});
test('blocked modern clipboard falls back to a real successful legacy copy', async () => {
  let received = '';
  const result = await copyTextToClipboard('TEST exact URL', { write: async () => { throw new Error('iframe permission denied'); }, fallback: text => { received = text; return true; } });
  assert.deepEqual(result, { ok: true, method: 'fallback' }); assert.equal(received, 'TEST exact URL');
});
test('missing modern clipboard can use the legacy copy path', async () => assert.deepEqual(await copyTextToClipboard('TEST', { fallback: () => true }), { ok: true, method: 'fallback' }));
test('no clipboard APIs never claims the link was copied', async () => assert.deepEqual(await copyTextToClipboard('TEST', {}), { ok: false, method: 'manual' }));
test('rejected/false clipboard paths require manual selection rather than false success', async () => assert.deepEqual(await copyTextToClipboard('TEST', { write: async () => { throw new Error('denied'); }, fallback: () => false }), { ok: false, method: 'manual' }));
test('exceptions from both clipboard mechanisms still produce a usable manual fallback', async () => assert.deepEqual(await copyTextToClipboard('TEST', { write: async () => { throw 1; }, fallback: () => { throw 2; } }), { ok: false, method: 'manual' }));
test('empty text is not copied or reported successful', async () => assert.equal((await copyTextToClipboard('', { write: async () => { throw new Error('must not call'); } })).ok, false));
test('copy field exposes read-only selectable text, status and keyboard-copy instructions', () => {
  const field = source('src/components/common/LinkCopyField.tsx');
  assert.match(field, /await copyTextToClipboard\(value\)/); assert.match(field, /result.ok \? 'copied' : 'manual'/);
  assert.ok(field.includes('readOnly value={value}')); assert.ok(field.includes('Ctrl+C')); assert.ok(field.includes('Command+C')); assert.match(field, /role="status"/);
});
test('app link strips authentication tokens, userinfo, query and private hashes', () => {
  assert.equal(applicationUrl('https://name:secret@5173-test.e2b.app/index.html?token=SECRET&view=storefront#/pos/landing_page_builder'), 'https://5173-test.e2b.app/');
});
test('app link supports a configured base path but never another origin', () => {
  assert.equal(applicationUrl('https://example.com/#/pos', '/preview/'), 'https://example.com/preview/');
  assert.equal(applicationUrl('https://example.com/#/pos', '//attacker.example/'), 'https://example.com/');
  assert.throws(() => applicationUrl('javascript:alert(1)'));
});
test('workspace links are identified for an honest host-authorization warning', () => {
  assert.equal(isWorkspacePreview('https://5173-test.e2b.app/'), true); assert.equal(isWorkspacePreview('https://example.com/'), false);
});
test('navbar contains app link and session access, not the removed public-site/logout/theme actions', () => {
  const nav = source('src/components/navigation/TopNavBar.tsx');
  assert.ok(nav.includes('label="App link"')); assert.ok(nav.includes('Active user session and access controls'));
  assert.ok(!nav.includes('CODE76 Site')); assert.ok(!nav.includes('onClick={logoutUser}')); assert.ok(!nav.includes('toggleTheme'));
  assert.ok(nav.includes('authorized Arena preview access'));
});

for (const unit of SERVICE_UNITS) test(`service quantity basis ${unit.label} round-trips and formats correctly`, () => {
  assert.equal(parseServiceUnit(unit.label), unit.value); assert.equal(parseServiceUnit(unit.value), unit.value);
  const item = { type: 'service' as const, serviceUnit: unit.value };
  assert.equal(serviceUnitLabel(item), unit.label); assert.equal(quantityWithUnit(1, item), `1 ${unit.singular}`); assert.equal(quantityWithUnit(2, item), `2 ${unit.plural}`);
});
test('new hourly starter service stores its billing unit without fictitious stock', () => {
  const item = makeStarterProduct({ ...emptyStarterProduct(), name: 'TEST hourly repair', type: 'service', sellingPrice: '250', serviceUnit: 'hour', stock: '9999' });
  assert.equal(item.serviceUnit, 'hour'); assert.equal(item.stock, 0); assert.equal(item.minStockAlert, 0); assert.equal(item.sellingPrice, 250);
});
test('product stock semantics are unchanged and no service unit is attached', () => {
  const item = makeStarterProduct({ ...emptyStarterProduct(), name: 'TEST product', sellingPrice: '10', stock: '8', serviceUnit: 'day' });
  assert.equal(item.stock, 8); assert.equal(item.serviceUnit, undefined); assert.equal(quantityWithUnit(8, item), '8 units');
});
test('legacy services have a safe editable task-completion display default', () => { assert.equal(DEFAULT_SERVICE_UNIT, 'task'); assert.equal(serviceUnitLabel({ type: 'service' }), 'Per task completion'); });
test('invalid explicitly supplied service units are rejected rather than changing the rate basis', () => {
  assert.equal(parseServiceUnit('not-a-unit'), undefined);
  assert.throws(() => makeStarterProduct({ ...emptyStarterProduct(), name: 'TEST service', type: 'service', sellingPrice: '10', serviceUnit: 'bogus' as any }), /supported service billing unit/);
});
test('both inventory entry paths expose service unit selection; new services are not 9999 stock', () => {
  assert.ok(source('src/components/modals/InventoryEntryModal.tsx').includes('Service quantity / billing unit'));
  assert.ok(source('src/components/modals/CompanyQAOnboardingModal.tsx').includes('Service quantity / billing unit'));
  assert.ok(!source('src/components/modals/InventoryEntryModal.tsx').includes("stock: itemType === 'service' ? 9999"));
});

test('unauthenticated users cannot view or export history', () => assert.deepEqual(accessHistoryPermissions(null, settings()), { canView: false, canExport: false }));
test('no privilege means no view or export, regardless of a UI unlock', () => assert.deepEqual(accessHistoryPermissions(user, settings()), { canView: false, canExport: false }));
test('admins may view and export even when role flags are false', () => assert.deepEqual(accessHistoryPermissions({ ...user, isAdmin: true }, settings()), { canView: true, canExport: true }));
test('view-only privilege does not grant file export', () => {
  const prefs = settings(); prefs.privileges.Cashier.canViewAuditLogs = true;
  assert.deepEqual(accessHistoryPermissions(user, prefs), { canView: true, canExport: false });
});
test('export flag alone cannot expose access history', () => {
  const prefs = settings(); prefs.privileges.Cashier.canExportPdf = true;
  assert.deepEqual(accessHistoryPermissions(user, prefs), { canView: false, canExport: false });
});
test('both required privileges allow delegated non-admin history exports', () => {
  const prefs = settings(); prefs.privileges.Cashier.canViewAuditLogs = true; prefs.privileges.Cashier.canExportPdf = true;
  assert.deepEqual(accessHistoryPermissions(user, prefs), { canView: true, canExport: true }); assert.doesNotThrow(() => assertAccessHistoryExport(user, prefs));
});
test('secondary active roles can grant privileges consistently with POS context', () => {
  const prefs = settings(); prefs.privileges.Associate.canViewAuditLogs = true; prefs.privileges.Associate.canExportPdf = true;
  assert.equal(accessHistoryPermissions(user, prefs).canExport, true);
});
test('a named CEO role without admin status or granted privileges does not bypass the policy', () => {
  assert.equal(accessHistoryPermissions({ ...user, roles: ['CEO', 'Associate'] }, settings()).canView, false);
});
test('export authorization fails closed when rights are revoked', () => {
  const prefs = settings(); assert.throws(() => assertAccessHistoryExport(user, prefs), /requires an administrator/); assert.throws(() => assertAccessHistoryExport(null, prefs));
});
test('audit no longer has a PIN or click-to-unlock backdoor and rechecks pending PDF downloads', () => {
  const page = source('src/components/platforms/AuditLogPlatform.tsx');
  assert.ok(!page.includes('setIsAdminUnlocked')); assert.ok(!page.includes('7676')); assert.ok(!page.includes('handleUnlock'));
  assert.ok(page.includes('assertAccessHistoryExport(live.current.user, live.current.settings)'));
  assert.ok(page.includes('!mounted.current || live.current.user?.id !== session.user?.id'));
});
test('session dialog locates history/downloads and handles sign-out inside the widget', () => {
  const page = source('src/components/modals/LoginModal.tsx');
  assert.ok(page.includes('Access-history tip')); assert.ok(page.includes('PDF, TXT or CSV')); assert.ok(page.includes('onClick={handleLogout}'));
  assert.ok(page.includes('historyAccess.canView')); assert.ok(page.includes('historyAccess.canExport')); assert.ok(page.includes('App Appearance Settings'));
});
test('all three history entry points use the same guarded component', () => {
  assert.ok(source('src/components/platforms/SettingsPlatform.tsx').includes('<AuditLogPlatform />'));
  assert.ok(source('src/components/platforms/AboutPlatform.tsx').includes('<AuditLogPlatform />'));
  assert.ok(!source('src/components/platforms/AboutPlatform.tsx').includes('printPDFReport('));
});
test('non-admins cannot save a modified permission map or open role-grant controls', () => {
  const page = source('src/components/platforms/SettingsPlatform.tsx');
  assert.ok(page.includes("activeTab === 'privileges' && !currentUser?.isAdmin"));
  assert.ok(page.includes('privileges: settings.privileges')); assert.ok(page.includes('Export Reports privilege'));
});
test('full backup cannot bypass restricted history export', () => {
  const serialized = JSON.stringify({ company: { name: 'TEST merchant' }, products: [], auditLogs: logs });
  const restricted = JSON.parse(permittedBackup(serialized, user, settings()));
  assert.equal('auditLogs' in restricted, false); assert.equal(restricted.company.name, 'TEST merchant');
  const allowed = JSON.parse(permittedBackup(serialized, { ...user, isAdmin: true }, settings()));
  assert.deepEqual(allowed.auditLogs, logs); assert.equal(JSON.parse(serialized).auditLogs.length, 1);
});
for (const cell of ['=HYPERLINK("bad")', '+cmd', '-10+cmd', '@SUM(A1)', '  =SUM(A1)', '\t=2+2']) test(`history CSV neutralizes formula-like value ${JSON.stringify(cell)}`, () => assert.ok(safeCsvCell(cell).startsWith('"\'')));
test('CSV preserves Unicode and quotes newlines, commas and quotation marks', () => {
  const csv = accessHistoryCsv(logs);
  assert.ok(csv.startsWith('\uFEFF"Log ID"')); assert.ok(csv.includes('TEST José – Wanjikũ'));
  assert.ok(csv.includes('"TEST quoted ""value"", line one\nline two"'));
});
test('empty CSV retains headers and TXT retains export metadata', () => {
  assert.ok(accessHistoryCsv([]).includes('"Timestamp (ISO)"'));
  assert.ok(accessHistoryText([], 'TEST officer').includes('Filtered records: 0'));
});
test('TXT escapes embedded newlines in record values without dropping Unicode', () => {
  const text = accessHistoryText(logs, 'TEST officer', '2026-10-20T09:00:00Z');
  assert.ok(text.includes('TEST José – Wanjikũ')); assert.ok(text.includes(JSON.stringify(logs[0].details)));
});
test('PDF is a real downloadable, Unicode-font, paginated document rather than a print-window placeholder', async () => {
  const many = Array.from({ length: 45 }, (_, index) => ({ ...logs[0], id: `TEST-${index}`, details: 'TEST pagination and café / Wanjikũ '.repeat(6) }));
  const font = readFileSync(new URL('../../public/fonts/audit-sans.ttf', import.meta.url)).toString('base64');
  const pdf = await accessHistoryPdf(many, 'TEST authorized officer', font);
  const bytes = Buffer.from(pdf); assert.ok(bytes.subarray(0, 8).toString().startsWith('%PDF-'));
  assert.ok((bytes.toString('latin1').match(/\/Type \/Page\b/g) || []).length > 1);
  assert.ok(bytes.toString('latin1').includes('/ToUnicode'));
});

test('appearance settings own light/dark controls and preserve saved preference state', () => {
  const page = source('src/components/platforms/SettingsPlatform.tsx');
  assert.ok(page.includes('Light / dark theme')); assert.ok(page.includes('aria-pressed={formSettings.appearance.theme === mode}'));
  assert.ok(page.includes('App Appearance Settings'));
});
test('empty merchant reviews have no placeholder badge or navigation; approved reviews remain reactive', () => {
  const page = source('src/components/landing/BusinessStorefrontLandingPage.tsx');
  assert.ok(!page.includes('No reviews yet')); assert.ok(page.includes('const showReviews = settings.landingPage.showSocialProof && approvedReviews.length > 0'));
  assert.ok(page.includes('{showReviews && <a href="#reviews"')); assert.ok(page.includes('{showReviews && ('));
});
test('public replacement contains exactly 18 unique real modules and useful benefit descriptions', () => {
  assert.equal(CODE76_PLATFORMS.length, 18); assert.equal(new Set(CODE76_PLATFORMS.map(p => p.id)).size, 18);
  for (const platform of CODE76_PLATFORMS) assert.ok(platform.benefit.length > 50);
  const page = source('src/components/landing/LandingPage.tsx');
  assert.ok(page.includes('CODE76 Platforms & Features for Your Business')); assert.ok(page.includes('CODE76_PLATFORMS.map'));
  assert.ok(!page.includes('Different Businesses CODE76 Powers')); assert.ok(!page.includes('BUSINESS_SECTORS.map'));
});
test('public marketing copy does not promise public merchant publishing or unconfigured live messaging', () => {
  assert.match(CODE76_PLATFORMS.find(p => p.id === 'landing_page_builder')!.benefit, /not as a publicly published storefront/);
  assert.match(CODE76_PLATFORMS.find(p => p.id === 'messaging')!.benefit, /depends on the configured/);
});

test('database restore cannot replace role privileges for a non-admin', () => {
  const page = source('src/components/platforms/SettingsPlatform.tsx');
  assert.match(page, /const handleRestoreBackup = \(\) => \{\s*if \(!currentUser\?\.isAdmin\)/);
  assert.ok(page.includes('disabled={!currentUser?.isAdmin} title="Full database restores require administrator access"'));
});
test('theme examples retain their own colors instead of inheriting opposite-mode utility overrides', () => {
  assert.ok(source('src/components/platforms/SettingsPlatform.tsx').includes('data-preview-theme={mode}'));
  const css = source('src/styles/workspace.css');
  assert.match(css, /appearance-theme-sample\[data-preview-theme="dark"\].*#020617/);
  assert.match(css, /appearance-theme-sample\[data-preview-theme="light"\].*#fff/);
});
test('review capture describes merchant feedback and private business-page approval, not CODE76 promotion', () => {
  const page = source('src/components/modals/ReviewCaptureModal.tsx');
  assert.ok(page.includes('Show on this business’s private Business Landing Page'));
  assert.ok(page.includes('does not edit the public CODE76 website'));
  assert.ok(!page.includes('Highly recommend CODE76 for all retail businesses!'));
});
test('document-preview copying also awaits the shared clipboard result before claiming success', () => {
  const page = source('src/components/modals/EmailExportModal.tsx');
  assert.match(page, /await copyTextToClipboard\(generatedTextDocument\)/);
  assert.match(page, /setCopiedText\(result.ok\)/);
  assert.ok(!page.includes('navigator.clipboard?.writeText'));
});
test('private business links are created from a clean app root so query credentials cannot leak', () => {
  const page = source('src/components/landing/BusinessStorefrontLandingPage.tsx');
  assert.ok(page.includes("viewUrl('pos', applicationUrl(window.location.href, import.meta.env.BASE_URL), 'landing_page_builder')"));
});
test('zero-stock services keep their billing basis in the honest no-key catalog assistant', async () => {
  const { businessCatalogReply } = await import('../../src/utils/storefrontChat.ts');
  const text = businessCatalogReply('price', { company: { name: 'TEST service business', currency: 'KES' }, products: [{ name: 'TEST service', type: 'service', serviceUnit: 'day', sellingPrice: 100, stock: 0 }] });
  assert.ok(text.includes('Per day')); assert.ok(!text.includes('out of stock')); assert.ok(text.includes('100.00'));
});
