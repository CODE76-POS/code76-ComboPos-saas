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
• Appreciation & Review Email: Click the email icon to send a polite follow-up appreciation email. You can preview and edit the template before dispatch.
• Action Columns: Action icons appear at BOTH the beginning and the end of every table for ergonomic access.
• PDF Voucher: Click the download icon to generate a formatted printable sales voucher.`,
  },
  {
    id: 's3',
    title: 'Section 3: Inventory Control & Marketing Dispatch',
    content: `• Product vs Service: Physical goods track stock and minimum stock alert thresholds; commercial services provide infinite fulfillment.
• Direct Marketing Widget: Click the purple Megaphone icon on any inventory row to open the direct sales marketing widget. Select a target customer and marketer, choose a template (Discount, New Product, Low Stock Urgency), preview the message, and send!
• Gemini Copy Polish: Click "AI Polish with Gemini" in the marketing widget to automatically generate high-converting promotional email copy.
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
• 🔒 Lock & Security (Lock / Shield): Signifies encrypted credentials, privilege restrictions, and manager PIN authorization gates.
• ⚠️ Warning & Alert (AlertTriangle): Alerts staff to critical events like low inventory stock thresholds, debt overdue balances, or system warnings.
• ⭐ Star Rating & Referrer (Star): Displays verified customer review scores (1-5 stars) and highlights top-performing community referrers.`,
  },
];

export const AboutPlatform: React.FC = () => {
  const { company, currentUser, settings } = usePOS();

  const [activeTab, setActiveTab] = useState<'manual' | 'about' | 'license' | 'terms' | 'audit'>('manual');
  const [searchManual, setSearchManual] = useState('');
  const [expandedSection, setExpandedSection] = useState<string>('s1');

  const filteredManual = USER_MANUAL_SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchManual.toLowerCase()) ||
      s.content.toLowerCase().includes(searchManual.toLowerCase())
  );

  const canViewAudit = accessHistoryPermissions(currentUser, settings).canView;
  const openAccessHistory = () => setActiveTab('audit');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">About CODE76 POS & Manual</h1>
          <p className="text-xs text-slate-400">
            System documentation for every section, verified commercial license key, audit activity tracking, and terms of service.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canViewAudit && (
            <>
              <button
                onClick={openAccessHistory}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Access history & exports</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-1">
          {[
            { id: 'manual', label: 'User Manual (All Sections)', icon: BookOpen },
            { id: 'about', label: 'About CODE76 POS', icon: Info },
            { id: 'license', label: 'License & Product Key', icon: KeyRound },
            { id: 'audit', label: 'User Activity & Audit Logs', icon: Clock },
            { id: 'terms', label: 'Terms & Conditions', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Panel */}
        <div className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white">
          {/* TAB 1: USER MANUAL */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-100">Complete Application User Manual</h3>
                  <p className="text-xs text-slate-400">Exhaustive operational guides for every platform section.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search manual guides..."
                    value={searchManual}
                    onChange={(e) => setSearchManual(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {filteredManual.map((sec) => {
                  const isOpen = expandedSection === sec.id;
                  return (
                    <div
                      key={sec.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden transition"
                    >
                      <button
                        onClick={() => setExpandedSection(isOpen ? '' : sec.id)}
                        className="w-full text-left p-4 flex items-center justify-between text-xs font-bold text-slate-200 hover:text-teal-300 transition cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-teal-400" />
                          {sec.title}
                        </span>
                        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                          {sec.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ABOUT THE APP */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-teal-500/20">
                  76
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-100">CODE76 POS Enterprise Edition</h3>
                  <p className="text-xs text-teal-400 font-semibold">Version 4.8.2 (Production Stable)</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                CODE76 POS is a unified service and product Point of Sale, ERP inventory, and AI-powered lead-to-buyer conversion ecosystem.
                Designed for retail supermarkets, hardware distributors, pharmacies, restaurants, and technical service providers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-teal-400 mb-1">Dual-Sided Architecture</div>
                  <p className="text-xs text-slate-400">
                    High-conversion public e-commerce landing page synced real-time with backend ERP POS terminal.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-sky-400 mb-1">Autonomous Gemini AI Sales</div>
                  <p className="text-xs text-slate-400">
                    AI sales concierge matches customer needs, addresses objections, closes deals, and triggers viral referral rewards.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-amber-400 mb-1">P&L Financial Clarity</div>
                  <p className="text-xs text-slate-400">
                    Tracks expenses vs sales vs inventory costs difference to give business owners guaranteed profit or loss visibility.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LICENSE & PRODUCT KEY */}
          {activeTab === 'license' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">App License & Product Key Verification</h3>
                <p className="text-xs text-slate-400">Authorized commercial deployment credentials.</p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">License Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active Enterprise License
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Registered Business Entity:</span>
                  <span className="text-xs font-bold text-slate-100">{company.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Product Registration Key:</span>
                  <span className="font-mono text-sm font-black text-amber-300 tracking-wider bg-slate-900 px-3 py-1 rounded-lg border border-amber-500/30">
                    C76-PRO-9842-ENTERPRISE-VALID
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Access Control Model:</span>
                  <span className="text-xs text-slate-200 font-mono">Hierarchical RBAC (Encrypted Passwords)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Security Signature:</span>
                  <span className="text-[10px] text-slate-500 font-mono">SHA256: 76f9c088219ae0891bf76e9821</span>
                </div>
              </div>
            </div>
          )}

          {/* One consistent permission-checked history/export surface. */}
          {activeTab === 'audit' && <AuditLogPlatform />}

          {/* TAB 5: TERMS AND CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
              <h3 className="text-base font-bold text-slate-100">Terms & Conditions of Software Use</h3>
              <p>
                1. <strong>License Grant:</strong> CODE76 POS grants the licensee a non-exclusive, commercial license to install, operate, and manage transactions across authorized retail and service terminals.
              </p>
              <p>
                2. <strong>Financial Reconciliation:</strong> The business owner maintains ultimate fiduciary responsibility for verifying physical cash drawer balances against the automated Profit & Loss records.
              </p>
              <p>
                3. <strong>Data Privacy & Consent:</strong> Customer photos, reviews, and referrals displayed on the public landing page require explicit consent via the directory checkbox.
              </p>
              <p>
                4. <strong>Security Integrity:</strong> All master administrative operations including CSV file imports and system restores require verification to prevent unintended data overwrites.
              </p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};
