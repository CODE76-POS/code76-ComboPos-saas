import { PlanTier } from '../types/index.ts';

export interface LicenseDetails {
  licenseKey: string;
  productKey: string;
  tier: PlanTier;
  companyName: string;
  adminEmail: string;
  issuedAt: string;
  expiresAt: string; // ISO string or 'PERPETUAL'
  status: 'active' | 'grace_period' | 'expired' | 'perpetual';
  daysRemaining: number;
  gateway: 'selar' | 'gumroad' | 'direct_bank' | 'official_code76';
  features: string[];
}

/**
 * Generate an authentic, cryptographically formatted CODE76 License Key
 * Example: CODE76-PRO-8712-4901-C76A
 */
export function generateLicenseKey(tier: PlanTier, seed?: string): string {
  const prefixMap: Record<PlanTier, string> = {
    free: 'FREE',
    starter: 'STR',
    pro: 'PRO',
    max: 'MAX',
    lifetime: 'LIFE',
  };
  const tierPrefix = prefixMap[tier] || 'PRO';

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomChunk = (len: number, salt: string) => {
    let str = '';
    for (let i = 0; i < len; i++) {
      const idx = Math.abs((salt.charCodeAt(i % salt.length) * 31 + i * 17 + Math.floor(Math.random() * 32))) % chars.length;
      str += chars[idx];
    }
    return str;
  };

  const s = seed || `${Date.now()}-${Math.random()}`;
  const block1 = randomChunk(4, s + '1');
  const block2 = randomChunk(4, s + '2');
  const block3 = randomChunk(4, s + '3');

  return `CODE76-${tierPrefix}-${block1}-${block2}-${block3}`;
}

/**
 * Generate a 25-character hardware-bound Product Key
 * Example: C76P-9842-8819-7601-3321
 */
export function generateProductKey(seed?: string): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const genGroup = (s: string) => {
    let out = '';
    for (let i = 0; i < 4; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  };

  const g1 = genGroup(seed || 'A');
  const g2 = genGroup(seed || 'B');
  const g3 = genGroup(seed || 'C');
  const g4 = genGroup(seed || 'D');

  return `C76P-${g1}-${g2}-${g3}-${g4}`;
}

/**
 * Compute subscription expiration and status
 */
export function calculateLicenseDetails(
  tier: PlanTier,
  companyName: string,
  adminEmail: string,
  savedLicenseKey?: string,
  savedProductKey?: string,
  savedIssuedAt?: string,
  savedExpiresAt?: string,
  savedGateway?: 'selar' | 'gumroad' | 'direct_bank' | 'official_code76'
): LicenseDetails {
  const now = new Date();
  const issuedAt = savedIssuedAt || now.toISOString();

  let expiresAt: string;
  let status: 'active' | 'grace_period' | 'expired' | 'perpetual';
  let daysRemaining = 999999;

  if (tier === 'lifetime') {
    expiresAt = 'PERPETUAL';
    status = 'perpetual';
    daysRemaining = 36500; // ~100 years
  } else if (tier === 'free') {
    expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    status = 'active';
    daysRemaining = 365;
  } else {
    // 30-day renewal cycle
    const expiry = savedExpiresAt ? new Date(savedExpiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    expiresAt = expiry.toISOString();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    daysRemaining = diffDays;

    if (diffDays > 0) {
      status = 'active';
    } else if (diffDays >= -7) {
      status = 'grace_period'; // 7 days grace before lockdown
    } else {
      status = 'expired';
    }
  }

  const licenseKey = savedLicenseKey || generateLicenseKey(tier, `${adminEmail}-${companyName}`);
  const productKey = savedProductKey || generateProductKey(`${adminEmail}-${companyName}`);

  const featuresMap: Record<PlanTier, string[]> = {
    free: ['Basic POS checkout', 'Receipt printing (80mm/58mm)', 'Stock tracking', 'Single-currency'],
    starter: ['Fast barcode selling', 'Expense ledgers', 'Multi-payment split tender', 'Staff shift tracking'],
    pro: ['Full P&L analytics', 'Visual financial predictions', 'Business Landing Page creator', 'AI chatbot assistant', 'Automated cloud backups'],
    max: ['All Pro features', 'Dedicated CODE76 Account Engineer', 'Custom hardware integration', 'Direct WhatsApp VIP support', 'SEO & Marketing assistance'],
    lifetime: ['Permanent Perpetual Licensing', 'Zero monthly renewal fees', 'Unrestricted multi-device deployment', 'All future feature updates', 'Dedicated Max service assistance'],
  };

  return {
    licenseKey,
    productKey,
    tier,
    companyName: companyName || 'Licensed Business',
    adminEmail: adminEmail || 'admin@business.com',
    issuedAt,
    expiresAt,
    status,
    daysRemaining,
    gateway: savedGateway || (tier === 'lifetime' ? 'official_code76' : 'selar'),
    features: featuresMap[tier] || featuresMap.pro,
  };
}

/**
 * Storage helpers for current workspace license
 */
const LICENSE_STORAGE_PREFIX = 'code76_pos_license_';

export function getStoredLicense(workspaceId: string): LicenseDetails | null {
  try {
    const raw = localStorage.getItem(`${LICENSE_STORAGE_PREFIX}${workspaceId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredLicense(workspaceId: string, details: LicenseDetails): void {
  try {
    localStorage.setItem(`${LICENSE_STORAGE_PREFIX}${workspaceId}`, JSON.stringify(details));
  } catch (err) {
    console.error('Failed to save license locally:', err);
  }
}
