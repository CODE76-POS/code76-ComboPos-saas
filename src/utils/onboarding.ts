import { DEFAULT_SERVICE_UNIT, parseServiceUnit } from './serviceUnits.ts';
import type { ServiceBillingUnit, AppSettings, CompanyData, ProductItem } from '../types/index.ts';

export const SETUP_STORAGE_KEY = 'code76_guided_setup_v2';
export const SETUP_STAGES = ['appearance', 'company', 'inventory', 'tour'] as const;
export type SetupStage = (typeof SETUP_STAGES)[number];
export interface SetupProgress {
  version: 2;
  stage: SetupStage;
  status: 'in_progress' | 'deferred' | 'complete';
  addedProductIds: string[];
  draftCompany?: CompanyData;
}

export const TEXT_SIZE_OPTIONS: { value: AppSettings['textSizing']; label: string; scale: number; sample: string }[] = [
  { value: 'compact', label: 'Compact', scale: 0.9, sample: 'More on your screen' },
  { value: 'normal', label: 'Normal', scale: 1, sample: 'A balanced everyday view' },
  { value: 'large', label: 'Large', scale: 1.15, sample: 'Comfortably readable' },
  { value: 'xlarge', label: 'Extra large', scale: 1.3, sample: 'More room for every word' },
];

export function isCompanyConfigured(company: CompanyData): boolean {
  return !!company.name.trim() && (company.isConfiguredByMerchant === true || company.name.trim() !== 'CODE76 ENTERPRISE SOLUTIONS');
}

export function blankMerchantCompany(currency = 'USD'): CompanyData {
  return {
    name: '', slogan: '', vision: '', logoUrl: '', coverUrl: '', regNumber: '', taxPin: '',
    email: '', tel1: '', tel2: '', whatsapp: '', address: '', location: '', country: '',
    currency, operatingHours: '', isConfiguredByMerchant: false,
  };
}

export function readSetupProgress(storage?: Pick<Storage, 'getItem'>): SetupProgress | null {
  try {
    const raw = (storage ?? globalThis.localStorage)?.getItem(SETUP_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (value.version !== 2 || !SETUP_STAGES.includes(value.stage) || !['in_progress', 'deferred', 'complete'].includes(value.status)) return null;
    return {
      ...value,
      addedProductIds: Array.isArray(value.addedProductIds) ? value.addedProductIds.filter((id: unknown) => typeof id === 'string').slice(0, 3) : [],
      draftCompany: value.draftCompany && typeof value.draftCompany.name === 'string' ? value.draftCompany : undefined,
    };
  } catch {
    return null;
  }
}

export function writeSetupProgress(progress: SetupProgress, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    const store = storage ?? globalThis.localStorage;
    if (!store) return false;
    store.setItem(SETUP_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export interface StarterProductDraft {
  name: string;
  category: string;
  type: 'product' | 'service';
  serviceUnit?: ServiceBillingUnit;
  sellingPrice: string;
  costPrice: string;
  stock: string;
  barcode: string;
}

export const emptyStarterProduct = (): StarterProductDraft => ({
  name: '', category: '', type: 'product', serviceUnit: DEFAULT_SERVICE_UNIT, sellingPrice: '', costPrice: '', stock: '', barcode: '',
});

export function makeStarterProduct(draft: StarterProductDraft): ProductItem {
  if (!draft.name.trim()) throw new Error('Enter a product or service name.');
  if (!draft.sellingPrice.trim()) throw new Error('Enter a selling price.');
  const price = Number(draft.sellingPrice);
  const cost = draft.type === 'service' ? 0 : Number(draft.costPrice || 0);
  const stock = draft.type === 'service' ? 0 : Number(draft.stock || 0);
  if (![price, cost, stock].every(Number.isFinite) || price < 0 || cost < 0 || stock < 0 || !Number.isSafeInteger(stock)) {
    throw new Error('Prices must be non-negative numbers. Stock must be a whole number of zero or more.');
  }
  if (![price, cost].every(value => Number.isSafeInteger(Math.round(value * 100)))) throw new Error('Enter a price within the supported currency range.');
  if (draft.type === 'service' && draft.serviceUnit && !parseServiceUnit(draft.serviceUnit)) throw new Error('Select a supported service billing unit.');
  const token = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    id: `ITEM-${new Date().getFullYear()}-${token}`,
    sku: `SKU-${token.slice(0, 8).toUpperCase()}`,
    barcode: draft.barcode.trim(),
    name: draft.name.trim(), category: draft.category.trim() || 'General', type: draft.type,
    serviceUnit: draft.type === 'service' ? parseServiceUnit(draft.serviceUnit) || DEFAULT_SERVICE_UNIT : undefined,
    costPrice: Math.round(cost * 100) / 100,
    sellingPrice: Math.round(price * 100) / 100,
    stock, minStockAlert: draft.type === 'service' ? 0 : 3,
    description: draft.type === 'service' ? 'Contact us to arrange this service.' : '',
    imageUrl: '', isFeatured: true, createdAt: new Date().toISOString(),
  };
}
