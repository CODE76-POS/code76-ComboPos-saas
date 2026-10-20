/** Transparent planning arithmetic inspired by the supplied equations.
 * No market volumes, testimonials, research scores or guaranteed outcomes are invented.
 */
function nonnegative(...values:number[]){if(values.some(value=>!Number.isFinite(value)||value<0))throw new Error('Use finite non-negative inputs.');}
function percent(value:number){if(!Number.isFinite(value)||value<0||value>100)throw new Error('Use a percentage from 0 to 100.');}
export function referralCoefficient(invitations:number,conversionPercent:number){nonnegative(invitations);percent(conversionPercent);return invitations*conversionPercent/100;}
export function paybackMonths(acquisitionCost:number,monthlyGrossProfit:number){nonnegative(acquisitionCost,monthlyGrossProfit);return monthlyGrossProfit===0?null:acquisitionCost/monthlyGrossProfit;}
export function lifetimeValueRatio(monthlyRevenue:number,grossMarginPercent:number,retentionMonths:number,acquisitionCost:number){nonnegative(monthlyRevenue,retentionMonths,acquisitionCost);percent(grossMarginPercent);return acquisitionCost===0?null:(monthlyRevenue*grossMarginPercent/100*retentionMonths)/acquisitionCost;}
export function orderValueFactor(baseRevenue:number,optionalBundleRevenue:number){nonnegative(baseRevenue,optionalBundleRevenue);return baseRevenue===0?null:optionalBundleRevenue/baseRevenue;}
export function netRetention(startingMrr:number,expansionMrr:number,churnMrr:number){nonnegative(startingMrr,expansionMrr,churnMrr);if(churnMrr>startingMrr+expansionMrr)throw new Error('Churn cannot exceed the revenue available to lose.');return startingMrr===0?null:(startingMrr+expansionMrr-churnMrr)/startingMrr;}
export function weightedEngagement(bookmarks:number,comments:number,shares:number,impressions:number){nonnegative(bookmarks,comments,shares,impressions);return impressions===0?null:(3*bookmarks+2*comments+shares)/impressions;}
