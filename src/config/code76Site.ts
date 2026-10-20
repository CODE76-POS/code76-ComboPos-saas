import { CODE76_MARKETING_CONTENT } from '../data/code76SiteContent.ts';

/**
 * CODE76 PRODUCT WEBSITE ONLY. Never source this content from a merchant's POS.
 * Edit this file / LandingPage.tsx for the public pre-login CODE76 website.
 * Merchant storefront settings remain in AppSettings.landingPage for compatibility.
 * These are illustrative CODE76 catalogue/review fixtures, not a tenant's records.
 */
// Current CODE76 website copy. This is not a merchant preference or migration default.
const CODE76_WEBSITE_SETTINGS = {
  heroTitle: 'Transform Every Retail & Service Transaction into Predictable Profit',
  heroSubtitle: 'Complete POS hardware, real-time inventory synchronization, automated debt tracking, and AI sales conversion for ambitious businesses.',
  featuredCount: 6, slideshowSpeedMs: 4000, showSocialProof: true, showChatbot: true,
  referralBonusText: 'Refer a fellow business owner or friend! When they purchase a terminal, both of you get $50 credit or 10% discount on next restock.',
  topReferrersLimit: 5, showPromoCountdown: true, customInstagram: '@code76_pos', customTwitter: '@code76pos',
  customWhatsappDirect: '+18007607676', shareableLinkSlogan: 'Exclusive Enterprise Commercial POS & ERP Hardware Special',
};

export const CODE76_SITE = Object.freeze({
  company: Object.freeze({ ...CODE76_MARKETING_CONTENT.company }),
  products: Object.freeze(CODE76_MARKETING_CONTENT.products.map(item => Object.freeze({ ...item }))),
  reviews: Object.freeze(CODE76_MARKETING_CONTENT.reviews.map(review => Object.freeze({ ...review }))),
  exampleSalesCount: CODE76_MARKETING_CONTENT.exampleSalesCount,
  customers: Object.freeze(CODE76_MARKETING_CONTENT.customers.map(person => Object.freeze({ ...person }))),
  marketingTeam: Object.freeze(CODE76_MARKETING_CONTENT.marketingTeam.map(person => Object.freeze({ ...person }))),
  companyMembers: Object.freeze(CODE76_MARKETING_CONTENT.companyMembers.map(person => Object.freeze({ ...person }))),
  landingPage: Object.freeze({ ...CODE76_WEBSITE_SETTINGS }),
});

export const CODE76_SITE_STORAGE_KEY = 'code76_public_site_v1';
