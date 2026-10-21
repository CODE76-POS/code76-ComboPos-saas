import type { AppSettings, RegionalSettings } from '../types/index.ts';
export const defaultRegional = (): RegionalSettings => ({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', dateFormat: 'DD/MM/YYYY', timeFormat: '24h', holidayDates: [] });
export function validTimeZone(zone: string): boolean { try { new Intl.DateTimeFormat('en', { timeZone: zone }); return !!zone; } catch { return false; } }
export function regional(settings?: Pick<AppSettings, 'regional'>): RegionalSettings {
  const fallback = defaultRegional();
  let saved = settings?.regional;
  if (!settings && typeof localStorage !== 'undefined') { try { saved = JSON.parse(localStorage.getItem('code76_pos_state_v1') || '{}').settings?.regional; } catch {} }
  return { timeZone: saved && validTimeZone(saved.timeZone) ? saved.timeZone : fallback.timeZone,
    dateFormat: ['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD'].includes(saved?.dateFormat || '') ? saved!.dateFormat : fallback.dateFormat,
    timeFormat: saved?.timeFormat === '12h' ? '12h' : '24h',
    holidayDates: [...new Set((saved?.holidayDates || []).filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)))].sort() };
}
export function dateOnly(value: string | Date, settings?: Pick<AppSettings, 'regional'>): string {
  const config = regional(settings);
  let year: string, month: string, day: string;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) [year, month, day] = value.split('-');
  else {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return 'Invalid date';
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: config.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)!.value;
    year = get('year'); month = get('month'); day = get('day');
  }
  return config.dateFormat === 'YYYY-MM-DD' ? `${year}-${month}-${day}` : config.dateFormat === 'MM/DD/YYYY' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}
export function timeOnly(value: string | Date, settings?: Pick<AppSettings, 'regional'>): string {
  const date = value instanceof Date ? value : new Date(value); if (!Number.isFinite(date.getTime())) return 'Invalid time';
  const config = regional(settings);
  return new Intl.DateTimeFormat('en-GB', { timeZone: config.timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: config.timeFormat === '12h' ? 'h12' : 'h23' }).format(date);
}
export function dateTime(value: string | Date, settings?: Pick<AppSettings, 'regional'>): string { return `${dateOnly(value, settings)} ${timeOnly(value, settings)} (${regional(settings).timeZone})`; }

export function calendarDate(value: string | Date, settings?: Pick<AppSettings,'regional'>): string {
  return dateOnly(value,{regional:{...regional(settings),dateFormat:'YYYY-MM-DD'}});
}
