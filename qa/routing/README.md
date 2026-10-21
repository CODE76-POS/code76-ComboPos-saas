# Routing, authenticated business builder and SEO — current evidence

Date: **20 October 2026**. This pass supersedes the old anonymous storefront routing policy; it does not replace or erase the earlier onboarding/payment/isolation history.

## Final results

| Check | Result |
|---|---|
| TypeScript | PASS |
| Production build | PASS; existing large-chunk warning only |
| Unit tests | **120/120** (62 new routing/SEO + 58 retained feature/calculation regressions) |
| Production HTTP | **21/21** |
| Development preview-host HTTP | **5/5** |
| Browser navigation/access/metadata/mobile | **31/31 distinct cases, final pass** |
| Final browser console errors | **0** |
| Supplied keys / live AI / real payments / real emails | **None used or sent** |

[Machine-readable summary](summary.json) · [Unit output](unit-results.txt) · [Production HTTP output](http-results.txt) · [Development HTTP results](development-http-results.json) · [Raw browser attempts](browser-results.json) · [Browser cases](BROWSER-CHECKS.md) · [Final console](console.txt)

The browser log contains **33 attempts**: one test-author registration-label mismatch and one genuine mobile-footer overflow were corrected and retested. The footer previously made a 390px viewport 404px wide; its links now wrap. An early favicon 404 was fixed by supplying the icon. The initial Vite canonical-link build failure is retained in [build-initial-failure.txt](build-initial-failure.txt); the final [build output](build.txt) passes. Do not interpret raw historical failed attempts as unresolved final cases.

## Reproduce

```sh
npm run lint
node --import tsx --test src/utils/calculations.test.ts qa/onboarding/feature.test.ts qa/routing/routing-seo.test.ts
NODE_OPTIONS=--max-old-space-size=768 npm run build
NODE_ENV=production DISABLE_HMR=true PORT=3000 NODE_OPTIONS=--max-old-space-size=384 npm start
# In another terminal:
python3 qa/routing/check-http.py
```

The five development checks started `NODE_ENV=development DISABLE_HMR=true PORT=3001 npm start`, requested `/`, `/index.html`, `/pos/landing_page_builder`, `/src/main.tsx` and `/favicon.ico` with `Host: 3001-routing-check.e2b.app` / `X-Forwarded-Proto: https`, and confirmed HTTP 200 and correct shell/metadata. That temporary development process was stopped; only production port 3000 remains.

Browser checks used the preinstalled Playwright CLI's `arena` session, normal snapshot-derived click/fill/select/navigation actions, and inspection-only evaluation for DOM, metadata, sizes and local-only test results. `ui.py` contains the helper. Seeded demo sign-in and one TEST-only business headline were used in the isolated test browser. No real account provider, user records, payment processor, email or live AI was contacted. The browser was closed after the pass.

## Manual acceptance flow

1. Open **CODE76 POS live app** in Arena's **Live Preview** panel. The public base URL offers sign-in/register; no guest storefront control exists.
2. Request `/#/pos/landing_page_builder` without signing in: public sign-in with a private-workspace notice, no merchant content or visit.
3. Use the local **CEO / Admin** demo profile: return to the requested internal builder; skip setup if desired.
4. Open the private link dialog, catalog section links and business settings. Links require sign-in; section navigation must keep the protected hash.
5. Save a TEST merchant headline. Back/Forward must restore the intended private screen. Choose CODE76 Site: public marketing remains unchanged while signed in.
6. Sign out, then Back: merchant content must not return. A full reload also requires sign-in under the existing memory-based prototype auth.
7. At 390px width, public registration, private builder and protected sign-in must fit without horizontal document overflow.

## Deliberate limits

A localhost or fake-Host HTTP check proves the application response, not authorization through a separate hosting proxy. The managed preview is the intended user interface. React/hash routing and CORS cannot authorize an upstream rejected request. Workspace previews are deliberately noindex; set a verified `PUBLIC_SITE_URL` for production and `PUBLIC_SITE_INDEXING=false` for staging.

The application guard is not new server-side authentication/tenant security. Browser-local data, client-side demo roles and stored prototype passwords remain known limitations; do not enter real credentials or customer data. Existing historical accounting/export/API issues are not claimed fixed. Earlier browser evidence under `qa/onboarding/` retains its historical scope; its anonymous-storefront case is no longer supported.
