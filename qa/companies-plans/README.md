# Companies, schedules, pay, camera and demo plan QA

Current results: **352/352 unit tests, 64/64 browser cases, 21/21 local HTTP checks, zero browser console errors**. TypeScript and production build pass. The existing large-main-chunk warning remains. This includes 171 new scope tests plus 181 retained regressions.

## Evidence

[Summary](summary.json) · [Unit results](unit-results.txt) · [Browser cases](BROWSER-CHECKS.md) · [Raw browser results](browser-results.json) · [HTTP output](http-results.txt) · [Console](console.txt) · [Build](build.txt)

- The camera was tested with **Chromium's synthetic video device**, not real hardware. `browser.config.json` records the fake-device launch options. The app attached a playing 1280×720 video stream with one video track and no audio, stopped/detached it, restarted/flipped it and captured a valid 1024×576 JPEG. Pixel variance confirms an actual patterned frame rather than an unready blank placeholder. The captured [test JPEG](fake-camera-capture.jpg) contains no real person.
- A TEST utility, a multi-function TEST company and a TEST branch were created. Same-ID vendor/transporter/marketing projections, edits from a linked directory, role removal and immutable expense snapshots were inspected.
- Expense and stock invoice print/export views included company type, contacts, tax identifier and branch/parent information. Normal CLI `pdf` saved those views to [expense PDF](expense-company.pdf) and [stock/branch PDF](stock-branch.pdf); optional QA-only Python `pypdf` parsed them. Their extracted text is retained. In the app, users choose Print / Save as PDF in the opened report view.
- The old invoice dialog exposed no actual item-line fields. It now has editable descriptions/physical quantities/unit costs, derived totals and paid status, no hidden commercial-terminal template, and a service-restock guard. A TEST stock invoice added exactly three physical items at unit cost 20 and preserved branch details.
- A TEST staff member was saved with explicit masculine illustration, two roles, morning half-day/off-Friday and a 1200-per-day agreed rate. No payment/expense was created by that rate. Two explicit 600 salary records were created; only the opted-in second payment generated one Salaries expense. Schedule edits created no further money records.
- Weekend, holiday-only and afternoon presets, explicit holiday configuration, disjoint off days, a feminine customer fallback, role-protected payroll, non-admin plan selection denial and payroll backup redaction were exercised.
- All four tiers were exercised. Free admin did not bypass licence limits; direct paid hashes were blocked. Starter kept ordinary business operations/exports but blocked marketing/comms/business page. Lifetime restored current modules. Data survived tier changes/reload. Free blocked underpayment/credit/debt while fully paid checkout and receipts worked with KES/Nairobi preferences.
- Mobile (390px) navbar, company directory and company/camera forms fit without document overflow. The admin Free delete workflow was exercised only on these synthetic records, preserving Free/region/currency/account/audit. The browser was then closed; the user's actual preview browser data was never altered.

## Reproduce

```sh
npm run lint
node --import tsx --test src/utils/calculations.test.ts qa/onboarding/feature.test.ts qa/routing/routing-seo.test.ts qa/usability/usability.test.ts qa/companies-plans/companies-plans.test.ts
npm run build
NODE_ENV=production DISABLE_HMR=true PORT=5173 NODE_OPTIONS=--max-old-space-size=384 npm start
python3 qa/companies-plans/check-http.py
```

For browser camera checks use the preinstalled CLI, session `arena`, with `open --browser=chromium --config=qa/companies-plans/browser.config.json`. Do not install another browser. `ui.py` contains the snapshot-driven helper. There were test-author control-name/argument corrections (manual search, settings tab reset on reload, `controls` role argument), not unresolved app failures; no assertions were hidden. The invoice-template issue was fixed before issuing an invoice.

## Scope limits

Plans/roles remain client-side **demo** entitlements; no provider charges, verified subscription, bank transfer or backend tenant security was added. No actual payroll, external customer, email or live AI was used. Other browsers need authorized preview-host access; no public deployment or browser-data synchronization is claimed. Real hardware/iframe camera permission must be granted by the host/browser and cannot be forced by JavaScript. Old financial/export issues outside this scope remain documented rather than certified fixed.
