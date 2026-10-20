import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { blankMerchantCompany, emptyStarterProduct, isCompanyConfigured, makeStarterProduct, readSetupProgress, SETUP_STORAGE_KEY, TEXT_SIZE_OPTIONS, writeSetupProgress } from '../../src/utils/onboarding.ts';
import { catalogChatContext, landingPageData } from '../../src/utils/landingPages.ts';
import { parseAppRoute, resolveAppSurface, viewUrl } from '../../src/utils/appRouting.ts';
import { BUSINESS_PAGE_DEFAULTS, LEGACY_CODE76_PAGE_DEFAULTS } from '../../src/config/businessPage.ts';
import { CODE76_SITE, CODE76_SITE_STORAGE_KEY } from '../../src/config/code76Site.ts';
import { mergeAppSettings, migrateBusinessPageSettings } from '../../src/utils/businessPageSettings.ts';
import { businessCatalogReply } from '../../src/utils/storefrontChat.ts';
import { INITIAL_COMPANY, INITIAL_SETTINGS } from '../../src/data/initialData.ts';
import type { CustomerReview } from '../../src/types/index.ts';

const source = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const draft = { ...emptyStarterProduct(), name: '  Acacia Coffee 250g  ', sellingPrice: '250', costPrice: '180', stock: '8', category: 'Groceries' };
const merchantCompany = { ...blankMerchantCompany('KES'), name: 'Acacia Market', tel1: '+254 700 123 456', address: 'Market Road', location: 'Nairobi', isConfiguredByMerchant: true };
const merchantProduct = makeStarterProduct(draft);
const approvedReview: CustomerReview = { id: 'review-test', customerName: 'TEST customer', rating: 4, comment: 'TEST-only approved review', date: '2026-10-20', isApprovedForLanding: true, isVerifiedPurchase: false };
const merchant = { company: merchantCompany, products: [merchantProduct], reviews: [approvedReview, { ...approvedReview, id: 'private', comment: 'PRIVATE REVIEW', isApprovedForLanding: false }] };

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

test('empty onboarding profile contains no CODE76 identity, contacts or tax registration', () => {
  const blank = blankMerchantCompany('KES');
  assert.equal(blank.name, ''); assert.equal(blank.email, ''); assert.equal(blank.taxPin, '');
  assert.equal(blank.tel1, ''); assert.equal(blank.currency, 'KES'); assert.equal(isCompanyConfigured(blank), false);
});
test('untouched CODE76 demo profile is not an actual merchant profile', () => assert.equal(isCompanyConfigured(INITIAL_COMPANY), false));
test('merchant can deliberately configure a company with the CODE76 name', () => assert.equal(isCompanyConfigured({ ...INITIAL_COMPANY, isConfiguredByMerchant: true }), true));
test('nonempty custom profile remains compatible with existing saved merchants', () => assert.equal(isCompanyConfigured(merchantCompany), true));
test('configured flag cannot make a blank name valid', () => assert.equal(isCompanyConfigured({ ...blankMerchantCompany(), name: '  ', isConfiguredByMerchant: true }), false));
test('all four real text sizing values have increasing, visible sample sizes', () => {
  assert.deepEqual(TEXT_SIZE_OPTIONS.map(option => option.value), ['compact', 'normal', 'large', 'xlarge']);
  assert.ok(TEXT_SIZE_OPTIONS.every((option, index) => index === 0 || option.scale > TEXT_SIZE_OPTIONS[index - 1].scale));
});
test('starter item saves supplied stock and prices, trimmed name and category', () => {
  const product = makeStarterProduct(draft);
  assert.equal(product.name, 'Acacia Coffee 250g'); assert.equal(product.category, 'Groceries');
  assert.equal(product.stock, 8); assert.equal(product.costPrice, 180); assert.equal(product.sellingPrice, 250);
  assert.equal(product.imageUrl, ''); assert.equal(product.barcode, '');
});
test('blank optional cost/stock are zero, never invented sample stock or prices', () => {
  const product = makeStarterProduct({ ...emptyStarterProduct(), name: 'Gift', sellingPrice: '0' });
  assert.equal(product.costPrice, 0); assert.equal(product.stock, 0); assert.equal(product.sellingPrice, 0);
});
test('starter service does not fabricate physical stock', () => {
  const product = makeStarterProduct({ ...draft, type: 'service', stock: '99', costPrice: '99' });
  assert.equal(product.type, 'service'); assert.equal(product.stock, 0); assert.equal(product.costPrice, 0);
});
test('starter items have unique inventory IDs', () => {
  const ids = Array.from({ length: 100 }, () => makeStarterProduct(draft).id);
  assert.equal(new Set(ids).size, 100);
});
for (const [field, value] of [['name', '  '], ['sellingPrice', ''], ['sellingPrice', '-1'], ['costPrice', '-1'], ['sellingPrice', 'Infinity'], ['sellingPrice', 'NaN'], ['sellingPrice', '1e308'], ['stock', '-1'], ['stock', '1.5'], ['stock', '9007199254740992']] as const) {
  test(`starter validation rejects ${field}=${JSON.stringify(value)}`, () => assert.throws(() => makeStarterProduct({ ...draft, [field]: value })));
}
test('setup progress restores stage, saved IDs and unsaved company draft', () => {
  const storage = new MemoryStorage();
  const progress = { version: 2 as const, stage: 'inventory' as const, status: 'deferred' as const, addedProductIds: ['item-a'], draftCompany: merchantCompany };
  assert.equal(writeSetupProgress(progress, storage), true); assert.deepEqual(readSetupProgress(storage), progress);
});
test('corrupt or old setup progress fails safely', () => {
  const storage = new MemoryStorage();
  for (const raw of ['null', '{bad json', '{}', '{"version":1,"stage":"company"}', '{"version":2,"stage":"unknown","status":"in_progress"}']) {
    storage.setItem(SETUP_STORAGE_KEY, raw); assert.equal(readSetupProgress(storage), null);
  }
});
test('storage quota failure is reported, not thrown', () => assert.equal(writeSetupProgress({ version: 2, stage: 'tour', status: 'complete', addedProductIds: [] }, { setItem() { throw new Error('Quota'); } }), false));
test('business page uses merchant identity and the actual saved inventory array', () => {
  const data = landingPageData('business', merchant);
  assert.equal(data.company.name, 'Acacia Market'); assert.strictEqual(data.products, merchant.products);
});
test('empty business catalog and reviews stay empty', () => {
  const data = landingPageData('business', { company: INITIAL_COMPANY, products: [], reviews: [] });
  assert.deepEqual(data.products, []); assert.deepEqual(data.reviews, []); assert.equal(data.company.name, 'Your Business'); assert.equal(data.company.tel1, '');
});
test('public CODE76 site ignores merchant brand and inventory', () => {
  const data = landingPageData('code76', merchant);
  assert.equal(data.company.name, CODE76_SITE.company.name);
  assert.ok(!data.products.some(product => product.id === merchantProduct.id));
  assert.ok(!data.reviews.some(review => review.id === approvedReview.id));
});
test('public CODE76 content is frozen against accidental mutation', () => {
  assert.equal(Object.isFrozen(CODE76_SITE.company), true); assert.equal(Object.isFrozen(CODE76_SITE.products), true);
});
test('new business page defaults contain no CODE76 offers or social handles', () => {
  const data = JSON.stringify(BUSINESS_PAGE_DEFAULTS);
  assert.ok(!/code76|\$50|terminal|1800760/i.test(data));
});
test('one-time migration removes unchanged legacy CODE76 copy', () => {
  const migrated = migrateBusinessPageSettings(LEGACY_CODE76_PAGE_DEFAULTS);
  assert.equal(migrated.heroTitle, ''); assert.equal(migrated.customWhatsappDirect, '');
  assert.equal(migrated.referralBonusText, ''); assert.equal(migrated.contentVersion, 2);
});
test('migration preserves custom merchant text, controls and contacts', () => {
  const migrated = migrateBusinessPageSettings({ ...LEGACY_CODE76_PAGE_DEFAULTS, heroTitle: 'Acacia fresh every day', customWhatsappDirect: '+254700123456', featuredCount: 3 });
  assert.equal(migrated.heroTitle, 'Acacia fresh every day'); assert.equal(migrated.customWhatsappDirect, '+254700123456'); assert.equal(migrated.featuredCount, 3);
});
test('versioned settings are not repeatedly cleaned if merchant intentionally uses a legacy phrase', () => {
  assert.equal(migrateBusinessPageSettings({ ...BUSINESS_PAGE_DEFAULTS, heroTitle: LEGACY_CODE76_PAGE_DEFAULTS.heroTitle }).heroTitle, LEGACY_CODE76_PAGE_DEFAULTS.heroTitle);
});
test('old partial settings acquire missing defaults without losing selected theme', () => {
  const merged = mergeAppSettings(INITIAL_SETTINGS, { ...INITIAL_SETTINGS, appearance: { ...INITIAL_SETTINGS.appearance, theme: 'light' }, textSizing: 'xlarge' });
  assert.equal(merged.appearance.theme, 'light'); assert.equal(merged.textSizing, 'xlarge'); assert.equal(merged.landingPage.contentVersion, 2);
});
test('public marketing configuration has no import dependency on merchant page defaults', () => {
  assert.ok(!source('src/config/code76Site.ts').includes("from './businessPage.ts'"));
  assert.ok(!source('src/config/code76Site.ts').includes("initialData.ts"));
  assert.ok(!source('src/data/code76SiteContent.ts').includes("initialData.ts"));
});
test('legacy storefront query cannot select an anonymous business page', () => assert.equal(resolveAppSurface(parseAppRoute(''), false), 'code76'));
test('base URL always selects the CODE76 product site, including for signed-in users', () => assert.equal(resolveAppSurface(parseAppRoute(''), true), 'code76'));
test('invalid routes and unauthenticated POS requests safely show the public site', () => {
  assert.equal(parseAppRoute('#/bogus').view, 'landing');
  assert.equal(resolveAppSurface(parseAppRoute('#/pos/landing_page_builder'), false), 'code76');
});
test('private page links preserve deployment paths and unrelated parameters using hash routing', () => {
  const url = new URL(viewUrl('pos', 'https://example.com/preview/?locale=en&view=storefront#portal', 'landing_page_builder'));
  assert.equal(url.pathname, '/preview/'); assert.equal(url.searchParams.has('view'), false);
  assert.equal(url.searchParams.get('locale'), 'en'); assert.equal(url.hash, '#/pos/landing_page_builder');
});
test('business chat excludes cost prices, tax IDs and non-public reviews', () => {
  const context = catalogChatContext('business', merchant);
  assert.equal(context.company.name, 'Acacia Market'); assert.equal(context.products[0].sellingPrice, 250);
  assert.ok(!('costPrice' in context.products[0])); assert.ok(!('taxPin' in context.company));
  assert.equal(context.reviews.length, 1); assert.ok(!JSON.stringify(context).includes('PRIVATE REVIEW'));
});
test('CODE76 chat cannot consume merchant records', () => {
  const context = catalogChatContext('code76', merchant);
  assert.ok(!JSON.stringify(context).includes('Acacia')); assert.equal(context.company.name, CODE76_SITE.company.name);
});
test('business fallback quotes actual merchandise and merchant currency', () => {
  const reply = businessCatalogReply('What is the price?', catalogChatContext('business', merchant));
  assert.match(reply, /Acacia Coffee 250g.*KES 250\.00/); assert.match(reply, /8 in stock/); assert.doesNotMatch(reply, /CODE76|Touch Terminal|\$599|\$50/);
});
test('empty business assistant invents no equipment', () => {
  const reply = businessCatalogReply('What can I buy?', { company: { name: 'Empty Shop' }, products: [] });
  assert.match(reply, /has not added any catalog items/); assert.doesNotMatch(reply, /CODE76|printer|terminal|warranty/i);
});
test('business assistant never confirms a reservation or appointment', () => {
  assert.match(businessCatalogReply('Book an appointment', catalogChatContext('business', merchant)), /does not reserve stock or confirm appointments/);
});
test('out-of-stock business merchandise is honestly labelled', () => {
  assert.match(businessCatalogReply('price', { company: { name: 'Test Shop' }, products: [{ name: 'Test product', sellingPrice: 10, stock: 0 }] }), /out of stock/);
});
test('public leads and metrics have their own storage key', () => assert.notEqual(CODE76_SITE_STORAGE_KEY, 'code76_pos_state_v1'));
test('public landing page reads only auth/navigation from POS context', () => {
  const publicPage = source('src/components/landing/LandingPage.tsx');
  const binding = publicPage.match(/const \{([^}]+)\} = usePOS\(\)/)?.[1];
  assert.ok(binding);
  const allowed = ['setActiveView', 'setActivePlatform', 'currentUser', 'loginUser', 'logoutUser', 'registerUser'];
  assert.ok(binding.split(',').every(name => allowed.includes(name.trim())));
  assert.ok(!publicPage.includes('addPerson(')); assert.ok(!publicPage.includes('logAuditAction('));
});
test('business page has no implicit INITIAL_* demo fallback or fixed 4.9 rating', () => {
  const page = source('src/components/landing/BusinessStorefrontLandingPage.tsx');
  assert.ok(!page.includes('INITIAL_')); assert.ok(!page.includes('4.9 / 5.0'));
  assert.ok(page.includes('`Stock: ${currentItem.stock} units`'));
  assert.ok(page.includes('`Low Stock (${item.stock} left)`'));
});
test('both chatbot callers explicitly identify their page surface', () => {
  assert.match(source('src/components/landing/LandingPage.tsx'), /<AIChatbotWidget surface="code76"/);
  assert.match(source('src/components/landing/BusinessStorefrontLandingPage.tsx'), /<AIChatbotWidget surface="business"/);
});
test('payment action is One payment and split removal uses a labelled trash icon', () => {
  const page = source('src/components/platforms/SalesPlatform.tsx');
  assert.ok(page.includes('One payment')); assert.ok(!page.includes('Exact Pay'));
  assert.match(page, /aria-label=\{`Delete payment/); assert.match(page, /<Trash2 className="w-4 h-4" aria-hidden="true"/);
});
test('wizard includes real settings/help/manual icons and enforces starter cap', () => {
  const wizard = source('src/components/modals/CompanyQAOnboardingModal.tsx');
  for (const icon of ['<Package', '<Settings', '<HelpCircle', '<Info']) assert.ok(wizard.includes(icon));
  for (const label of ['Open Inventory', 'Open Settings', 'Open platform guidance', 'Open About & Manual']) assert.ok(wizard.includes(`aria-label="${label}"`));
  assert.ok(wizard.includes('!canEditInventory || addedItems.length >= 3')); assert.ok(wizard.includes('Skip inventory for now')); assert.ok(wizard.includes('role="dialog"'));
});
test('theme state is derived from persisted Settings rather than divergent local state', () => {
  const context = source('src/context/POSContext.tsx');
  assert.match(context, /const theme = settings\.appearance\.theme/); assert.ok(!context.includes('const [theme, setTheme]'));
});
test('POS font preferences are scoped away from both landing pages', () => {
  const app = source('src/App.tsx'); const css = source('src/styles/workspace.css');
  assert.ok(app.includes("surface === 'pos' ? settings.textSizing : undefined"));
  assert.match(css, /\.pos-workspace\[data-text-size="xlarge"\]/); assert.ok(!css.includes('html { font-size'));
});
