import type { ProductItem, ServiceBillingUnit } from '../types/index.ts';

export const SERVICE_UNITS: readonly { value: ServiceBillingUnit; label: string; singular: string; plural: string }[] = [
  { value: 'task', label: 'Per task completion', singular: 'task completion', plural: 'task completions' },
  { value: 'minute', label: 'Per minute', singular: 'minute', plural: 'minutes' },
  { value: 'hour', label: 'Per hour', singular: 'hour', plural: 'hours' },
  { value: 'day', label: 'Per day', singular: 'day', plural: 'days' },
  { value: 'week', label: 'Per week', singular: 'week', plural: 'weeks' },
  { value: 'month', label: 'Per month', singular: 'month', plural: 'months' },
  { value: 'year', label: 'Per year', singular: 'year', plural: 'years' },
  { value: 'session', label: 'Per session', singular: 'session', plural: 'sessions' },
  { value: 'visit', label: 'Per visit', singular: 'visit', plural: 'visits' },
  { value: 'project', label: 'Per project', singular: 'project', plural: 'projects' },
];
export const DEFAULT_SERVICE_UNIT: ServiceBillingUnit = 'task';

export function parseServiceUnit(value?: string): ServiceBillingUnit | undefined {
  if (!value?.trim()) return undefined;
  const normalized = value.trim().toLowerCase().replace(/^per\s+/, '').replace(/\s+/g, ' ');
  const found = SERVICE_UNITS.find(unit => [unit.value, unit.singular, unit.plural, unit.label.toLowerCase()].includes(normalized));
  return found?.value;
}
export function serviceUnitLabel(item: Pick<ProductItem, 'type' | 'serviceUnit'>): string {
  if (item.type !== 'service') return 'Units';
  return (SERVICE_UNITS.find(unit => unit.value === item.serviceUnit) || SERVICE_UNITS[0]).label;
}
export function quantityWithUnit(quantity: number, item: Pick<ProductItem, 'type' | 'serviceUnit'>): string {
  if (item.type !== 'service') return `${quantity} ${quantity === 1 ? 'unit' : 'units'}`;
  const unit = SERVICE_UNITS.find(unit => unit.value === item.serviceUnit) || SERVICE_UNITS[0];
  return `${quantity} ${quantity === 1 ? unit.singular : unit.plural}`;
}
