import type { AppSettings } from '../types/index.ts';
import { BUSINESS_PAGE_DEFAULTS, LEGACY_CODE76_PAGE_DEFAULTS } from '../config/businessPage.ts';

/** Retains custom merchant settings. Replaces only unchanged legacy CODE76 seed copy, once. */
export function migrateBusinessPageSettings(saved?: Partial<AppSettings['landingPage']>): AppSettings['landingPage'] {
  const merged = { ...BUSINESS_PAGE_DEFAULTS, ...saved };
  if (saved?.contentVersion !== 2) {
    for (const [key, legacyValue] of Object.entries(LEGACY_CODE76_PAGE_DEFAULTS)) {
      const field = key as keyof AppSettings['landingPage'];
      if (merged[field] === legacyValue) (merged as Record<string, unknown>)[key] = BUSINESS_PAGE_DEFAULTS[field];
    }
  }
  return { ...merged, contentVersion: 2 };
}

export function mergeAppSettings(defaults: AppSettings, saved?: Partial<AppSettings>): AppSettings {
  return {
    ...defaults, ...saved,
    payments: { ...defaults.payments, ...saved?.payments },
    appearance: { ...defaults.appearance, ...saved?.appearance },
    font: { ...defaults.font, ...saved?.font },
    receipts: { ...defaults.receipts, ...saved?.receipts },
    privileges: { ...defaults.privileges, ...saved?.privileges },
    landingPage: migrateBusinessPageSettings(saved?.landingPage),
  };
}
