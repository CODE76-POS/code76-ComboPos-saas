import { CODE76_BRAND,brandAssetUrl } from '../../config/code76Brand.ts';
import { Code76Credit,Code76SocialLinks } from '../common/Code76Credit.tsx';
import { SupportContactForm } from '../common/SupportContactForm.tsx';
import { PLAN_INFO,planTier } from '../../utils/plans.ts';
import { PlanPrice } from '../common/PlanPrice.tsx';
import { AuditLogPlatform } from './AuditLogPlatform.tsx';
import { accessHistoryPermissions } from '../../utils/accessHistory.ts';
import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  BookOpen,
  Info,
  KeyRound,
  ShieldAlert,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  ShieldCheck,
  FileText,
  Clock,
  Sparkles,
  Lock,
  Mail,
} from 'lucide-react';

const USER_MANUAL_SECTIONS = [
 {id:'support-branding-demo',title:'Support, creator credits, richer demo data and debt records',content:`• SUPPORT: About & Manual → Contact support. Recipient is code76pos@gmail.com. In-app sending uses the server's configured SMTP service. Until configured, the form clearly reports delivery unavailable and can open a pre-addressed email draft. Do not include passwords, tokens or private customer/payroll data. No real message is sent by merely opening the form.
• CREDIT: Generated receipts, printable reports/invoices, direct PDFs, TXT, CSV and JSON backups carry Website created by CODE76, code76pos@gmail.com and the official YouTube URL. CSV uses metadata columns, JSON uses a _code76 object—never invalid trailing lines. Raw uploaded/camera photos and merchant logos are not watermarked.
• SOCIAL / LOGO: CODE76-owned navigation, About and public footer use the supplied local logo. YouTube: https://www.youtube.com/@CODE76-fn4fj. Facebook: https://www.facebook.com/profile.php?id=61552639386192. This does not replace the merchant's own identity.
• DEMO: Demo Data is opt-in and administrator-confirmed. The expanded synthetic dataset includes products/services, history, partial/unpaid debt examples, companies/branches, staff/pay records, utilities and invoices. The demo badge stays visible. It is training data, not real customer proof, payments or business performance. Your plan and display preferences are retained.
• DEBT: Eligible plan/role required. Open Pay Debt from Sales History, enter a positive amount no greater than the current balance, choose the actual channel and optional reference, then record it. Credit/Debt is not a repayment method. Partial/full balances and any linked sales invoice are updated; a payment ID prevents repeated posting. No bank transfer or customer email occurs automatically.
• DEBT HISTORY: Receipt/detail views show dated repayment records. Use a debt-payment voucher or updated receipt for your own records. Old balances that disagree with their amount-paid/total fields must be reviewed, not silently repaired.
• BUSINESS ASSISTANT: The merchant catalog is separate from CODE76 subscription offers. Ask by product name/SKU/category, budget, service billing unit or contact/location. Only valid active promotions are quoted. Unknown policies, bookings, fulfilment and rewards must be confirmed directly with that business.`},
  {
    id: 'plans-companies-payroll',
    title: 'Plans, related companies, pictures, staff schedules & salary payments',
    content: `• DEMO PLANS: Settings → Demo Plan Settings. Only an administrator can select Free, Starter, Pro, Max or Lifetime. No charge, renewal or paid licence is created. Existing saved workspaces keep Pro-equivalent access; new workspaces start Free.
• FREE: selling, receipts, history with debt balances read-only, inventory without marketing/export, basic appearance/receipts, currency/payments/date/time settings, business-data deletion and help. New debt creation/repayments are not included.
• STARTER: Access everything Pro Tier has except email, referral operations, Business Landing Page creation and chatbot intelligence. Messaging and inventory promotion editing are available; email-campaign actions remain excluded. PRO: all software including historical/live records, future scenario visual analytics, the Business Landing Page/chatbot and debt handling. MAX: everything Pro plus CODE76 team services. LIFETIME: current/future software and Max service access. Role privileges still apply.
• PRICES (USD): Free standard $20 → $0/month (100% off); Starter $26 → $13/month; Pro $50 → $25/month; Max $110 → $55/month; Lifetime $500 → $250 one-time. All paid offers are 50% off. No price deadline or actual charge/renewal is created by choosing a demo plan. Plan-comparison months multiply monthly tiers, not Lifetime.
• MAX / LIFETIME SERVICES: advertising/market planning, lawful business-matched lead research, referral program assistance, SEO review, defensive business cybersecurity and scoped growth/staff support. Agree deliverables, schedule and any third-party/ad spend before work. Access is not unlimited work or a result guarantee.
• SERVICE BRIEFS: Settings → CODE76 Team Services (Max/Lifetime, administrator/Modify Settings role). Save and copy a local brief. It is not sent, assigned, notified, scanned, queued or fulfilled by this demo. Do not paste credentials or private customer lists; security work needs explicit authorization.
• NAVIGATION: section menus stay with the measured CODE76/POS headers on desktop and mobile. Private business links scroll without replacing #/pos/landing_page_builder. The product site and business-page content stay independent.
• PLANNING: the public site has six transparent assumption calculators (referral K, payback, LTV:CAC with retention months, optional order value, NRR and weighted engagement). They are not guarantees or hidden tracking. Analytics future scenarios use stored sales plus a disclosed average/linear method; no fake $18,500 baseline, AI model execution or confidence interval is claimed.
• PICTURES: choose optional Neutral, Masculine or Feminine fallback avatar style for a person. It controls an illustration, not sex/gender/orientation. Supplied photos override it. Companies and branches use their logo or a building placeholder, not a person's portrait.
• COMPANIES: My Company → Other Companies & Branches. Add a utility such as an Electricity company, a supplier, marketing company, transporting company or branch. Choose the parent of a branch. Contacts/legal identifiers are optional; no real company details are guessed.
• LINKED DIRECTORIES: select vendor, transporter and/or marketing functions. The same stable ID appears in each chosen directory. Edits and removals synchronize; invoices, expenses and salary history keep their original snapshots. Companies are not employees. External people become company members only when explicitly marked as staff.
• EXPENSES / STOCK INVOICES: select the involved company, branch or contact rather than retyping its name. Enter actual invoice item descriptions, physical quantities and unit costs; totals are calculated from those lines and tax. Stock invoices do not restock services. At save, its name/type/parent/contact/address/tax details are copied into a transaction snapshot and exported PDF details. Later company edits do not change old documents. Manual names remain supported for legacy records.
• SHIFTS: full day, morning-to-noon half day, noon-to-evening half day, overnight, weekends-only, holidays-only or every day. Select off days explicitly. Working and off days do not overlap. Times use the company timezone; holiday-only uses the explicit dates in Currency, Date & Time—not a guessed country calendar.
• PAY: use the Wallet / Salary payments action beside a company member to record an actual payment and view history. Save an agreed amount and basis (month/week/day/hour/completed task/delivery/session/project). A rate is not a payment. Salary payments are separate dated bookkeeping records with actual amount, period, channel and reference. No funds are transferred.
• SALARY EXPENSES: tick Also record this exact payment once in Salaries expenses only when needed. Unticked creates no expense. Manage People permission is required; expense posting also needs Edit Expenses. Repeated submission of the same record does not post another expense.
• CAMERA: Camera tab requests video only after the preview exists. Allow browser camera permission and wait for a live frame. Capture is disabled before readiness. Retry/flip/stop are supported; leaving the tab or form stops tracks. HTTPS/localhost and embedding-host permission are required. A host policy cannot be overridden by the app—use the device-camera/file option if necessary. Captures/uploads are resized locally and are not uploaded by this control.
• DATE / TIME / CURRENCY: Settings → Currency, Date & Time. Choose an IANA timezone, date order and 12/24-hour time; configure holiday dates. UTC event timestamps do not change. Date-only business documents retain their calendar date. Currency changes do not convert historical amounts.
• PAYMENTS: enable Cash, M-Pesa, Airtel Money, T-Kash, credit/debit card, bank transfer, cheque, PayPal, gift card, voucher, crypto or Other. These are recorded channels, not configured live processors. Credit/debt is unavailable in Free.
• DATA / SECURITY: demo plans and roles are client-side prototype controls, not server-verified subscriptions or tenant security. Do not enter real passwords/customer/payroll information into this test workspace. Browser-local records do not sync to another browser.`,
  },
  {
    id: 'setup',
    title: 'Getting started: guided setup & the two landing pages',
    content: `• Open My Company → Open guided setup to resume the assistant.
• First choose light/dark appearance and text size, then save your own company profile.
• Add zero to three starter products or services. Only saved items are added; skip and add more later in Inventory (Package icon).
• Settings uses the gear icon. Platform guidance uses the question-mark circle (HelpCircle). About & Manual uses the information-circle icon (Info).
• CODE76 main site: the base URL always shows product information and sign-in/register, even if you are already signed in. Merchant company and inventory changes never edit this website.
• Service billing: select Per task completion, Per hour, Per day, Per session, etc. in Inventory or first-inventory setup. The selling price is for one selected unit; services have no stock count.
• Theme: use Settings → App Appearance Settings, choose light/dark and save.
• Session: open your user/role avatar in the top navbar for access-history guidance or to sign out to CODE76.
• App link: the top navbar contains the root URL and a copy button. Preview-host access may still be required in another browser; local records do not sync.
• Access history: administrators or permitted roles can view Audit & Access Logs. Downloads require Export Reports too; use PDF, TXT or CSV.
• Your Business Landing Page: signed-in users only, inside POS → Business Landing Page (#/pos/landing_page_builder). It uses My Company, Inventory, approved reviews and Settings → Business Landing Page Settings. Its assistant, leads and metrics are separate.
• Private workspace links require sign-in. There is no standalone public storefront or ?view=storefront access. This browser-local prototype does not publish merchant data to other browsers; its client-side authentication is not production server/tenant security.`,
  },
  {
    id: 's1',
    title: 'Section 1: Point of Sale & Checkout Operations',
    content: `• Autocomplete Search: Start typing SKU, name, or scan barcode. The autocomplete dropdown displays the product photo, live price, available stock count, and an instant "+ Add 1" button.
• One payment: Fills one accepted payment with the full total (Cash when enabled). Add extra payment methods to split the amount; use the trash icon to delete an added payment row.
• Multi-Payment Split: Click "+ Add Method" in the cart to split customer bill across Cash, M-Pesa, Card, Bank Wire, and Credit/Debt simultaneously.
• Extra Charges: Select charge reason (Tax, Transportation, Packaging, Delivery, Service Fee) and enter custom amount. It itemizes automatically.
• Discounts: Apply percentage or dollar discounts per line item, or apply a cart-wide promotional discount to the entire subtotal.
• Referral Tagging: Use the "Referred By" combo-box to credit customers, marketers, or staff (e.g. "Peter Nick (Customer)").
• Testimonial Prompt: Available with the Business Landing Page entitlement (Pro/Max/Lifetime); approved feedback appears only on the private merchant preview.`,
  },
  {
    id: 's2',
    title: 'Section 2: Sales History & Debt Reconciliation',
    content: `• Drilldown: Click the eye icon on any transaction row to inspect all products and services sold in that sale.
• Debt Operations: With a paid plan and appropriate privileges, if a customer owes a balance, click "Pay Debt" to accept partial or complete settlement and record the payment channel.
• Appreciation & Review Email: Click the email icon to prepare a polite follow-up email draft. You can preview and edit the template before sending in your email app.
• Action Columns: Action icons appear at BOTH the beginning and the end of every table for ergonomic access.
• PDF Voucher: Click the download icon to generate a formatted printable sales voucher.`,
  },
  {
    id: 's3',
    title: 'Section 3: Inventory Control & Marketing Dispatch',
    content: `• Product vs Service: Physical goods track stock and minimum stock alert thresholds; commercial services provide infinite fulfillment.
• Direct Marketing Widget: Click the purple Megaphone icon on any inventory row to open the direct sales marketing widget. Select a target customer and marketer, choose a template (Discount, New Product, Low Stock Urgency), preview the message, and send!
• Gemini Copy Polish: Click "AI Polish with Gemini" in the marketing widget to prepare draft copy when an AI provider is configured. No conversion result is guaranteed.
• Inventory export: paid plans and export privilege are required; inventory promotion editing is available in Starter; emailing/referrals are excluded there. Free inventory remains usable without marketing/export.`,
  },
  {
    id: 's4',
    title: 'Section 4: Operational Expense Auditing',
    content: `• Category Tagging: Group expenditures into Rent, Utilities, Salaries, Logistics, Marketing, Supplies, and Maintenance.
• Financial P&L Impact: Every expense automatically reconciles against gross sales and COGS to compute true Net Profit or Loss.
• Related company: select a saved utility/supplier/branch. Its details are frozen on the expense and included in its PDF voucher.
• Voucher Export: Print single payment vouchers or full expense reports with saved company details.`,
  },
  {
    id: 's5',
    title: 'Section 5: Invoicing & Accounts Receivable',
    content: `• Dual Billing: Supports customer Sales Invoices and vendor Stock Purchase Invoices on paid plans. Select the company/branch from the saved list; its details become a historical snapshot.
• Status Tracking: Monitor Paid, Pending, and Overdue balances.
• Printable Letterhead: Generate formal PDF invoices with tax PIN and bank wire instructions.`,
  },
  {
    id: 's6',
    title: 'Section 6: Analytics, P&L & Landing Page Infographics',
    content: `• 3-Way Difference: Displays Sales Revenue vs Inventory Cost (COGS) vs Operational Expenses = Net Profit.
• Landing Page Infographics: Real-time telemetry on visitors, time spent on page, chatbot interactions, leads captured, and conversion percentage.
• Top Referrers Leaderboard: Highlights top brand advocates across customers, marketers, and staff.
• Gemini AI CFO: Click "Run Gemini AI CFO Analysis" for strategic profit maximization insights.`,
  },
  {
    id: 's7',
    title: 'Section 7: People, Companies & Optional Pictures',
    content: `• Directories include Customers, Vendors, Transporters, Marketing Team, Company Members and Other Companies & Branches.
• Choose Person, Company or Branch where applicable. A person's first name or an organisation's name is required. Branches require a valid parent; contact details/photos are optional rather than fabricated.
• Fallback avatar style is optional and does not record sex or orientation. Missing company pictures use a building placeholder.
• Photo consent relates to the private merchant page only; it never edits CODE76 product-site content.`,
  },
  {
    id: 's8',
    title: 'Section 8: Company Members & Dual-Role Logic',
    content: `• Dual Combo-Boxes: Assign two roles from CEO, Manager, Developer, Transporter, Marketor, Cashier, Accountant, etc.
• Autonomous Synchronization:
  - If a member is given the role "Transporter/Driver", they automatically sync to the Transporters directory.
  - If a member is given the role "Marketor", they automatically sync to the Marketing Team directory.`,
  },
  {
    id: 's9',
    title: 'Section 9: Your Business Landing Page & catalog assistant',
    content: `• Merchant data only: Company identity, real inventory and approved reviews. Empty inventory stays empty—no implicit CODE76 demo catalog.
• Featured items and slideshow: Choose featured products in Inventory; configure count and speed in Business Landing Page Settings.
• Honest social proof: Ratings are calculated from approved reviews. No invented five-star reviews are substituted.
• Catalog assistant: Uses this business’s products, prices and contacts. It cannot confirm appointments, reserve stock, send email or assign rewards.
• The CODE76 main site is a separate product website. This business-page editor does not change it.
• A preview link is not a publication mechanism: this prototype stores business data in the current browser.`,
  },
  {
    id: 's10',
    title: 'Section 10: PDF & Excel Settings (Admin Data Pipeline)',
    content: `• Security Gate: Protected by administrator authorization credentials and audit logging.
• Visual Column Alignment Showcase: Displays exact required CSV headers and example row before uploading to prevent errors.
• Validation Alert: Confirms number of successfully validated and committed records.`,
  },
  {
    id: 's11',
    title: 'Section 11: Universal Platform & UI Action Icons Guide',
    content: `• ✉️ Email Export Icon (Mail): Dispatches formatted documents (.txt, .pdf, or .csv) for a single record row or the entire platform table to any selected company member, admin, customer, marketer, transporter, or vendor.
• 📄 Download Icon (Download / FileText): Instantly renders and prints a formatted official PDF voucher, sales invoice, receipt, or activity audit trail report.
• 👁️ Inspect Icon (Eye): Opens the drilldown modal showing comprehensive field details, line-item itemizations, contact addresses, or transaction breakdowns.
• ✏️ Edit Icon (Edit / Pen): Launches the editor modal to modify prices, stock alerts, addresses, company profiles, or invoice line items.
• 🗑️ Delete Icon (Trash2): Removes records with administrative confirmation, automatically recorded in the enterprise audit log.
• 📢 Marketing Icon (Megaphone): Triggers the direct marketing widget to compose and send targeted promotional blasts with AI Gemini copy enhancement.
• 📷 Photo Attachment (Camera / Upload / HardDrive / Link2): Five-in-one photo ingestion widget supporting direct URL, Google Drive link converter, local file browse, drag-and-drop, and live camera snapshot.
• 🔄 Sync / Refresh Icon (RefreshCw): Manually refreshes database records, updates inventory counts, or recalculates financial health scores.
• 🔒 Lock & Security (Lock / Shield): Marks role-restricted actions. The preview does not claim encrypted account storage or production authorization.
• ⚠️ Warning & Alert (AlertTriangle): Alerts staff to critical events like low inventory stock thresholds, debt overdue balances, or system warnings.
• ⭐ Star Rating & Referrer (Star): Displays verified customer review scores (1-5 stars) and highlights top-performing community referrers.`,
  },
];

export const AboutPlatform:React.FC=()=>{
 const {company,currentUser,settings,setActivePlatform,setSettingsSection}=usePOS();
 const [activeTab,setActiveTab]=useState<'manual'|'about'|'support'|'license'|'terms'|'audit'>('manual');
 const [searchManual,setSearchManual]=useState('');const [expandedSection,setExpandedSection]=useState('support-branding-demo');
 const canViewAudit=accessHistoryPermissions(currentUser,settings).canView;
 const sections=USER_MANUAL_SECTIONS.filter(section=>`${section.id} ${section.title} ${section.content}`.toLowerCase().includes(searchManual.toLowerCase()));
 const tabs=[{id:'manual',label:'User manual & guidelines'},{id:'about',label:'About CODE76 POS'},{id:'support',label:'Contact support'},{id:'license',label:'Plan & demo status'},{id:'audit',label:'User Activity & Audit Logs'},{id:'terms',label:'Safe-use guidelines'}] as const;
 return <div className="max-w-7xl mx-auto px-4 py-6"><div className="flex flex-wrap items-start justify-between gap-4 mb-6"><div className="flex items-center gap-4"><img src={brandAssetUrl()} alt="CODE76 POS logo" className="w-16 h-16 rounded-2xl object-contain"/><div><h1 className="text-2xl font-black">CODE76 POS · About, help & support</h1><p className="mt-1 text-xs text-slate-400">Clear workflows, honest demo status and direct support contact.</p></div></div><button className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white" onClick={()=>setActiveTab('support')}>Contact the support team</button></div>
 <div className="grid lg:grid-cols-12 gap-5"><aside className="lg:col-span-3 min-w-0 flex lg:block gap-2 overflow-x-auto lg:overflow-visible pb-2" aria-label="About and help sections">{tabs.map(tab=><button key={tab.id} aria-current={activeTab===tab.id?'page':undefined} onClick={()=>setActiveTab(tab.id)} className={`shrink-0 lg:w-full whitespace-nowrap rounded-xl border px-4 py-3 text-left text-sm font-semibold ${activeTab===tab.id?'border-teal-600 bg-teal-700 text-white':'border-slate-800 text-slate-400 hover:bg-slate-900'}`}>{tab.label}</button>)}</aside><div className="lg:col-span-9 min-w-0 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
 {activeTab==='manual'&&<section><h2 className="text-xl font-bold">Application user manual</h2><p className="mt-2 text-sm text-slate-400">Search by task, such as debt, camera, company, payroll, branding, plans or support.</p><input aria-label="Search manual guides" placeholder="Search manual guides..." value={searchManual} onChange={event=>setSearchManual(event.target.value)} className="my-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm"/>{!sections.length&&<p className="text-sm text-slate-400">No guide matched. Try a broader term or contact support.</p>}<div className="space-y-3">{sections.map(section=><article className="overflow-hidden rounded-xl border border-slate-700" key={section.id}><button className="w-full px-4 py-3 text-left text-sm font-bold" aria-expanded={expandedSection===section.id} onClick={()=>setExpandedSection(expandedSection===section.id?'':section.id)}>{section.title}</button>{expandedSection===section.id&&<div className="border-t border-slate-700 px-4 py-4 whitespace-pre-line text-sm leading-relaxed text-slate-400">{section.content}</div>}</article>)}</div></section>}
 {activeTab==='about'&&<section className="space-y-5"><div className="flex items-center gap-4"><img src={brandAssetUrl()} alt="CODE76 POS logo" className="w-20 h-20 rounded-2xl object-contain"/><div><h2 className="text-2xl font-black">CODE76 POS</h2><p className="mt-1 text-xs text-teal-400">Products, services and business records · workspace preview</p></div></div><p className="text-sm leading-relaxed text-slate-400">Explore checkout, receipts, product/service inventory, linked companies, expenses/invoices, staff schedules/pay records and role-scoped reporting. The public CODE76 product site and your private business-page preview have separate content and settings.</p><div className="grid sm:grid-cols-2 gap-3">{[{title:'A workflow you can inspect',copy:'Use clearly marked demo records or enter test records of your own. Prices, amounts and plan restrictions remain visible.'},{title:'Your records, clearly bounded',copy:'Business records currently live in this browser. This is not a server-backed, production multi-tenant deployment or a bank/payment processor.'},{title:'Assistance without false promises',copy:'A catalog assistant can explain supplied data and contacts. It does not reserve stock, guarantee results or perform team services automatically.'},{title:'Support you can reach',copy:'Use Contact support or the email/social links below. Direct server mail needs administrator SMTP configuration; fallback drafts are not sent until you send them.'}].map(card=><article key={card.title} className="rounded-xl border border-slate-700 p-4"><h3 className="font-bold text-teal-400">{card.title}</h3><p className="mt-2 text-sm text-slate-400">{card.copy}</p></article>)}</div><Code76SocialLinks/></section>}
 {activeTab==='support'&&<SupportContactForm initialName={currentUser?.name||''} initialEmail={currentUser?.email||''}/>}
 {activeTab==='license'&&<section className="space-y-4"><h2 className="text-xl font-bold">Plan & demo status</h2><p className="text-sm text-slate-400">Selected tier: <strong className="text-teal-400">{PLAN_INFO[planTier(settings)].name}</strong>. This is a client-side demo entitlement, not a verified purchase, active subscription, registration key or security certificate.</p><PlanPrice tier={planTier(settings)}/><dl className="grid sm:grid-cols-2 gap-3 text-sm"><div className="rounded-xl border border-slate-700 p-4"><dt className="text-slate-400">Business profile</dt><dd>{company.isConfiguredByMerchant?company.name:'Not configured by the merchant'}</dd></div><div className="rounded-xl border border-slate-700 p-4"><dt className="text-slate-400">Dataset</dt><dd>{company.isDemo?'Synthetic demo records loaded':'Your current browser workspace'}</dd></div></dl><p className="text-sm text-slate-400">Production use requires server-side authentication/tenant controls, secure account storage, actual billing/communications services, verified backups and independent accounting/security review. No fabricated licence key, encrypted-password claim or verification hash is shown.</p><button className="rounded-xl border border-teal-700 px-4 py-2 text-sm" onClick={()=>{setSettingsSection('plans');setActivePlatform('settings');}}>View plan comparison</button></section>}
 {activeTab==='audit'&&(canViewAudit?<AuditLogPlatform />:<p role="alert" className="text-sm text-amber-300">Access history needs an eligible plan and Audit Logs role permission. Downloads also require Export Reports. Ask your administrator.</p>)}
 {activeTab==='terms'&&<section className="space-y-4 text-sm leading-relaxed text-slate-400"><h2 className="text-xl font-bold text-slate-100">Safe-use guidelines</h2><p>Use synthetic or non-sensitive test data in this preview. Current roles and plans are demonstration controls, not production tenant isolation. Do not enter real passwords, private customer/payroll records, card data or access tokens.</p><p>Recorded sales, debt collections and salary entries are bookkeeping only. No funds are transferred. Review figures and source documents independently before financial use.</p><p>Demo loading replaces the business records in this browser only after administrator confirmation. Create permitted backups before replacing or deleting records. Uploaded/captured customer pictures are not watermarked by the creator credit.</p><p>Support delivery is available only when SMTP is configured. A prepared draft, local message log, service brief or displayed email address is not evidence that a message or service was delivered.</p><p>Actual commercial licence terms, privacy requirements and the scope of any team engagement must be agreed with CODE76 separately. These guidelines do not create a paid licence, professional certification or result guarantee.</p><a className="font-bold text-teal-400 underline" href={CODE76_BRAND.emailUrl}>Ask CODE76 about your deployment</a></section>}
 <Code76Credit/>
 </div></div></div>;
};
