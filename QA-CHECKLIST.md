# CODE76 ComboPOS — completed quality-check checklist

> **Historical baseline:** This checklist predates the guided-setup / landing-isolation update. Its unresolved production limitations still matter. See [FEATURE-UPDATE.md](FEATURE-UPDATE.md) for the later feature scope and verification.

**Reviewed:** 20 October 2026 · **Repository:** `CODE76-POS/code76-ComboPos-saas`
**Revision:** `77b5cfccf9168fa851125b7dfb564bf102aae22b`, plus the local dependency/setup fixes documented in `PREVIEW.md`.

> **Verdict: suitable for a controlled demo, not approved for production.**
> The QA review is complete for the scope below. Unchecked items are unresolved defects, warnings, or explicitly untested release gates—not claims that these features passed.

## Results at a glance

| Executed automated checks | Passed | Failed | Total |
|---|---:|---:|---:|
| Repository's existing calculation tests | 7 | 0 | 7 |
| Added calculation/export/security regression checks | 16 | 4 | 20 |
| Local, no-key API checks | 5 | 5 | 10 |
| Platform navigation/render smoke checks | 17 | 0 | 17 |
| **Total** | **45** | **9** | **54** |

Additional checks: **production build passed; TypeScript passed; npm production dependency audit reported zero known vulnerabilities.** Browser workflow checks below are additional to the 54 automated cases. Passing a navigation check only means the screen rendered—not that every function on that screen was tested. The dependency audit is not a security certification.

**Test environment:** Chromium, desktop 1280 × 900 and phone 390 × 844; one local production Node/Express server on port 3000. All business records used were isolated browser-local demo fixtures. No Gemini requests, real payments, emails, camera access, or external account changes were made.

## 1. Setup and runtime

- [x] **PASS** — Dependencies installed and production bundle built. The missing `react-is` dependency was fixed during preview setup.
- [x] **PASS** — TypeScript check passes, including the added TypeScript regression tests.
- [x] **PASS** — Server health returns `status: ok`, `hasApiKey: false` after testing.
- [x] **PASS** — No browser console errors during the checked application flows.
- [x] **PASS** — Test browser closed afterward; only the production app server remains running.
- [ ] **WARN** — Initial JavaScript bundle is about **1.37 MB / 345 KB gzip**. Split platform modules and measure on slower devices before launch.
- [ ] **WARN** — Vite warns about future native-config compatibility of `__dirname`. Not a current build failure.

## 2. Checkout, stock and financial correctness

- [x] **PASS** — One-click CEO demo access and loading the 12-item demonstration catalog work.
- [x] **PASS** — Empty-cart checkout is disabled; name search produces the correct autocomplete result and adds the scanner.
- [x] **PASS** — A $89 scanner, 10% cart discount and $10 transportation charge produce **$90.10**.
- [x] **PASS** — Split allocation of **$20 cash + $70.10 M-Pesa** reconciles to $90.10. This was simulated bookkeeping, not an M-Pesa transfer.
- [x] **PASS** — Removing the second split and checking out with $20 records **$70.10 debt**, receipt `REC-7604`, and `debt_pending` status.
- [x] **PASS** — Normal scanner stock deduction works: **35 → 34**.
- [x] **PASS** — Recording the remaining $70.10 updates the same sale to **$90.10 paid, $0 debt, completed**.
- [x] **PASS** — Ordinary fully paid checkout and receipt generation were also verified during initial preview testing.
- [ ] **FAIL · P1 · QA-STOCK-01** — Overselling is accepted. A completed sale sold **9 kiosks when only 8 were in stock**; inventory was silently clamped to zero. Add stock guards at cart entry and commit, with atomic server-side enforcement in a real backend.
- [ ] **FAIL · P1 · QA-SALE-01** — Receipts and sales use hardcoded `cashier-01` / **Peter Nick (Cashier)** even while signed in as Dr. David Kimani. Use the authenticated user and preserve an immutable transaction identity.
- [ ] **FAIL · P1 · QA-FIN-01** — Historical COGS uses the **current** inventory cost ahead of the recorded sale-item cost. Four units sold with a recorded cost of $50 should retain COGS $200; changing current cost to $80 produces **$320**. Snapshot and use cost-at-sale.
- [ ] **WARN · QA-UX-01** — A negative line discount is marked invalid by the number input but still changes the displayed line amount: **$89 → $97.90**, while cart net remains $89. Reject or clamp invalid input and use the same calculation function for line display and cart totals.

## 3. Ledgers, navigation and persistence

- [x] **PASS** — All **17 platform screens** rendered: Sales POS, Sales History, Inventory, Expenses, Invoices, Analytics, Customers, Vendors, Transporters, Marketing Team, Company Members, My Company, Messaging, Business Landing Page, Settings, Audit Logs, and About/Manual.
- [x] **PASS** — Empty expense submission is blocked by required-field validation; record count remains unchanged.
- [x] **PASS** — Creating a **$12.34** test expense works. Searching for its title isolates one row and a $12.34 filtered total.
- [x] **PASS** — Expense, completed sale and deducted stock survive a page reload in the **same browser**.
- [ ] **WARN / POLICY DECISION** — Reload returns the user to the landing/login screen. Business data persists, but the active login is not persisted. Define intended session behaviour before treating this as either correct or defective.
- [ ] **WARN · QA-UX-02** — A review popup opens automatically about 1.2 seconds after checkout and overlays the still-open receipt, including for walk-in sales. Sequence these dialogs instead of stacking them unexpectedly.

## 4. Exports and reports

- [x] **PASS** — Basic CSV download works and ordinary quoted commas/quotation marks round-trip correctly.
- [x] **PASS** — The printable expense report opens and shows the filtered sample record and correct $12.34 amount. Physical printing and an actual Save-as-PDF dialog were not exercised.
- [ ] **FAIL · P2 · QA-CSV-01** — Exported quoted **multiline fields do not import intact**: `parseCSV` splits on newline before handling CSV quoting. Use a multiline-aware CSV parser.
- [ ] **FAIL · P1 · QA-CSV-02** — Formula-like CSV values such as `=1+1` are not neutralized. Quoting alone does not stop spreadsheet formula interpretation. Sanitize spreadsheet-facing untrusted fields.
- [ ] **FAIL · P1 · QA-SEC-03** — Printable reports interpolate unescaped field values into HTML via `document.write`. An inert `<em>` test marker became markup rather than escaped text. This confirms unsafe HTML interpolation; active script exploitation was **not** performed. Escape all text and validate any intentional HTML.
- [ ] **WARN · QA-CSV-03** — With the ledger filtered to one row, CSV exported **all 6 expenses**, while the printable report contained **1**. Decide the intended scope and make the controls consistent or label “Export all” explicitly.

## 5. APIs and AI fallback

- [x] **PASS** — Health endpoint, no-key chat fallback and marketing template return usable responses.
- [x] **PASS** — Malformed JSON receives HTTP 400; SPA refresh routes receive the app shell.
- [ ] **FAIL · P2 · QA-API-01** — Chat request-shape validation is missing. `{}` causes **HTTP 500**; non-array `messages` and messages without text are accepted with **HTTP 200**, instead of clear client errors. Validate types, roles, non-empty text and size limits before processing.
- [ ] **FAIL · P2 · QA-API-02** — An unknown `/api/...` route returns **HTTP 200 HTML** from the SPA fallback, rather than JSON 404. Add a dedicated API not-found handler before the SPA catch-all.
- [ ] **FAIL · P2 · QA-AI-01** — CFO fallback returns `recommendations`, but the UI renders `actionPlan`. **The summary does render**, but the actionable priorities do not appear. Normalize the live and fallback response schemas and distinguish template output from live Gemini output.
- [ ] **FAIL BEFORE LIVE AI · P1 · QA-SEC-02** — Source review found no authentication, per-user quota, or rate limiter on the Gemini routes, with permissive CORS. A live key would expose uncontrolled API-spend risk. The current preview has **no key configured**, so these checks did not incur Gemini usage.

## 6. Authentication, data protection and accessibility

- [ ] **PRODUCTION BLOCKER · P0 · QA-SEC-01** — Authentication/roles are client-side, demo credentials are shipped in source, registered passwords are stored in localStorage, and roles are selected by the client. No server-side tenant-scoped business database is present. This is a prototype architecture, not secure multi-tenant SaaS. Implement real authentication, server-enforced authorization, protected password handling, tenant isolation and durable storage before entering merchant data.
- [x] **PASS, LIMITED** — Phone POS layout fits a 390px document viewport and remains readable; horizontally scrolling navigation/category controls are intentional.
- [ ] **WARN · QA-MOBILE-01** — The public landing page has a **404px document width at a 390px viewport**: 14px horizontal overflow.
- [ ] **FAIL RELEASE ACCESSIBILITY GATE · P2 · QA-A11Y-01** — The signed-in landing-page scan found **7 controls** without associated HTML labels or ARIA labelling; the initial signed-out scan found 10. Some placeholders provide fallback names, but this is not a substitute for complete programmatic labelling. POS icon-only buttons also appear unnamed in accessibility snapshots. Add explicit names and proper dialog semantics, then perform keyboard/focus and assistive-technology checks. This was a limited DOM/accessibility-tree review, **not a full WCAG audit**.

## Reproduction and source pointers for key defects

| Ticket | Reproduce / inspect | Evidence |
|---|---|---|
| QA-STOCK-01 | Load demo, add kiosk 9 times, Exact Pay, complete sale. `SalesPlatform.tsx:135–182`; `POSContext.tsx:406–423`. | [Oversell state](qa/evidence/oversell-state.txt), [cart snapshot](qa/evidence/oversell-cart-snapshot.txt) |
| QA-SALE-01 | Sign in as CEO, sell any item, inspect cashier on receipt. `SalesPlatform.tsx:272–273`. | [Partial-sale state](qa/evidence/partial-sale-state.txt), [receipt snapshot](qa/evidence/partial-sale-snapshot.txt) |
| QA-FIN-01 | Run the historical COGS regression. `calculations.ts:140,150`. | [Combined test log](qa/evidence/all-unit-tests.txt) |
| QA-CSV-01 / 02 | Run multiline round-trip and formula-neutralization regressions. `exportUtils.ts:24–25,43`. | [Regression tests](qa/quality-checks.test.ts), [test log](qa/evidence/all-unit-tests.txt) |
| QA-SEC-03 | Run the inert report-marker test. `exportUtils.ts:127,197`. | [Regression tests](qa/quality-checks.test.ts) |
| QA-API-01 / 02 | Run local API shape/error checks. `server.ts:50–185,316–318`. | [API results](qa/evidence/api-checks.json) |
| QA-AI-01 | Analytics → Run Gemini AI CFO Analysis, with no key. `server.ts:237–254`; `AnalyticsPlatform.tsx:1833–1843`. | [CFO UI observation](qa/evidence/cfo-fallback-ui.txt) |
| QA-SEC-01 / 02 | Source review: `POSContext.tsx:924–1035`; `server.ts:14–24,50,191,237`. | Architecture review; no destructive security exploit attempted |

Source paths above are relative to `src/`, except `server.ts` at the repository root.

## Explicitly untested / blocked release gates

These are **not passed** and are intentionally separated from the completed local checks:

- [ ] Live Gemini key validity, model availability, quota/failover and billing behaviour. Keys stayed unused.
- [ ] Real M-Pesa/card settlement, external email delivery, physical barcode scanners/receipt printers, camera and upload integrations.
- [ ] Authenticated Arena preview embedding from the user's browser. The app was checked locally; the bare public sandbox URL is traffic-token protected.
- [ ] Full create/edit/delete and bulk-import coverage for every module; invoice posting and reversal edge cases. Rendering each module is not end-to-end CRUD coverage.
- [ ] Cross-browser and physical-device coverage; full keyboard/screen-reader/contrast testing; sustained load and concurrent checkout tests.
- [ ] Production tenant separation, database migrations/backups/restore and failure recovery. A real backend is a prerequisite.

## Recommended fix order

1. **Before any real merchant data:** secure authentication, backend/tenant storage and AI endpoint access/spend controls.
2. **Before trusting transactions:** reject overselling, record the real cashier, and preserve immutable cost-at-sale.
3. **Before sharing exports:** escape report HTML, neutralize CSV formulas, and repair multiline parsing.
4. **Before release sign-off:** API validation/error contracts, CFO fallback schema, accessibility and mobile overflow; define export filtering and session policy.
5. Rerun the red regressions, then expand invoice/CRUD, integration and cross-browser coverage.

## Files and rerun commands

```sh
npm run lint
node --import tsx --test src/utils/calculations.test.ts qa/quality-checks.test.ts
python qa/check-api.py
```

The combined unit suite currently exits nonzero because four confirmed regression checks fail. Do not suppress those failures to obtain a green checklist.

Additional evidence: [build log](qa/evidence/build-and-unit-tests.txt), [dependency audit](qa/evidence/npm-audit.json), [17-screen navigation results](qa/evidence/navigation-checks.json), [debt settlement](qa/evidence/debt-settlement-state.txt), [persistence](qa/evidence/reload-persistence.txt), [phone POS screenshot](qa/evidence/mobile-pos.png), [landing overflow metrics](qa/evidence/mobile-landing-metrics.txt), [browser console](qa/evidence/browser-console.txt), and [final health](qa/evidence/final-health.json).

**Changes this QA pass:** added tests, evidence and this checklist only. No application business-logic fixes or GitHub pushes were made. QA artifacts are about 0.55 MB; the test browser has been closed to keep workspace resource use low. The app remains available as **CODE76 ComboPOS** in Live Preview.
