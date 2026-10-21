import { CODE76_BRAND, brandAssetUrl } from '../../config/code76Brand.ts';
import { Code76Credit, Code76SocialLinks } from '../common/Code76Credit.tsx';
import { SupportContactForm } from '../common/SupportContactForm.tsx';
import { PLAN_INFO, planTier } from '../../utils/plans.ts';
import { PlanPrice } from '../common/PlanPrice.tsx';
import { AuditLogPlatform } from './AuditLogPlatform.tsx';
import { accessHistoryPermissions } from '../../utils/accessHistory.ts';
import { MANUAL_CATEGORIES, USER_MANUAL, type ManualCategory, type ManualEntry } from '../../data/userManual.ts';
import { CODE76_PLATFORMS } from '../../config/code76Platforms.ts';
import type { PlatformId } from '../../types/index.ts';
import { appDialogs } from '../../utils/appDialogs.ts';
import React, { useMemo, useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Info,
  Layers,
  Lock,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';

/** Flattens an entry into searchable text while keeping one canonical field. */
const manualSections = USER_MANUAL.map((entry: ManualEntry) => ({
  ...entry,
  content: [entry.summary, ...entry.steps.map((step, index) => `${index + 1}. ${step}`), ...(entry.tips || [])].join('\n'),
}));

const categoryIcon = (category: ManualCategory) => {
  switch (category) {
    case 'Selling & receipts': return CheckCircle2;
    case 'Catalogue': return Layers;
    case 'Money in': return FileText;
    case 'People & access': return Users;
    case 'Insight': return Sparkles;
    case 'Growth & content': return ExternalLink;
    case 'System & data': return ShieldCheck;
    case 'Reference': return BookOpen;
    default: return Info;
  }
};

export const AboutPlatform: React.FC = () => {
  const { company, currentUser, settings, setActivePlatform, setSettingsSection } = usePOS();
  const [activeTab, setActiveTab] = useState<'manual' | 'about' | 'support' | 'license' | 'terms' | 'audit'>('manual');
  const [searchManual, setSearchManual] = useState('');
  const [category, setCategory] = useState<ManualCategory | 'All'>('All');
  const [expandedSection, setExpandedSection] = useState('first-run');
  const canViewAudit = accessHistoryPermissions(currentUser, settings).canView;

  const sections = useMemo(() => manualSections.filter((section) =>
    (category === 'All' || section.category === category) &&
    `${section.id} ${section.title} ${section.content}`.toLowerCase().includes(searchManual.toLowerCase()),
  ), [searchManual, category]);

  const completedCategories = useMemo(() => new Set(USER_MANUAL.map((entry) => entry.category)).size, []);

  const openPlatform = (platform?: ManualEntry['platform']) => {
    if (!platform) return;
    setActivePlatform(platform);
    appDialogs.toast('Opened from the user manual.', 'info');
  };

  const tabs = [
    { id: 'manual', label: 'User manual & guidelines' },
    { id: 'about', label: 'About & features' },
    { id: 'support', label: 'Contact support' },
    { id: 'license', label: 'Plan & demo status' },
    { id: 'audit', label: 'User Activity & Audit Logs' },
    { id: 'terms', label: 'Safe-use guidelines' },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={brandAssetUrl()} alt="CODE76 POS logo" className="h-16 w-16 rounded-2xl object-contain" />
          <div>
            <h1 className="text-2xl font-black">CODE76 POS · About, help & support</h1>
            <p className="mt-1 text-xs text-slate-400">A complete operator manual, honest demo status and direct support contact.</p>
          </div>
        </div>
        <button className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white" onClick={() => setActiveTab('support')}>Contact the support team</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <aside className="min-w-0 flex lg:block gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:col-span-3" aria-label="About and help sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 whitespace-nowrap rounded-xl border px-4 py-3 text-left text-sm font-semibold lg:w-full ${activeTab === tab.id ? 'border-teal-600 bg-teal-700 text-white' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}`}
            >
              {tab.label}
            </button>
          ))}
          <div className="hidden rounded-2xl border border-slate-800 bg-slate-950 p-3 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Manual coverage</p>
            <p className="mt-1 text-2xl font-black text-slate-100">{USER_MANUAL.length}</p>
            <p className="text-[11px] text-slate-500">guides across {completedCategories} categories</p>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-600">Search by task, platform, icon or symptom. Each guide links to the screen it describes when permitted by the plan.</p>
          </div>
        </aside>

        <div className="min-w-0 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7 lg:col-span-9">
          {activeTab === 'manual' && (
            <section>
              <h2 className="text-xl font-bold">Application user manual</h2>
              <p className="mt-2 text-sm text-slate-400">Search by task, such as receipt, debt, camera, roles, chatbot, analytics, backup or settings.</p>

              <div className="my-4 flex flex-wrap gap-2">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    aria-label="Search manual guides"
                    placeholder="Search manual guides…"
                    value={searchManual}
                    onChange={(event) => setSearchManual(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm"
                  />
                </div>
                <button type="button" onClick={() => { setSearchManual(''); setCategory('All'); }} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800">Reset filters</button>
              </div>

              <div className="mb-4 flex flex-wrap gap-1.5">
                {(['All', ...MANUAL_CATEGORIES] as const).map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => setCategory(entry)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${category === entry ? 'bg-teal-600 text-white' : 'border border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    {entry}
                  </button>
                ))}
              </div>

              {!sections.length && <p className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">No guide matched. Try a broader term, choose “All”, or contact support.</p>}

              <div className="space-y-2.5">
                {sections.map((section) => {
                  const Icon = categoryIcon(section.category);
                  const isOpen = expandedSection === section.id;
                  return (
                    <article className="overflow-hidden rounded-xl border border-slate-700" key={section.id}>
                      <button
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
                        aria-expanded={isOpen}
                        onClick={() => setExpandedSection(isOpen ? '' : section.id)}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-teal-300"><Icon className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-slate-100">{section.title}</span>
                          <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-slate-500">{section.category}</span>
                        </span>
                        {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />}
                      </button>
                      {isOpen && (
                        <div className="border-t border-slate-700 px-4 py-4">
                          <p className="text-sm leading-relaxed text-slate-300">{section.summary}</p>
                          <ol className="mt-3 space-y-1.5 text-sm leading-relaxed text-slate-400">
                            {section.steps.map((step, index) => (
                              <li key={index} className="flex gap-2">
                                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-[10px] font-black text-teal-300">{index + 1}</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                          {!!section.tips?.length && (
                            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-400">Good to know</p>
                              <ul className="mt-1 space-y-1 text-[12px] leading-relaxed text-slate-400">
                                {section.tips.map((tip, index) => <li key={index}>• {tip}</li>)}
                              </ul>
                            </div>
                          )}
                          {section.platform && (
                            <button
                              type="button"
                              onClick={() => openPlatform(section.platform)}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-teal-800 px-3 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-950/40"
                            >
                              Open the related platform <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-bold text-slate-200">Need a printable copy?</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Download the manual as plain text, or open it as a printable page. Both are generated in this browser.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const text = manualSections.map((section) => `${section.title}\n${'-'.repeat(section.title.length)}\n${section.content}\n`).join('\n');
                      const url = URL.createObjectURL(new Blob([`CODE76 POS USER MANUAL\n${text}\nWebsite created by CODE76\n`], { type: 'text/plain;charset=utf-8' }));
                      const link = document.createElement('a'); link.href = url; link.download = 'code76-pos-user-manual.txt'; link.click();
                      setTimeout(() => URL.revokeObjectURL(url), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                  >
                    <Download className="h-3.5 w-3.5" />Download TXT manual
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const opened = window.open('', '_blank');
                      if (!opened) { void appDialogs.alert({ title: 'Print window blocked', message: 'Allow pop-ups for this site to open the printable manual, or download the TXT copy.', tone: 'warning' }); return; }
                      opened.document.write(`<title>CODE76 POS User Manual</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:32px;line-height:1.55;color:#0f172a}h1{font-size:26px}h2{margin-top:28px;border-bottom:1px solid #cbd5e1;padding-bottom:4px;font-size:18px}li{margin:4px 0}.tip{background:#f1f5f9;padding:10px 14px;border-radius:8px;font-size:12px}</style><h1>CODE76 POS — User manual</h1><p>Generated ${new Date().toLocaleString()} · browser-local workspace</p>${manualSections.map((section) => `<h2>${section.title}</h2><p><strong>${section.category}</strong> — ${section.summary}</p><ol>${section.steps.map((step) => `<li>${step}</li>`).join('')}</ol>${section.tips?.length ? `<div class="tip">${section.tips.map((tip) => `• ${tip}`).join('<br/>')}</div>` : ''}`).join('')}<p style="margin-top:28px;font-size:11px;color:#475569">${CODE76_BRAND.credit} · ${CODE76_BRAND.email}</p>`);
                      opened.document.close();
                      opened.focus();
                      opened.print();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-600"
                  >
                    <FileText className="h-3.5 w-3.5" />Printable manual
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'about' && (
            <section className="space-y-5">
              <div className="flex items-center gap-4">
                <img src={brandAssetUrl()} alt="CODE76 POS logo" className="h-20 w-20 rounded-2xl object-contain" />
                <div>
                  <h2 className="text-2xl font-black">CODE76 POS</h2>
                  <p className="mt-1 text-xs text-teal-400">Products, services and business records · workspace preview</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Explore checkout, receipts in five formats, product/service inventory, linked companies, expenses and invoices, schedules and pay records, receivables aging, role-scoped reporting and a merchant assistant. The public CODE76 product site and your private business-page preview have separate content, settings and assistants.
              </p>

              <div>
                <h3 className="text-sm font-bold text-slate-100">What the workspace includes</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {[
                    { title: 'Selling & split payments', copy: 'Products, services, line/cart discounts, extra charges, tax, multiple payment channels and change due.' },
                    { title: 'Receipts that travel', copy: 'Preview, print, PDF/TXT/CSV/JSON/HTML downloads, plus email, WhatsApp, SMS or copied messages.' },
                    { title: 'Debt that stays honest', copy: 'Credit limits, partial repayment, vouchers, aging buckets, statements and reminder drafts.' },
                    { title: 'Catalogue control', copy: 'Stock adjustment with reasons, service billing units, promotions, CSV import and specification exports.' },
                    { title: 'People & companies', copy: 'Linked vendors/transporters/marketers, staff dual roles, shifts, pay basis and salary history.' },
                    { title: 'Money out', copy: 'Expenses with supplier snapshots, sales invoices and stock-purchase invoices with due dates.' },
                    { title: 'Analytics', copy: 'Filterable operational insights, margin/COGS, payment mix, top items, checkout hours and aging.' },
                    { title: 'Growth tools', copy: 'Private business landing page, review capture and a configurable catalogue-only assistant.' },
                    { title: 'Separate business workspaces', copy: 'Registering a business creates its own workspace. The person who registers is the administrator; staff logins are attached to company members and load only that business\'s records.' },
                    { title: 'Team access & recovery', copy: 'Administrators create staff usernames from company members. A security question reveals a forgotten username or resets a password using a hashed answer stored in this browser.' },
                    { title: 'Controls', copy: 'Role privilege matrix, audit trail, CSV import, JSON backup/restore and per-platform deletion.' },
                    { title: 'In-app dialogs', copy: 'Notices, confirmations, choices and prompts render as widgets — browser pop-up blocking cannot hide them.' },
                  ].map((card) => (
                    <article key={card.title} className="rounded-xl border border-slate-700 p-4">
                      <h4 className="font-bold text-teal-400">{card.title}</h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{card.copy}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-100">Platforms in the navigation</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {CODE76_PLATFORMS.filter((platform) => platform.id !== 'setup').map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => {
                        if (platform.id === 'backup_vault') {
                          setActivePlatform('settings');
                        } else {
                          setActivePlatform(platform.id as PlatformId);
                        }
                      }}
                      className="rounded-full border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-teal-700 hover:text-teal-200"
                    >
                      {platform.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { title: 'A workflow you can inspect', copy: 'Use clearly marked demo records or enter test records of your own. Prices, amounts and plan restrictions remain visible.' },
                  { title: 'Your records, clearly bounded', copy: 'Each business has its own workspace in this browser and switching businesses swaps the entire dataset. This is still not a server-backed, production multi-tenant deployment or a bank/payment processor.' },
                  { title: 'Assistance without false promises', copy: 'The assistant explains supplied data and contacts. It does not reserve stock, guarantee results or perform team services automatically.' },
                  { title: 'Support you can reach', copy: 'Use Contact support or the email/social links below. Direct server mail needs administrator SMTP configuration; drafts are not sent until you send them.' },
                ].map((card) => (
                  <article key={card.title} className="rounded-xl border border-slate-700 p-4">
                    <h4 className="font-bold text-slate-100">{card.title}</h4>
                    <p className="mt-1.5 text-sm text-slate-400">{card.copy}</p>
                  </article>
                ))}
              </div>
              <Code76SocialLinks />
            </section>
          )}

          {activeTab === 'support' && <SupportContactForm initialName={currentUser?.name || ''} initialEmail={currentUser?.email || ''} />}

          {activeTab === 'license' && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Plan & demo status</h2>
              <p className="text-sm text-slate-400">Selected tier: <strong className="text-teal-400">{PLAN_INFO[planTier(settings)].name}</strong>. This is a client-side demo entitlement, not a verified purchase, active subscription, registration key or security certificate.</p>
              <PlanPrice tier={planTier(settings)} />
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-slate-700 p-4"><dt className="text-slate-400">Business profile</dt><dd>{company.isConfiguredByMerchant ? company.name : 'Not configured by the merchant'}</dd></div>
                <div className="rounded-xl border border-slate-700 p-4"><dt className="text-slate-400">Dataset</dt><dd>{company.isDemo ? 'Synthetic demo records loaded' : 'Your current browser workspace'}</dd></div>
                <div className="rounded-xl border border-slate-700 p-4"><dt className="text-slate-400">Receipt formats</dt><dd>PDF, TXT, CSV, JSON, HTML</dd></div>
                <div className="rounded-xl border border-slate-700 p-4"><dt className="text-slate-400">Assistant</dt><dd>{settings.chatbot?.enabled === false ? 'Disabled by the merchant' : 'Catalogue-only business assistant'}</dd></div>
              </dl>
              <p className="text-sm text-slate-400">Production use requires server-side authentication/tenant controls, secure account storage, actual billing/communications services, verified backups and independent accounting/security review. No fabricated licence key, encrypted-password claim or verification hash is shown.</p>
              <button className="rounded-xl border border-teal-700 px-4 py-2 text-sm" onClick={() => { setSettingsSection('plans'); setActivePlatform('settings'); }}>View plan comparison</button>
            </section>
          )}

          {activeTab === 'audit' && (canViewAudit ? <AuditLogPlatform /> : <p role="alert" className="text-sm text-amber-300">Access history needs an eligible plan and Audit Logs role permission. Downloads also require Export Reports. Ask your administrator.</p>)}

          {activeTab === 'terms' && (
            <section className="space-y-4 text-sm leading-relaxed text-slate-400">
              <h2 className="text-xl font-bold text-slate-100">Safe-use guidelines</h2>
              <p>Use synthetic or non-sensitive test data in this preview. Workspaces are separated inside this browser, but roles, plans and accounts remain demonstration controls rather than server-enforced tenant security. Do not enter real passwords, private customer/payroll records, card data or access tokens. Anyone using the same browser profile could inspect local storage.</p>
              <p>Recorded sales, debt collections and salary entries are bookkeeping only. No funds are transferred. Review figures and source documents independently before financial use.</p>
              <p>Demo loading replaces the business records in this browser only after administrator confirmation. Create permitted backups before replacing or deleting records. Uploaded/captured customer pictures are not watermarked by the creator credit.</p>
              <p>Receipt “send” actions open a draft in your own mail, WhatsApp or SMS app. A prepared draft, download, local message log, service brief or displayed email address is not evidence that a message or service was delivered.</p>
              <p>Support delivery is available only when SMTP is configured. Actual commercial licence terms, privacy requirements and the scope of any team engagement must be agreed with CODE76 separately. These guidelines do not create a paid licence, professional certification or result guarantee.</p>
              <a className="font-bold text-teal-400 underline" href={CODE76_BRAND.emailUrl}>Ask CODE76 about your deployment</a>
            </section>
          )}

          <Code76Credit />
        </div>
      </div>
    </div>
  );
};
