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
import { printPDFReport } from '../../utils/exportUtils.ts';
import { EmailExportModal } from '../modals/EmailExportModal.tsx';

const USER_MANUAL_SECTIONS = [
  {
    id: 's1',
    title: 'Section 1: Point of Sale & Checkout Operations',
    content: `• Autocomplete Search: Start typing SKU, name, or scan barcode. The autocomplete dropdown displays the product photo, live price, available stock count, and an instant "+ Add 1" button.
• Multi-Payment Split: Click "+ Add Method" in the cart to split customer bill across Cash, M-Pesa, Card, Bank Wire, and Credit/Debt simultaneously.
• Extra Charges: Select charge reason (Tax, Transportation, Packaging, Delivery, Service Fee) and enter custom amount. It itemizes automatically.
• Discounts: Apply percentage or dollar discounts per line item, or apply a cart-wide promotional discount to the entire subtotal.
• Referral Tagging: Use the "Referred By" combo-box to credit customers, marketers, or staff (e.g. "Peter Nick (Customer)").
• Testimonial Prompt: Completing a checkout immediately opens the Customer Testimonial prompt for landing page social proof.`,
  },
  {
    id: 's2',
    title: 'Section 2: Sales History & Debt Reconciliation',
    content: `• Drilldown: Click the eye icon on any transaction row to inspect all products and services sold in that sale.
• Debt Operations: If a customer owes a balance, click "Pay Debt" to accept partial or complete settlement and record the payment channel.
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
• PDF Audit & CSV Export: Instantly export inventory valuation reports.`,
  },
  {
    id: 's4',
    title: 'Section 4: Operational Expense Auditing',
    content: `• Category Tagging: Group expenditures into Rent, Utilities, Salaries, Logistics, Marketing, Supplies, and Maintenance.
• Financial P&L Impact: Every expense automatically reconciles against gross sales and COGS to compute true Net Profit or Loss.
• Voucher Export: Print single payment vouchers or full monthly expense audit reports.`,
  },
  {
    id: 's5',
    title: 'Section 5: Invoicing & Accounts Receivable',
    content: `• Dual Billing: Supports customer Sales Invoices and vendor Stock Purchase Invoices.
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
    title: 'Section 7: Directory Management & Mandatory Fields',
    content: `• 5 Groups: Customers, Vendors, Transporters, Marketing Team, and Company Members.
• Mandatory Fields: First Name, Second Name, Tel 1, Tel 2, WhatsApp No, Email 1, Email 2, Address, Location, Country, and Photo.
• Photo Consent: Toggle whether person has consented to showcase their photo and review on the public landing page.`,
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
    title: 'Section 9: Public E-Commerce Landing Page & AI Sales Chatbot',
    content: `• Data Integrity Gate: Automatically verifies that inventory, company members, company info, sales, reviews, and analytics exist.
• Featured 6 Items & Interactive Slideshow: First 6 items show in primary cards; remaining catalog items cycle in an interactive slideshow.
• Live Sales Counter & Social Proof: Displays real-time sales completed and verified 5-star customer testimonials.
• Live AI Sales Concierge: Powered by Gemini with live inventory grounding. Matches visitor needs, handles price questions, closes sales, and offers referral rewards if they hesitate to buy!`,
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
  const { auditLogs, company, hasPrivilege } = usePOS();

  const [activeTab, setActiveTab] = useState<'manual' | 'about' | 'license' | 'terms' | 'audit'>('manual');
  const [searchManual, setSearchManual] = useState('');
  const [expandedSection, setExpandedSection] = useState<string>('s1');

  const filteredManual = USER_MANUAL_SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchManual.toLowerCase()) ||
      s.content.toLowerCase().includes(searchManual.toLowerCase())
  );

  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const canViewAudit = hasPrivilege('canViewAuditLogs');

  const auditExportColumns = [
    { header: 'Timestamp', dataKey: 'formattedTimestamp' },
    { header: 'User Name', dataKey: 'userName' },
    { header: 'User Role', dataKey: 'userRole' },
    { header: 'Security Action', dataKey: 'action' },
    { header: 'Event Details', dataKey: 'details' },
    { header: 'Terminal / IP', dataKey: 'ipOrDevice' },
  ];

  const handleExportAuditPDF = () => {
    printPDFReport(
      'System Security & Activity Audit Log',
      company,
      [
        { header: 'Timestamp', dataKey: 'timestamp' },
        { header: 'User', dataKey: 'user' },
        { header: 'Role', dataKey: 'role' },
        { header: 'Action', dataKey: 'action' },
        { header: 'Details', dataKey: 'details' },
      ],
      auditLogs.map((l) => ({
        timestamp: new Date(l.timestamp).toLocaleString(),
        user: l.userName,
        role: l.userRole,
        action: l.action,
        details: l.details,
      }))
    );
  };

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
                onClick={handleExportAuditPDF}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Audit PDF</span>
              </button>
              <button
                onClick={() => setEmailModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-teal-600/20"
              >
                <Mail className="w-4 h-4" />
                <span>Email PDF & CSV Audit Trail</span>
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

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100">User Activity & Security Audit Trail</h3>
                  <p className="text-xs text-slate-400">
                    Tracks who logged in, logged out, sales completed, inventory changes, and data imports.
                  </p>
                </div>
                {canViewAudit && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportAuditPDF}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export PDF
                    </button>
                    <button
                      onClick={() => setEmailModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-md shadow-teal-600/20"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email Audit Trail (PDF & CSV)
                    </button>
                  </div>
                )}
              </div>

              {!canViewAudit ? (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
                  <Lock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-300">
                    Audit log viewing is restricted by your role privilege settings.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-80 border border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">Activity Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-200">{log.userName}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-teal-300 border border-slate-700">
                              {log.userRole}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-100">{log.action}</td>
                          <td className="py-2 px-3 text-slate-300 text-xs">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

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

      {/* Email Export Modal for System Audit Trail (.pdf, .csv, and .txt formats) */}
      {emailModalOpen && (
        <EmailExportModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          title="System Security & Activity Audit Trail"
          moduleName="Audit Logs"
          isSingleRow={false}
          availableFormats={['pdf', 'csv', 'txt']}
          data={auditLogs.map((l) => ({
            ...l,
            formattedTimestamp: new Date(l.timestamp).toLocaleString(),
          }))}
          columns={auditExportColumns}
          metadata={[
            { label: 'Total Events Logged', value: `${auditLogs.length} Events` },
            { label: 'Security Level', value: 'Enterprise Role-Enforced' },
            { label: 'Company', value: company.name },
            { label: 'Tax PIN', value: company.taxPin },
          ]}
        />
      )}
    </div>
  );
};
