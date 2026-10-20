import type { PaymentMethod } from '../types/index.ts';
/** Recording channels only: no live payment-provider connections are implied. */
export const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'M-Pesa', 'Airtel Money', 'T-Kash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Cheque', 'PayPal', 'Gift Card', 'Voucher', 'Crypto', 'Other', 'Credit / Debt'];
export function canonicalPaymentMethod(method: string): PaymentMethod {
  return (method === 'Card' ? 'Credit Card' : method === 'Bank Wire' ? 'Bank Transfer' : PAYMENT_METHODS.includes(method as PaymentMethod) ? method : 'Other') as PaymentMethod;
}
export function acceptedPaymentMethods(methods: string[], allowDebt: boolean): PaymentMethod[] {
  return [...new Set(methods.map(canonicalPaymentMethod))].filter(method => allowDebt || method !== 'Credit / Debt');
}
