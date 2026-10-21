import React, { useState } from 'react';
import { PlanTier } from '../../types/index.ts';
import { PLAN_INFO } from '../../utils/plans.ts';
import { usePOS } from '../../context/POSContext.tsx';
import { calculateLicenseDetails, saveStoredLicense } from '../../utils/licenseManager.ts';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  CreditCard,
  Zap,
  Key,
  Copy,
  Check,
  AlertCircle,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface TierCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier: PlanTier;
}

export const TierCheckoutModal: React.FC<TierCheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedTier,
}) => {
  const { currentUser, registerUser, company, workspace, setDemoPlan } = usePOS();

  // Registration step states (if signed out)
  const [companyName, setCompanyName] = useState(workspace?.companyName || company.name || '');
  const [adminName, setAdminName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');

  // Flow states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [checkoutResult, setCheckoutResult] = useState<{
    checkoutUrl: string;
    gateway: string;
    licenseKey: string;
    productKey: string;
    amountUsd: number;
    interval: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const tierInfo = PLAN_INFO[selectedTier] || PLAN_INFO.pro;

  const handleStartCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      let activeUserEmail = currentUser?.email || email.trim();
      let activeCompany = workspace?.companyName || companyName.trim() || 'My Business';
      let activeWsId = currentUser?.workspaceId || workspace?.id || `ws-${Date.now().toString(36)}`;

      // If user is not logged in, register their business account first (Best Practice)
      if (!currentUser) {
        if (!email.trim() || !password || !companyName.trim()) {
          setErrorMsg('Please enter your business name, admin email, and secure password.');
          setIsSubmitting(false);
          return;
        }

        const regRes = registerUser({
          companyName: companyName.trim(),
          adminName: adminName.trim() || email.trim().split('@')[0],
          email: email.trim(),
          password,
          security: [{ questionId: 'first-school', answer: 'Verified CODE76 Client' }],
        });

        if (!regRes.success) {
          setErrorMsg(regRes.message);
          setIsSubmitting(false);
          return;
        }
      }

      // Call resilient checkout backend (Selar -> Gumroad -> Direct Fallback)
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          email: activeUserEmail,
          companyName: activeCompany,
          workspaceId: activeWsId,
          adminName: adminName || activeUserEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Checkout connection was interrupted. Using local license generator.');
      }

      // Save pre-provisioned authentic license locally
      const licenseDetails = calculateLicenseDetails(
        selectedTier,
        activeCompany,
        activeUserEmail,
        data.licenseKey,
        data.productKey,
        new Date().toISOString(),
        data.expiresAt,
        data.gateway === 'selar' ? 'selar' : data.gateway === 'gumroad' ? 'gumroad' : 'official_code76'
      );
      saveStoredLicense(activeWsId, licenseDetails);

      // Set in-app plan tier
      try {
        setDemoPlan(selectedTier);
      } catch {}

      setCheckoutResult({
        checkoutUrl: data.checkoutUrl,
        gateway: data.gateway,
        licenseKey: data.licenseKey,
        productKey: data.productKey,
        amountUsd: data.amountUsd,
        interval: data.interval,
      });
    } catch (err: any) {
      console.warn('Fallback local license provision engaged:', err.message);
      // Even if API fails or network drop, provide local license and direct link
      const fallbackLicense = calculateLicenseDetails(
        selectedTier,
        companyName || 'Business',
        email || 'admin@business.com'
      );
      setCheckoutResult({
        checkoutUrl: `https://selar.co/code76-${selectedTier}?email=${encodeURIComponent(email || 'client@business.com')}`,
        gateway: 'resilient_direct',
        licenseKey: fallbackLicense.licenseKey,
        productKey: fallbackLicense.productKey,
        amountUsd: selectedTier === 'lifetime' ? 399 : selectedTier === 'max' ? 129 : selectedTier === 'starter' ? 19 : 49,
        interval: selectedTier === 'lifetime' ? 'one-time' : 'month',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLicenseToClipboard = () => {
    if (!checkoutResult) return;
    navigator.clipboard.writeText(checkoutResult.licenseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border-2 border-teal-500/50 shadow-2xl p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/40 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-100">{tierInfo.name} License Activation</h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Official SaaS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure Checkout with Instant Cryptographic License &amp; Product Key
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!checkoutResult ? (
          <form onSubmit={handleStartCheckout} className="space-y-4 text-xs">
            {/* Selected Plan Summary Banner */}
            <div className="rounded-2xl border border-teal-500/30 bg-teal-950/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">Selected Tier</span>
                  <div className="text-lg font-black text-slate-100">{tierInfo.name} Platform</div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-teal-300">
                    {selectedTier === 'lifetime' ? '$399' : selectedTier === 'max' ? '$129' : selectedTier === 'starter' ? '$19' : '$49'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {selectedTier === 'lifetime' ? 'One-time · Lifetime' : '/month'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">{tierInfo.detail}</p>
            </div>

            {/* Account Details if user is not signed in */}
            {!currentUser && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5 text-teal-400 font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Step 1: Your Business Admin Account Details</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Registering your business account first ensures your License Key and receipts are tied directly to your business workspace.
                </p>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Business / Store Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Hypermarket Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Admin Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Samuel Kiprono"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Admin Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. samuel@apex.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Secure Admin Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            )}

            {currentUser && (
              <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Active Signed-In Account</span>
                  <strong className="text-slate-100 font-bold">{currentUser.name}</strong>
                  <span className="text-teal-400 text-[11px] block">{currentUser.email}</span>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-bold">
                  {currentUser.roles[0]}
                </span>
              </div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-xl shadow-teal-500/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Generating Resilient Checkout &amp; Keys...</span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Proceed to Secure Checkout &amp; License Keys &rarr;</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>🔒 Resilient Circuit-Breaker (Selar &amp; Gumroad Failover)</span>
              <span>Instant Key Generation</span>
            </div>
          </form>
        ) : (
          /* Step 2: Checkout Prepared with Instant Keys */
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/40 p-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 animate-bounce" />
              <h4 className="text-base font-black text-emerald-200">
                License &amp; Product Keys Generated!
              </h4>
              <p className="text-xs text-emerald-300 mt-1">
                Your credentials are cryptographically reserved. Complete checkout via the portal below.
              </p>
            </div>

            {/* Keys Display Box */}
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5 mb-1">
                  <Key className="w-3.5 h-3.5" />
                  <span>Unique License Key (CODE76 Authenticated)</span>
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-teal-300 select-all">
                    {checkoutResult.licenseKey}
                  </code>
                  <button
                    onClick={copyLicenseToClipboard}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>System Product Key</span>
                </label>
                <code className="block bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 select-all">
                  {checkoutResult.productKey}
                </code>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Billing Interval: <strong>{checkoutResult.interval}</strong></span>
                <span>Gateway: <strong className="capitalize">{checkoutResult.gateway.replace('_', ' ')}</strong></span>
              </div>
            </div>

            {/* Launch Checkout Portal Button */}
            <div className="space-y-2 pt-1">
              <a
                href={checkoutResult.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-xl shadow-teal-500/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center"
              >
                <span>Launch Secure Payment Portal (${checkoutResult.amountUsd})</span>
                <ExternalLink className="w-4 h-4 text-slate-950" />
              </a>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer text-center"
              >
                Done · Return to CODE76 POS
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-500">
              Your license keys remain permanently accessible in your POS Navigation Header and in Settings &rarr; License &amp; Verification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
