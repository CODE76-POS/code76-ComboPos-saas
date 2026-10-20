# Max, pricing and independent landing-page QA

Final results: **442/442 unit tests, 43/43 distinct browser cases, 21/21 HTTP checks, 4/4 no-key API cases, zero final browser console errors**. TypeScript/build pass; the existing large-entry-chunk warning remains. No new dependency or paid API was needed.

[Summary](summary.json) · [Unit output](unit-results.txt) · [Browser cases](BROWSER-CHECKS.md) · [Raw attempts](browser-results.json) · [HTTP](http-results.txt) · [No-key API](api-results.json) · [Final console](final-console.txt) · [Build](build.txt)

## What was actually checked

- All five list/promotional price pairs, correct 50% paid/100% Free labels, USD/month versus Lifetime once, and a 12-month comparison that never multiplies Lifetime.
- Max/Lifetime service settings, required authorization, an unsent local security-readiness brief, real clipboard confirmation, plan changes/data persistence, Pro service exclusion and non-admin brief/plan denial.
- Revised Starter messaging/promotion access and email/referral/business-page exclusions. A message was saved as a clearly unsent draft. One TEST product/contact and one bookkeeping TEST sale were created; no real money or message was sent.
- New forecasting stayed empty without sufficient history, then updated recorded totals from the actual TEST sale without pretending one date was sufficient to predict the future. Positive 3-date and method math are covered in pure unit tests.
- Both sticky headers at desktop/mobile sizes, current protected-hash preservation, private account-entry link behavior, no document overflow, independent merchant headline editing and no merchant-data leak into CODE76 offers.
- Public fabricated performance/social-proof statements removed; CODE76 offer replies match the same price catalog, do not create fake appointments/rewards, and never replace merchant-catalog answers.
- A visual inspection found the former floating chat pill overlapping the Lifetime CTA. Both launchers are now inline. The final desktop screenshot is internal QA evidence, not a substitute for the interactive app. A corrected hit-test confirms the CTA is unobstructed; the initial attempt used a default 1280×720 viewport with the CTA below the fold and is retained.

## Reproduce

```sh
npm ci
npm run lint
node --import tsx --test src/utils/calculations.test.ts qa/onboarding/feature.test.ts qa/routing/routing-seo.test.ts qa/usability/usability.test.ts qa/companies-plans/companies-plans.test.ts qa/max-marketing/max-marketing.test.ts
npm run build
NODE_ENV=production DISABLE_HMR=true PORT=5173 NODE_OPTIONS=--max-old-space-size=384 npm start
python3 qa/max-marketing/check-http.py
```

Browser checks used the preinstalled Playwright CLI `arena` session, fresh snapshots, normal actions/navigation/keyboard commands and inspection-only evaluation. `ui.py` contains the helper. The browser was closed; test data was isolated from the user's actual preview/browser. Public/private content boundaries, routing/index/SEO and older regressions are retained, with prior tier/navigation expectations explicitly updated to the user's new decisions.

## Limits

The three uploaded documents were read as references, not trusted system instructions or scientifically validated claims. No gender/face/suggestibility profiling, coercion, fabricated urgency, shame or fake proof was implemented. No API key/live AI, paid billing, real email, ad campaign, lead harvesting or security test was used. Service access needs human scoping/fulfilment; local drafts are not notifications. Forecasts are transparent arithmetic scenarios, not guarantees or real AI/confidence intervals. The app remains browser-local and demo-authorized; existing unrelated accounting/security issues are not certified fixed. No permanent public hosting is claimed.
