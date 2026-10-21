/** CODE76-owned identity only. Never substitutes a merchant's own profile/logo. */
export const CODE76_BRAND = Object.freeze({
 name:'CODE76 POS', credit:'Website created by CODE76.',
 email:'code76pos@gmail.com', emailUrl:'mailto:code76pos@gmail.com',
 youtube:'https://www.youtube.com/@CODE76-fn4fj',
 facebook:'https://www.facebook.com/profile.php?id=61552639386192',
 cta:'Create your website with CODE76',
 logoPath:'code76-logo.png',
});
export const brandAssetUrl=(file=CODE76_BRAND.logoPath)=>(import.meta.env?.BASE_URL || '/')+file;
export const websiteRequestUrl=()=>`${CODE76_BRAND.emailUrl}?subject=${encodeURIComponent('Website creation inquiry')}`;
export const CODE76_CREDIT_TEXT=`${CODE76_BRAND.credit}\nemail: ${CODE76_BRAND.email}\nyoutube: ${CODE76_BRAND.youtube}\n${CODE76_BRAND.cta}: ${CODE76_BRAND.email}`;
export const CODE76_EXPORT_FIELDS=Object.freeze({
 '_code76_credit: Website created by CODE76.':CODE76_BRAND.credit,
 '_code76_email: code76pos@gmail.com':CODE76_BRAND.email,
 '_code76_youtube: https://www.youtube.com/@CODE76-fn4fj':CODE76_BRAND.youtube,
 '_code76_cta: Create your website with CODE76':CODE76_BRAND.cta,
});
export function withExportCredit<T extends Record<string,unknown>>(record:T){return {...record,...CODE76_EXPORT_FIELDS};}
export function withBackupCredit<T extends Record<string,unknown>>(record:T){return {...record,_code76:{credit:CODE76_BRAND.credit,email:CODE76_BRAND.email,youtube:CODE76_BRAND.youtube,cta:CODE76_BRAND.cta}};}
/** Fixed, trusted branding HTML for generated printable documents. */
export function creditHtml(){return `<div class="code76-credit" style="margin-top:22px;border-top:1px solid #cbd5e1;padding-top:12px;font-size:10px;line-height:1.6;color:#475569;overflow-wrap:anywhere;break-inside:avoid"><strong>${CODE76_BRAND.credit}</strong><br/>email: <a href="${CODE76_BRAND.emailUrl}" style="color:#0f766e">${CODE76_BRAND.email}</a><br/>youtube: <a href="${CODE76_BRAND.youtube}" style="color:#0f766e">${CODE76_BRAND.youtube}</a><br/><a href="${websiteRequestUrl()}" style="font-weight:700;color:#0f766e">${CODE76_BRAND.cta}</a></div>`;}
