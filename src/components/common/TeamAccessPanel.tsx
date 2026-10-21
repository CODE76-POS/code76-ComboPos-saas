import React, { useMemo, useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { appDialogs } from '../../utils/appDialogs.ts';
import { directoryName } from '../../utils/directory.ts';
import { ALL_ROLES, type PersonRecord, type UserRole } from '../../types/index.ts';
import { SecurityQuestionFields } from './SecurityQuestionFields.tsx';
import {
  RECOVERY_QUESTION_COUNT,
  normalizeEmail,
  type AccountRecord,
  type SecurityDraft,
} from '../../utils/accounts.ts';
import { KeyRound, ShieldCheck, ShieldOff, UserPlus, Users, Building2, Mail, Lock, X, CheckCircle2, AlertCircle } from 'lucide-react';

const emptySecurity = (): SecurityDraft[] => Array.from({ length: RECOVERY_QUESTION_COUNT }, () => ({ questionId: '', answer: '' }));
const inputClass = 'w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none';
const buttonClass = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-40';

interface LoginEditorProps {
  member?: PersonRecord | null;
  account?: AccountRecord | null;
  onClose: () => void;
}

/** Create or reset one company-member login. */
export const MemberAccessDialog: React.FC<LoginEditorProps> = ({ member = null, account = null, onClose }) => {
  const { companyMembers, workspaceAccounts, createTeamLogin, updateTeamLogin } = usePOS();
  const [memberId, setMemberId] = useState(member?.id || account?.memberId || '');
  const selectedMember = companyMembers.find((entry) => entry.id === memberId) || member || null;
  const existing = workspaceAccounts.find((entry) => entry.memberId === memberId)
    || (account && workspaceAccounts.find((entry) => entry.email === account.email))
    || null;
  const [name, setName] = useState(existing?.name || (selectedMember ? directoryName(selectedMember) : ''));
  const [email, setEmail] = useState(existing?.email || selectedMember?.email1 || '');
  const [password, setPassword] = useState('');
  const [roleOne, setRoleOne] = useState<UserRole>(existing?.roles[0] || selectedMember?.roles?.[0] || 'Cashier');
  const [roleTwo, setRoleTwo] = useState<UserRole>(existing?.roles[1] || selectedMember?.roles?.[1] || 'Associate');
  const [security, setSecurity] = useState<SecurityDraft[]>(emptySecurity);
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!existing && !selectedMember) { setNotice({ tone: 'error', text: 'Choose the company member this login belongs to.' }); return; }
    if (!existing && !email.trim()) { setNotice({ tone: 'error', text: 'Enter the email this member will use to sign in.' }); return; }
    const result = existing
      ? updateTeamLogin(existing.email, {
          ...(password ? { password } : {}),
          ...(existing.isAdmin ? {} : { roles: [roleOne, roleTwo] as [UserRole, UserRole] }),
          security,
          ...(selectedMember ? { memberId: selectedMember.id } : {}),
          ...(name.trim() ? { name: name.trim() } : {}),
        })
      : createTeamLogin({ memberId: selectedMember!.id, memberName: directoryName(selectedMember!), email, password, roles: [roleOne, roleTwo], security });
    if (!result.success) { setNotice({ tone: 'error', text: result.message }); return; }
    setNotice({ tone: 'success', text: result.message });
    if (!existing) {
      setPassword('');
      setSecurity(emptySecurity());
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4">
      <div role="dialog" aria-modal="true" aria-label="Company member login" className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white">
        <button type="button" onClick={onClose} aria-label="Close member login" className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={18} /></button>
        <h2 className="text-lg font-bold">{existing ? 'Reset member login' : 'Create member login'}</h2>
        <p className="mt-1 text-xs text-slate-400">
          The login is attached to a company member. It opens <strong className="text-slate-200">only this business's workspace</strong> — never another company's records.
        </p>

        {notice && (
          <p role="status" className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${notice.tone === 'error' ? 'border-rose-800 bg-rose-950/50 text-rose-300' : 'border-emerald-800 bg-emerald-950/40 text-emerald-300'}`}>
            {notice.tone === 'error' ? <AlertCircle size={14} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={14} className="mt-0.5 shrink-0" />}
            {notice.text}
          </p>
        )}

        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Company member
            <select aria-label="Company member" required={!existing} className={`${inputClass} mt-1`} value={memberId} onChange={(event) => {
              setMemberId(event.target.value);
              const next = companyMembers.find((entry) => entry.id === event.target.value);
              if (next) {
                if (!existing) { setName(directoryName(next)); setEmail(next.email1 || ''); }
                if (next.roles) { setRoleOne(next.roles[0]); setRoleTwo(next.roles[1]); }
              }
            }}>
              <option value="">{existing?.isAdmin ? 'Administrator (no member record needed)' : 'Choose a member…'}</option>
              {companyMembers.map((entry) => (
                <option key={entry.id} value={entry.id}>{directoryName(entry)}{entry.email1 ? ` · ${entry.email1}` : ''}</option>
              ))}
            </select>
            {!companyMembers.length && <span className="mt-1 block text-[10px] text-amber-300">Add company members in the Company Members directory first.</span>}
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-300">
              Display name
              <input aria-label="Login display name" className={`${inputClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="block text-xs font-semibold text-slate-300">
              Sign-in email (username)
              <input aria-label="Login email" type="email" required className={`${inputClass} mt-1`} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="member@business.com" />
            </label>
            <label className="block text-xs font-semibold text-slate-300">
              {existing ? 'New password (leave blank to keep)' : 'Temporary password'}
              <input aria-label="Login password" type="password" className={`${inputClass} mt-1`} value={password} onChange={(event) => setPassword(event.target.value)} minLength={existing ? 0 : 6} required={!existing} autoComplete="new-password" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs font-semibold text-slate-300">
                Primary role
                <select aria-label="Primary role" disabled={Boolean(existing?.isAdmin)} className={`${inputClass} mt-1`} value={roleOne} onChange={(event) => setRoleOne(event.target.value as UserRole)}>
                  {ALL_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-300">
                Second role
                <select aria-label="Second role" disabled={Boolean(existing?.isAdmin)} className={`${inputClass} mt-1`} value={roleTwo} onChange={(event) => setRoleTwo(event.target.value as UserRole)}>
                  {ALL_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>
            </div>
          </div>

          <SecurityQuestionFields value={security} onChange={setSecurity} label={existing ? 'New recovery questions' : 'Recovery questions'} hint="Required. These let the member recover their username or reset a forgotten password without help." />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={buttonClass}>Close</button>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-600">
              <KeyRound size={14} /> {existing ? 'Save login changes' : 'Create login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Administrator-only panel: who can sign in to this business, and what they
 * may open. Accounts always belong to exactly one workspace.
 */
export const TeamAccessPanel: React.FC = () => {
  const {
    currentUser, workspace, workspaceAccounts, companyMembers, company,
    updateTeamLogin, removeTeamLogin,
  } = usePOS();
  const [editing, setEditing] = useState<{ member?: PersonRecord | null; account?: AccountRecord | null } | null>(null);
  const scopedAccounts = useMemo(
    () => workspaceAccounts.filter((account) => account.workspaceId === currentUser?.workspaceId),
    [workspaceAccounts, currentUser?.workspaceId],
  );

  if (!currentUser?.isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-200">
        <p className="flex items-center gap-2 font-bold"><ShieldOff size={16} /> Administrator access required</p>
        <p className="mt-2 text-xs">Only the business administrator can create or reset team logins. Company data is still limited to this workspace.</p>
      </div>
    );
  }

  const accountForMember = (member: PersonRecord) => scopedAccounts.find((account) =>
    account.memberId === member.id || (member.email1 && normalizeEmail(account.email) === normalizeEmail(member.email1)));

  const resetPassword = async (account: AccountRecord) => {
    const ok = await appDialogs.confirm({
      title: `Reset password for ${account.name}?`,
      message: 'You will be asked for a new password and fresh recovery questions. The old password stops working immediately.',
      confirmLabel: 'Continue',
      tone: 'warning',
    });
    if (ok) setEditing({ account });
  };

  const removeLogin = async (account: AccountRecord) => {
    const ok = await appDialogs.confirm({
      title: `Remove ${account.name}'s login?`,
      message: 'They will no longer be able to sign in. Their historical sales, expenses and audit entries stay in this workspace.',
      confirmLabel: 'Remove login',
      destructive: true,
      tone: 'danger',
    });
    if (!ok) return;
    const result = removeTeamLogin(account.email);
    if (!result.success) await appDialogs.alert({ title: 'Login not removed', message: result.message, tone: 'warning' });
    else appDialogs.toast(result.message, 'success');
  };

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-100"><Building2 size={17} className="text-teal-400" /> Team access for {workspace?.companyName || company.name}</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          One workspace per business. Administrator accounts are created when a business registers; every staff login is attached to a company member and can read only this workspace's records.
        </p>
        <p className="mt-2 rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-[11px] text-amber-200">
          Prototype security: credentials are hashed and stored in this browser only. A production deployment must keep accounts on a server with per-tenant authorisation.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-bold text-slate-100"><ShieldCheck size={16} className="text-teal-400" /> Active logins ({scopedAccounts.length})</h3>
          <button type="button" onClick={() => setEditing({ member: null, account: null })} className={buttonClass}><UserPlus size={14} /> Create member login</button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                <th className="p-2">Person</th>
                <th className="p-2">Sign-in email</th>
                <th className="p-2">Roles</th>
                <th className="p-2">Recovery</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!scopedAccounts.length && (
                <tr><td colSpan={5} className="p-3 text-slate-400">No logins yet. Create one for each company member who needs the POS.</td></tr>
              )}
              {scopedAccounts.map((account) => (
                <tr key={account.email} className="border-t border-slate-800">
                  <td className="p-2">
                    <strong className="block text-slate-100">{account.name}</strong>
                    <span className={`text-[10px] ${account.isAdmin ? 'text-amber-300' : 'text-slate-400'}`}>{account.isAdmin ? 'Administrator' : 'Team member'}</span>
                  </td>
                  <td className="p-2 text-slate-300"><Mail size={12} className="mr-1 inline" />{account.email}</td>
                  <td className="p-2 text-slate-300">{account.roles.join(' / ')}</td>
                  <td className="p-2 text-slate-300">{account.security.length ? `${account.security.length} questions set` : <span className="text-amber-300">Not set</span>}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      <button type="button" onClick={() => resetPassword(account)} className={buttonClass}><KeyRound size={13} /> Reset</button>
                      {!account.isAdmin && (
                        <button type="button" onClick={() => removeLogin(account)} className={`${buttonClass} border-rose-900 text-rose-300 hover:bg-rose-950/50`}><ShieldOff size={13} /> Remove</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 p-4">
        <h3 className="flex items-center gap-2 font-bold text-slate-100"><Users size={16} className="text-teal-400" /> Company members without a login</h3>
        <p className="mt-1 text-[11px] text-slate-400">Registers a credential for an existing company member. Their roles decide which platforms and actions they can use.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {companyMembers.filter((member) => !accountForMember(member)).map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
              <div className="min-w-0">
                <strong className="block truncate text-xs text-slate-200">{directoryName(member)}</strong>
                <span className="block truncate text-[10px] text-slate-400">{member.email1 || 'No email on the member record'} · {member.roles?.join(' / ') || 'No roles set'}</span>
              </div>
              <button type="button" onClick={() => setEditing({ member, account: null })} className={buttonClass} disabled={!member.email1} title={member.email1 ? 'Create login' : 'Add an email to the member record first'}>
                <UserPlus size={13} /> Add login
              </button>
            </div>
          ))}
          {!companyMembers.filter((member) => !accountForMember(member)).length && (
            <p className="text-xs text-slate-400">Every company member already has a login.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 p-4">
        <h3 className="flex items-center gap-2 font-bold text-slate-100"><Lock size={16} className="text-teal-400" /> Administrator recovery</h3>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div>
            <strong className="block text-xs text-slate-200">{currentUser.name}</strong>
            <span className="text-[10px] text-slate-400">{currentUser.email} · {scopedAccounts.find((account) => account.email === currentUser.email)?.security.length || 0} recovery questions</span>
          </div>
          <button type="button" onClick={() => setEditing({ account: scopedAccounts.find((account) => account.email === currentUser.email) || null })} className={buttonClass}><KeyRound size={13} /> Change password / questions</button>
        </div>
      </section>

      {editing && <MemberAccessDialog member={editing.member} account={editing.account} onClose={() => setEditing(null)} />}
    </div>
  );
};
