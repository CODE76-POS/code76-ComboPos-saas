import React, { useMemo, useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { appDialogs } from '../../utils/appDialogs.ts';
import {
  DATASET_DEFINITIONS,
  countDataset,
  describeSelection,
  type DatasetCounts,
  type DatasetKey,
} from '../../utils/dataDeletion.ts';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDriveDownload,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-react';

const riskStyle: Record<'low' | 'medium' | 'high', string> = {
  low: 'border-slate-700 bg-slate-950/60',
  medium: 'border-amber-900/70 bg-amber-950/10',
  high: 'border-rose-900/70 bg-rose-950/10',
};

const riskBadge: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-slate-800 text-slate-300',
  medium: 'bg-amber-500/15 text-amber-200',
  high: 'bg-rose-500/15 text-rose-200',
};

export const DataDeletionCenter: React.FC = () => {
  const pos = usePOS();
  const {
    currentUser,
    hasPrivilege,
    wipeSelectedDatabases,
    setActivePlatform,
    setSettingsSection,
    logAuditAction,
    receiptDispatches,
    teamServiceBriefs,
    salaryPayments,
    relatedCompanies,
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
  } = pos;

  const counts: DatasetCounts = useMemo(() => ({
    products: products.length,
    sales: sales.length,
    invoices: invoices.length,
    expenses: expenses.length,
    customers: customers.length,
    vendors: vendors.length,
    transporters: transporters.length,
    marketingTeam: marketingTeam.length,
    companyMembers: companyMembers.length,
    relatedCompanies: relatedCompanies.length,
    salaryPayments: salaryPayments.length,
    reviews: reviews.length,
    landingMetrics: Number(!!pos.landingMetrics && Object.values(pos.landingMetrics).some((value) => Number(value) > 0)),
    teamServiceBriefs: teamServiceBriefs.length,
    auditLogs: auditLogs.length,
    settings: 1,
  }), [products.length, sales.length, invoices.length, expenses.length, customers.length, vendors.length, transporters.length, marketingTeam.length, companyMembers.length, relatedCompanies.length, salaryPayments.length, reviews.length, pos.landingMetrics, teamServiceBriefs.length, auditLogs.length]);

  const canDelete = !!currentUser?.isAdmin || hasPrivilege('canDeleteData');
  const [selected, setSelected] = useState<DatasetKey[]>([]);
  const [query, setQuery] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [working, setWorking] = useState(false);
  const [lastResult, setLastResult] = useState<{ names: string[]; at: string } | null>(null);

  const visible = DATASET_DEFINITIONS.filter((definition) =>
    `${definition.label} ${definition.platform} ${definition.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  const totalRecords = selected.reduce((sum, key) => sum + countDataset(key, counts), 0);
  const requiredPhrase = `DELETE ${selected.length}`;
  const canSubmit = canDelete && selected.length > 0 && confirmation.trim().toUpperCase() === requiredPhrase && !working;

  const toggle = (key: DatasetKey) => {
    setConfirmation('');
    setSelected((previous) => previous.includes(key) ? previous.filter((entry) => entry !== key) : [...previous, key]);
  };

  const runDeletion = async () => {
    if (!canSubmit) return;
    const confirmed = await appDialogs.confirm({
      title: `Delete ${selected.length} platform database${selected.length === 1 ? '' : 's'}?`,
      message: `You are about to permanently remove ${totalRecords.toLocaleString()} record${totalRecords === 1 ? '' : 's'} from: ${describeSelection(selected)}.`,
      detail: 'This cannot be undone from the app. Download a permitted JSON backup first if you may need the records. Your account, plan tier and untouched platforms are retained.',
      confirmLabel: 'Permanently delete selected',
      destructive: true,
    });
    if (!confirmed) return;
    setWorking(true);
    try {
      const names = wipeSelectedDatabases(selected);
      setLastResult({ names, at: new Date().toISOString() });
      setSelected([]);
      setConfirmation('');
      appDialogs.toast(`Deleted ${names.length} platform database${names.length === 1 ? '' : 's'}.`, 'success');
    } catch (error) {
      void appDialogs.alert({
        title: 'Deletion stopped',
        message: error instanceof Error ? error.message : 'The selected platform data could not be deleted.',
        tone: 'danger',
      });
    } finally {
      setWorking(false);
    }
  };

  const resetSettings = async () => {
    const confirmed = await appDialogs.confirm({
      title: 'Reset every system setting?',
      message: 'Payment channels, receipts, chatbot, business page, appearance, fonts, CSV templates and role privileges return to their documented defaults.',
      detail: 'Your plan tier, regional preferences and all business records are retained. This cannot be undone.',
      confirmLabel: 'Reset settings',
      destructive: true,
    });
    if (!confirmed) return;
    wipeSelectedDatabases(['settings']);
    logAuditAction('Reset system settings', 'Restored documented defaults while retaining plan tier, regional preferences and business records.');
    appDialogs.toast('System settings restored to defaults.', 'success');
  };

  const clearReceiptLog = async () => {
    const confirmed = await appDialogs.confirm({
      title: 'Clear the receipt send history?',
      message: `Remove ${receiptDispatches.length} local receipt hand-off record${receiptDispatches.length === 1 ? '' : 's'}?`,
      detail: 'Receipts themselves stay in Sales History. Only the record of which channel/format was opened is removed.',
      confirmLabel: 'Clear send history',
      destructive: true,
    });
    if (!confirmed) return;
    pos.clearReceiptDispatchLog();
    appDialogs.toast('Receipt send history cleared.', 'success');
  };

  if (!canDelete) {
    return (
      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-100">Data deletion center</h2>
        <div role="alert" className="rounded-2xl border border-amber-800 bg-amber-950/30 p-5 text-sm text-amber-100">
          <p className="font-bold">Administrator or Delete data permission required</p>
          <p className="mt-2 text-amber-200/90">Ask an administrator to grant the <strong>Delete platform data</strong> privilege in Settings → App User Privilege Settings. Plan restrictions still apply.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-100"><Trash2 className="h-5 w-5 text-rose-400" />Data deletion center</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Delete one platform database at a time or every business record at once. Deletion happens only in this browser workspace and is written to the audit log. There is no server copy to restore.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setSettingsSection('backup'); }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-800"
        >
          <HardDriveDownload className="h-4 w-4" /> Export a backup first
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Platforms available</p>
          <p className="mt-1 text-2xl font-black text-slate-100">{DATASET_DEFINITIONS.length}</p>
          <p className="text-[11px] text-slate-500">Each can be deleted independently.</p>
        </div>
        <div className="rounded-2xl border border-teal-900 bg-teal-950/20 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-teal-400">Selected</p>
          <p className="mt-1 text-2xl font-black text-teal-200">{selected.length}</p>
          <p className="text-[11px] text-teal-500/80">{describeSelection(selected)}</p>
        </div>
        <div className="rounded-2xl border border-rose-900 bg-rose-950/20 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-rose-400">Records to remove</p>
          <p className="mt-1 text-2xl font-black text-rose-200">{totalRecords.toLocaleString()}</p>
          <p className="text-[11px] text-rose-400/80">Counted before deletion.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            aria-label="Find a platform to delete"
            placeholder="Find a platform…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100"
          />
        </div>
        <button type="button" onClick={() => setSelected(DATASET_DEFINITIONS.map((definition) => definition.key))} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">
          Select every platform
        </button>
        <button type="button" onClick={() => { setSelected([]); setConfirmation(''); }} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">
          Clear selection
        </button>
      </div>

      <ul className="grid gap-2 md:grid-cols-2">
        {visible.map((definition) => {
          const count = countDataset(definition.key, counts);
          const checked = selected.includes(definition.key);
          return (
            <li key={definition.key}>
              <label className={`flex h-full cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition ${checked ? 'border-rose-600/80 bg-rose-950/20' : `${riskStyle[definition.risk]} hover:border-slate-600`}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(definition.key)}
                  className="mt-1 h-4 w-4 rounded border-slate-600 text-rose-500 focus:ring-rose-500"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">{definition.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${riskBadge[definition.risk]}`}>{definition.risk} risk</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">{(definition.key === 'settings' ? (count ? 'configured' : 'not set') : `${count.toLocaleString()} record${count === 1 ? '' : 's'}`)}</span>
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-slate-400">{definition.description}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-wide text-slate-500">Platform: {definition.platform}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="rounded-2xl border border-rose-900/80 bg-rose-950/20 p-4">
        <div className="flex items-start gap-2 text-rose-200">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold">Deletion is permanent in this workspace.</p>
            <p className="mt-1 text-rose-200/80">Plan entitlements, the signed-in account and platforms you did not select stay untouched. A JSON backup is the only way to restore deleted records, and only an administrator can restore one.</p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-bold text-rose-100">
            Type <span className="rounded bg-rose-900/60 px-1.5 py-0.5 font-mono text-rose-100">{requiredPhrase}</span> to enable deletion
            <input
              aria-label="Deletion confirmation phrase"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={requiredPhrase}
              className="mt-1 w-full rounded-xl border border-rose-900 bg-slate-950 px-3 py-2 font-mono text-sm text-rose-100"
            />
          </label>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void runDeletion()}
            className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="mr-1.5 inline h-4 w-4" />
            {working ? 'Deleting…' : `Delete ${selected.length || '0'} selected platform${selected.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>

      {lastResult && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-900 bg-emerald-950/20 p-3.5 text-xs text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p><strong>Last deletion:</strong> {lastResult.names.join(', ')}. The audit log records who ran it and when.</p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-200"><RotateCcw className="h-4 w-4 text-teal-400" />Reset settings only</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Restore payment, receipt, chatbot, appearance and privilege defaults without touching records.</p>
          <button type="button" onClick={() => void resetSettings()} className="mt-2 w-full rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">Reset settings</button>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-200"><Database className="h-4 w-4 text-sky-400" />Receipt send history</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{receiptDispatches.length} local hand-off entries. Receipts stay in Sales History.</p>
          <button type="button" onClick={() => void clearReceiptLog()} disabled={!receiptDispatches.length} className="mt-2 w-full rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-40">Clear send history</button>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-200"><AlertTriangle className="h-4 w-4 text-amber-400" />What is kept</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Your account, plan tier, regional format, audit trail (unless selected) and the receipt send log.</p>
          <button type="button" onClick={() => setActivePlatform('audit_logs')} className="mt-2 w-full rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">Open audit logs</button>
        </div>
      </div>
    </section>
  );
};
