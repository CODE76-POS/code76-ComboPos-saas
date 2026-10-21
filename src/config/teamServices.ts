export const TEAM_SERVICES = [
 {id:'advertising',title:'Advertising & market positioning',detail:'Work with the CODE76 team on audience, offer, channel and campaign planning.',deliverable:'An agreed campaign brief and measurement plan. Ad spend/platform fees require separate approval.'},
 {id:'leads',title:'Business-matched customer lead research',detail:'Define your ideal business customer and research relevant, lawful contact opportunities.',deliverable:'A scoped lead-research brief; use permitted public business information or consent-based contacts, not private/sensitive dossiers.'},
 {id:'referrals',title:'Referral program assistance',detail:'Plan clear referral terms, consent-based sharing and attribution for your business.',deliverable:'A referral workflow and terms checklist. No reward is promised or issued automatically.'},
 {id:'seo',title:'SEO & website conversion review',detail:'Review discoverability, page structure, metadata and the path from interest to inquiry.',deliverable:'Prioritized SEO and page-improvement recommendations. Search rankings and sales are not guaranteed.'},
 {id:'cybersecurity',title:'Business cybersecurity services',detail:'Scope a defensive review of account access, MFA, backups, recovery and staff awareness.',deliverable:'An authorized security-readiness checklist and agreed actions; no testing outside an approved scope, certification or breach guarantee.'},
 {id:'growth',title:'Growth reviews & staff enablement',detail:'Discuss your business goals, review useful metrics and identify training/onboarding priorities.',deliverable:'A practical next-step plan; additional work is defined and agreed during onboarding.'},
] as const;
export type TeamServiceId = typeof TEAM_SERVICES[number]['id'];
export const TEAM_SERVICE_SCOPE = 'Max and Lifetime include access to CODE76 team-assisted services. Agree scope, delivery schedule and any third-party/ad spend first; access is not unlimited work or a guaranteed outcome.';
