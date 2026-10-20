# CODE76 POS — interactive workspace preview

Open **CODE76 POS live app** in Arena's **Live Preview** panel, port **3000**. This is the actual interactive application, not a screenshot or a file preview. Use the managed preview panel; the bare sandbox host may require a hosting traffic/access token.

## Test the requested routes

1. Open the base URL `/`: it always shows public CODE76 marketing with **Sign In / Register**, even if already signed in. `/index.html` also works.
2. Use **⚡ CEO / Admin** for the seeded, local-only demo login, or try the sign-in/register form with test-only details.
3. Complete or skip the guided setup. Its theme/text/company/0–3 real item workflow is retained.
4. Inside POS, select **Business Landing Page** (or the **Business Page** shortcut). The URL becomes `/#/pos/landing_page_builder`.
5. Open the business-page gear to edit **Settings → Business Landing Page Settings**. These settings do not alter the CODE76 website. My Company and Inventory control merchant content.
6. Choose **CODE76 Site**: the base URL returns to public marketing while you remain signed in. **Enter POS App** explicitly opens the workspace again.
7. Sign out, then use Back or request the internal builder URL: the public sign-in page appears, not merchant content. `?view=storefront` no longer opens a public storefront.

Optional sample data is under **Demo Data**. Use only test records. **One payment** replaces the old Exact Pay label. Checkout payment methods are bookkeeping fields, not a live processor. Nothing from the tool's isolated test browser populates your own preview browser.

## Low-resource start / restart

```sh
npm ci
npm run lint
node --import tsx --test src/utils/calculations.test.ts qa/onboarding/feature.test.ts qa/routing/routing-seo.test.ts
NODE_OPTIONS=--max-old-space-size=768 npm run build
NODE_ENV=production DISABLE_HMR=true PORT=3000 NODE_OPTIONS=--max-old-space-size=384 npm start
```

One production server is retained, without development watchers. No supplied Gemini key was used or saved. `/api/health` reports whether an API key is loaded; current checks use no live AI.

## Production SEO

Set `PUBLIC_SITE_URL` to the verified public production origin before deploying/building; the Node server otherwise uses the validated current request origin. Local and `*.e2b.app` previews are intentionally noindex. Use `PUBLIC_SITE_INDEXING=false` for other staging environments. Public canonical/social/schema metadata, robots and sitemap must never point to a merchant hash route.

See [routing/SEO changes](ROUTING-SEO-UPDATE.md), [page ownership and access boundaries](docs/LANDING-PAGES.md), and [current evidence](qa/routing/README.md).

## Scope and limits

The application serves root/index with HTTP 200 and accepts the managed preview host. Hash routing does **not** fix authorization rejected by a hosting proxy before the request reaches Node; that is an infrastructure setting.

This remains a browser-local prototype: merchant data lives in localStorage, auth/roles are client-side, passwords are stored in browser storage, and a full reload requires sign-in again. The builder guard is not production server/tenant security. Do not use real credentials, customer information or payment details. No public merchant storefront is published. The large initial JS bundle remains a known build warning.

Changes are committed locally on `feat/guided-setup-and-landing-isolation`. GitHub publication still requires authenticated write access; no remote update is claimed.
