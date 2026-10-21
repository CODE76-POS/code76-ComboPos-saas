import React, { useMemo, useState } from 'react';
import { ALL_ROLES, type AppSettings, type UserRole } from '../../types/index.ts';
import {
  PRIVILEGE_DEFINITIONS,
  PRIVILEGE_GROUPS,
  privilegeValue,
  type PrivilegeKey,
} from '../../utils/privileges.ts';
import { appDialogs } from '../../utils/appDialogs.ts';
import { CheckCheck, Info, RotateCcw, ShieldCheck, Users, X } from 'lucide-react';

interface PrivilegeMatrixProps {
  formSettings: AppSettings;
  setFormSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  savedSettings: AppSettings;
  currentUser: { isAdmin?: boolean; roles: [UserRole, UserRole] } | null;
}

const ROLE_PRESETS: { id: string; label: string; description: string; values: Partial<Record<PrivilegeKey, boolean>> }[] = [
  {
    id: 'operations',
    label: 'Full operations',
    description: 'Sell, edit stock, expenses, invoices, analytics, people, imports, exports and settings.',
    values: { canSell: true, canSendReceipts: true, canSettleDebt: true, canViewInventory: true, canEditInventory: true, canAdjustStock: true, canViewExpenses: true, canEditExpenses: true, canViewInvoices: true, canViewAnalytics: true, canManagePeople: true, canManageSchedules: true, canViewAuditLogs: true, canModifySettings: true, canImportCsv: true, canExportPdf: true, canEditLandingPage: true, canManageChatbot: true, canDeleteData: false },
  },
  {
    id: 'cashier',
    label: 'Cashier',
    description: 'Sell, take payment and send receipts. No cost prices, edits, exports or settings.',
    values: { canSell: true, canSendReceipts: true, canSettleDebt: true, canViewInventory: true, canEditInventory: false, canAdjustStock: false, canViewExpenses: false, canEditExpenses: false, canViewInvoices: true, canViewAnalytics: false, canManagePeople: false, canManageSchedules: false, canViewAuditLogs: false, canModifySettings: false, canImportCsv: false, canExportPdf: false, canEditLandingPage: false, canManageChatbot: false, canDeleteData: false },
  },
  {
    id: 'supervisor',
    label: 'Supervisor',
    description: 'Selling, stock adjustments, expenses and analytics with exports.',
    values: { canSell: true, canSendReceipts: true, canSettleDebt: true, canViewInventory: true, canEditInventory: true, canAdjustStock: true, canViewExpenses: true, canEditExpenses: true, canViewInvoices: true, canViewAnalytics: true, canManagePeople: false, canManageSchedules: true, canViewAuditLogs: false, canModifySettings: false, canImportCsv: false, canExportPdf: true, canEditLandingPage: false, canManageChatbot: false, canDeleteData: false },
  },
  {
    id: 'readonly',
    label: 'Read-only',
    description: 'View catalogue and history only. Cannot sell, edit, export or change settings.',
    values: { canSell: false, canSendReceipts: false, canSettleDebt: false, canViewInventory: true, canEditInventory: false, canAdjustStock: false, canViewExpenses: false, canEditExpenses: false, canViewInvoices: true, canViewAnalytics: false, canManagePeople: false, canManageSchedules: false, canViewAuditLogs: false, canModifySettings: false, canImportCsv: false, canExportPdf: false, canEditLandingPage: false, canManageChatbot: false, canDeleteData: false },
  },
];

export const PrivilegeMatrix: React.FC<PrivilegeMatrixProps> = ({ formSettings, setFormSettings, savedSettings, currentUser }) => {
  const [group, setGroup] = useState<string>('Selling & receipts');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer-facing' | 'management'>('all');
  const columns = useMemo(() => PRIVILEGE_DEFINITIONS.filter((definition) => definition.group === group), [group]);

  const roles = useMemo(() => {
    if (roleFilter === 'customer-facing') return ALL_ROLES.filter((role) => ['Cashier', 'Ass-Associate', 'Associate', 'Ass-Cashier', 'Marketor', 'Transporter/Driver', 'Cleaner', 'Erandes-Person', 'Erands-Person', 'Technician'].includes(role));
    if (roleFilter === 'management') return ALL_ROLES.filter((role) => ['CEO', 'Director', 'Manager', 'Ass-Manager', 'Supervisor', 'Ass-Supervisor', 'Company HR', 'Company HR 2', 'Accountant', 'Developer', 'Basor', 'Maintainance', 'Other'].includes(role));
    return ALL_ROLES;
  }, [roleFilter]);

  const setPrivilege = (role: UserRole, key: PrivilegeKey, value: boolean) => {
    setFormSettings((previous) => ({
      ...previous,
      privileges: {
        ...previous.privileges,
        [role]: { ...previous.privileges[role], [key]: value },
      },
    }));
  };

  const setRoleGroup = (role: UserRole, value: boolean) => {
    setFormSettings((previous) => ({
      ...previous,
      privileges: {
        ...previous.privileges,
        [role]: {
          ...previous.privileges[role],
          ...Object.fromEntries(columns.map((definition) => [definition.key, value])),
        },
      },
    }));
  };

  const applyPreset = async (preset: typeof ROLE_PRESETS[number]) => {
    const confirmed = await appDialogs.confirm({
      title: `Apply the “${preset.label}” preset?`,
      message: `This replaces the permissions for the ${roles.length} visible role${roles.length === 1 ? '' : 's'}. You still need to press “Save All Settings Changes” to persist it.`,
      detail: preset.description,
      confirmLabel: 'Apply preset',
      tone: 'warning',
    });
    if (!confirmed) return;
    setFormSettings((previous) => {
      const privileges = { ...previous.privileges };
      for (const role of roles) {
        privileges[role] = { ...privileges[role], ...preset.values } as AppSettings['privileges'][UserRole];
      }
      return { ...previous, privileges };
    });
    appDialogs.toast(`“${preset.label}” applied to ${roles.length} roles — save to keep it.`, 'info');
  };

  const resetToSaved = () => {
    setFormSettings((previous) => ({ ...previous, privileges: savedSettings.privileges }));
    appDialogs.toast('Unsaved privilege changes discarded.', 'info');
  };

  const selfRole = currentUser?.roles?.[0];
  const adminNotice = 'Administrators always keep every right, regardless of these checkboxes.';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-100"><ShieldCheck className="h-4 w-4 text-teal-400" />App user privilege settings (RBAC)</h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">Every control below is enforced by the workspace guard for the roles you give it to. A member with two roles receives the union of both roles’ rights. {adminNotice}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={resetToSaved} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">
            <RotateCcw className="h-3.5 w-3.5" /> Discard unsaved changes
          </button>
        </div>
      </div>

      <div role="note" className="flex items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-400">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
        <p>Privilege changes are a client-side prototype guard, not server-enforced tenant security. The <strong>Delete data</strong> right still requires an administrator confirmation, and the <strong>Send receipts</strong> right never sends email by itself — it only opens a pre-filled draft.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PRIVILEGE_GROUPS.map((entry) => (
          <button
            key={entry}
            type="button"
            onClick={() => setGroup(entry)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${group === entry ? 'bg-teal-600 text-white' : 'border border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            {entry}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="font-bold uppercase tracking-wide text-slate-500">Show roles</span>
        {[
          { id: 'all', label: 'All roles' },
          { id: 'management', label: 'Management' },
          { id: 'customer-facing', label: 'Customer-facing' },
        ].map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setRoleFilter(entry.id as typeof roleFilter)}
            className={`rounded-lg px-2.5 py-1 font-bold ${roleFilter === entry.id ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {entry.label}
          </button>
        ))}
        <span className="text-slate-600">·</span>
        <span className="text-slate-500">{roles.length} roles</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950 text-[10px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-950 py-2.5 px-3">Role</th>
              {columns.map((definition) => (
                <th key={definition.key} className="px-2 py-2.5 text-center" title={definition.description}>
                  <span className="block">{definition.shortLabel}</span>
                  <button type="button" onClick={() => roles.forEach((role) => setRoleGroup(role, true))} className="mt-0.5 text-[9px] font-normal text-teal-500 hover:text-teal-300">all on</button>
                </th>
              ))}
              <th className="px-2 py-2.5 text-center">Group</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {roles.map((role) => {
              const record = formSettings.privileges[role];
              return (
                <tr key={role} className={`hover:bg-slate-800/40 ${role === selfRole ? 'bg-teal-950/10' : ''}`}>
                  <td className="sticky left-0 z-10 bg-slate-900 py-2 px-3 font-semibold text-slate-200">
                    <span className="flex items-center gap-1.5">
                      {role}
                      {role === selfRole && <span className="rounded-full bg-teal-500/15 px-1.5 py-0.5 text-[9px] font-bold text-teal-300">you</span>}
                    </span>
                  </td>
                  {columns.map((definition) => (
                    <td key={definition.key} className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${role}: ${definition.label}`}
                        checked={privilegeValue(record, definition.key)}
                        onChange={(event) => setPrivilege(role, definition.key, event.target.checked)}
                        className="h-4 w-4 rounded border-slate-600 text-teal-500 focus:ring-teal-500"
                      />
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-2 py-2 text-center">
                    <button type="button" onClick={() => setRoleGroup(role, true)} className="rounded p-1 text-emerald-400 hover:bg-emerald-950/40" aria-label={`Enable all ${group} controls for ${role}`}><CheckCheck className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => setRoleGroup(role, false)} className="rounded p-1 text-rose-400 hover:bg-rose-950/40" aria-label={`Disable all ${group} controls for ${role}`}><X className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
        <summary className="cursor-pointer text-xs font-bold text-slate-300">What each control allows</summary>
        <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-slate-400">
          {columns.map((definition) => (
            <li key={definition.key}><strong className="text-slate-200">{definition.shortLabel}</strong> — {definition.description}</li>
          ))}
        </ul>
      </details>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-200"><Users className="h-4 w-4 text-teal-400" />Role presets</p>
        <p className="mt-1 text-[11px] text-slate-500">Prefer to start from a known pattern? Presets only change the {roles.length} visible roles.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {ROLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => void applyPreset(preset)}
              className="rounded-xl border border-slate-800 p-3 text-left transition hover:border-teal-700 hover:bg-slate-900"
            >
              <span className="block text-xs font-bold text-slate-100">{preset.label}</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
