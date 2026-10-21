import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { FEATURES, hasPlanFeature, PLAN_INFO, PLAN_TIERS, planTier } from '../../utils/plans.ts';
import { PlanPrice } from './PlanPrice.tsx';
import { TEAM_SERVICE_SCOPE } from '../../config/teamServices.ts';
import { planCost, usd } from '../../config/planPricing.ts';
import { calculateLicenseDetails, getStoredLicense } from '../../utils/licenseManager.ts';
import { TierCheckoutModal } from '../modals/TierCheckoutModal.tsx';
import {
  Key,
  ShieldCheck,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  Award,
} from 'lucide-react';

export function DemoPlanSettings() {
  const { settings, currentUser, setDemoPlan, workspace, company } = usePOS();
  const [notice, setNotice] = useState('');
  const [months, setMonths] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [checkoutModalTier, setCheckoutModalTier] = useState<any>(null);

  const selected = planTier(settings);
  const license = currentUser
    ? getStoredLicense(currentUser.workspaceId || 'default') ||
      calculateLicenseDetails(selected, workspace?.companyName || company.name, currentUser.email)
    : calculateLicenseDetails(selected, company.name, 'admin@business.com');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <section className="space-y-6">
      {/* 1. Official License & Product Key Certificate Box */}
      {currentUser?.isAdmin && (
        <div className="rounded-3xl border-2 border-teal-500/60 bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 p-6 sm:p-7 shadow-2xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/40">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-100">Official CODE76 POS License Certificate</h3>
                  <span className="px-2 py-0.5 text-[9px] uppercase font-extrabold rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    {license.status === 'perpetual' ? 'PERPETUAL OWNERSHIP' : 'ACTIVE SUBSCRIPTION'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Cryptographically bound to {license.companyName} ({license.adminEmail})</p>
              </div>
            </div>

            <button
              onClick={() => setCheckoutModalTier(selected === 'lifetime' ? 'max' : 'lifetime')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade / Renew License</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
            {/* License Key */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>Unique License Key</span>
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(license.licenseKey, 'license')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedKey === 'license' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'license' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <code className="block bg-slate-900 border border-slate-800/90 rounded-xl px-3 py-2 text-xs font-mono font-bold text-teal-300 select-all">
                {license.licenseKey}
              </code>
            </div>

            {/* Product Key */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hardware &amp; Terminal Product Key</span>
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(license.productKey, 'product')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedKey === 'product' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'product' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <code className="block bg-slate-900 border border-slate-800/90 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 select-all">
                {license.productKey}
              </code>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span>Tier: <strong className="text-slate-200 uppercase">{selected}</strong></span>
              <span>·</span>
              <span>Expires: <strong className="text-teal-300">{license.expiresAt === 'PERPETUAL' ? 'PERPETUAL (NEVER EXPIRES)' : new Date(license.expiresAt).toLocaleDateString()}</strong></span>
            </div>
            <div className="text-teal-400 font-medium">
              ✓ Verified by CODE76 Cryptographic Authority (Online/Offline)
            </div>
          </div>
        </div>
      )}

      {/* 2. Plan Tier Selection Cards */}
      <div>
        <h2 className="font-bold text-xl text-slate-100">App Plans &amp; Workspace Entitlements</h2>
        <p className="mt-1 text-sm text-slate-400">
          Switch active workspace tiers or preview features. As Administrator, you can activate any plan and manage subscription terms.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLAN_TIERS.map((tier) => (
          <div
            key={tier}
            data-demo-plan-card={tier}
            className={`rounded-2xl border p-5 transition flex flex-col justify-between ${
              selected === tier
                ? 'border-teal-500 bg-teal-950/40 ring-1 ring-teal-500/40'
                : 'border-slate-800 bg-slate-900 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-black text-slate-100">{PLAN_INFO[tier].name}</h3>
                {selected === tier && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold">
                    Active Plan
                  </span>
                )}
              </div>
              <PlanPrice tier={tier} />
              <p className="text-xs text-slate-400 mt-2 min-h-[38px] leading-relaxed">{PLAN_INFO[tier].detail}</p>
              <ul className="my-3 space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2.5">
                {PLAN_INFO[tier].benefits.map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <span className="text-teal-400 font-bold shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <button
                type="button"
                aria-label={`Select ${PLAN_INFO[tier].name} demo plan`}
                disabled={!currentUser?.isAdmin || selected === tier}
                className="w-full rounded-xl bg-teal-700 hover:bg-teal-600 px-3 py-2 text-xs font-bold text-white transition disabled:opacity-40 cursor-pointer"
                onClick={() => {
                  try {
                    setDemoPlan(tier);
                    setNotice(`${PLAN_INFO[tier].name} plan applied to workspace. Existing records retained.`);
                  } catch (error) {
                    setNotice(String(error));
                  }
                }}
              >
                {selected === tier ? 'Active Workspace Plan' : `Activate ${PLAN_INFO[tier].name} Plan`}
              </button>

              {tier !== 'free' && (
                <button
                  type="button"
                  onClick={() => setCheckoutModalTier(tier)}
                  className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-[11px] font-semibold text-teal-300 border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-teal-400" />
                  <span>Connect Billing (Selar/Gumroad)</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!currentUser?.isAdmin && (
        <p className="text-xs text-slate-400">Only an administrator can change the workspace plan.</p>
      )}

      {notice && (
        <div className="p-3 rounded-xl bg-teal-950/80 border border-teal-500 text-sm text-teal-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Illustrative Calculator */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <label className="text-sm font-semibold text-slate-200 flex items-center">
          <span>Illustrative comparison months:</span>
          <input
            aria-label="Plan comparison months"
            type="number"
            min="1"
            max="120"
            value={months}
            onChange={(event) => setMonths(Math.min(120, Math.max(1, Math.trunc(Number(event.target.value) || 1))))}
            className="ml-3 w-20 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-100 font-bold"
          />
        </label>
        <p className="mt-2 text-xs text-slate-400">
          For {months} month{months === 1 ? '' : 's'}:{' '}
          {PLAN_TIERS.map(
            (tier) => `${PLAN_INFO[tier].name}: ${usd(planCost(tier, months))}${tier === 'lifetime' ? ' once' : ''}`
          ).join(' · ')}
        </p>
      </div>

      {/* Feature Matrix */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-bold">
              <th className="p-2">Feature Platform</th>
              {PLAN_TIERS.map((tier) => (
                <th key={tier} className="p-2">{PLAN_INFO[tier].name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((feature) => (
              <tr className="border-t border-slate-800/80 hover:bg-slate-800/40 transition" key={feature}>
                <td className="p-2 capitalize font-medium text-slate-300">{feature.replace(/_/g, ' ')}</td>
                {PLAN_TIERS.map((tier) => (
                  <td key={tier} className="p-2">
                    {hasPlanFeature(tier, feature) ? (
                      <span className="text-teal-400 font-bold">✓ Included</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        {TEAM_SERVICE_SCOPE} Lifetime tier includes perpetual service access and future software updates. Role privileges still apply.
      </p>

      {/* Checkout Modal */}
      {checkoutModalTier && (
        <TierCheckoutModal
          isOpen={!!checkoutModalTier}
          onClose={() => setCheckoutModalTier(null)}
          selectedTier={checkoutModalTier}
        />
      )}
    </section>
  );
}
