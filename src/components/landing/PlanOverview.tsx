import React, { useState } from 'react';
import { PLAN_INFO, type PlanTier } from '../../utils/plans.ts';
import { PlanPrice } from '../common/PlanPrice.tsx';
import { TEAM_SERVICE_SCOPE } from '../../config/teamServices.ts';
import { TierCheckoutModal } from '../modals/TierCheckoutModal.tsx';
import { ShieldCheck, Zap } from 'lucide-react';

/** Standard subscription tiers rendered in 4 columns */
const STANDARD_TIERS: PlanTier[] = ['free', 'starter', 'pro', 'max'];

/** Public CODE76 offer; connected to resilient checkout with Selar/Gumroad failover */
export function PlanOverview() {
  const [checkoutTier, setCheckoutTier] = useState<PlanTier | null>(null);

  const handleTierSelect = (tier: PlanTier) => {
    if (tier === 'free') {
      const el = document.getElementById('portal-access');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setCheckoutTier(tier);
    }
  };

  return (
    <section id="plans" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-24">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <span className="text-xs uppercase tracking-widest text-teal-400 font-bold flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          Transparent Scalable Pricing &amp; Instant Licensing
        </span>
        <h2 className="mt-2 text-3xl sm:text-4xl font-black text-slate-100">
          Free, Starter, Pro, Max &amp; Lifetime
        </h2>
        <p className="mt-4 text-sm text-slate-400">
          Start with daily operations for free. Choose more software capability as you grow, or secure permanent ownership with Lifetime. Instant unique license key generation upon activation.
        </p>
      </div>

      {/* Standard 4-Tier Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STANDARD_TIERS.map((tier) => (
          <article
            key={tier}
            data-pricing-tier={tier}
            className={`flex flex-col min-w-0 rounded-2xl border bg-slate-900 p-5 ${
              tier === 'max'
                ? 'border-teal-500 ring-1 ring-teal-500/30'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-black text-slate-100">{PLAN_INFO[tier].name}</h3>
              {tier === 'max' && (
                <span className="rounded-full border border-teal-700 px-2 py-0.5 text-[10px] text-teal-300 bg-teal-950/60 font-semibold">
                  Software + Team
                </span>
              )}
            </div>

            <PlanPrice tier={tier} />

            <p className="text-xs text-slate-400 min-h-[38px] leading-relaxed">{PLAN_INFO[tier].detail}</p>

            <ul className="my-4 space-y-2 text-xs text-slate-300">
              {PLAN_INFO[tier].benefits.map((benefit) => (
                <li key={benefit} className="flex gap-2 items-start">
                  <span className="text-teal-400 font-bold" aria-hidden="true">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleTierSelect(tier)}
              className={`mt-auto inline-flex justify-center rounded-xl px-4 py-3 text-xs font-bold transition cursor-pointer ${
                tier === 'max'
                  ? 'bg-teal-600 text-white hover:bg-teal-500 shadow-md shadow-teal-600/30'
                  : tier === 'free'
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white shadow-xs'
              }`}
            >
              {tier === 'free' ? 'Start with Free' : `Claim ${PLAN_INFO[tier].name} License &rarr;`}
            </button>
          </article>
        ))}
      </div>

      {/* Lifetime Tier Card - Spread at Full Width Below Standard Tiers */}
      <article
        data-pricing-tier="lifetime"
        className="mt-6 rounded-3xl border-2 border-teal-500/60 bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="sm:absolute sm:top-0 sm:right-0 bg-gradient-to-l from-teal-500 to-emerald-500 text-slate-950 text-[11px] font-black uppercase px-4 py-1.5 sm:rounded-bl-2xl shadow-md tracking-wider inline-block mb-4 sm:mb-0">
          ★ Lifetime Unlimited Ownership · Best Value
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-4 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-100">
                {PLAN_INFO['lifetime'].name}
              </h3>
              <span className="rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 text-xs font-bold">
                Pay Once, Keep Forever
              </span>
            </div>
            <PlanPrice tier="lifetime" />
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {PLAN_INFO['lifetime'].detail}
            </p>
          </div>

          <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-3">
              Included in Lifetime Tier:
            </h4>
            <ul className="grid sm:grid-cols-2 gap-2 text-xs text-slate-200">
              {PLAN_INFO['lifetime'].benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold shrink-0" aria-hidden="true">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
              <li className="flex items-start gap-2">
                <span className="text-teal-400 font-bold shrink-0" aria-hidden="true">✓</span>
                <span>Zero recurring monthly subscription fees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 font-bold shrink-0" aria-hidden="true">✓</span>
                <span>Perpetual updates &amp; multi-branch access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 font-bold shrink-0" aria-hidden="true">✓</span>
                <span>Unique Cryptographic Lifetime License &amp; Product Key</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 flex flex-col justify-center items-stretch gap-2.5">
            <button
              onClick={() => handleTierSelect('lifetime')}
              className="inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-teal-500/25 transition cursor-pointer"
            >
              <span>Claim Lifetime License</span>
            </button>
            <span className="text-[11px] text-center text-slate-400">
              🔒 One-time fee · Full data ownership
            </span>
          </div>
        </div>
      </article>

      <div className="mt-5 grid md:grid-cols-2 gap-3 text-xs text-slate-400">
        <p className="rounded-xl border border-slate-800 p-4">
          Transparent billing: USD/month for Free, Starter, Pro and Max; Lifetime is one-time payment with permanent licensing. Built-in Selar &amp; Gumroad resilient gateways ensure smooth activation.
        </p>
        <p className="rounded-xl border border-slate-800 p-4">
          {TEAM_SERVICE_SCOPE} Lifetime tier includes perpetual software updates, dedicated CODE76 engineering assistance, and full cryptographic license verification.
        </p>
      </div>

      {/* Checkout Modal Trigger */}
      {checkoutTier && (
        <TierCheckoutModal
          isOpen={!!checkoutTier}
          onClose={() => setCheckoutTier(null)}
          selectedTier={checkoutTier}
        />
      )}
    </section>
  );
}
