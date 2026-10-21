import type { PlanTier } from '../types/index.ts';

/** Owner-supplied USD list prices. Promotional display only, not a charge. */
export const PLAN_PRICING: Record<PlanTier,{list:number;current:number;discountPercent:number;interval:'month'|'once'}> = {
  free:{list:20,current:0,discountPercent:100,interval:'month'},
  starter:{list:26,current:13,discountPercent:50,interval:'month'},
  pro:{list:50,current:25,discountPercent:50,interval:'month'},
  max:{list:110,current:55,discountPercent:50,interval:'month'},
  lifetime:{list:500,current:250,discountPercent:50,interval:'once'},
};
export const usd = (amount:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(amount);
export function planCost(tier:PlanTier,months=1):number {
  if(!Number.isSafeInteger(months)||months<1)throw new Error('Enter a positive whole number of months.');
  return PLAN_PRICING[tier].current*(PLAN_PRICING[tier].interval==='once'?1:months);
}
