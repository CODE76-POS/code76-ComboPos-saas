import {PLAN_INFO,PLAN_TIERS} from './plans.ts';
import {PLAN_PRICING,usd} from '../config/planPricing.ts';
import {TEAM_SERVICE_SCOPE} from '../config/teamServices.ts';
export const softwareOfferSummary=()=>PLAN_TIERS.map(tier=>{const p=PLAN_PRICING[tier];return `${PLAN_INFO[tier].name}: ${usd(p.current)} USD ${p.interval==='month'?'per month':'one-time'} (standard ${usd(p.list)}, ${p.discountPercent}% off). ${PLAN_INFO[tier].detail}`;}).join('\n');
export function softwarePlanReply(message:string):string|null{
 if(!/\b(plan|plans|tier|tiers|subscription|starter|max|lifetime)\b|\bpro\b.*\b(price|cost|month)\b|\b(price|cost)\b.*\bpro\b/i.test(message))return null;
 return `CODE76 software plans\n\n${softwareOfferSummary()}\n\n${TEAM_SERVICE_SCOPE} Lifetime includes the same access. Prices are a displayed offer only: the demo has no connected billing, paid-licence verification or service fulfilment. Role privileges still apply.`;
}
export function code76SiteReply(message:string):string{
 const plan=softwarePlanReply(message);if(plan)return plan;
 if(/\b(refer|referral|friend)\b/i.test(message))return 'Max and Lifetime include help planning a referral program. Agree consent, eligibility, attribution and any rewards with the CODE76 team first. This chat does not assign cash, credits or referrals. Compare the published plans or use the contact section to discuss a brief.';
 if(/\b(book|appointment|reserve|reservation|service|seo|cybersecurity|advertis|leads)\b/i.test(message))return `${TEAM_SERVICE_SCOPE} You can prepare a service brief in an eligible workspace or contact the team using the site contact details. No appointment, ad spend, lead delivery or security test has been booked or initiated by this chat.`;
 if(/\b(hardware|terminal|scanner|printer|warranty|dispatch|stock|budget)\b/i.test(message))return 'The website includes illustrative hardware/catalog information. Confirm current availability, pricing, warranty and delivery terms directly with CODE76 before ordering. This chat cannot reserve goods or guarantee dispatch. Software plan prices are shown in Plans & prices.';
 return 'Welcome to CODE76 POS. I can explain the software plans, actual workspace modules and team-assisted services. Start with Free to try the workflow, compare the five plans, or tell me which business task you want to make easier. No billing, booking, lead delivery or team notification occurs automatically in this demo.';
}
