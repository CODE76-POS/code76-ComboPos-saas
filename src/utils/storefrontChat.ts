import {serviceUnitLabel} from './serviceUnits.ts';
import type {ServiceBillingUnit} from '../types/index.ts';
export interface CatalogChatContext {
 company?:{name?:string;currency?:string;tel1?:string;whatsapp?:string;email?:string;address?:string;location?:string;country?:string;operatingHours?:string;slogan?:string;vision?:string};
 products?:{name:string;sku?:string;category?:string;type?:string;serviceUnit?:ServiceBillingUnit;sellingPrice:number;stock?:number;isOnPromo?:boolean;promoDiscountPrice?:number;promoExpiresAt?:string;description?:string}[];
}
export function currentCatalogPrice(product:NonNullable<CatalogChatContext['products']>[number],now=Date.now()):number{
 const expires=product.promoExpiresAt?Date.parse(product.promoExpiresAt):undefined;
 const active=product.isOnPromo&&Number.isFinite(product.promoDiscountPrice)&&product.promoDiscountPrice!>=0&&product.promoDiscountPrice!<=product.sellingPrice&&(expires===undefined||(Number.isFinite(expires)&&expires>now));
 return active?product.promoDiscountPrice!:product.sellingPrice;
}
const tokens=(text:string):string[]=>text.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
const stop=new Set(['a','an','the','i','we','you','your','this','that','do','does','have','has','what','which','is','are','and','or','for','to','of','in','on','please','show','tell','me','want','need','price','prices','cost','how','much','item','items','product','products','service','services','can','under','below','less','than','up','budget']);
/** Customer-safe merchant answer only. No platform offers, private costs, fake
 * stock, rewards, verified bookings, emails or warranties are invented.
 */
export interface CatalogReplyOptions { showPrices?: boolean; showStock?: boolean }
export function businessCatalogReply(message:string,context?:CatalogChatContext,options:CatalogReplyOptions={}):string{
 const showPrices=options.showPrices!==false, showStock=options.showStock!==false;
 const company=context?.company||{},name=company.name?.trim()||'this business';
 const contact=[company.tel1&&`Phone: ${company.tel1}`,company.whatsapp&&`WhatsApp: ${company.whatsapp}`,company.email&&`Email: ${company.email}`].filter(Boolean).join(' · ');
 const next=contact||'Contact details have not been supplied; ask the business to add them before arranging an order.';
 const query=message.toLowerCase();
 if(/\b(cost price|buying cost|profit margin|salary|payroll|tax pin|supplier cost)\b/.test(query))return `This assistant uses ${name}'s customer-facing catalog only, not private costs, payroll, legal identifiers or accounting records.\n${next}`;
 const hours=/\b(opening|closing|business hours|working hours|when.*open)\b/.test(query)||(/\bhours\b/.test(query)&&!(/\b(price|cost|service|per|consult|repair)\b/.test(query)));
 if(/\b(where|location|address|visit|contact|phone|email|human|person)\b/.test(query)||hours){const address=[company.address,company.location,company.country].filter(Boolean).join(', ');return `${name}\n${address?`Location: ${address}\n`:'A location has not been provided.\n'}${company.operatingHours?`Hours: ${company.operatingHours}\n`:''}${next}`;}
 if(/\b(book|appointment|reserve|reservation|order now|buy now)\b/.test(query))return `Please contact ${name} to arrange a visit, service or order. This chat does not reserve stock or confirm appointments, and does not take payments.\n\n${next}`;
 if(/\b(refer|referral|friend|warranty|refund|return|delivery)\b/.test(query))return `Check directly with ${name} for its current policies, service terms and any offers. No booking, reward, warranty or delivery promise has been assigned by this chat.\n\n${next}`;
 const products=(Array.isArray(context?.products)?context.products:[]).filter(p=>p&&typeof p.name==='string'&&Number.isFinite(p.sellingPrice)&&p.sellingPrice>=0);
 if(!products.length)return `${name} has not added any catalog items yet. Please check back or contact the business.\n\n${next}`;
 const terms=tokens(message).filter(token=>!stop.has(token)&&!/^\d+$/.test(token));
 const scored=products.map(product=>{const title=tokens(`${product.name} ${product.sku||''}`),other=tokens(`${product.category||''} ${product.description||''}`);return {product,score:(product.sku&&query.includes(product.sku.toLowerCase())?100:query.includes(product.name.toLowerCase())?90:0)+terms.reduce((sum,term)=>sum+(title.some(token=>token.includes(term)||term.includes(token))?3:other.includes(term)?1:0),0)};});
 const matches=scored.filter(item=>item.score>0).sort((a,b)=>b.score-a.score);
 const budgetMatch=query.match(/(?:under|below|less than|up to|budget(?: of)?)\s*(?:[$€£]|[a-z]{3}\s*)?(\d+(?:\.\d{1,2})?)/i);const budget=budgetMatch?Number(budgetMatch[1]):undefined;
 let choices=(matches.length?matches.map(m=>m.product):products).filter(p=>budget===undefined||currentCatalogPrice(p)<=budget);
 if(!choices.length)return `${name} has no listed item within the stated budget of ${showPrices?`${company.currency||''} ${budget!.toFixed(2)}`:'that budget'}. No unavailable discount has been applied.\n${next}`;
 if(/\b(cheap|cheapest|budget|afford|alternative)\b/.test(query)||budget!==undefined)choices.sort((a,b)=>currentCatalogPrice(a)-currentCatalogPrice(b));
 const catalog=choices.slice(0,3).map(product=>{const availability=product.type==='service'?`${product.serviceUnit?serviceUnitLabel({type:'service',serviceUnit:product.serviceUnit})+'; ':''}service; contact to arrange`:(product.stock||0)>0?`${showStock?`${product.stock} in stock`:'in stock'}`:'out of stock';const price=showPrices?`${company.currency||''} ${currentCatalogPrice(product).toFixed(2)}`:'price on request';return `• ${product.name}${product.sku?` [${product.sku}]`:''} — ${price} (${availability})`;}).join('\n');
 const exact=matches.length?'Matching catalog entries':terms.length?'No exact match was found; here are actual catalog examples':'Current catalog';
 return `${exact} from ${name}:\n\n${catalog}\n\nConfirm availability, price basis and terms with the business. Which item or service would you like to discuss?\n${next}`;
}
