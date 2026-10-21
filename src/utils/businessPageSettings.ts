import { PLAN_TIERS } from './plans.ts';
import { DEFAULT_CHATBOT_SETTINGS } from '../config/assistant.ts';
import { normalizePrivileges } from './privileges.ts';
import { regional } from './regional.ts';
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
    planTier: PLAN_TIERS.includes(saved?.planTier as any) ? saved!.planTier : saved ? 'pro' : 'free',
    regional: regional(saved),
    payments: { ...defaults.payments, ...saved?.payments },
    appearance: { ...defaults.appearance, ...saved?.appearance },
    font: { ...defaults.font, ...saved?.font },
    receipts: { ...defaults.receipts, ...saved?.receipts },
    // Older workspaces lack the newer RBAC controls; fill them from documented fallbacks.
    privileges: normalizePrivileges({ ...defaults.privileges, ...saved?.privileges }),
    chatbot: { ...DEFAULT_CHATBOT_SETTINGS, ...defaults.chatbot, ...saved?.chatbot },
    automatedBackups: { ...defaults.automatedBackups, ...saved?.automatedBackups } as any,
    landingPage: migrateBusinessPageSettings(saved?.landingPage),
  };
}
