import { PLAN_INFO, planTier, type PlanTier } from '../../utils/plans.ts';
import { accessHistoryPermissions } from '../../utils/accessHistory.ts';
import React, { useEffect, useRef, useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { Lock, Mail, Shield, X, UserPlus, LogIn, CheckCircle2, AlertCircle, History, Info, Building2, KeyRound, ArrowLeft, HelpCircle, Key, Copy, Check, Sparkles, CreditCard } from 'lucide-react';
import { SecurityQuestionFields } from '../common/SecurityQuestionFields.tsx';
import { RECOVERY_QUESTION_COUNT, type RecoveryProfile, type SecurityDraft } from '../../utils/accounts.ts';
import { getStoredLicense, calculateLicenseDetails } from '../../utils/licenseManager.ts';
import { TierCheckoutModal } from './TierCheckoutModal.tsx';

type AuthMode = 'login' | 'register' | 'recover';
type RecoveryStep = 'identify' | 'questions' | 'reset' | 'done';

const emptySecurity = (): SecurityDraft[] => Array.from({ length: RECOVERY_QUESTION_COUNT }, () => ({ questionId: '', answer: '' }));

export const LoginModal: React.FC = () => {
  const {
    loginModalOpen, setLoginModalOpen, currentUser, loginUser, logoutUser, registerUser,
    settings, setActivePlatform, hasFeature, workspace, setSettingsSection,
    lookupRecoveryAccount, verifyRecoveryAnswersFor, resetAccountPassword,
  } = usePOS();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [security, setSecurity] = useState<SecurityDraft[]>(emptySecurity);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [registerPlanTier, setRegisterPlanTier] = useState<PlanTier>('free');
  const [checkoutTierModal, setCheckoutTierModal] = useState<PlanTier | null>(null);

  const activeTier = planTier(settings);
  const currentLicense = currentUser
    ? getStoredLicense(currentUser.workspaceId || 'default') ||
      calculateLicenseDetails(activeTier, workspace?.companyName || 'Business', currentUser.email, currentUser.licenseKey, currentUser.productKey, currentUser.licenseExpiresAt)
    : null;

  const copyKey = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>('identify');
  const [recoveryQuery, setRecoveryQuery] = useState('');
  const [recoveryCompany, setRecoveryCompany] = useState('');
  const [recoveryProfile, setRecoveryProfile] = useState<RecoveryProfile | null>(null);
  const [recoveryAnswers, setRecoveryAnswers] = useState<Record<string, string>>({});
  const [newPassword, setNewPassword] = useState('');

  const historyAccess = accessHistoryPermissions(currentUser, settings);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!loginModalOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLoginModalOpen(false);
      if (event.key === 'Tab') {
        const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, a[href]') || [])].filter(element => element.offsetParent !== null);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    dialog.current?.querySelector<HTMLElement>('button')?.focus();
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); if (previous?.isConnected) previous.focus(); };
  }, [loginModalOpen, setLoginModalOpen]);
  if (!loginModalOpen) return null;

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrorMsg('');
    setSuccessMsg('');
    setRecoveryStep('identify');
    setRecoveryProfile(null);
    setRecoveryAnswers({});
    setNewPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setErrorMsg('Please enter both your email address and password.');
        return;
      }
      const res = loginUser(email, password);
      if (res.success) {
        setSuccessMsg('Authentication successful! Only your business workspace was loaded.');
        setTimeout(() => {
          setSuccessMsg('');
          setLoginModalOpen(false);
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
      return;
    }

    if (mode === 'register') {
      if (!companyName.trim() || !fullName.trim()) {
        setErrorMsg('Enter your business name and your full name — the person who registers is the administrator.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      const result = registerUser({ companyName, adminName: fullName, email, password, security });
      if (!result.success) { setErrorMsg(result.message); return; }
      if (registerPlanTier !== 'free') {
        setSuccessMsg(`Account created! Directing to ${registerPlanTier.toUpperCase()} payment portal...`);
        setTimeout(() => {
          setLoginModalOpen(false);
          setCheckoutTierModal(registerPlanTier);
        }, 500);
        return;
      }
      setSuccessMsg(result.message);
      setTimeout(() => {
        setSuccessMsg('');
        setLoginModalOpen(false);
      }, 1400);
      return;
    }

    // Recovery — identify the account first.
    if (recoveryStep === 'identify') {
      if (!recoveryQuery.trim()) {
        setErrorMsg('Enter your account email, or your business name and full name.');
        return;
      }
      const result = lookupRecoveryAccount(recoveryQuery, recoveryCompany);
      if (!result.success || !result.value) { setErrorMsg(result.message); return; }
      setRecoveryProfile(result.value);
      setRecoveryAnswers({});
      setRecoveryStep('questions');
      setSuccessMsg(`Security question loaded for ${result.value.email}.`);
      return;
    }

    if (recoveryStep === 'questions' && recoveryProfile) {
      const ok = verifyRecoveryAnswersFor(recoveryProfile.email, recoveryAnswers);
      if (!ok) {
        setErrorMsg('That security answer did not match. Capitals and extra spaces are ignored — check the spelling and try again.');
        return;
      }
      setErrorMsg('');
      setSuccessMsg('');
      setRecoveryStep('reset');
      return;
    }

    if (recoveryStep === 'reset' && recoveryProfile) {
      const result = resetAccountPassword(recoveryProfile.email, recoveryAnswers, newPassword);
      if (!result.success) { setErrorMsg(result.message); return; }
      setRecoveryStep('done');
      setSuccessMsg(`Your username is ${recoveryProfile.email}. ${result.message}`);
      setEmail(recoveryProfile.email);
      setPassword('');
    }
  };

  const handleLogout = () => {
    setLoginModalOpen(false);
    logoutUser(); // Immediately returns to the CODE76 public root, including its account portal.
  };

  const heading = currentUser
    ? 'Active User Session'
    : mode === 'login' ? 'Sign In to CODE76 POS'
    : mode === 'register' ? 'Register Your Business' : 'Recover Login Credentials';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="session-dialog-heading" className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 sm:p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setLoginModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-teal-400">
              {currentUser ? 'Role-Based Access Control' : 'Business workspace access'}
            </span>
            <h3 id="session-dialog-heading" className="text-xl font-bold text-slate-100">
              {heading}
            </h3>
          </div>
        </div>

        {currentUser ? (
          <div className="space-y-4 my-2">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-300 font-bold text-xl flex items-center justify-center mx-auto mb-3 border border-teal-500/40">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <h4 className="font-bold text-lg text-slate-100">{currentUser.name}</h4>
              <p className="text-xs text-slate-400">{currentUser.email}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-[11px] font-semibold text-teal-300">
                <Building2 size={13} /> {workspace?.companyName || 'Business workspace'}
              </p>
              <div className="flex justify-center gap-2 mt-3">
                {currentUser.roles.map((r, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold"
                  >
                    Role: {r}
                  </span>
                ))}
                <span className="px-2.5 py-1 text-xs rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                  {currentUser.isAdmin ? 'Administrator' : 'Team member'}
                </span>
              </div>
            </div>

            {/* Official Cryptographic License & Product Key (Visible to Administrator) */}
            {currentUser.isAdmin && currentLicense && (
              <div className="rounded-2xl border border-teal-500/40 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400 uppercase tracking-wider">
                    <Key className="w-3.5 h-3.5" />
                    <span>Official CODE76 License Credentials</span>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {currentLicense.status === 'perpetual' ? 'PERPETUAL' : 'ACTIVE'}
                  </span>
                </div>

                {/* License Key */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400 font-semibold">Unique License Key</span>
                    <button
                      type="button"
                      onClick={() => copyKey(currentLicense.licenseKey, 'license')}
                      className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedKey === 'license' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'license' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <code className="block bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-teal-300 select-all">
                    {currentLicense.licenseKey}
                  </code>
                </div>

                {/* Product Key */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400 font-semibold">Hardware Product Key</span>
                    <button
                      type="button"
                      onClick={() => copyKey(currentLicense.productKey, 'product')}
                      className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedKey === 'product' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'product' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <code className="block bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 select-all">
                    {currentLicense.productKey}
                  </code>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <span>Tier: <strong className="text-slate-200 uppercase">{currentLicense.tier}</strong></span>
                  <span>Expires: <strong className="text-teal-300">{currentLicense.expiresAt === 'PERPETUAL' ? 'Never' : new Date(currentLicense.expiresAt).toLocaleDateString()}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginModalOpen(false);
                      setSettingsSection('plans');
                      setActivePlatform('settings');
                    }}
                    className="text-teal-400 hover:underline font-semibold cursor-pointer"
                  >
                    Manage &rarr;
                  </button>
                </div>
              </div>
            )}

            <p className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-[11px] leading-relaxed text-slate-400">
              This session can only read and write <strong className="text-slate-200">{workspace?.companyName || 'this business'}</strong> records.
              Staff logins are created by the administrator against a company member, and data from other businesses on this device is never loaded here.
            </p>

            <p className="text-xs text-teal-400">Current plan: {PLAN_INFO[planTier(settings)].name} · demo entitlements only, no billing</p>
            <div className="rounded-xl border border-teal-800 bg-teal-950/40 p-3 text-xs text-slate-300">
              <p className="flex items-center gap-2 font-bold text-teal-300"><Info size={15} /> Access-history tip</p>
              {!hasFeature('audit') ? <p className="mt-2">Access history requires Starter, Pro or Lifetime, plus the necessary role privileges. Your Free records are preserved; an administrator can change the demo plan in Settings.</p> : historyAccess.canView ? <>
                <p className="mt-2">Find app user access history in <strong>Audit & Access Logs</strong>, or <strong>Settings → Audit Logs & Login History</strong>.</p>
                <p className="mt-2">{historyAccess.canExport ? 'You can download the filtered results as PDF, TXT or CSV files.' : 'Your role can view history. Downloads also require the Export Reports privilege; ask an administrator.'}</p>
                <button type="button" onClick={() => { if (!accessHistoryPermissions(currentUser, settings).canView) return; setLoginModalOpen(false); setActivePlatform('audit_logs'); }} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 font-semibold text-white"><History size={14} /> Open access history</button>
              </> : <p className="mt-2">Access history and its PDF, TXT and CSV downloads are restricted to administrators or users with the required Audit Logs and Export Reports privileges. Ask your administrator for access.</p>}
            </div>
            <p className="text-xs text-slate-400">Use Sign Out below to return to the public CODE76 landing page with sign-in/register. Change light/dark mode in Settings → App Appearance Settings.</p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setLoginModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-md transition cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-800/60 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Business name
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Wanjiku Hardware"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">This becomes its own workspace. Only people you register can open its records.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-slate-400" /> Administrator full name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Samuel Kiprono"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">The person who registers and pays for CODE76 POS becomes this business's administrator.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Target Plan Selection
                  </label>
                  <select
                    value={registerPlanTier}
                    onChange={(e) => setRegisterPlanTier(e.target.value as PlanTier)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="free">Free Plan — Standard POS ($0/mo)</option>
                    <option value="starter">Starter Plan — Payroll &amp; Marketing ($19/mo)</option>
                    <option value="pro">Pro Plan — Complete Suite &amp; Bot ($49/mo)</option>
                    <option value="max">Max Plan — Software + Dedicated Team ($129/mo)</option>
                    <option value="lifetime">Lifetime License — Unlimited Ownership ($399 once)</option>
                  </select>
                </div>
              </>
            )}

            {mode !== 'recover' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {mode === 'register' ? 'Administrator email (username)' : 'Email Address'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  autoComplete="username"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            {mode !== 'recover' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
                {mode === 'register' && <p className="mt-1 text-[10px] text-slate-500">At least 6 characters. Staff members get their own logins from the administrator.</p>}
              </div>
            )}

            {mode === 'register' && (
              <SecurityQuestionFields value={security} onChange={setSecurity} label="Security question" hint="Choose one question only you can answer. It recovers your username or resets a forgotten password." />
            )}

            {mode === 'recover' && (
              <div className="space-y-4">
                {recoveryStep === 'identify' && (
                  <>
                    <p className="text-xs leading-relaxed text-slate-400">
                      Forgot your password or username? Enter your account email — or, if you forget the email, your business name plus your full name. We then ask the security question you chose.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Account email or your full name</label>
                      <input
                        type="text"
                        value={recoveryQuery}
                        onChange={(e) => setRecoveryQuery(e.target.value)}
                        placeholder="name@business.com — or your full name"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                      />
                      <p className="mt-1 text-[10px] text-slate-500">If you forgot the email, type your full name and fill in the business name below.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Business name (helps find your account)</label>
                      <input type="text" value={recoveryCompany} onChange={(e) => setRecoveryCompany(e.target.value)} placeholder="e.g. Wanjiku Hardware" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
                    </div>
                  </>
                )}

                {recoveryStep === 'questions' && recoveryProfile && (
                  <>
                    <p className="text-xs leading-relaxed text-slate-400">
                      Answer the security question for <strong className="text-slate-200">{recoveryProfile.name}</strong>. Capitals and extra spaces are ignored.
                    </p>
                    {recoveryProfile.questions.map((question) => (
                      <label key={question.id} className="block text-xs font-semibold text-slate-300">
                        {question.prompt}
                        <input
                          type="text"
                          required
                          autoComplete="off"
                          value={recoveryAnswers[question.id] || ''}
                          onChange={(e) => setRecoveryAnswers((previous) => ({ ...previous, [question.id]: e.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                        />
                      </label>
                    ))}
                  </>
                )}

                {recoveryStep === 'reset' && recoveryProfile && (
                  <>
                    <div className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-3 text-xs text-emerald-300">
                      Answers verified. Your username is <strong>{recoveryProfile.email}</strong> for {recoveryProfile.companyName}.
                    </div>
                    <label className="block text-xs font-semibold text-slate-300">
                      New password
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500">At least 6 characters. Your security question stays the same.</p>
                  </>
                )}

                {recoveryStep === 'done' && recoveryProfile && (
                  <div className="rounded-xl border border-emerald-700 bg-emerald-950/50 p-4 text-xs text-emerald-200">
                    <p className="flex items-center gap-2 font-bold"><CheckCircle2 size={15} /> Recovery complete</p>
                    <p className="mt-2">Username: <strong>{recoveryProfile.email}</strong></p>
                    <p className="mt-1">Password changed on this device. Return to Sign In with the same email.</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {mode === 'login' ? (
                <>
                  <button type="button" onClick={() => switchMode('register')} className="text-xs text-teal-400 hover:text-teal-300 font-medium hover:underline cursor-pointer">
                    New business? Register as administrator
                  </button>
                  <button type="button" onClick={() => switchMode('recover')} className="text-xs text-amber-300 hover:text-amber-200 font-medium hover:underline cursor-pointer inline-flex items-center gap-1">
                    <HelpCircle size={13} /> Forgot password or email?
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => switchMode('login')} className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-medium hover:underline cursor-pointer">
                  <ArrowLeft size={13} /> Back to Sign In
                </button>
              )}

              {!(mode === 'recover' && recoveryStep === 'done') && (
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-lg shadow-teal-600/30 transition flex items-center gap-2 cursor-pointer"
                >
                  {mode === 'login' ? <LogIn className="w-4 h-4" /> : mode === 'register' ? (registerPlanTier === 'free' ? <UserPlus className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />) : <KeyRound className="w-4 h-4" />}
                  {mode === 'login' ? 'Sign In' : mode === 'register' ? (registerPlanTier === 'free' ? 'Register Business' : `Register & Proceed to ${registerPlanTier.toUpperCase()} Payment`) : recoveryStep === 'identify' ? 'Find My Account' : recoveryStep === 'questions' ? 'Verify Answers' : 'Set New Password'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {checkoutTierModal && (
        <TierCheckoutModal
          isOpen={!!checkoutTierModal}
          onClose={() => setCheckoutTierModal(null)}
          selectedTier={checkoutTierModal}
        />
      )}
    </div>
  );
};
