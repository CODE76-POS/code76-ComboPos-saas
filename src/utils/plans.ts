import type { AppSettings, PlanTier, PlatformId, SettingsSection } from '../types/index.ts';

export const PLAN_TIERS: PlanTier[] = ['free','starter','pro','max','lifetime'];
export const PLAN_INFO = {
 free:{name:'Free',term:'Monthly',detail:'Selling, receipts, history with read-only debt balances, inventory without marketing/exports, basic settings and guides.',benefits:['Core sales and receipt operations','Inventory without marketing or data exports','Appearance, currency, payments, date/time and guides']},
 starter:{name:'Starter',term:'Monthly',detail:'Access everything Pro Tier has except: emailing, referral, business landing page creation and chatbot intelligence features.',benefits:['Business operations, visual analytics and payroll','Messaging and inventory promotion tools','No email, referral, business-page creation or chatbot intelligence']},
 pro:{name:'Pro',term:'Monthly',detail:'With Pro Tier you access everything for your business, including:',benefits:['Historical, live and future-prediction visual data analytics','Business Landing Page and intelligent chatbot','All sales operations, including debt handling','And many other workspace features']},
 max:{name:'Max',term:'Monthly',detail:'Everything in Pro, plus CODE76 team-assisted services to support your business growth.',benefits:['Advertising and market-positioning assistance','Business-matched lead research and referral program help','SEO optimization and business cybersecurity services','Growth reviews and additional support by agreed scope']},
 lifetime:{name:'Lifetime',term:'One-time',detail:'All current software features, future declared features and updates, plus access to the Max team-service package.',benefits:['All current and future software features/updates','Max team-service access included','No monthly software charge; role privileges still apply']},
} as const;
export const FEATURES = [
 'selling','receipts','sales_history','inventory','appearance','payments','regional','delete_data','about',
 'debts','expenses','invoices','analytics','directory','company_profile','payroll','audit','data_export','inventory_export','backup','imports','privileges',
 'inventory_marketing','business_landing','chatbot','messaging','email','referrals','team_services',
] as const;
export type Feature=typeof FEATURES[number];
const FREE=new Set<Feature>(['selling','receipts','sales_history','inventory','appearance','payments','regional','delete_data','about']);
const STARTER_EXCLUSIONS=new Set<Feature>(['business_landing','chatbot','email','referrals']);
export function planTier(settings?:Pick<AppSettings,'planTier'>):PlanTier{return PLAN_TIERS.includes(settings?.planTier as PlanTier)?settings!.planTier!:'pro';}
export function hasPlanFeature(tier:PlanTier,feature:Feature):boolean{
 if(!FEATURES.includes(feature))return false;
 if(feature==='team_services')return tier==='max'||tier==='lifetime';
 if(tier==='free')return FREE.has(feature);
 if(tier==='starter')return !STARTER_EXCLUSIONS.has(feature);
 return tier==='pro'||tier==='max'||tier==='lifetime';
}
export const PLATFORM_FEATURE:Record<PlatformId,Feature>={selling:'selling',sales_history:'sales_history',inventory:'inventory',expenses:'expenses',invoices:'invoices',analytics:'analytics',customers:'directory',vendors:'directory',transporters:'directory',marketing_team:'directory',company_members:'directory',my_company:'company_profile',messaging:'messaging',landing_page_builder:'business_landing',settings:'appearance',audit_logs:'audit',about:'about'};
export function canOpenPlatform(settings:AppSettings,platform:PlatformId):boolean{return hasPlanFeature(planTier(settings),PLATFORM_FEATURE[platform]);}
export function canOpenSettings(settings:AppSettings,section:SettingsSection):boolean{
 const feature:Record<SettingsSection,Feature>={payments:'payments',textSizing:'appearance',appearance:'appearance',font:'appearance',receipts:'receipts',regional:'regional',plans:'appearance',dataEraser:'delete_data',landingPage:'business_landing',backup:'backup',privileges:'privileges',pdfExcel:'imports',emailTemplates:'email',auditLogs:'audit',teamServices:'team_services',demoData:'appearance',chatbot:'chatbot'};
 return hasPlanFeature(planTier(settings),feature[section]);
}
export function requirePlanFeature(settings:AppSettings,feature:Feature):void{if(!hasPlanFeature(planTier(settings),feature))throw new Error(`${feature.replace(/_/g,' ')} is not included in the ${PLAN_INFO[planTier(settings)].name} demo plan.`);}
