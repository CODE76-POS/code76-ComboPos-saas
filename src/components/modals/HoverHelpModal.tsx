import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  HelpCircle,
  Settings,
  BookOpen,
  ArrowRight,
  X,
  Sparkles,
  Mail,
  Download,
  Eye,
  Edit,
  Trash2,
  Megaphone,
  Camera,
  RefreshCw,
  Lock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PlatformId } from '../../types/index.ts';

const PLATFORM_HELP_MAP: Record<
  PlatformId,
  {
    title: string;
    description: string;
    whatItDoes: string[];
    settingsLocation: string;
    settingsTab: string;
    manualSection: string;
  }
> = {
  selling: {
    title: 'Sales & Checkout Platform',
    description: 'The core point-of-sale operational engine for creating transactions and ringing up sales.',
    whatItDoes: [
      'Multi-payment splitting: Accept combinations of Cash, M-Pesa, Card, Bank Wire, and Credit/Debt.',
      'Autocomplete search: Type SKU, barcode, or name with real-time stock and instant quantity additions.',
      'Flexible discounts: Apply discounts per individual line item or apply a cart-wide promotional discount.',
      'Extra charges: Add transportation, packaging, custom fees, or tax with automatic itemization.',
      'Referral commission attribution: Track who referred the customer (Peter Nick - Customer/Marketer).',
    ],
    settingsLocation: 'Settings > Payments & Settings > Color / Appearance',
    settingsTab: 'payments',
    manualSection: 'Section 1: Point of Sale & Checkout Operations',
  },
  sales_history: {
    title: 'Sales History & Debt Platform',
    description: 'Complete ledger of all past customer transactions, debt collections, and review collection.',
    whatItDoes: [
      'Drill down into individual line items and products sold in any past sale.',
      'Debt Settlement: Process partial or full debt payments when credit customers return.',
      'Customer Testimonials: Collect reviews and ratings directly from completed sales.',
      'Polite appreciation emails: Send pre-templated follow-up emails requesting testimonials.',
    ],
    settingsLocation: 'Settings > Receipts & Settings > Email Templates',
    settingsTab: 'emailTemplates',
    manualSection: 'Section 2: Sales History & Debt Reconciliation',
  },
  inventory: {
    title: 'Inventory & Product Catalog',
    description: 'Unified management for tangible physical goods and commercial service offerings.',
    whatItDoes: [
      'Dual Action Columns: Action controls positioned at both the start and the end of the table.',
      'Marketing Action Icon: Click the marketing icon on any row to dispatch direct promotional emails to customers.',
      'Low Stock Warnings: Automatic visual badges when stock dips below minimum alert threshold.',
      'PDF & CSV Export: Instantly export inventory catalogs for auditing.',
    ],
    settingsLocation: 'Settings > PDF & Excel Settings',
    settingsTab: 'pdfExcel',
    manualSection: 'Section 3: Inventory Control & Marketing Dispatch',
  },
  expenses: {
    title: 'Operational Expenses Platform',
    description: 'Track and categorize every overhead cost from showroom rent to marketing campaigns.',
    whatItDoes: [
      'Categorize expenses into Rent, Utilities, Salaries, Logistics, Marketing, and Supplies.',
      'Direct impact on the Profit & Loss (P&L) formula: Revenue minus COGS minus Expenses = Net Profit.',
      'Store digital receipt URLs and vendor payment methods.',
    ],
    settingsLocation: 'Settings > App User Privilege Settings',
    settingsTab: 'privileges',
    manualSection: 'Section 4: Operational Expense Auditing',
  },
  invoices: {
    title: 'Invoices Platform (Sales & Stock Purchases)',
    description: 'Dual billing hub for both customer receivables and vendor stock purchase orders.',
    whatItDoes: [
      'Issue professional customer sales invoices with due dates and payment terms.',
      'Track incoming vendor purchase invoices to reconcile incoming inventory shipments.',
      'Printable and downloadable PDF invoice views with corporate letterhead.',
    ],
    settingsLocation: 'Settings > Receipts Settings',
    settingsTab: 'receipts',
    manualSection: 'Section 5: Invoicing & Accounts Receivable',
  },
  analytics: {
    title: 'Executive Analytics & Profit/Loss',
    description: 'High-level business intelligence answering whether your company is making profits or losses.',
    whatItDoes: [
      'Financial P&L: Visualizes Expenses vs Sales vs Inventory costs (COGS) difference.',
      'Landing Page Infographics: Track visitors, time on page, chatbot interactions, and lead conversion rate.',
      'Top Referrers Leaderboard: Recognize top customers, marketers, and staff driving referral sales.',
      'AI CFO Insights: Run Gemini analysis for strategic profit expansion recommendations.',
    ],
    settingsLocation: 'Settings > Landing Page Settings',
    settingsTab: 'landingPage',
    manualSection: 'Section 6: Analytics, P&L & Conversion Metrics',
  },
  customers: {
    title: 'Customers Directory',
    description: 'Centralized CRM holding verified contact details, purchase history, and referral stats.',
    whatItDoes: [
      'Stores First & Second Name, Tel 1 & 2, WhatsApp, Email 1 & 2, Address, Location, Country, and Avatar.',
      'Landing Page Photo Consent: Mark whether client has approved displaying their photo for social proof.',
      'Top Referrer Badges: Displays star badges for top community referrers.',
      'CSV / Excel Import & Export with administrative validation.',
    ],
    settingsLocation: 'Settings > PDF & Excel Settings',
    settingsTab: 'pdfExcel',
    manualSection: 'Section 7: People & Directory Management',
  },
  vendors: {
    title: 'Vendors & Suppliers Directory',
    description: 'Vendor contact database for hardware manufacturers, paper suppliers, and distributors.',
    whatItDoes: [
      'All mandatory contact channels (Phone 1 & 2, WhatsApp, dual emails, physical location).',
      'Import vendor catalogs via CSV or export contact lists for purchasing agents.',
    ],
    settingsLocation: 'Settings > PDF & Excel Settings',
    settingsTab: 'pdfExcel',
    manualSection: 'Section 7: People & Directory Management',
  },
  transporters: {
    title: 'Transporters & Logistics Fleet',
    description: 'Delivery drivers, couriers, and freight companies handling store dispatches.',
    whatItDoes: [
      'Auto-synced: Company members assigned the role Transporter/Driver automatically appear here!',
      'All mandatory contacts, WhatsApp numbers, locations, and PDF reports.',
    ],
    settingsLocation: 'Settings > App User Privilege Settings',
    settingsTab: 'privileges',
    manualSection: 'Section 7: People & Directory Management',
  },
  marketing_team: {
    title: 'Marketing & Growth Team',
    description: 'Sales representatives, growth marketers, and customer relationship coordinators.',
    whatItDoes: [
      'Auto-synced: Company members assigned the Marketor role automatically appear here!',
      'Tracks total referral revenue volume generated by each marketer.',
    ],
    settingsLocation: 'Settings > App User Privilege Settings',
    settingsTab: 'privileges',
    manualSection: 'Section 7: People & Directory Management',
  },
  company_members: {
    title: 'Company Members & Staff Directory',
    description: 'Internal employees and contractors with mandatory dual-role job assignments.',
    whatItDoes: [
      'Dual Role Dropdowns: Select 2 specific titles from CEO, Manager, Developer, Transporter, Marketor, etc.',
      'Automatic Cross-Directory Sync: Transporter/Driver syncs to Transporters; Marketor syncs to Marketing Team.',
      'RBAC Role Privileges: Permissions automatically restrict or allow platform access based on roles.',
    ],
    settingsLocation: 'Settings > App User Privilege Settings',
    settingsTab: 'privileges',
    manualSection: 'Section 8: Company Members & Dual-Role Logic',
  },
  my_company: {
    title: 'My Company Profile',
    description: 'Corporate identity, vision, logo, tax registration PIN, and official contact credentials.',
    whatItDoes: [
      'Power the Public Landing Page with your genuine company slogan, logo, and vision.',
      'Appears on all printed sales receipts, PDF reports, and invoice headers.',
    ],
    settingsLocation: 'Settings > Landing Page Settings',
    settingsTab: 'landingPage',
    manualSection: 'Section 9: Company Setup & Public Brand Presence',
  },
  messaging: {
    title: 'Messaging & Communications Hub',
    description: 'Direct SMS, WhatsApp, and email communication channel for customers, vendors, and staff.',
    whatItDoes: [
      'Dispatch quick WhatsApp or email updates using pre-configured communication templates.',
      'Send stock alerts, order status updates, and review requests.',
    ],
    settingsLocation: 'Settings > Email Marketing Templates',
    settingsTab: 'emailTemplates',
    manualSection: 'Section 10: Multi-Channel Messaging',
  },
  landing_page_builder: {
    title: 'Landing Page & Data Gate Checker',
    description: 'E-commerce showcase builder connected directly to your live POS data and AI sales chatbot.',
    whatItDoes: [
      'Data Integrity Gate: Validates that inventory, company members, reviews, and company profile exist.',
      'First 6 items displayed in prominent cards; remaining items displayed in dynamic interactive slideshow.',
      'Live AI Sales Chatbot: Recommends products, closes deals, and invites non-buyers to refer friends.',
    ],
    settingsLocation: 'Settings > Landing Page Settings',
    settingsTab: 'landingPage',
    manualSection: 'Section 11: High-Conversion E-Commerce Landing Page & AI Bot',
  },
  settings: {
    title: 'System Settings Platform',
    description: 'Global configuration for payments, text sizing, receipts, colors, fonts, backups, and RBAC.',
    whatItDoes: [
      'Admin credentials verification for CSV/Excel data imports with visual template alignment.',
      'Customize responsive text sizing, left vs right cart placement, and color themes.',
      'Data backup export and restore in one click.',
    ],
    settingsLocation: 'Currently in Settings Platform',
    settingsTab: 'payments',
    manualSection: 'Section 12: Comprehensive Configuration & Security',
  },
  audit_logs: {
    title: 'Audit Logs & Login History',
    description: 'Detailed security and activity audit trail tracking who logged in, timestamps, actions taken, and session logout times.',
    whatItDoes: [
      'Tracks user login timestamps, IP/device sessions, exact actions performed, and logout events.',
      'Protected with admin login credential authorization gate.',
      'Filter and search access history by date, user name, role, and action type.',
      'Export audit trail records to CSV or PDF for compliance.',
    ],
    settingsLocation: 'Settings > App User Privilege Settings',
    settingsTab: 'privileges',
    manualSection: 'Section 13: Security & Access Audit History',
  },
  about: {
    title: 'About CODE76 POS & User Manual',
    description: 'System documentation, verified enterprise license key, terms of service, and full guides.',
    whatItDoes: [
      'Comprehensive searchable user manual for every single section of CODE76 POS.',
      'Displays authorized enterprise license key: C76-PRO-9842-ENTERPRISE-VALID.',
      'Legal terms and conditions for commercial software usage.',
    ],
    settingsLocation: 'Settings > App User Privilege Settings',
    settingsTab: 'privileges',
    manualSection: 'Complete User Manual Reference Guide',
  },
};

export const HoverHelpModal: React.FC = () => {
  const { hoverHelpPlatform, setHoverHelpPlatform, setActivePlatform } = usePOS();
  const [showIconGlossary, setShowIconGlossary] = useState(true);

  if (!hoverHelpPlatform) return null;

  const info = PLATFORM_HELP_MAP[hoverHelpPlatform] || PLATFORM_HELP_MAP.selling;

  const navigateToSettings = () => {
    setActivePlatform('settings');
    setHoverHelpPlatform(null);
  };

  const navigateToManual = () => {
    setActivePlatform('about');
    setHoverHelpPlatform(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 sm:p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setHoverHelpPlatform(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Close help"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-teal-400">
              Interactive Guidance & Help
            </span>
            <h3 className="text-xl font-bold text-slate-100">{info.title}</h3>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-4 leading-relaxed">{info.description}</p>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-teal-300 flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            Key Platform Capabilities
          </h4>
          <ul className="space-y-2">
            {info.whatItDoes.map((bullet, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Universal Action & Table Icons Meaning Guide */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-4">
          <button
            type="button"
            onClick={() => setShowIconGlossary(!showIconGlossary)}
            className="w-full flex items-center justify-between text-xs font-bold text-teal-300 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-400" />
              What Do The Icons On This Platform Mean? (Icon Guide)
            </span>
            {showIconGlossary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showIconGlossary && (
            <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-start gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                <Mail className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block text-[11px]">Email Export (Mail):</strong>
                  <span className="text-[10px] text-slate-400">Dispatch row or full table to members, admins, or customers (.pdf, .txt, .csv).</span>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                <Download className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block text-[11px]">PDF Print (Download):</strong>
                  <span className="text-[10px] text-slate-400">Directly generate printable official receipts, vouchers, and audit trail reports.</span>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                <Eye className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block text-[11px]">Inspect (Eye):</strong>
                  <span className="text-[10px] text-slate-400">Drill down into full line items, split payment breakdowns, and customer notes.</span>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                <Edit className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block text-[11px]">Edit / Update:</strong>
                  <span className="text-[10px] text-slate-400">Modify product pricing, stock alerts, directory contact records, or profile info.</span>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                <Trash2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block text-[11px]">Delete (Trash):</strong>
                  <span className="text-[10px] text-slate-400">Safely delete record with audit log tracking and permission checks.</span>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                <Megaphone className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block text-[11px]">Direct Marketing:</strong>
                  <span className="text-[10px] text-slate-400">Open marketing outreach widget with Gemini AI copy conversion.</span>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                <Camera className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block text-[11px]">5-Way Photo Uploader:</strong>
                  <span className="text-[10px] text-slate-400">Attach photo via URL, Google Drive link, device browse, drag & drop, or live camera.</span>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block text-[11px]">Warning & Stock Alert:</strong>
                  <span className="text-[10px] text-slate-400">Signals stock has dipped below minimum threshold or payment is overdue.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
              <Settings className="w-3.5 h-3.5" />
              Associated Settings
            </div>
            <p className="text-xs text-slate-300 mb-2">{info.settingsLocation}</p>
            <button
              onClick={navigateToSettings}
              className="text-xs text-amber-300 hover:text-amber-200 font-medium flex items-center gap-1 hover:underline cursor-pointer"
            >
              Open in Settings <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              User Manual Guide
            </div>
            <p className="text-xs text-slate-300 mb-2">{info.manualSection}</p>
            <button
              onClick={navigateToManual}
              className="text-xs text-sky-300 hover:text-sky-200 font-medium flex items-center gap-1 hover:underline cursor-pointer"
            >
              Read Full Manual <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setHoverHelpPlatform(null)}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition cursor-pointer"
          >
            Got It, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
