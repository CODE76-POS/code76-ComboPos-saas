import type { CompanyData, CustomerReview, ProductItem } from '../types/index.ts';
import { CODE76_SITE } from '../config/code76Site.ts';
import { blankMerchantCompany, isCompanyConfigured } from './onboarding.ts';

export type AppView = 'landing' | 'pos' | 'storefront';
export type LandingSurface = 'code76' | 'business';
export interface MerchantPageData {
  company: CompanyData;
  products: readonly ProductItem[];
  reviews: readonly CustomerReview[];
}

export function landingPageData(surface: LandingSurface, merchant: MerchantPageData): MerchantPageData {
  if (surface === 'code76') {
    return { company: CODE76_SITE.company, products: CODE76_SITE.products, reviews: CODE76_SITE.reviews };
  }
  return {
    company: isCompanyConfigured(merchant.company)
      ? merchant.company
      : { ...blankMerchantCompany(merchant.company.currency), name: 'Your Business' },
    products: merchant.products,
    reviews: merchant.reviews,
  };
}

export function initialView(search: string, authenticated = false): AppView {
  const view = new URLSearchParams(search).get('view');
  if (view === 'storefront') return 'storefront';
  if (view === 'landing') return 'landing';
  if (view === 'pos') return 'pos'; // App renders the sign-in page if no user is authenticated.
  return authenticated ? 'pos' : 'landing';
}

export function viewUrl(view: AppView, href: string): string {
  const url = new URL(href);
  url.searchParams.set('view', view);
  url.hash = '';
  return url.toString();
}

/** Only customer-visible information is sent to either landing-page assistant. */
export function catalogChatContext(surface: LandingSurface, merchant: MerchantPageData) {
  const data = landingPageData(surface, merchant);
  const company = data.company;
  return {
    company: {
      name: company.name, slogan: company.slogan, vision: company.vision,
      currency: company.currency, tel1: company.tel1, whatsapp: company.whatsapp,
      email: company.email, address: company.address, location: company.location,
      country: company.country, operatingHours: company.operatingHours,
    },
    products: data.products.map(product => ({
      id: product.id, sku: product.sku, name: product.name, category: product.category,
      type: product.type, sellingPrice: product.sellingPrice, stock: product.stock,
      isOnPromo: product.isOnPromo, promoDiscountPrice: product.promoDiscountPrice, description: product.description,
    })),
    reviews: data.reviews.filter(review => review.isApprovedForLanding).map(review => ({
      comment: review.comment, rating: review.rating, customerName: review.customerName,
    })),
  };
}
