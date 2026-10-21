import type { PlatformId } from '../types/index.ts';

export type ManualCategory =
  | 'Getting started'
  | 'Selling & receipts'
  | 'Catalogue'
  | 'Money in'
  | 'People & access'
  | 'Insight'
  | 'Growth & content'
  | 'System & data'
  | 'Reference';

export interface ManualEntry {
  id: string;
  title: string;
  category: ManualCategory;
  summary: string;
  steps: string[];
  tips?: string[];
  platform?: PlatformId;
  keywords?: string[];
}

export const MANUAL_CATEGORIES: ManualCategory[] = [
  'Getting started',
  'Selling & receipts',
  'Catalogue',
  'Money in',
  'People & access',
  'Insight',
  'Growth & content',
  'System & data',
  'Reference',
];

export const USER_MANUAL: ManualEntry[] = [
  {
    id: 'first-run',
    title: 'First run: appearance, company profile and your first items',
    category: 'Getting started',
    platform: 'my_company',
    summary: 'A new workspace starts empty with a demo Pro entitlement (no charge). The guided setup saves only what you explicitly add and can be resumed at any time.',
    steps: [
      'Open any platform and choose ⚡ CEO / Admin for the local demo session (or sign in / register with a test account).',
      'The guided setup asks for light/dark appearance and text size first, then your company name, contacts and legal identifiers.',
      'Add zero to three starter products or services. Skipping is allowed; nothing is invented for you.',
      'Open Settings → Demo Plan Settings (administrator) to try another tier. No charge or renewal is created.',
      'Use About → User manual at any time; the question-mark circle next to each platform title opens context guidance.',
    ],
    tips: [
      'Auth, roles and plans in this build are client-side prototype controls, not production tenant security.',
      'Data is stored in this browser. Another browser or device starts with its own empty workspace.',
    ],
    keywords: ['onboarding', 'setup', 'register', 'login', 'demo', 'start'],
  },
  {
    id: 'navigation',
    title: 'Navigation, deep links and the two separate websites',
    category: 'Getting started',
    platform: 'selling',
    summary: 'The CODE76 product site is the public base URL. The merchant workspace and its business page live behind sign-in under hash routes that need no server rewrite.',
    steps: [
      'The base URL (/) always shows CODE76 marketing and the account portal — never merchant data.',
      'After sign-in, launch the terminal. The address changes to #/pos/… and the top navigation exposes every permitted platform.',
      'The business page builder is only reachable at #/pos/landing_page_builder while signed in; it is not a public storefront.',
      'Browser back/forward work: the workspace reads the hash on load and on every hash change.',
      'Sign out returns to the CODE76 sign-in/register portal. Reloading the workspace requires signing in again.',
    ],
    tips: [
      'A “Copy link” control copies the clean workspace root, not a credential or merchant hash.',
      'Hosting-level authorization is separate: a copied raw preview URL may be rejected by the sandbox host before the app runs.',
    ],
    keywords: ['route', 'hash', 'landing', 'link', 'navigation', 'sign out'],
  },
  {
    id: 'checkout',
    title: 'Building a sale, split payments and change due',
    category: 'Selling & receipts',
    platform: 'selling',
    summary: 'The terminal supports product and service lines, line and cart discounts, extra charges, tax, split payments and customer credit.',
    steps: [
      'Search or scan an item, then adjust quantity and price. Services use a billing unit instead of stock.',
      'Optionally add a line discount or a cart-wide discount, plus extra charges such as delivery or installation.',
      'Add one or more payment rows (Cash, M-Pesa, card, bank transfer, cheque, PayPal, voucher, crypto and others enabled in Settings).',
      'The panel computes total paid, change due and any remaining debt before you complete the sale.',
      'Press “Complete Sale”. A review request may follow when the plan includes the business landing page.',
    ],
    tips: [
      'Overselling is blocked for stock products; services are never stock-limited.',
      'A negative discount or extra charge cannot reduce a total below zero.',
      'The Free plan requires full payment; debt needs a paid demo plan.',
    ],
    keywords: ['pos', 'cart', 'discount', 'split payment', 'tax', 'change', 'checkout'],
  },
  {
    id: 'receipts',
    title: 'Receipt preview, sending and downloads (PDF, TXT, CSV, JSON, HTML)',
    category: 'Selling & receipts',
    platform: 'selling',
    summary: 'Receipts can be previewed, printed, downloaded in five formats and handed to the customer via a pre-filled email, WhatsApp or SMS draft.',
    steps: [
      'After checkout choose Send, Download or View. The same actions are available later from Sales History.',
      'Send tab: pick a channel, enter the customer email/phone (pre-filled from the sale when available) and open the share draft.',
      'Download tab: choose PDF (generated locally, no print dialog), TXT (42-column thermal text), CSV (line items), JSON (structured) or HTML (standalone page).',
      'Copy text is available for any other channel; paste it into your own message.',
      'Settings → Receipts controls which formats/channels appear, the default channel, the message template and whether the cashier is prompted after a sale.',
    ],
    tips: [
      'CODE76 never transmits the message. The audit log records that a share sheet was opened, not that the customer received it.',
      'TXT is the most reliable format for SMS/WhatsApp; PDF may not preview inside every messaging app.',
      'A download is recorded in the local send history with the channel “copy”.',
    ],
    keywords: ['receipt', 'pdf', 'txt', 'csv', 'json', 'whatsapp', 'email', 'sms', 'print', 'download'],
  },
  {
    id: 'receipt-branding',
    title: 'Receipt branding, tax PIN, barcode and return policy',
    category: 'Selling & receipts',
    platform: 'settings',
    summary: 'Receipt header, thank-you notice, return policy, barcode, tax PIN and payment instructions are merchant-controlled in Settings → Receipts.',
    steps: [
      'Set the receipt header title (defaults to your company name) and the thank-you notice.',
      'Write a return/warranty policy that reflects your real terms; the seed text is an example only.',
      'Toggle the barcode line and tax/VAT PIN. The barcode is a visual placeholder, not a scannable standard.',
      'Add optional till/paybill/bank instructions to help customers pay outstanding balances.',
      'Every generated receipt keeps the CODE76 creator credit; merchant logos are not watermarked.',
    ],
    keywords: ['branding', 'tax pin', 'barcode', 'policy', 'header'],
  },
  {
    id: 'inventory',
    title: 'Products, services and stock adjustments',
    category: 'Catalogue',
    platform: 'inventory',
    summary: 'Products carry stock; services carry a billing unit. Both can be featured, promoted and exported according to the plan.',
    steps: [
      'Add an item: name, category/sub-category, cost price, selling price, stock and low-stock alert.',
      'For a service choose task, minute, hour, day, week, month, year, session, visit or project and set stock to zero.',
      'Use Stock adjustment to post a counted quantity with a reason; the change is written to the audit log.',
      'Use the row actions to inspect, edit, promote, export a specification PDF or delete.',
      'Import many items from Settings → PDF & Excel Settings (CSV) using the documented column guide.',
    ],
    tips: [
      'A service never restocks or reserves capacity; scheduling is agreed outside the app.',
      'Deleting an item keeps historical sale line snapshots intact.',
    ],
    keywords: ['stock', 'product', 'service', 'billing unit', 'promo', 'csv import'],
  },
  {
    id: 'debts',
    title: 'Customer credit, partial payments and debt repayment',
    category: 'Money in',
    platform: 'sales_history',
    summary: 'Credit sales create a tracked balance with an optional due date. Repayments are posted against the original receipt with a protected payment ID.',
    steps: [
      'Enable “Allow partial payment & credit debts” in Settings → Payments (paid plan).',
      'At checkout, leave a remaining balance and optionally set a due date. The sale saves as debt-pending or debt-partial.',
      'Open Sales History → Pay Debt beside the receipt. Enter the amount already received, the actual channel and an optional reference.',
      'The balance, amount paid and status update; a payment record prevents duplicate posting on resubmission.',
      'Open the updated receipt or print a payment voucher for your records.',
    ],
    tips: [
      'Credit/Debt cannot repay an existing debt; choose the real channel that was received.',
      'Overpayments are rejected. A historical balance that disagrees with total/amount paid is flagged instead of silently repaired.',
      'Due dates record terms only — no reminder is sent automatically.',
    ],
    keywords: ['debt', 'credit', 'partial', 'repayment', 'balance', 'voucher'],
  },
  {
    id: 'receivables',
    title: 'Receivables aging, customer statements and reminder drafts',
    category: 'Money in',
    platform: 'sales_history',
    summary: 'Sales History groups open balances into aging buckets and can prepare a statement or reminder text for one customer.',
    steps: [
      'Open the Receivables & debt aging panel above the transactions table.',
      'Read outstanding, overdue, due-within-7-days and no-due-date totals; click a bucket to filter the table.',
      'Choose a customer, then Statement to download TXT/CSV or copy the text.',
      'Use Reminder to copy a polite draft. Review the balance and consent before sending it yourself.',
      'Record the repayment when it arrives so aging and analytics stay accurate.',
    ],
    tips: [
      'Aging uses the company-calendar date from Settings → Currency, Date & Time.',
      'Statements are local record summaries, not bank statements or payment demands.',
    ],
    keywords: ['aging', 'receivables', 'statement', 'reminder', 'overdue'],
  },
  {
    id: 'expenses',
    title: 'Recording expenses, supplier bills and salary-posted costs',
    category: 'Money in',
    platform: 'expenses',
    summary: 'Expenses reduce net profit immediately. They can reference a supplier company, branch or contact instead of retyping a name.',
    steps: [
      'Add an expense: title, category, amount, date, vendor and payment method.',
      'Pick a related company/contact when available; its name and identifiers are snapshotted for the document.',
      'Attach a receipt photo or file where the form offers it.',
      'Salary payments can optionally post one linked expense under the Salaries category.',
      'Filter by category or date and export CSV/PDF for permitted roles.',
    ],
    keywords: ['expense', 'supplier', 'bill', 'salary expense', 'category'],
  },
  {
    id: 'invoices',
    title: 'Sales invoices and stock-purchase invoices',
    category: 'Money in',
    platform: 'invoices',
    summary: 'Invoices are formal documents with line items, tax and due dates; they can be paid, pending or overdue.',
    steps: [
      'Create an invoice from the Invoices platform or convert a cart with “Convert to Sales Invoice”.',
      'Enter item descriptions, positive quantities and non-negative unit prices; totals are calculated from the lines.',
      'Choose paid or pending and set a due date.',
      'Record payments from the invoice row; the status recalculates.',
      'Download a branded PDF or export the ledger for permitted roles.',
    ],
    tips: ['Stock-purchase invoices do not restock services.', 'A sales invoice can also appear in Sales History with its own status.'],
    keywords: ['invoice', 'b2b', 'stock purchase', 'due date', 'paid'],
  },
  {
    id: 'directory',
    title: 'Customers, vendors, transporters and marketing team',
    category: 'People & access',
    platform: 'customers',
    summary: 'Directory identities are linked across categories: a company can be a vendor, transporter and marketer without duplicate records.',
    steps: [
      'Add a person or organisation, with two phone numbers, email addresses, address and location.',
      'Choose the category and, for a company, which functions it performs (vendor, transporter, marketer).',
      'Link a branch to its parent company instead of duplicating it.',
      'Mark a person as staff to create a company-member identity with roles, schedule and pay basis.',
      'Edit or remove the identity; historical invoices/expenses keep their own snapshots.',
    ],
    tips: [
      'Photos are optional. A neutral/masculine/feminine fallback is an illustration, not a gender claim.',
      'Photo consent is required before a customer picture is used on the business page.',
    ],
    keywords: ['customer', 'vendor', 'transporter', 'marketer', 'company', 'branch', 'directory'],
  },
  {
    id: 'roles',
    title: 'Roles, dual roles and the privilege matrix',
    category: 'People & access',
    platform: 'settings',
    summary: 'Members have exactly two roles; their effective access is the union of both. Administrators always keep every right.',
    steps: [
      'Create or edit a company member and choose two distinct roles (for example Cashier + Accountant).',
      'Open Settings → App User Privilege Settings (administrator).',
      'Pick a privilege group (selling, catalogue, people, growth, system) and tick or clear controls per role.',
      'Use the group check-all buttons, or apply a preset such as Cashier, Supervisor, Read-only or Full operations.',
      'Press Save All Settings Changes to persist the matrix.',
    ],
    tips: [
      'Sending receipts, recording debt payments, editing the business page, configuring the chatbot, managing schedules and deleting data are separate rights.',
      'Logins themselves are created by the administrator in Settings → Team Access & Logins or from the key icon in Company Members.',
      'The older saved workspaces inherit documented fallbacks until an administrator changes them.',
      'RBAC is a client-side guard, not server tenant security.',
    ],
    keywords: ['role', 'privilege', 'rbac', 'permission', 'cashier', 'admin'],
  },
  {
    id: 'business-workspace',
    title: 'Register your business: the person who pays is the administrator',
    category: 'Getting started',
    platform: 'selling',
    summary: 'Every registration creates a separate business workspace. The person who registers owns that workspace and becomes its only administrator.',
    steps: [
      'Open Sign In (header) or the account portal on the CODE76 landing page and choose “Register your business”.',
      'Enter the business name, the administrator\'s full name, the administrator email (username) and a password of at least 6 characters.',
      'Choose one security question and type the answer — it recovers the login if the password or email is forgotten.',
      'Registration signs you in and loads a clean workspace for that business only; nothing from another business is copied.',
      'Add staff as company members, then create their logins from Company Members → key icon, or Settings → Team Access & Logins.',
      'Sign in later with the same email; the app reopens only that business\'s saved workspace.',
    ],
    tips: [
      'One email address can belong to only one business workspace on this device.',
      'The administrator account cannot be deleted from the team panel; transfer ownership by registering a new administrator instead.',
      'Credentials are hashed and stored in this browser. A production deployment must keep accounts on a server with per-tenant authorisation.',
    ],
    keywords: ['register', 'admin', 'administrator', 'business', 'workspace', 'tenant', 'owner', 'sign up'],
  },
  {
    id: 'team-logins',
    title: 'Create staff logins from a company member record',
    category: 'People & access',
    platform: 'company_members',
    summary: 'A company member is the person record; the login is the credential attached to it. Only the administrator can create or reset one.',
    steps: [
      'Open Company Members and add the person, including a work email and their two roles.',
      'Press the key icon on that member\'s row (or open Settings → Team Access & Logins).',
      'Confirm the display name and sign-in email, set a temporary password of at least 6 characters, and keep the two roles.',
      'Choose a security question and answer for that member, then press Create login.',
      'Give the member their email and temporary password privately; they can change the password through their security question.',
      'To change roles or reset a password, open the same panel and press Reset; to revoke access, press Remove.',
    ],
    tips: [
      'The login inherits the member\'s roles and the role privilege matrix — it cannot grant more than the administrator allows.',
      'Removing a login never deletes the person, their historical sales, expenses or audit entries.',
      'Members without an email on their record cannot receive a login until one is added.',
      'Only the administrator sees Team Access & Logins; other roles only see their own session details.',
    ],
    keywords: ['login', 'staff', 'team', 'member', 'credential', 'password', 'key', 'access'],
  },
  {
    id: 'security-recovery',
    title: 'Security question: recover a forgotten password or username',
    category: 'People & access',
    summary: 'One security question guards each account. It reveals the sign-in email and resets the password without a server.',
    steps: [
      'On the sign-in dialog choose “Forgot password or email?”.',
      'Enter the account email — or, if you forgot the email, your full name plus the business name.',
      'Answer the question exactly as it was set. Capitals and extra spaces are ignored.',
      'The next step shows the account email (your username) and asks for a new password of at least 6 characters.',
      'Return to Sign In with the same email and the new password; your question stays unchanged.',
    ],
    tips: [
      'The answer is stored only as a salted hash in this browser — the app cannot display or email it.',
      'Five wrong passwords pause that login for about five minutes. Recovery answers are checked separately.',
      'If both the password and the answer are lost, only the business administrator can reset the login from Team Access.',
      'There is no email or SMS delivery, so recovery never claims a message was sent.',
    ],
    keywords: ['security question', 'forgot', 'recover', 'reset password', 'username', 'email', 'answer'],
  },
  {
    id: 'workspace-isolation',
    title: 'One business per workspace: what each person can see',
    category: 'System & data',
    platform: 'settings',
    summary: 'Session data is scoped to the signed-in business. Switching businesses swaps the entire dataset; records are never merged.',
    steps: [
      'The header shows the signed-in person and their business workspace name.',
      'Every sale, product, customer, expense, invoice, debt, message, setting and audit entry belongs to that workspace.',
      'Signing out clears merchant records from memory and returns to the public CODE76 site.',
      'Signing in as a member of another business loads that business\'s saved workspace only.',
      'The administrator\'s Team Access panel lists accounts for the current business; logins from other businesses are never shown or editable.',
    ],
    tips: [
      'Workspaces are separated inside this browser (localStorage). They are not server tenants and do not sync between devices.',
      'Anyone with access to the same browser profile and developer tools could inspect local storage — use test data only.',
      'Export a backup before wiping a workspace; deletion is permanent and local.',
    ],
    keywords: ['workspace', 'company', 'isolation', 'tenant', 'privacy', 'data', 'switch', 'separate'],
  },
  {
    id: 'schedules',
    title: 'Shifts, off days and salary payments',
    category: 'People & access',
    platform: 'company_members',
    summary: 'Schedules describe availability; salary payments are separate dated records of money actually paid.',
    steps: [
      'Choose a shift preset (full day, half days, overnight, weekends, holidays, every day) and set working hours.',
      'Select off days explicitly so they never overlap working days.',
      'Set the agreed rate and basis (month/week/day/hour/task/delivery/session/project).',
      'Use the Wallet action beside a member to record an actual payment with period, channel and reference.',
      'Optionally tick “Also record this exact payment in Salaries expenses” once.',
    ],
    tips: [
      'A rate is not a payment; only recorded payments appear in payroll history.',
      'No funds are transferred by the app.',
      'Holiday-only shifts use the explicit holiday dates in regional settings, not a guessed country calendar.',
    ],
    keywords: ['shift', 'schedule', 'payroll', 'salary', 'rate', 'off day'],
  },
  {
    id: 'analytics',
    title: 'Analytics, forecasts and the operational insight panel',
    category: 'Insight',
    platform: 'analytics',
    summary: 'Analytics combines recorded sales, expenses, inventory value, landing metrics and receivables into charts and plain-language answers.',
    steps: [
      'Open Analytics and choose a period in Operational insights (7/30/90 days or all recorded).',
      'Read revenue, estimated gross profit, margin, average basket and receivables.',
      'Switch the Mix view between payment channels and item categories; review top items and checkout hours.',
      'Use the question centre below for profit/loss, margins, debt, stock health, traffic, funnels and forecasts.',
      'Export the insight summary, aging or any chart data as CSV/PDF where offered.',
    ],
    tips: [
      'COGS for historical lines uses the cost saved on the line item; the headline estimate uses current cost prices where line costs are unavailable.',
      'Forecasts use disclosed average/linear methods, not a trained AI model or confidence interval.',
    ],
    keywords: ['analytics', 'forecast', 'margin', 'kpi', 'aging', 'export'],
  },
  {
    id: 'chatbot-settings',
    title: 'Chatbot settings, tone, quick prompts and handoff',
    category: 'Growth & content',
    platform: 'settings',
    summary: 'The merchant assistant answers from saved catalogue and contact data only. Its name, tone, greeting and prompts are configurable.',
    steps: [
      'Open Settings → Chatbot & Assistant Settings (administrator or Configure chatbot privilege).',
      'Enable the assistant and decide whether prices, stock and lead capture are allowed.',
      'Set the assistant name, greeting, tone and up to six quick prompts.',
      'Add a handoff contact and a fallback message for questions outside the catalogue.',
      'Save, then open the business page to review the widget.',
    ],
    tips: [
      'The assistant never invents policies, bookings, delivery promises or rewards.',
      'With no server AI key it uses the local catalogue reply engine and says that it is limited.',
      'This assistant is separate from the CODE76 product-site assistant.',
    ],
    keywords: ['chatbot', 'assistant', 'tone', 'prompt', 'handoff', 'ai'],
  },
  {
    id: 'business-page',
    title: 'Business landing page: content, reviews and sharing',
    category: 'Growth & content',
    platform: 'landing_page_builder',
    summary: 'The business page is a private, authenticated preview that uses your own catalogue, approved reviews and contacts. It is not published publicly.',
    steps: [
      'Sign in and open Business Landing Page (#/pos/landing_page_builder).',
      'Pick a template/section order and edit the hero title and subtitle.',
      'Choose the featured item count and slideshow speed; toggle social proof and the chatbot.',
      'Approve reviews in the page builder; unapproved or empty reviews are not displayed.',
      'Use Copy link to share the link with permitted people. The page keeps merchant content separate from CODE76 offers.',
    ],
    tips: [
      'Only reviews marked approved and verified appear.',
      'The page never shows CODE76 subscription plans or CODE76 team-service offers.',
      'Publishing to a public storefront is not available in this prototype.',
    ],
    keywords: ['landing page', 'storefront', 'reviews', 'hero', 'share'],
  },
  {
    id: 'data-deletion',
    title: 'Deleting one platform or every business database',
    category: 'System & data',
    platform: 'settings',
    summary: 'Settings → Delete Platform Data removes an individual platform database or all business records, with typed confirmation and an in-app dialog.',
    steps: [
      'Export a JSON backup first (Settings → Data Backup Settings) if you may need the records.',
      'Open Settings → Delete Platform Data. Record counts appear beside each platform.',
      'Tick one or more platforms, or Select every platform. Read the cascade notes.',
      'Type DELETE <number> in the confirmation field and press the delete button.',
      'Confirm in the in-app dialog. The audit log records who deleted what and when.',
    ],
    tips: [
      'Deleting Customers does not delete their historical sales; delete Sales separately if that is intended.',
      'Deleting System Settings restores defaults but keeps the plan tier, regional format and records.',
      'Audit logs are retained unless you explicitly select them.',
      'There is no server copy to restore; only an administrator can restore a backup file.',
    ],
    keywords: ['delete', 'wipe', 'reset', 'database', 'platform data', 'gdpr'],
  },
  {
    id: 'backup',
    title: 'Backups, restore and export boundaries',
    category: 'System & data',
    platform: 'settings',
    summary: 'A JSON backup captures the workspace state; exports include only what the role and plan allow.',
    steps: [
      'Open Settings → Data Backup Settings.',
      'Download the JSON backup; access history is included only with Export Reports permission.',
      'Choose a file to restore and confirm. Restoring replaces the current browser workspace.',
      'Use CSV/PDF exports per platform for accounting or sharing.',
      'Remember that backups include sensitive local records — store them securely.',
    ],
    keywords: ['backup', 'restore', 'json', 'export', 'permission'],
  },
  {
    id: 'settings-tabs',
    title: 'Settings reference: what each tab controls',
    category: 'System & data',
    platform: 'settings',
    summary: 'Every settings tab and the effect of saving it.',
    steps: [
      'Demo Plan Settings — administrator-only tier switch; no billing is connected.',
      'Demo Data & Training — opt-in synthetic dataset with an administrator confirmation.',
      'CODE76 Team Services — local service briefs for Max/Lifetime; never sent automatically.',
      'Payment Settings — channels, currency, tax and whether credit sales are allowed.',
      'Currency, Date & Time — IANA timezone, date order, 12/24h clock and holiday dates.',
      'Delete Platform Data — selective or full business-data deletion.',
      'Text Sizing, Appearance and Font — display preferences saved to the workspace.',
      'Business Landing Page Settings — hero copy, featured count, social proof and chatbot visibility.',
      'Receipts Settings — branding, formats, channels, message template and post-sale prompt.',
      'Chatbot & Assistant Settings — merchant assistant configuration.',
      'Data Backup Settings — backup download and restore.',
      'App User Privilege Settings — role matrix and presets.',
      'PDF & Excel Settings — validated CSV import pipeline.',
      'Email Marketing Templates — reusable campaign copy.',
      'Audit Logs & Login History — filtered access history.',
    ],
    keywords: ['settings', 'tabs', 'configuration', 'options'],
  },
  {
    id: 'dialogs',
    title: 'In-app dialogs, notices and confirmations',
    category: 'Reference',
    summary: 'Every notice, confirmation, choice and text prompt is a widget inside the app. Browser pop-up or notification blocking cannot hide them.',
    steps: [
      'A notice appears for information, success, warning or danger, with a single “Got it” action.',
      'A confirmation asks for an explicit choice and marks destructive actions in red.',
      'A choice widget offers labelled actions such as Send / Download / View receipt.',
      'A prompt collects short text with validation; it cannot be submitted if a required value is missing.',
      'Toasts appear top-right for quick feedback and can be dismissed.',
    ],
    tips: [
      'Press Escape to dismiss, Enter to confirm a non-text dialog.',
      'Printable-report windows still need pop-up permission because they are separate documents; the app now explains this in an in-app dialog.',
    ],
    keywords: ['alert', 'confirm', 'dialog', 'popup', 'toast', 'notification'],
  },
  {
    id: 'widgets',
    title: 'Widget and icon reference',
    category: 'Reference',
    summary: 'What the common controls in tables, forms and the navigation do.',
    steps: [
      '✉️ Mail — open the email/export widget for a row or the whole platform.',
      '📄 Download / FileDown — generate a PDF, CSV, TXT or statement.',
      '👁️ Eye — inspect the full record, line items and history.',
      '✏️ Edit — open the editor for the row.',
      '🗑️ Trash — delete after an in-app confirmation; recorded in the audit log.',
      '📢 Megaphone — compose a promotion with the marketing widget (plan permitting).',
      '📷 Camera / Upload / Drive / Link — choose a photo source; captures are resized locally.',
      '⚠️ Triangle — low stock, overdue balance or a validation warning.',
      '⭐ Star — capture or show a review rating.',
      '💰 Wallet — record a salary or debt payment.',
      '🔔 Bell — prepare a reminder draft (nothing sent automatically).',
      '🟢 Check — confirm/save; unavailable features are visibly disabled with a reason.',
    ],
    keywords: ['icons', 'widgets', 'buttons', 'table actions', 'camera'],
  },
  {
    id: 'plans',
    title: 'Plans, limits and what is not included',
    category: 'Reference',
    summary: 'Demo tiers change which platforms open. Prices are illustrative, no payment gateway is connected and no licence is created.',
    steps: [
      'Free — selling, receipts, history with read-only debt balances, basic inventory, your company profile, company members with their logins and roles, appearance/payments/regional settings and guides.',
      'Starter — everything Pro has except email, referral operations, business-page creation and chatbot intelligence.',
      'Pro — all software including analytics, business page, chatbot and debt handling.',
      'Max — Pro plus CODE76 team-service access.',
      'Lifetime — current and future software plus Max service access, one-time.',
    ],
    tips: [
      'Role privileges still apply regardless of tier.',
      'Current published promotional prices are shown on the CODE76 site; no charge or renewal is created by choosing a demo plan.',
      'Team services are scoped work agreed with CODE76, not unlimited support or a result guarantee.',
    ],
    keywords: ['plan', 'pricing', 'free', 'pro', 'max', 'lifetime'],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting common issues',
    category: 'Reference',
    summary: 'Quick checks for blocked previews, missing data, camera and receipt problems.',
    steps: [
      'Blank workspace after reload: sign in again; sessions are not persisted.',
      'Data missing in another browser: records are browser-local and do not sync.',
      'Camera unavailable: allow permission after the preview appears, use HTTPS/localhost, and stop other apps using the camera.',
      'Receipt PDF does not open in WhatsApp: send TXT or attach the downloaded file instead.',
      'Preview rejected by the host (403): open the authorized Live Preview; a copied raw URL may need a host token.',
      'Settings tab hidden: the plan may not include it, or the role lacks the privilege.',
      'Forgot the password or email: use “Forgot password or email?” on the sign-in dialog and answer the security question.',
      'Signed in to the wrong business: sign out, then sign in with the account that belongs to the other workspace; records are never merged.',
    ],
    keywords: ['error', 'camera', '403', 'blank', 'missing', 'fix'],
  },
  {
    id: 'limits',
    title: 'Safe use, data boundaries and honest limitations',
    category: 'Reference',
    summary: 'This is a browser-local prototype for test data — not production multi-tenant software or a payment processor.',
    steps: [
      'Use test records only. Do not enter real passwords, card data or private customer/payroll information.',
      'Auth, roles and plans are demonstration controls; there is no server verification. Passwords and recovery answers are salted hashes in this browser, not a production identity server.',
      'Each business workspace is separated locally, but two people sharing one browser profile could inspect the same local storage. Use test data only.',
      'Sales, debts and salaries are bookkeeping records. No funds move and no settlement is verified.',
      'AI answers are limited to supplied catalogue data and may be unavailable without a server key.',
      'Back up before deleting. Clearing browser storage erases the workspace permanently.',
    ],
    keywords: ['security', 'privacy', 'limitations', 'test data', 'production'],
  },
];

export const MANUAL_ENTRY_BY_ID = Object.fromEntries(USER_MANUAL.map((entry) => [entry.id, entry]));

export function searchManual(query: string, category: ManualCategory | 'All'): ManualEntry[] {
  const needle = query.trim().toLowerCase();
  return USER_MANUAL.filter((entry) => {
    if (category !== 'All' && entry.category !== category) return false;
    if (!needle) return true;
    return `${entry.title} ${entry.category} ${entry.summary} ${entry.steps.join(' ')} ${(entry.tips || []).join(' ')} ${(entry.keywords || []).join(' ')}`
      .toLowerCase()
      .includes(needle);
  });
}
