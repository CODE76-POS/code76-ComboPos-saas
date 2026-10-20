# Two landing pages: independent ownership and authenticated access

> **Latest navbar/service/history update:** see [../WORKSPACE-UPDATE.md](../WORKSPACE-UPDATE.md). Root/public versus authenticated builder ownership remains unchanged.

The CODE76 product website and the merchant Business Landing Page are **independently managed**. They share authentication/navigation and a reusable assistant UI, not content or settings.

**Current access policy:** the merchant page is private and exists only inside the authenticated POS `landing_page_builder` screen. This supersedes the earlier guest-accessible storefront design and its historical browser evidence.

| | Public CODE76 product website | Private merchant Business Landing Page |
|---|---|---|
| URL | `/` (also `/index.html`); public even when already signed in | `/#/pos/landing_page_builder`; sign-in required |
| Purpose | Explain CODE76 and provide sign-in/register | Preview the business’s own identity, products and services inside POS |
| Main component | `src/components/landing/LandingPage.tsx` | `src/components/landing/BusinessStorefrontLandingPage.tsx` |
| Content | `src/config/code76Site.ts`, `src/data/code76SiteContent.ts` | My Company, Inventory and approved merchant reviews |
| Settings | CODE76-only configuration module | **Settings → Business Landing Page Settings** (`AppSettings.landingPage`) |
| Leads / events / metrics | `Code76SiteContext`, browser key `code76_public_site_v1` | Merchant CRM/audit/private-preview metrics in `POSContext`, key `code76_pos_state_v1` |
| Assistant audience | Required `surface="code76"` | Required `surface="business"` |
| SEO | Public canonical/meta/social/schema; production may be indexed | Noindex/nofollow; no separate merchant canonical or public sitemap entry |

## Editing either page without changing the other

- **“Change the CODE76 main site”** means edit the public component/config/content snapshot. Do not edit merchant My Company data or `AppSettings.landingPage`.
- **“Change my Business Landing Page”** means edit the private builder component or its merchant settings. Do not edit the CODE76 website/config/content snapshot.
- Business catalog/company changes normally belong in **Inventory / My Company**, not source-code defaults.
- The public site deliberately has its own content snapshot and does not import merchant/demo seeds. Changes to merchant demo data cannot silently rebrand the CODE76 assistant or replace its catalog.
- POS font sizing and light/dark preference styles are scoped to `.pos-workspace`. Neither landing surface inherits those preferences.
- Shared components must take an explicit audience. Both assistant callers select their audience and send only safe catalog fields, not cost prices, tax identifiers or unapproved reviews.
- Public inquiries/events/metrics write to the CODE76 store, not merchant CRM/audit records. Merchant preview events remain separate. The private page does not substitute demo company details, stock, reviews or contacts when empty.

## Root and protected routing

`src/utils/appRouting.ts` is the small hash-router equivalent; no new routing dependency was added.

- Empty hash and normal marketing anchors (`#about`, `#features`, `#portal-access`, etc.) select the public page, regardless of authentication.
- `/#/pos` requests Sales POS. Other internal screens use `/#/pos/<platform_id>`.
- `/#/pos/landing_page_builder` is the **only** merchant-page route.
- `App.tsx` mounts internal platforms and their dialogs only when `currentUser` exists and the route explicitly requests POS. The merchant component also checks authentication before rendering or counting a visit.
- An anonymous private-route request displays the CODE76 sign-in/register page with a private-workspace notice, never merchant content. The requested hash is retained so successful sign-in can open that screen.
- `?view=storefront`, `?view=pos`, and standalone storefront hashes no longer select merchant content. Unrecognized routes fall back to public marketing.
- Both `hashchange` and `popstate` are observed. In-page merchant links scroll without replacing the protected hash. Sign-out clears private dialogs; Back cannot bypass the guard.
- The existing browser-local authentication is memory-based. Full reloads require sign-in again; saved merchant records are not treated as an authenticated session.

## SEO and HTTP index handling

- `LandingPage` includes `PublicLandingMetadata`; `src/utils/siteSeo.ts` shares metadata between server HTML, static builds and client navigation.
- There is one canonical root, matching Open Graph URL, description/keywords/theme metadata, Twitter card, local 1200×630 sharing image, and `SoftwareApplication` JSON-LD. Unsupported native-platform and invented free-price claims were removed from the schema.
- Set **`PUBLIC_SITE_URL`** to the verified production origin before production deployment/build. No production domain is guessed. The Node server otherwise derives an absolute root from validated request/proxy headers. Canonicals exclude query strings, private hashes and merchant settings.
- Local servers and `*.e2b.app` workspace previews are automatically noindex. `PUBLIC_SITE_INDEXING=false` also disables public indexing for staging.
- The server explicitly serves `/` and `/index.html` as HTML with HTTP 200. Other non-file SPA paths receive the shell, not a 403. This does not expose merchant content: rendering still requires the internal hash and sign-in.
- `/robots.txt` and `/sitemap.xml` describe only the public product site. API misses return JSON 404; missing assets return 404 rather than HTML.
- Vite permits `*.e2b.app` preview hosts and binds to `0.0.0.0`; this prevents Vite's own host rejection. Hash routing avoids server rewrite requirements for internal links.
- **A hosting/access-proxy 403 happens before this application.** Neither client routing, canonical tags nor permissive CORS can authorize it. Use Arena's managed **CODE76 POS live app** Live Preview; infrastructure access still needs to be configured by the host.

## Saved-data compatibility

`AppSettings.landingPage` is retained. Its version-2 migration replaces only exact, untouched CODE76 seed phrases with neutral defaults; merchant customizations survive. No company, product, sale, expense or customer records are deleted or relocated. Historical mixed leads/metrics remain where they were rather than guessing their provenance; new writes are separated.

## Regression commands and evidence

```sh
npm run lint
node --import tsx --test src/utils/calculations.test.ts qa/onboarding/feature.test.ts qa/routing/routing-seo.test.ts
npm run build
# With the production server running on port 3000:
python3 qa/routing/check-http.py
```

Current routing/SEO evidence is in [`qa/routing/README.md`](../qa/routing/README.md). Prior onboarding/payment/isolation evidence remains in `qa/onboarding/`; its old anonymous-storefront browser case is historical, not the current policy.

## Prototype limits

This is a browser-local prototype, not a production multi-tenant backend. **The new protection is an application rendering/navigation guard, not new server-side authentication or tenant authorization.** Registered account passwords and demo role selection still use the existing client-side model; do not enter real passwords, customer data or payment details. There is no public merchant publishing endpoint. Public CODE76 leads also remain browser-local unless a real backend is connected.

This work does not certify existing accounting, stock overselling, export sanitization, API spend/rate controls or all historical security issues. The CODE76 site's existing marketing claims/sample endorsements were not fact-checked or redesigned.
