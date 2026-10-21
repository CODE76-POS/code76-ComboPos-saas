import { appDialogs } from '../../utils/appDialogs.ts';
import {DemoTrainingSettings} from '../common/DemoTrainingSettings.tsx';
import { TeamServicesPanel } from '../common/TeamServicesPanel.tsx';
import { TeamAccessPanel } from '../common/TeamAccessPanel.tsx';
import { writeWorkspaceData } from '../../utils/accounts.ts';
import { canOpenSettings, planTier } from '../../utils/plans.ts';
import { regional, validTimeZone } from '../../utils/regional.ts';
import { PAYMENT_METHODS } from '../../config/paymentMethods.ts';
import { RegionalSettingsForm } from '../common/RegionalSettingsForm.tsx';
import { DemoPlanSettings } from '../common/DemoPlanSettings.tsx';
import { PlanNotice } from '../common/PlanNotice.tsx';
import { accessHistoryPermissions, permittedBackup } from '../../utils/accessHistory.ts';
import { DEFAULT_SERVICE_UNIT, parseServiceUnit } from '../../utils/serviceUnits.ts';
import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  Settings,
  CreditCard,
  Type,
  Globe,
  Receipt,
  Palette,
  HardDrive,
  Shield,
  FileSpreadsheet,
  Mail,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Upload,
  Download,
  KeyRound,
  HelpCircle,
  FileText,
  UserCheck,
  ShieldCheck,
  Trash2,
  Package,
  Layers,
  Users,
  Building,
  Truck,
  RotateCcw,
  Database,
  Sun,
  Moon,
  MessageCircle,
} from 'lucide-react';
import { ALL_ROLES, AppSettings, UserRole } from '../../types/index.ts';
import { parseCSV } from '../../utils/exportUtils.ts';
import { AuditLogPlatform } from './AuditLogPlatform.tsx';
import { DataDeletionCenter } from '../common/DataDeletionCenter.tsx';
import { ChatbotSettingsPanel } from '../common/ChatbotSettingsPanel.tsx';
import { PrivilegeMatrix } from '../common/PrivilegeMatrix.tsx';
import { RECEIPT_CHANNELS, RECEIPT_FORMATS, DEFAULT_RECEIPT_SEND_TEMPLATE } from '../../config/assistant.ts';

export const SettingsPlatform: React.FC = () => {
  const {
    settings,
    setCompany,
    setSettings,
    settingsSection: activeTab,
    setSettingsSection: setActiveTab,
    currentUser,
    hasPrivilege,
    addProduct,
    addPerson,
    addExpense,
    setHoverHelpPlatform,
    logAuditAction,
    products,
    sales,
    expenses,
    invoices,
    customers,
    vendors,
    transporters,
    marketingTeam,
    companyMembers,
    reviews,
    auditLogs,
  } = usePOS();



  const [formSettings, setFormSettings] = useState<AppSettings>(settings);
  useEffect(() => {
    setFormSettings(previous => ({ ...previous, textSizing: settings.textSizing, appearance: { ...previous.appearance, theme: settings.appearance.theme } }));
  }, [settings.appearance.theme, settings.textSizing]);
  const [settingsSearch,setSettingsSearch]=useState('');
  const [saveAlert, setSaveAlert] = useState<string>('');

  // CSV Import State in PDF & Excel Settings
  const [adminAuthVerified, setAdminAuthVerified] = useState<boolean>(currentUser?.isAdmin || false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [targetImportPlatform, setTargetImportPlatform] = useState<
    'inventory' | 'customers' | 'vendors' | 'transporters' | 'marketing_team' | 'company_members' | 'expenses'
  >('inventory');
  const [importFileContent, setImportFileContent] = useState<string>('');
  const [importSuccessAlert, setImportSuccessAlert] = useState<string>('');
  const [importErrorAlert, setImportErrorAlert] = useState<string>('');

  // Backup restore file input
  const [restoreJson, setRestoreJson] = useState<string>('');


  const handleSave = () => {
    if (!canOpenSettings(settings,activeTab)) { setSaveAlert('This settings section is not included in your demo plan.'); return; }
    if (!validTimeZone(regional(formSettings).timeZone) || !/^[A-Z]{3}$/.test(formSettings.payments.defaultCurrency)) { setSaveAlert('Choose a valid time zone and a three-letter currency code.'); return; }
    if (!formSettings.payments.acceptedMethods.some(method=>method!=='Credit / Debt')) { setSaveAlert('Enable at least one non-debt payment channel.'); return; }
    if (activeTab === 'privileges' && !currentUser?.isAdmin) {
      setSaveAlert('Only an administrator can change role privileges.');
      return;
    }
    // Non-admin appearance/preferences saves must not modify the permission map.
    const permitted = planTier(settings)==='free' ? { ...settings, payments:formSettings.payments, appearance:formSettings.appearance, font:formSettings.font, textSizing:formSettings.textSizing, receipts:formSettings.receipts, regional:formSettings.regional } : formSettings;
    setSettings({ ...permitted, planTier:settings.planTier, privileges:currentUser?.isAdmin ? permitted.privileges : settings.privileges });
    setCompany(previous=>({...previous,currency:formSettings.payments.defaultCurrency}));
    logAuditAction('Updated System Settings', `Saved configuration changes in ${activeTab}`);
    setSaveAlert('Settings saved successfully!');
    setTimeout(() => setSaveAlert(''), 2500);
  };

  // Admin authentication check for CSV Import
  const handleVerifyAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (adminPasswordInput === '7676' || currentUser?.isAdmin) {
      setAdminAuthVerified(true);
      logAuditAction('Admin Authenticated for Import', 'Verified admin credentials for Excel/CSV data pipeline');
    } else {
      setAuthError('Incorrect administrator password. Access denied.');
    }
  };

  // Expected column guides for target platforms
  const COLUMN_GUIDES: Record<string, { columns: string[]; example: string }> = {
    inventory: {
      columns: ['name', 'category', 'sku', 'barcode', 'costPrice', 'sellingPrice', 'stock', 'minStockAlert', 'type', 'description'],
      example: 'CODE76 Touch Terminal,Hardware,POS-99,760012,380,599,20,5,product,True-flat capacitive touchscreen',
    },
    customers: {
      columns: ['firstName', 'secondName', 'tel1', 'tel2', 'whatsappNo', 'email1', 'email2', 'address', 'location', 'country'],
      example: 'Alex,Kariuki,+1 555 1234,+1 555 5678,+1 555 1234,alex@apex.com,alex.personal@gmail.com,Plot 12,Kilimani,Kenya',
    },
    vendors: {
      columns: ['firstName', 'secondName', 'tel1', 'tel2', 'whatsappNo', 'email1', 'email2', 'address', 'location', 'country'],
      example: 'Apex,Hardware Supplies,+1 555 8899,+1 555 8800,+1 555 8899,sales@apexsupplies.com,,Depot 3,Industrial,Kenya',
    },
    transporters: {
      columns: ['firstName', 'secondName', 'tel1', 'tel2', 'whatsappNo', 'email1', 'email2', 'address', 'location', 'country'],
      example: 'Swift,Express Logistics,+1 555 3344,+1 555 3345,+1 555 3344,dispatch@swift.com,,Gate 4,Embakasi,Kenya',
    },
    marketing_team: {
      columns: ['firstName', 'secondName', 'tel1', 'tel2', 'whatsappNo', 'email1', 'email2', 'address', 'location', 'country'],
      example: 'Kevin,Kiprono,+1 555 7766,+1 555 7767,+1 555 7766,kevin@growth.com,,Suite 2,Westlands,Kenya',
    },
    company_members: {
      columns: ['firstName', 'secondName', 'tel1', 'tel2', 'whatsappNo', 'email1', 'email2', 'address', 'location', 'country', 'role1', 'role2'],
      example: 'Jane,Wanjiku,+1 555 4411,+1 555 4412,+1 555 4411,jane@code76.com,,Depot,CBD,Kenya,Marketor,Manager',
    },
    expenses: {
      columns: ['title', 'category', 'amount', 'date', 'vendorName', 'paymentMethod', 'description'],
      example: 'Warehouse Electricity,Utilities,180,2026-10-15,Kenya Power,Bank Transfer,Monthly grid supply',
    },
  };

  // Handle CSV file upload & parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportFileContent(text);
    };
    reader.readAsText(file);
  };

  // Validate and commit CSV import to database
  const handleCommitImport = () => {
    setImportErrorAlert('');
    setImportSuccessAlert('');

    if (!importFileContent.trim()) {
      setImportErrorAlert('Please select or paste valid CSV data first.');
      return;
    }

    try {
      const records = parseCSV(importFileContent);
      if (records.length === 0) {
        setImportErrorAlert('The uploaded CSV file contains no readable data rows.');
        return;
      }

      const guide = COLUMN_GUIDES[targetImportPlatform];
      const firstRowKeys = Object.keys(records[0]).map((k) => k.toLowerCase());

      // Check required columns alignment
      const missing = guide.columns.filter((c) => !firstRowKeys.includes(c.toLowerCase()));
      if (missing.length > 3) {
        setImportErrorAlert(
          `Column alignment mismatch! Missing expected columns: ${missing.join(', ')}. Please refer to the alignment guide.`
        );
        return;
      }

      if (targetImportPlatform === 'inventory') {
        const invalid = records.find(row => row.type?.toLowerCase() === 'service' && (row.serviceUnit || row.serviceunit)?.trim() && !parseServiceUnit(row.serviceUnit || row.serviceunit));
        if (invalid) throw new Error('Unsupported serviceUnit. Use task, minute, hour, day, week, month, year, session, visit or project.');
      }
      // Add to database
      let count = 0;
      records.forEach((row) => {
        if (targetImportPlatform === 'inventory') {
          addProduct({
            name: row.name || 'Imported Product',
            category: row.category || 'General',
            sku: row.sku || `SKU-${Date.now().toString().slice(-5)}`,
            barcode: row.barcode || `7600${Math.floor(100000 + Math.random() * 900000)}`,
            costPrice: parseFloat(row.costprice) || 0,
            sellingPrice: parseFloat(row.sellingprice) || 0,
            stock: row.type?.toLowerCase() === 'service' ? 0 : parseInt(row.stock) || 10,
            minStockAlert: row.type?.toLowerCase() === 'service' ? 0 : parseInt(row.minstockalert) || 2,
            type: (row.type?.toLowerCase() === 'service' ? 'service' : 'product') as any,
            serviceUnit: row.type?.toLowerCase() === 'service' ? parseServiceUnit(row.serviceUnit || row.serviceunit) || DEFAULT_SERVICE_UNIT : undefined,
            description: row.description || '',
            imageUrl: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=600&auto=format&fit=crop&q=80',
          });
          count++;
        } else if (targetImportPlatform === 'expenses') {
          addExpense({
            title: row.title || 'Imported Expense',
            category: (row.category as any) || 'Other',
            amount: parseFloat(row.amount) || 0,
            date: row.date || new Date().toISOString().split('T')[0],
            vendorName: row.vendorname || 'Vendor',
            paymentMethod: row.paymentmethod || 'Bank Transfer',
            description: row.description || '',
          });
          count++;
        } else {
          // People directory
          const cat =
            targetImportPlatform === 'company_members'
              ? 'company_member'
              : (targetImportPlatform as any);

          addPerson(cat, {
            firstName: row.firstname || 'Imported',
            secondName: row.secondname || 'User',
            tel1: row.tel1 || '+1 555 0000',
            tel2: row.tel2 || '',
            whatsappNo: row.whatsappno || row.tel1 || '',
            email1: row.email1 || 'user@example.com',
            email2: row.email2 || '',
            address: row.address || 'Commercial Hub',
            location: row.location || 'Nairobi',
            country: row.country || 'Kenya',
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            photoConsentForLanding: true,
            category: cat,
            roles:
              cat === 'company_member'
                ? [(row.role1 as UserRole) || 'Associate', (row.role2 as UserRole) || 'Other']
                : undefined,
            notes: 'Imported via CSV Data Alignment Tool',
          });
          count++;
        }
      });

      setImportSuccessAlert(`Successfully verified and imported ${count} records into ${targetImportPlatform}!`);
      logAuditAction(
        'CSV Import Succeeded',
        `Imported ${count} verified records into ${targetImportPlatform} platform`
      );
      setImportFileContent('');
    } catch (err: any) {
      setImportErrorAlert(`Failed to parse CSV: ${err.message || String(err)}`);
    }
  };

  // Backup Export
  const handleDownloadFullBackup = () => {
    const stateStr = localStorage.getItem('code76_pos_state_v1');
    if (!stateStr) return;
    let allowedState: string;
    try { allowedState = permittedBackup(stateStr, currentUser, settings); }
    catch { setSaveAlert('The saved backup could not be read. No file was downloaded.'); return; }
    const blob = new Blob([allowedState], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CODE76_POS_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    logAuditAction('Exported Database Backup', accessHistoryPermissions(currentUser, settings).canExport ? 'Created JSON backup including authorized access history' : 'Created JSON backup with access history excluded by permissions');
    setSaveAlert(accessHistoryPermissions(currentUser, settings).canExport ? 'Backup download requested.' : 'Backup download requested. Access history was omitted because export permission is not granted.');
  };

  // Backup Restore
  const handleRestoreBackup = () => {
    if (!currentUser?.isAdmin) { setSaveAlert('Only an administrator can restore a full database snapshot.'); return; }
    try {
      if (!restoreJson.trim()) return;
      const parsed = JSON.parse(restoreJson);
      localStorage.setItem('code76_pos_state_v1', restoreJson);
      // The signed-in business also keeps its own scoped snapshot; update both
      // so a restore can never leak records into another workspace.
      if (currentUser?.workspaceId) writeWorkspaceData(currentUser.workspaceId, parsed);
      void appDialogs.alert({ title: 'Backup restored', message: 'The saved snapshot was written to this browser. Reloading the workspace now.', tone: 'success' }).then(() => window.location.reload());
    } catch {
      void appDialogs.alert({ title: 'Backup not restored', message: 'Invalid JSON file format. Please upload a valid CODE76 POS backup.', tone: 'danger' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">System Settings Platform</h1>
            <button
              onClick={() => setHoverHelpPlatform('settings')}
              title="Click for platform guidance & settings"
              className="p-1 rounded-lg text-teal-400 hover:text-teal-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Configure payment methods, responsive text sizing, landing page rules, receipts, appearance, font families, backups, privileges, and PDF/Excel import pipeline.
          </p>
        </div>

        {saveAlert && (
          <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl px-3.5 py-1.5 text-xs text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {saveAlert}
          </div>
        )}
      </div>

      {/* Main Settings Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-1"><input aria-label="Find settings" placeholder="Find a setting…" value={settingsSearch} onChange={event=>setSettingsSearch(event.target.value)} className="mb-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"/>
          {[
            { id: 'plans', label: 'Demo Plan Settings', icon: Shield },
            { id: 'demoData', label: 'Demo Data & Training', icon: Database },
            { id: 'teamServices', label: 'CODE76 Team Services', icon: Users },
            { id: 'payments', label: 'Payment Settings', icon: CreditCard },
            { id: 'regional', label: 'Currency, Date & Time', icon: Globe },
            { id: 'dataEraser', label: 'Delete Platform Data', icon: Trash2 },
            { id: 'chatbot', label: 'Chatbot & Assistant Settings', icon: MessageCircle },
            { id: 'textSizing', label: 'Text Sizing Settings', icon: Type },
            { id: 'landingPage', label: 'Business Landing Page Settings', icon: Globe },
            { id: 'receipts', label: 'Receipts Settings', icon: Receipt },
            { id: 'appearance', label: 'App Appearance Settings', icon: Palette },
            { id: 'font', label: 'Font Text Settings', icon: FileText },
            { id: 'backup', label: 'Data Backup Settings', icon: HardDrive },
            { id: 'teamAccess', label: 'Team Access & Logins', icon: KeyRound, adminOnly: true },
            { id: 'privileges', label: 'App User Privilege Settings', icon: Shield, adminOnly: true },
            { id: 'pdfExcel', label: 'PDF & Excel Settings (CSV Import)', icon: FileSpreadsheet },
            { id: 'emailTemplates', label: 'Email Marketing Templates', icon: Mail },
            { id: 'auditLogs', label: 'Audit Logs & Login History', icon: ShieldCheck },
          ].filter(tab=>canOpenSettings(settings,tab.id as any)&&(!('adminOnly' in tab) || !tab.adminOnly || currentUser?.isAdmin)&&tab.label.toLowerCase().includes(settingsSearch.toLowerCase())).map((tab) => {
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
        <div className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          {canOpenSettings(settings,activeTab) ? <>
          {/* TAB 1: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-100">Payments & Checkout Settings</h3>
                <p className="text-xs text-slate-400">Configure multi-payment channels, currencies, and tax.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Accepted Payment Methods
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {PAYMENT_METHODS.filter(method=>method!=='Card'&&method!=='Bank Wire').map(
                    (m) => (
                      <label
                        key={m}
                        className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formSettings.payments.acceptedMethods.includes(m)}
                          onChange={(e) => {
                            const cur = formSettings.payments.acceptedMethods;
                            const next = e.target.checked ? [...cur, m] : cur.filter((x) => x !== m);
                            setFormSettings({
                              ...formSettings,
                              payments: { ...formSettings.payments, acceptedMethods: next },
                            });
                          }}
                          className="rounded text-teal-500 focus:ring-teal-500"
                        />
                        <span className="text-slate-200">{m}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Default Currency Symbol</label>
                  <input
                    type="text"
                    value={formSettings.payments.defaultCurrency}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        payments: { ...formSettings.payments, defaultCurrency: e.target.value },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Standard Sales Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formSettings.payments.taxRatePercentage}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        payments: { ...formSettings.payments, taxRatePercentage: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <input
                  id="debtSalesAllow"
                  type="checkbox"
                  disabled={planTier(settings)==='free'} checked={formSettings.payments.allowDebtSales}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      payments: { ...formSettings.payments, allowDebtSales: e.target.checked },
                    })
                  }
                  className="rounded text-teal-500 focus:ring-teal-500"
                />
                <label htmlFor="debtSalesAllow" className="text-xs text-slate-300 cursor-pointer">
                  Allow partial payment & customer credit debts (Tracked in Sales History platform)
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: TEXT SIZING */}
          {activeTab === 'textSizing' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-100">Global Text Sizing Settings</h3>
                <p className="text-xs text-slate-400">
                  Select default scale for table typography, buttons, and cash register displays.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'compact', label: 'Compact Sizing', desc: 'Dense data density' },
                  { id: 'normal', label: 'Normal Sizing (Recommended)', desc: 'Standard clarity' },
                  { id: 'large', label: 'Large Sizing', desc: 'Enhanced legibility' },
                  { id: 'xlarge', label: 'Extra Large Sizing', desc: 'Maximum touch readability' },
                ].map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() =>
                      setFormSettings({
                        ...formSettings,
                        textSizing: sz.id as any,
                      })
                    }
                    className={`p-4 rounded-2xl text-left border transition cursor-pointer ${
                      formSettings.textSizing === sz.id
                        ? 'bg-teal-600/20 border-teal-500 text-teal-300 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">{sz.label}</div>
                    <div className="text-[10px] text-slate-400">{sz.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LANDING PAGE SETTINGS */}
          {activeTab === 'landingPage' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Business Landing Page & Chatbot Settings</h3>
                <p className="text-xs text-slate-400 mt-2">These settings affect only your private Business Landing Page inside the POS. They never change the CODE76 main site or its sign-in page, and do not publish a public storefront.</p>
                <p className="text-xs text-slate-400">
                  Configure hero headlines, AI sales assistant, slideshow speed, and referral reward text.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Hero Main Headline</label>
                <input
                  type="text"
                  aria-label="Business page headline"
                  value={formSettings.landingPage.heroTitle}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      landingPage: { ...formSettings.landingPage, heroTitle: e.target.value },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Hero Subtitle</label>
                <textarea
                  rows={2}
                  aria-label="Business page subtitle"
                  value={formSettings.landingPage.heroSubtitle}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      landingPage: { ...formSettings.landingPage, heroSubtitle: e.target.value },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Slideshow Transition Speed (ms)</label>
                  <input
                    type="number"
                    step="500"
                    min="2000"
                    max="10000"
                    value={formSettings.landingPage.slideshowSpeedMs}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        landingPage: {
                          ...formSettings.landingPage,
                          slideshowSpeedMs: parseInt(e.target.value) || 4000,
                        },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Featured Grid Items Count</label>
                  <input
                    type="number"
                    min="3"
                    max="12"
                    value={formSettings.landingPage.featuredCount}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        landingPage: {
                          ...formSettings.landingPage,
                          featuredCount: parseInt(e.target.value) || 6,
                        },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Referral Reward Text (Shown to visitors if they hesitate to buy)
                </label>
                <input
                  type="text"
                  aria-label="Business page referral offer"
                  value={formSettings.landingPage.referralBonusText}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      landingPage: {
                        ...formSettings.landingPage,
                        referralBonusText: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer flex-1 text-xs">
                  <input
                    type="checkbox"
                    checked={formSettings.landingPage.showChatbot}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        landingPage: { ...formSettings.landingPage, showChatbot: e.target.checked },
                      })
                    }
                    className="rounded text-teal-500"
                  />
                  <span>Enable Gemini Live AI Sales Chatbot</span>
                </label>

                <label className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer flex-1 text-xs">
                  <input
                    type="checkbox"
                    checked={formSettings.landingPage.showSocialProof}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        landingPage: { ...formSettings.landingPage, showSocialProof: e.target.checked },
                      })
                    }
                    className="rounded text-teal-500"
                  />
                  <span>Showcase Verified Testimonials & Reviews</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: RECEIPTS */}
          {activeTab === 'receipts' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Thermal Receipt Printout Settings</h3>
                <p className="text-xs text-slate-400">Configure header slogans, return policies, and barcode layout.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Receipt Header Title</label>
                <input
                  type="text"
                  value={formSettings.receipts.headerTitle}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      receipts: { ...formSettings.receipts, headerTitle: e.target.value },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Thank You Notice</label>
                <input
                  type="text"
                  value={formSettings.receipts.footerNotice}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      receipts: { ...formSettings.receipts, footerNotice: e.target.value },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Return & Warranty Policy</label>
                <textarea
                  rows={2}
                  value={formSettings.receipts.returnPolicy}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      receipts: { ...formSettings.receipts, returnPolicy: e.target.value },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSettings.receipts.showBarcode}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        receipts: { ...formSettings.receipts, showBarcode: e.target.checked },
                      })
                    }
                    className="rounded text-teal-500"
                  />
                  <span>Render Barcode on bottom of receipt</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSettings.receipts.showTaxPin}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        receipts: { ...formSettings.receipts, showTaxPin: e.target.checked },
                      })
                    }
                    className="rounded text-teal-500"
                  />
                  <span>Print Tax / VAT PIN on header</span>
                </label>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <h4 className="text-sm font-bold text-slate-100">Sending & delivery after a sale</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">The cashier is offered the receipt right after checkout. Nothing is emailed or messaged automatically by CODE76 — the chosen channel opens a pre-filled draft on this device.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="flex items-start gap-2 rounded-xl border border-slate-800 p-2.5 text-xs text-slate-300">
                    <input type="checkbox" checked={formSettings.receipts.autoOpenAfterSale !== false} onChange={(event) => setFormSettings({ ...formSettings, receipts: { ...formSettings.receipts, autoOpenAfterSale: event.target.checked } })} className="mt-0.5 rounded text-teal-500" />
                    <span><strong className="block text-slate-100">Open the receipt preview after checkout</strong>The cashier can print, download or send it immediately.</span>
                  </label>
                  <label className="flex items-start gap-2 rounded-xl border border-slate-800 p-2.5 text-xs text-slate-300">
                    <input type="checkbox" checked={formSettings.receipts.promptAfterSale !== false} onChange={(event) => setFormSettings({ ...formSettings, receipts: { ...formSettings.receipts, promptAfterSale: event.target.checked } })} className="mt-0.5 rounded text-teal-500" />
                    <span><strong className="block text-slate-100">Ask “Send receipt now?”</strong>Shows an in-app choice to send, download or skip. Never a browser popup.</span>
                  </label>
                </div>

                <p className="mt-4 text-xs font-semibold text-slate-400">Download formats offered</p>
                <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {RECEIPT_FORMATS.map((format) => {
                    const enabled = (formSettings.receipts.enabledFormats || RECEIPT_FORMATS.map((entry) => entry.id)).includes(format.id);
                    return (
                      <label key={format.id} className="flex items-start gap-2 rounded-xl border border-slate-800 p-2.5 text-[11px] text-slate-300">
                        <input
                          type="checkbox"
                          checked={enabled || format.id === 'pdf'}
                          disabled={format.id === 'pdf'}
                          onChange={(event) => {
                            const current = formSettings.receipts.enabledFormats || RECEIPT_FORMATS.map((entry) => entry.id);
                            const next = event.target.checked ? [...current, format.id] : current.filter((entry) => entry !== format.id);
                            const unique = next.filter((entry, index, all) => all.indexOf(entry) === index);
                            const ordered = RECEIPT_FORMATS.map((entry) => entry.id).filter((entry) => unique.includes(entry));
                            setFormSettings({ ...formSettings, receipts: { ...formSettings.receipts, enabledFormats: ordered.includes('pdf') ? ordered : [...ordered, 'pdf'] } });
                          }}
                          className="mt-0.5 rounded text-teal-500"
                        />
                        <span><strong className="block text-slate-100">{format.label}{format.id === 'pdf' ? ' (always on)' : ''}</strong>{format.description}</span>
                      </label>
                    );
                  })}
                </div>

                <p className="mt-4 text-xs font-semibold text-slate-400">Send channels</p>
                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                  {RECEIPT_CHANNELS.map((channel) => {
                    const enabled = (formSettings.receipts.enabledChannels || RECEIPT_CHANNELS.map((entry) => entry.id)).includes(channel.id);
                    return (
                      <label key={channel.id} className="flex items-start gap-2 rounded-xl border border-slate-800 p-2.5 text-[11px] text-slate-300">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(event) => {
                            const current = formSettings.receipts.enabledChannels || RECEIPT_CHANNELS.map((entry) => entry.id);
                            const next = event.target.checked ? [...current, channel.id] : current.filter((entry) => entry !== channel.id);
                            setFormSettings({ ...formSettings, receipts: { ...formSettings.receipts, enabledChannels: next } });
                          }}
                          className="mt-0.5 rounded text-teal-500"
                        />
                        <span><strong className="block text-slate-100">{channel.label}</strong>{channel.description}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-400">Default channel
                    <select
                      value={formSettings.receipts.defaultChannel || 'email'}
                      onChange={(event) => setFormSettings({ ...formSettings, receipts: { ...formSettings.receipts, defaultChannel: event.target.value as any } })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    >
                      {RECEIPT_CHANNELS.map((channel) => <option key={channel.id} value={channel.id}>{channel.label}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-400">Payment details on the receipt (optional)
                    <input
                      value={formSettings.receipts.paymentInstructions || ''}
                      onChange={(event) => setFormSettings({ ...formSettings, receipts: { ...formSettings.receipts, paymentInstructions: event.target.value } })}
                      placeholder="Till / paybill / bank details"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                </div>

                <label className="mt-3 block text-xs font-semibold text-slate-400">Message used when sending a receipt
                  <textarea
                    rows={2}
                    value={formSettings.receipts.sendMessageTemplate || DEFAULT_RECEIPT_SEND_TEMPLATE}
                    onChange={(event) => setFormSettings({ ...formSettings, receipts: { ...formSettings.receipts, sendMessageTemplate: event.target.value } })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-100"
                  />
                  <span className="mt-1 block text-[10px] font-normal leading-relaxed text-slate-500">Tokens: {'{customer} {company} {receipt} {total} {currency} {date}'}. A receipt sent this way is a message/draft, not a server email or payment confirmation.</span>
                </label>
                <button type="button" onClick={() => setFormSettings({ ...formSettings, receipts: { ...formSettings.receipts, sendMessageTemplate: DEFAULT_RECEIPT_SEND_TEMPLATE } })} className="mt-2 rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-800">Restore default message</button>
              </div>
            </div>
          )}

          {/* TAB 5: APPEARANCE & COLOR */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-100">App Appearance</h3>
                <p className="text-xs text-slate-400">
                  Cart position on Left vs Right, product grid display toggle, and color accents.
                </p>
              </div>

              <fieldset className="rounded-2xl border border-slate-800 p-4">
                <legend className="px-2 text-sm font-bold text-teal-400">Light / dark theme</legend>
                <div className="grid grid-cols-2 gap-3">
                  {(['light', 'dark'] as const).map(mode => <button key={mode} type="button" aria-label={`${mode === 'light' ? 'Light' : 'Dark'} theme`} aria-pressed={formSettings.appearance.theme === mode}
                    onClick={() => setFormSettings({ ...formSettings, appearance: { ...formSettings.appearance, theme: mode } })}
                    className={`rounded-xl border p-4 text-left text-sm ${formSettings.appearance.theme === mode ? 'border-teal-500 ring-2 ring-teal-500/30' : 'border-slate-700'}`}>
                    <span className="flex items-center gap-2 font-bold">{mode === 'light' ? <Sun size={19} /> : <Moon size={19} />}{mode === 'light' ? 'Light' : 'Dark'}</span>
                    <span data-preview-theme={mode} className="appearance-theme-sample mt-3 block rounded-lg border px-3 py-4 text-xs">Sales · Inventory · Reports</span>
                  </button>)}
                </div>
                <p className="mt-3 text-xs text-slate-400">Choose a theme, then Save All Settings Changes. This affects the POS workspace, not the CODE76 website or the private business-page design.</p>
              </fieldset>

              {/* Cart Position Selection: LEFT vs RIGHT */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
                  Sales Terminal Cart Placement
                </label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setFormSettings({
                        ...formSettings,
                        appearance: { ...formSettings.appearance, cartPosition: 'left' },
                      })
                    }
                    className={`p-4 rounded-2xl text-left border transition cursor-pointer ${
                      formSettings.appearance.cartPosition === 'left'
                        ? 'bg-teal-600/20 border-teal-500 text-teal-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-sm mb-1 font-bold">Cart on Left Side</div>
                    <div className="text-[10px] text-slate-400">Products & search on right side</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormSettings({
                        ...formSettings,
                        appearance: { ...formSettings.appearance, cartPosition: 'right' },
                      })
                    }
                    className={`p-4 rounded-2xl text-left border transition cursor-pointer ${
                      formSettings.appearance.cartPosition === 'right'
                        ? 'bg-teal-600/20 border-teal-500 text-teal-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-sm mb-1 font-bold">Cart on Right Side (Default)</div>
                    <div className="text-[10px] text-slate-400">Products & search on left side</div>
                  </button>
                </div>
              </div>

              {/* Show product grid below search */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-100">Showcase Product Grid Below Search</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Display visual card catalog under the sales search bar in addition to autocomplete.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formSettings.appearance.showProductGridBelowSearch}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      appearance: {
                        ...formSettings.appearance,
                        showProductGridBelowSearch: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 rounded text-teal-500 cursor-pointer"
                />
              </div>

              {/* Theme selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Display Mode</label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setFormSettings({
                        ...formSettings,
                        appearance: { ...formSettings.appearance, theme: 'dark' },
                      })
                    }
                    className={`p-3 rounded-xl border text-center font-bold cursor-pointer ${
                      formSettings.appearance.theme === 'dark'
                        ? 'bg-slate-800 border-teal-500 text-teal-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Dark Enterprise Theme
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormSettings({
                        ...formSettings,
                        appearance: { ...formSettings.appearance, theme: 'light' },
                      })
                    }
                    className={`p-3 rounded-xl border text-center font-bold cursor-pointer ${
                      formSettings.appearance.theme === 'light'
                        ? 'bg-slate-800 border-teal-500 text-teal-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Clean Light Theme
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FONT TEXT SETTINGS */}
          {activeTab === 'font' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Font Typography Settings</h3>
                <p className="text-xs text-slate-400">Configure the POS workspace typeface. CODE76 main-site styling is maintained separately.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'Inter', name: 'Inter (High-Readability Modern Sans)' },
                  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans (Contemporary Tech)' },
                  { id: 'Outfit', name: 'Outfit (Geometric Clean Display)' },
                  { id: 'Roboto', name: 'Roboto (Google Industrial Standard)' },
                  { id: 'Playfair', name: 'Playfair (Executive Serif Aesthetic)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      setFormSettings({
                        ...formSettings,
                        font: { fontFamily: f.id as any },
                      })
                    }
                    className={`p-4 rounded-2xl text-left border transition cursor-pointer ${
                      formSettings.font.fontFamily === f.id
                        ? 'bg-teal-600/20 border-teal-500 text-teal-300 shadow-md font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-sm font-bold">{f.name}</div>
                    <div className="text-xs text-slate-400 mt-1">Sample: CODE76 POS $599.00</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: DATA BACKUP SETTINGS */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-100">Data Backup & Disaster Recovery</h3>
                <p className="text-xs text-slate-400">Export complete JSON backup snapshots or restore from a past save.</p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Download Full JSON Database Backup</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Includes all sales, inventory, directory records, settings, and customer reviews.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadFullBackup}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Backup File
                </button>
              </div>

              {/* Restore */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-slate-100">Restore System From Backup JSON</h4>
                {!currentUser?.isAdmin && <p className="text-xs text-amber-300">Only an administrator can restore a database snapshot, because it can replace role privileges and history.</p>}
                <textarea
                  rows={4}
                  value={restoreJson}
                  onChange={(e) => setRestoreJson(e.target.value)}
                  placeholder="Paste backup JSON content here to restore..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono"
                />
                <button
                  type="button"
                  onClick={handleRestoreBackup}
                  disabled={!currentUser?.isAdmin} title="Full database restores require administrator access"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Restore Database Snapshot
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: PRIVILEGES (RBAC) */}
          {activeTab === 'teamAccess' && (
            <TeamAccessPanel />
          )}

          {activeTab === 'privileges' && (
            currentUser?.isAdmin
              ? <PrivilegeMatrix formSettings={formSettings} setFormSettings={setFormSettings} savedSettings={settings} currentUser={currentUser} />
              : <div role="alert" className="rounded-xl border border-amber-700 bg-amber-950/30 p-5 text-sm text-amber-200">Only an administrator can change role privileges. Only an administrator can change these controls. Ask for the Audit Logs, Export Reports privilege or receipt access when needed.</div>
          )}

          {activeTab === 'chatbot' && (
            <ChatbotSettingsPanel formSettings={formSettings} setFormSettings={setFormSettings} savedSettings={settings} canManage={!!currentUser?.isAdmin || hasPrivilege('canManageChatbot')} />
          )}

          {activeTab === 'pdfExcel' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  PDF & Excel Import / Export Pipeline
                </h3>
                <p className="text-xs text-slate-400">
                  Authenticate as admin, select targeted platform, review the visual column guide, upload CSV, and commit.
                </p>
              </div>

              {/* ADMIN AUTHENTICATION GATE */}
              {!adminAuthVerified ? (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center max-w-md mx-auto my-4 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-100">Administrator Authorization Required</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      To prevent accidental corruption, CSV & Excel data imports require admin credentials verification.
                    </p>
                  </div>

                  {authError && (
                    <div className="text-xs text-rose-400 font-medium bg-rose-950/60 p-2 rounded-lg border border-rose-800/60">
                      {authError}
                    </div>
                  )}

                  <form onSubmit={handleVerifyAdmin} className="space-y-3">
                    <input
                      type="password"
                      required
                      placeholder="Enter Administrator Password"
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-center text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                    >
                      Authenticate Admin Access
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/40 text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <span>Admin Access Verified (Session Unlocked for Data Pipeline)</span>
                    </div>
                    <button
                      onClick={() => setAdminAuthVerified(false)}
                      className="text-[11px] underline text-emerald-400 hover:text-emerald-300"
                    >
                      Lock Pipeline
                    </button>
                  </div>

                  {/* 1. Target Platform Selection */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      1. Select Target Platform for Import
                    </label>
                    <select
                      value={targetImportPlatform}
                      onChange={(e) => {
                        setTargetImportPlatform(e.target.value as any);
                        setImportFileContent('');
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-teal-500"
                    >
                      <option value="inventory">Inventory (Products & Services)</option>
                      <option value="customers">Customers Directory</option>
                      <option value="vendors">Vendors Directory</option>
                      <option value="transporters">Transporters Directory</option>
                      <option value="marketing_team">Marketing Team Directory</option>
                      <option value="company_members">Company Members (Dual-Role Staff)</option>
                      <option value="expenses">Operational Expenses</option>
                    </select>
                  </div>

                  {/* 2. Visual Column Alignment Guide */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      2. Visual Column Alignment Guide & Expected Format
                    </div>
                    <p className="text-xs text-slate-300">
                      Your CSV / Excel table MUST contain the following header column names in row 1:
                    </p>

                    <div className="flex flex-wrap gap-1.5 py-1">
                      {COLUMN_GUIDES[targetImportPlatform].columns.map((col) => (
                        <span
                          key={col}
                          className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-slate-800 text-teal-300 border border-slate-700"
                        >
                          {col}
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-400 pt-1">
                      Example Row format:{' '}
                      <span className="font-mono text-slate-300">
                        {COLUMN_GUIDES[targetImportPlatform].example}
                      </span>
                    </div>
                  </div>

                  {/* 3. File Input & Paste Box */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      3. Upload CSV File or Paste Raw CSV Text
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-teal-400 hover:file:bg-slate-700 cursor-pointer"
                      />
                    </div>
                    <textarea
                      rows={5}
                      value={importFileContent}
                      onChange={(e) => setImportFileContent(e.target.value)}
                      placeholder="Or paste comma-separated CSV text directly here..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono leading-relaxed"
                    />
                  </div>

                  {/* Alerts */}
                  {importSuccessAlert && (
                    <div className="bg-emerald-950/70 border border-emerald-800 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{importSuccessAlert}</span>
                    </div>
                  )}

                  {importErrorAlert && (
                    <div className="bg-rose-950/70 border border-rose-800 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{importErrorAlert}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleCommitImport}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Validate & Save CSV Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: EMAIL MARKETING TEMPLATES */}
          {activeTab === 'emailTemplates' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-100">Email Marketing & Outreach Templates</h3>
                <p className="text-xs text-slate-400">
                  Customize pre-configured email templates used in the Inventory marketing widget and post-sale reviews.
                </p>
              </div>

              <div className="space-y-4">
                {formSettings.emailTemplates.map((tpl, idx) => (
                  <div key={tpl.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-teal-400">{tpl.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{tpl.type}</span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Subject Line Template</label>
                      <input
                        type="text"
                        value={tpl.subject}
                        onChange={(e) => {
                          const updated = formSettings.emailTemplates.map((t, i) =>
                            i === idx ? { ...t, subject: e.target.value } : t
                          );
                          setFormSettings({ ...formSettings, emailTemplates: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">
                        Body Template (Placeholders: {'{customer_name}'}, {'{product_name}'}, {'{discount}'},{' '}
                        {'{company_name}'}, {'{company_tel}'})
                      </label>
                      <textarea
                        rows={3}
                        value={tpl.body}
                        onChange={(e) => {
                          const updated = formSettings.emailTemplates.map((t, i) =>
                            i === idx ? { ...t, body: e.target.value } : t
                          );
                          setFormSettings({ ...formSettings, emailTemplates: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: AUDIT LOGS & LOGIN HISTORY */}
          {activeTab === 'auditLogs' && (
            <div className="space-y-5">
              <AuditLogPlatform />
            </div>
          )}

          {activeTab === 'plans' && <DemoPlanSettings />}
          {activeTab === 'demoData' && <DemoTrainingSettings />}
          {activeTab === 'teamServices' && <TeamServicesPanel />}
          {activeTab === 'regional' && <RegionalSettingsForm settings={formSettings} onChange={setFormSettings} />}
          {activeTab === 'dataEraser' && <DataDeletionCenter />}
          {/* Global Save Button at bottom of each tab */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-lg shadow-teal-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save All Settings Changes
            </button>
          </div>
          </> : <PlanNotice feature="This settings section" />}
        </div>
      </div>
    </div>
  );
};
