# Companies, people, schedules, pay and demo plans

> **Latest pricing/Max update:** [Max, current prices, Starter changes and coordinated landing navigation](MAX-PRICING-AND-LANDING.md). Max and Lifetime include scoped team-service access. Current evidence: [qa/max-marketing](qa/max-marketing/README.md).

## Live app

Open **CODE76 POS — Workspace Preview**, **port 5173**, in Arena's Live Preview panel. The app URL remains available in the POS top navbar. A new workspace starts Free; select **CEO / Admin → skip/complete setup → Current demo plan → Pro or Lifetime** to test company, payroll and other paid features. Existing saved workspaces without a tier retain Pro-equivalent access. No billing or subscription provider is connected.

## People versus organisations

All five people directories support a supplied photo or an optional **Neutral / Masculine / Feminine fallback avatar style**. This chooses an illustration only; it does not collect sex, gender or sexual orientation or infer appearance from a name. Supplied pictures take precedence. Missing organisation pictures use a company/building placeholder.

Under **My Company → Other Companies & Branches**, add:
- Companies such as an electricity utility, water company, ISP, landlord, supplier, marketing company or transport company.
- Branches with a selected parent company. Cycles and missing parents are rejected.
- Actual contacts, addresses, registration numbers or tax identifiers when known. No Kenya Power contact/legal details or other real company facts are fabricated.

Use the company-function checkboxes to list one company in **Vendors**, **Transporters** and/or **Marketing Team**. These are synchronized projections of the same stable identity, not unrelated duplicates. Editing a linked row updates its other views; removing a function removes only that derived membership. People with staff roles Transporter/Driver or Marketor synchronize similarly. External drivers/agents are not assumed to be employees unless explicitly marked as company members. Organisations never become salary-paid people.

Deleting a linked identity removes its directory projections, not historical expense/invoice snapshots or salary-payment history.

## Expense and stock-invoice company selection

1. Save the related company/branch/contact.
2. Open **Expenses → Record Expense** or **Invoices → Create Invoice → Stock Purchase**.
3. Choose the involved company/branch/contact from the list. Its name is filled automatically; manual legacy names remain supported.
4. At save, its name/type, parent, contacts, address and supplied legal identifiers are frozen in a transaction snapshot. Later company edits do not rewrite old documents.
5. The snapshot appears in expense vouchers and invoice PDF metadata/ledger details. Existing PDF actions open a printable view; choose **Print / Save as PDF** in that view. New fields are HTML-escaped.

Stock invoices now have actual item descriptions, physical quantities and unit costs, not a hidden 599-unit-price template. Totals derive from the lines plus tax; paid/pending reflects the entered amount paid. Service purchases are not restocked as physical goods. The app's existing cost-plus default for new product selling prices is retained—review pricing in Inventory. This update does not certify the entire historical accounting model.

## Staff shifts and off days

In **Company Members → Add/Edit**:
- Select two job roles, a quick shift preset and optional agreed pay rate.
- Presets cover full weekdays, **morning–noon**, **noon–evening**, overnight, **weekends only**, **holidays only**, and every day.
- Working/off-day selections stay disjoint. Overnight end times explicitly mean the following day.
- Holiday-only schedules use the dates entered in **Settings → Currency, Date & Time**. No country calendar, paid leave or payroll calculation is guessed.
- Times are local to the selected workspace timezone.

## Agreed pay is not an actual payment

An agreed amount can be per month, week, day, hour, completed task, delivery, session or project. Saving it never creates a payment or expense.

Use the member's **Wallet / Salary payments** action to record an already-paid amount, date, basis, period/tasks covered, payment channel and reference. These are bookkeeping entries; no funds are transferred. Actual amount is entered separately and is not filled from the agreed rate. There is a member history and a separate salary-payment ledger, including former-member records.

**Also record this exact payment once in Salaries expenses** is unchecked by default. Tick it only if that expense has not already been recorded. It creates one linked expense; repeated submission of the same record is idempotent. Manage People permission is required, and posting an expense also requires Edit Expenses. Payroll values are omitted from non-HR backups; linked salary expenses are also omitted for roles without finance access.

## Demo tier matrix

| Tier | Included | Excluded / limits |
|---|---|---|
| **Free** | Selling, receipts, history with debt balances read-only, basic inventory, appearance/receipts, currency/payments/date/time, admin-confirmed business-data deletion, help | No new credit/debt or repayment actions; no inventory marketing/export; no advanced company/finance/people, business page, merchant chatbot, messaging or email |
| **Starter** | Pro business operations including companies, staff/payroll, invoices/expenses, analytics, permitted exports and audit | No inventory marketing, Business Landing Page, merchant chatbot, messaging or email |
| **Pro** | All current features, subject to role privileges | Intended monthly-subscription model; no real billing connected |
| **Lifetime** | All current and future declared features/updates, subject to role privileges | Intended lifetime-access model; no real billing connected |

Plan restrictions guard direct routes, settings sections, relevant controls and state actions. Admin status does not bypass a plan; only admins can select a different **demo** plan. Tier changes do not delete records. Selecting a tier creates no charge, payment, licence verification or renewal. Client-side entitlements are not a production payment/security boundary.

Free's business-data deletion requires an admin, the typed word DELETE and a confirmation. It removes business records but retains accounts, plan/preferences and audit history. Do not use it on real records without a backup and deliberate approval.

## Date, timezone, currency and payment channels

**Settings → Currency, Date & Time** offers an IANA zone, three date orders, 12/24-hour display and explicit holiday dates. Event timestamps remain UTC; date-only invoices/expenses retain their original calendar date. Changing currency changes labels/preferences, not historical amounts or exchange rates.

Payment channels include Cash, M-Pesa, Airtel Money, T-Kash, credit/debit card, bank transfer, cheque, PayPal, gift card, voucher, crypto and Other; credit/debt requires an eligible plan. Enable checkout channels in Payment Settings. These are bookkeeping choices, not live provider integrations.

## Camera and photo inputs

The shared camera starts after the video element mounts, waits for usable dimensions/frames, and disables capture until ready. Capture saves a real JPEG capped at 1024px; preview can mirror a front camera but saved document/product text is not reversed. Retry, front/back switching and stop work; leaving a tab/form releases tracks and late permission responses are discarded. Uploads/device photos are resized locally before storage and cannot update a different/unmounted entry.

Camera requires HTTPS (localhost is allowed), browser permission, an available device and permission from the embedding host. If unavailable, use **Use device camera / choose a photo instead**. The app cannot override an Arena iframe camera policy or hosting access control. Testing used Chromium's synthetic camera, not a person's hardware or real portrait.

## Limits and evidence

This remains a browser-local prototype: no server-side tenant authentication, real subscriptions, bank transfers or cloud data synchronization were added. Do not enter real passwords, payroll or customer data. Workspace URLs may require authorized Arena preview access in another browser; routing cannot remove the host's traffic-token gate. Public CODE76 marketing/SEO and authenticated merchant business-page ownership remain separate.

See [current QA evidence](qa/companies-plans/README.md). All test changes were in the tool's isolated browser. No supplied API key, live payment, real email or external identity was used.
