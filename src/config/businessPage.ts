import type { AppSettings, LandingMetrics } from '../types/index.ts';

/** Defaults belong to a merchant page, never the CODE76 product website. */
export const BUSINESS_PAGE_DEFAULTS: AppSettings['landingPage'] = {
  contentVersion: 2,
  heroTitle: '', heroSubtitle: '', featuredCount: 6, slideshowSpeedMs: 4000,
  showSocialProof: true, showChatbot: true, referralBonusText: '', topReferrersLimit: 5,
  showPromoCountdown: true, customInstagram: '', customTwitter: '', customWhatsappDirect: '', shareableLinkSlogan: '',
};

/** Exact old seed values, used only to migrate accidentally shared product-site defaults. */
export const LEGACY_CODE76_PAGE_DEFAULTS = {
  heroTitle: 'Transform Every Retail & Service Transaction into Predictable Profit',
  heroSubtitle: 'Complete POS hardware, real-time inventory synchronization, automated debt tracking, and AI sales conversion for ambitious businesses.',
  featuredCount: 6, slideshowSpeedMs: 4000, showSocialProof: true, showChatbot: true,
  referralBonusText: 'Refer a fellow business owner or friend! When they purchase a terminal, both of you get $50 credit or 10% discount on next restock.',
  topReferrersLimit: 5, showPromoCountdown: true, customInstagram: '@code76_pos', customTwitter: '',
  customWhatsappDirect: '+254796003614', shareableLinkSlogan: 'Exclusive Enterprise Commercial POS & ERP Hardware Special',
};

export const EMPTY_BUSINESS_METRICS: LandingMetrics = { visitors: 0, avgTimeOnPageSeconds: 0, chatbotConversations: 0, leadsCaptured: 0, referralVisits: 0, totalLandingSales: 0 };
