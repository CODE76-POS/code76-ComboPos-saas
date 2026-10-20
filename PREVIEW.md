# CODE76 ComboPOS preview

Repository: https://github.com/CODE76-POS/code76-ComboPos-saas

Inspected revision: `77b5cfccf9168fa851125b7dfb564bf102aae22b` (main).

## Open and test

Open **CODE76 ComboPOS** in Arena's **Live Preview** panel (port 3000). The bare sandbox URL is access-protected; use the authenticated preview panel.

1. On the landing page, choose **⚡ CEO / Admin** under Quick 1-Click Demo Profiles.
2. Choose **Skip setup** if you only want to explore.
3. Choose **Demo Data → Yes, Load Rich Demo Data** to populate the 12-item catalog and sample sales, expenses, customers, and invoices.
4. In **Sales POS**, add an item, choose **Exact Pay**, then **Complete Sale & Print Receipt**. A feedback modal also opens shortly afterward; cancel it to return to the receipt.
5. Explore **Inventory**, **Sales History**, and **Analytics & P&L**. The navigation tabs scroll horizontally.

Demo data loaded in the automated test browser does not populate your own browser. Use step 3 in your preview.

## Setup / restart

```sh
npm ci
npm run lint
node --import tsx --test src/utils/calculations.test.ts
NODE_OPTIONS=--max-old-space-size=768 npm run build
NODE_ENV=production DISABLE_HMR=true PORT=3000 NODE_OPTIONS=--max-old-space-size=384 npm start
```

The preview uses a single production server, without development file watchers. No Gemini keys were saved or used. Gemini-dependent endpoints return the repository's built-in demo responses when no key is configured.

## Verified

- TypeScript check: passed.
- Existing calculation tests: 7/7 passed.
- Production build: passed after adding the missing `react-is` runtime peer dependency used by Recharts.
- Browser smoke test: landing page, one-click CEO login, sample data loading, checkout, receipt, inventory stock deduction (22 → 21), and analytics rendering.
- Checkout test: one terminal for $449.25, receipt REC-7604; this was a local demo transaction, not a real payment.
- No browser console errors during the checked app flow.
- Local `/api/health`: healthy, `hasApiKey: false`.
- The public sandbox URL returns an E2B traffic-token requirement outside Arena; authenticated external preview rendering was not independently verified.

## Local changes

- Added `react-is` to `package.json` and generated `package-lock.json`.
- Added `.npmrc` to work around npm 10's optional-peer dependency resolver crash.
- No application business logic changed; nothing pushed upstream.

## Important limitations

This revision is a browser-local POS prototype, not a production multi-tenant SaaS backend. Business records are saved in localStorage rather than a shared database. Demo account verification and role selection are client-side, and registered account passwords are stored in browser storage. Do not enter real passwords, customer data, or payment details. Payment methods are bookkeeping fields; no live payment processor was configured or tested. Gemini responses in this preview are templates, not live model output. Before enabling live AI, review model names, authorization, input limits, and quota controls. The marketing and insights endpoints hardcode a different model name from chat.

The build also warns about a large initial JavaScript bundle (~1.37 MB, ~345 KB gzip) and a future Vite configuration compatibility change. Neither blocked this preview.
