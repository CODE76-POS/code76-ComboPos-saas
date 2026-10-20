# CODE76 POS — interactive workspace preview

> **Latest feature guide:** [Companies, schedules, payroll, camera and demo tiers](COMPANIES-PLANS-GUIDE.md). New workspaces start Free; use Current demo plan → Pro/Lifetime (admin) to test the advanced forms. No billing is connected.

Open **CODE76 POS — Workspace Preview** in Arena's **Live Preview** panel, port **5173**. This is the actual interactive application, not a screenshot or a file preview. A fresh preview instance was opened and checked on this port; the old port-3000 instance was stopped to retain only one app server. Use the managed preview panel; the bare sandbox host may require a hosting traffic/access token.

The restart commands below use the application's default port 3000 as an example. Set `PORT=5173` instead to match the current workspace preview.

## Test the updated app

1. The base URL `/` always shows CODE76 marketing and the account portal. The old sector section is replaced by 18 practical platforms/features.
2. Use **⚡ CEO / Admin** for the local demo session, then complete or skip setup.
3. The POS top navbar contains **App link**, a read-only URL, **Copy link**, and an open-in-new-tab control. It copies the clean current root, not a merchant hash or credential query.
4. For services, choose **Service quantity / billing unit** in Inventory or guided first-inventory setup: task completion, minute, hour, day, week, month, year, session, visit or project. Product stock remains numeric; services do not carry stock.
5. **Business Landing Page** opens only at `/#/pos/landing_page_builder` after sign-in. It uses merchant data, automatically reflects inventory and approved reviews, and shows no empty-review placeholder. Its private link also uses the reliable copy control.
6. Open your **active user/session avatar** for access-history guidance or **Sign Out**. Sign-out returns to CODE76 sign-in/register. The redundant CODE76 Site and far-right logout buttons are removed.
7. Light/dark controls are under **Settings → App Appearance Settings**. Choose a mode and save; the old navbar theme switches are removed.
8. **Audit & Access Logs** provides real filtered PDF/TXT/CSV downloads. Admins or granted Audit Logs roles may view; file/email export additionally requires Export Reports. Role grants and full snapshot restore are admin-only. Read-only backups omit access history.

**Another browser:** this workspace host requires an Arena/E2B traffic token before requests reach the app. A copied raw URL may therefore show 403. Open the conversation's authorized Live Preview in that browser, or deploy the app to an authorized public host. Client routing cannot remove hosting authentication. Sessions and merchant data are browser-local, not automatically shared.

Use only TEST data: auth/roles are still a client-side prototype, and payment methods are bookkeeping fields rather than a live payment processor. No supplied Gemini key was used or saved.

## Low-resource start / restart

```sh
npm ci
npm run lint
node --import tsx --test src/utils/calculations.test.ts qa/onboarding/feature.test.ts qa/routing/routing-seo.test.ts qa/usability/usability.test.ts qa/companies-plans/companies-plans.test.ts
NODE_OPTIONS=--max-old-space-size=768 npm run build
NODE_ENV=production DISABLE_HMR=true PORT=3000 NODE_OPTIONS=--max-old-space-size=384 npm start
```

One production server is retained, without development watchers. No supplied Gemini key was used or saved. `/api/health` reports whether an API key is loaded; current checks use no live AI.

## Production SEO

Set `PUBLIC_SITE_URL` to the verified public production origin before deploying/building; the Node server otherwise uses the validated current request origin. Local and `*.e2b.app` previews are intentionally noindex. Use `PUBLIC_SITE_INDEXING=false` for other staging environments. Public canonical/social/schema metadata, robots and sitemap must never point to a merchant hash route.

See [routing/SEO changes](ROUTING-SEO-UPDATE.md), [page ownership and access boundaries](docs/LANDING-PAGES.md), and [latest usability evidence](qa/usability/README.md).

## Scope and limits

The application serves root/index with HTTP 200 and accepts the managed preview host. Hash routing does **not** fix authorization rejected by a hosting proxy before the request reaches Node; that is an infrastructure setting.

This remains a browser-local prototype: merchant data lives in localStorage, auth/roles are client-side, passwords are stored in browser storage, and a full reload requires sign-in again. The builder guard is not production server/tenant security. Do not use real credentials, customer information or payment details. No public merchant storefront is published. The large initial JS bundle remains a known build warning.

Changes are committed locally on `feat/guided-setup-and-landing-isolation`. GitHub publication still requires authenticated write access; no remote update is claimed.
