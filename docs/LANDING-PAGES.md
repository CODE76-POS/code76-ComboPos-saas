# Two landing pages: ownership and editing boundaries

This app has **two different pages, not two names for one page**. They share authentication/navigation and a reusable assistant UI, not merchant content.

| | CODE76 product/main website | Merchant Business Landing Page |
|---|---|---|
| Purpose | Explain CODE76 and provide the pre-POS sign-in/register portal | Show one business’s identity, products and services |
| View / preview URL | `landing` / `?view=landing` | `storefront` / `?view=storefront`; also the POS **Business Landing Page** tab |
| Main component | `src/components/landing/LandingPage.tsx` | `src/components/landing/BusinessStorefrontLandingPage.tsx` |
| Content | `src/config/code76Site.ts`, `src/data/code76SiteContent.ts` | My Company, Inventory and approved merchant reviews |
| Page configuration | CODE76-only configuration module | **Settings → Business Landing Page Settings** (`AppSettings.landingPage`) |
| Leads / events / metrics | `Code76SiteContext`, browser key `code76_public_site_v1` | Merchant CRM / audit / metrics in `POSContext`, key `code76_pos_state_v1` |
| Chatbot audience | Required `surface="code76"` | Required `surface="business"` |

## How to request or implement future edits

- **“Change the CODE76 main site”** means edit the public component/config/content snapshot. Do not edit merchant My Company data or `AppSettings.landingPage`.
- **“Change my Business Landing Page”** means edit the storefront component or its merchant settings. Do not edit the CODE76 website/config/content snapshot.
- Merchant-specific catalog/company changes normally belong in **Inventory / My Company**, not source-code defaults.
- Public CODE76 content deliberately has its **own fixture snapshot**. It no longer imports the merchant/demo seed module. Changes to merchant demo data cannot silently rebrand the CODE76 assistant or change its catalog.
- POS font sizing and light/dark compatibility styles are scoped to `.pos-workspace`. Neither landing page inherits a merchant’s POS theme, font preference or text sizing.
- Shared presentation components must take an explicit audience. If changing shared assistant UI, verify both audiences rather than assuming one company’s wording applies to both.

## What was separated in this update

1. Removed live merchant company, products, staff, customers, sales, reviews and page settings from the CODE76 marketing component. Only auth/navigation comes from `usePOS()` there.
2. Public website inquiries/events/telemetry now write to the independent CODE76 site store, not the merchant’s CRM or audit log. Assistant email capture also uses its own audience’s store.
3. Both assistant callers specify their audience. Catalog context is selected explicitly and excludes merchant cost prices, tax identifiers and unapproved reviews.
4. Explicit CODE76 requests on the server use CODE76 content, not client-supplied merchant records. Business AI instructions and no-key/error fallbacks use merchant catalog/contact data only; they do not substitute CODE76 hardware or invent appointments, reservations, warranties or referral credits.
5. The merchant page no longer substitutes demo products, sales, reviews or contacts when empty. Its categories and currency come from its own data. Ratings come from approved reviews rather than a fixed 4.9.
6. Settings and My Company labels now explicitly say **Business Landing Page**. The storefront’s gear opens that exact settings tab. Return to POS leaves the storefront rather than reopening its builder.
7. `?view=` selection and browser Back/Forward now select the intended page. A storefront URL can render the storefront without a POS login.

## Saved-data compatibility

- The existing `AppSettings.landingPage` name is retained to avoid breaking saved merchants. Its type/comment and UI labels explicitly identify it as business-only.
- A one-time `contentVersion: 2` migration replaces **only exact, unchanged legacy CODE76 seed phrases/handles** with neutral business defaults. Customized merchant text, controls and contacts are retained.
- Once versioned, settings are not repeatedly cleaned; merchants may intentionally use their chosen wording.
- No company, product, sale, expense or customer records are deleted or relocated by this separation.
- Historical leads and metrics were previously mixed. They remain where they were: the app cannot safely infer their past source. **New** website writes are separated going forward.

## Regression guards

```sh
npm run lint
node --import tsx --test src/utils/calculations.test.ts qa/onboarding/feature.test.ts
npm run build
```

The focused tests cover data isolation, neutral defaults and migration, query routing, assistant grounding, no invented empty-state data, explicit assistant surfaces and public-site dependencies. Browser evidence additionally checks changes in both directions, independent lead/metric writes, settings links and persistence.

## Important remaining limits

This is still a **browser-local prototype**, not a deployed multi-tenant storefront backend. A preview URL selects a page; it does not publish one browser’s merchant database to other devices or make the catalog globally available. Public CODE76 leads are also browser-local unless a real product-site lead backend is connected.

This update does not claim to fix the existing client-side authentication model, all role/tenant security, API spend/rate controls, stock overselling, historical COGS or export sanitization issues recorded in the earlier `QA-CHECKLIST.md`. The CODE76 website’s existing marketing claims/sample endorsements were not fact-checked or redesigned in this feature pass.
