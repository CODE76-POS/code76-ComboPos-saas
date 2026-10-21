import type {AppSettings,SaleTransaction} from '../types/index.ts';
import {calendarDate} from './regional.ts';
export interface ProjectionPoint{date:string;actual:number|null;forecast:number|null;kind:'recorded'|'scenario'}
const plusDays=(date:string,days:number)=>new Date(Date.parse(date+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
const cents=(n:number)=>Math.round(n*100)/100;
/** Small, disclosed scenario models—not AI, a confidence interval or a guarantee.
 * Historical values are summed from stored transactions, never fabricated from a baseline.
 */
export function salesProjection(sales:readonly SaleTransaction[],settings:AppSettings,today=new Date(),model:'average'|'linear'='average',growthPercent=0){
 if(!Number.isFinite(growthPercent)||growthPercent< -90||growthPercent>200)throw new Error('Use a scenario adjustment from -90% to 200%.');
 const end=calendarDate(today,settings),start=plusDays(end,-13),totals=new Map<string,number>(),observed=new Set<string>();
 for(const sale of sales){if(!Number.isFinite(sale.netTotal)||sale.netTotal<0||!Number.isFinite(Date.parse(sale.timestamp)))continue;const date=calendarDate(sale.timestamp,settings);if(date<start||date>end)continue;observed.add(date);totals.set(date,(totals.get(date)||0)+sale.netTotal);}
 const history:ProjectionPoint[]=Array.from({length:14},(_,i)=>{const date=plusDays(start,i);return {date,actual:cents(totals.get(date)||0),forecast:null,kind:'recorded'};});
 const eligible=observed.size>=3;
 const y=history.map(point=>point.actual!);const average=y.slice(-7).reduce((a,b)=>a+b,0)/7;
 const meanX=6.5,meanY=y.reduce((a,b)=>a+b,0)/14;const slope=y.reduce((sum,value,index)=>sum+(index-meanX)*(value-meanY),0)/y.reduce((sum,_value,index)=>sum+(index-meanX)**2,0);
 const future:ProjectionPoint[]=eligible?Array.from({length:7},(_,i)=>({date:plusDays(end,i+1),actual:null,forecast:cents(Math.max(0,(model==='average'?average:meanY+slope*(14+i-meanX))*(1+growthPercent/100))),kind:'scenario'})):[];
 return {history,future,points:[...history,...future],eligible,observedDays:observed.size,recordedTotal:cents(y.reduce((a,b)=>a+b,0)),scenarioTotal:eligible?cents(future.reduce((sum,point)=>sum+point.forecast!,0)):null,model};
}
