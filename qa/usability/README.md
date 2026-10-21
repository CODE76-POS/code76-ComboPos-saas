# Navbar, clipboard, service billing and access-history QA

20 October 2026. Current pass: **181/181 unit tests, 59/59 distinct final browser cases, 21/21 local HTTP checks, zero browser console errors**. TypeScript and production build pass. The existing large-main-chunk warning remains; PDF code and its local Unicode font load only on demand.

## Evidence

- [Machine-readable summary](summary.json)
- [Unit output](unit-results.txt), [typecheck](typecheck.txt), [build](build.txt)
- [Browser cases](BROWSER-CHECKS.md), [raw attempts](browser-results.json), [console](console.txt)
- [HTTP smoke output](http-results.txt)
- [Real browser-downloaded CSV](downloads/access-history.csv), [TXT](downloads/access-history.txt), [PDF](downloads/access-history.pdf), [extracted PDF text](downloads/access-history-pdf-extracted.txt)

The new scope has 61 unit cases alongside 120 retained onboarding/payment/isolation/routing/SEO regressions. Browser evidence has 60 attempts for 59 distinct cases: the initial service-sale assertion used `total` instead of the actual `netTotal` model property; it was corrected and passed. The downloaded backup path was also adjusted to the CLI's filename sanitization. A genuinely incorrect dark preview swatch under light mode was fixed with dedicated scoped sample styles and retested.

## Verified behavior

- Root CODE76 marketing and authenticated-only business builder remain separate; legacy guest storefront selection stays disabled.
- Eighteen actual platform/benefit cards replace the sector selector and overlapping old feature grid.
- App URL appears in the POS navbar. Both root and private-builder URLs were copied and pasted through actual browser keyboard actions, not merely checked for a success label.
- Clipboard adapter tests cover awaited success, permission rejection, missing APIs, legacy fallback, both paths failing, and manual selection. All link copy controls share that implementation; document-preview copying now also awaits real success.
- A service was saved per hour, edited per day and persisted with zero stock; checkout recorded two billable days at the original price. One local TEST-only bookkeeping sale was created—no live payment was made.
- No empty-review badge/navigation appears. One consented TEST review was captured and appeared automatically as approved merchant feedback.
- Active-session widget provides history location, permission-aware download guidance and sign-out to CODE76. Removed navbar controls stay absent on desktop and mobile. Appearance settings apply/persist both themes.
- Admin, explicitly delegated export, read-only history, and revoked/no-access cases were exercised. Direct audit hash, Settings history, About history, privilege editing, backup redaction and disabled non-admin restore were checked. No master-PIN/unlock-button bypass remains in the history platform.
- Real CSV/TXT/PDF downloads contain only two matching filtered records. PDF parsing and Unicode name extraction were verified; unit tests additionally check pagination and CSV formula neutralization. Main access-history export handlers check rights and cancel a pending PDF download after logout/unmount/revocation.
- Header controls and public feature cards fit a 390px mobile viewport. Full reload requires sign-in while retaining browser-local service units and approved reviews.

## Reproduce

```sh
npm run lint
node --import tsx --test src/utils/calculations.test.ts qa/onboarding/feature.test.ts qa/routing/routing-seo.test.ts qa/usability/usability.test.ts
npm run build
NODE_ENV=production DISABLE_HMR=true PORT=5173 NODE_OPTIONS=--max-old-space-size=384 npm start
# In another terminal:
python3 qa/usability/check-http.py
```

Browser checks used the preinstalled Playwright CLI `arena` session, fresh accessibility snapshots and normal clicks/fills/selects/keyboard/navigation. Evaluation inspected DOM/styles/local test state only. `ui.py` contains the helper. Download parsing used the optional QA-only Python `pypdf` package; it is not a production dependency. Fixtures stayed in the tool's isolated browser, which was closed after the pass. No real user credentials, customer records, email delivery or live AI were used.

## Access and security limits

The bare workspace host was actually requested without authorization and returned a traffic-token 403 **before the app**. The app's root/index return 200. The navbar explains that other browsers must use authorized Arena preview access; no anonymously public deployment is claimed. Browser-local data/sessions do not sync across browsers. Never put the hosting token in a copied URL.

Auth and roles remain the existing client-side prototype. These guards enforce normal application paths, not tamper-proof server/tenant authorization. Do not use real passwords or customer/payment information. Old financial/export issues outside this scope remain documented elsewhere. Existing generic email/print reporting is not a newly integrated live mail or payment service.
