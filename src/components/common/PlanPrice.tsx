import React from 'react';
import type { PlanTier } from '../../types/index.ts';
import { PLAN_PRICING,usd } from '../../config/planPricing.ts';
export function PlanPrice({tier}:{tier:PlanTier}){
 const price=PLAN_PRICING[tier];
 return <div data-plan-price={tier} className="my-4 space-y-2">
   <div className="flex flex-wrap items-center gap-2 text-xs"><del aria-label={`Standard price ${usd(price.list)} ${price.interval==='month'?'per month':'one time'}`} className="text-slate-400">{usd(price.list)}</del><span className="rounded-full border border-teal-700 bg-teal-900/30 px-2 py-1 font-bold text-teal-300">{price.discountPercent}% off</span></div>
   <div className="flex flex-wrap items-baseline gap-1"><strong className="text-4xl font-black tracking-tight" data-final-price={price.current}>{usd(price.current)}</strong><span className="text-sm text-slate-400">{price.interval==='month'?'/ month':'one-time'}</span></div>
   <p className="text-[10px] text-slate-400">USD · {price.interval==='month'?'Monthly price, not an annual charge.':'No monthly software charge.'}</p>
 </div>;
}
