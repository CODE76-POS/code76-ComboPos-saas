# CODE76 public root, private business builder and SEO

> **Latest navbar/service/history update:** see [WORKSPACE-UPDATE.md](WORKSPACE-UPDATE.md). Root/public versus authenticated builder ownership remains unchanged.

## Delivered behavior

- **`/` is always the CODE76 product marketing/sign-in/register page**, including when the user is already signed in. `/index.html` serves the same public shell with a root canonical.
- **The Business Landing Page is internal only:** sign in, then POS → Business Landing Page → `/#/pos/landing_page_builder`.
- The former anonymous `?view=storefront` path and public merchant-launch controls are removed. Direct private-route requests display sign-in without mounting merchant content; sign-in returns to the requested screen. Back/Forward and sign-out follow the same guard.
- Public CODE76 content/settings/leads/metrics and merchant content/settings/CRM remain independently managed. The previously delivered onboarding and One payment/trash controls are retained.
- Private links are explicitly labelled sign-in-required; nothing here publishes a merchant storefront. Merchant section links scroll without replacing the POS hash route.

## Metadata and server

A shared SEO helper writes consistent server/client title, description, canonical, Open Graph, Twitter card and software structured data. The public page owns its metadata; private screens are noindex/nofollow. Canonicals point only to the public root, without private fragments or tracking parameters. The local sharing image is 1200×630; favicon and noscript fallback are included.

**Configure `PUBLIC_SITE_URL` with the verified production origin.** No production domain is assumed. The Node server otherwise builds the absolute canonical from validated request/proxy headers. Local/`*.e2b.app` previews are noindex; staging can set `PUBLIC_SITE_INDEXING=false`. Only the public root is listed in the sitemap.

Explicit root/index handlers return HTTP 200. API misses return JSON 404 and missing assets remain 404 rather than receiving SPA HTML. Vite permits managed workspace preview hosts. A hash router in `appRouting.ts`/`POSContext.tsx`, with conditional `App.tsx` protection, avoids adding a routing package or depending on server rewrites for `/#/pos/...` links.

**A hosting-proxy 403 is separate.** Requests rejected upstream never reach React or these HTTP handlers. Client routing, CORS and SEO tags cannot repair host access-token/authorization settings. Use the managed **CODE76 POS live app** Live Preview panel, not a raw access-protected sandbox link.

## Verification

Current commands, detailed cases and machine-readable results are in [`qa/routing/README.md`](qa/routing/README.md). Verification includes the previous onboarding/isolation/payment regressions plus new routing/SEO cases, HTTP root/index/fallback behavior and browser navigation.

The mobile browser check also found a pre-existing 14px overflow in the public footer link row. That row now wraps; no marketing redesign was introduced. An initial Vite build treated the relative canonical as an asset directory; marking the source link `vite-ignore` resolved it. Raw initial evidence is retained rather than hidden.

## Important limitation

Authentication/data remain the existing browser-local prototype. This work closes the UI routing bypass and guards merchant rendering, **not** a new production server-side auth/tenant backend. No supplied API key, live payment, real email or external identity provider was used. Existing historical accounting/security limitations are not certified as fixed.

GitHub writes were previously blocked by missing authentication. Changes and evidence are prepared locally; no remote publication is claimed.
