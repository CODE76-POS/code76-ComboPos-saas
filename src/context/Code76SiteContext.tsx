import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LandingMetrics, PersonRecord } from '../types/index.ts';
import { CODE76_SITE_STORAGE_KEY } from '../config/code76Site.ts';

const ZERO_METRICS: LandingMetrics = { visitors: 0, avgTimeOnPageSeconds: 0, chatbotConversations: 0, leadsCaptured: 0, referralVisits: 0, totalLandingSales: 0 };
type SiteLead = Omit<PersonRecord, 'id' | 'createdAt'> & { id: string; createdAt: string };
interface SiteState {
  metrics: LandingMetrics;
  leads: SiteLead[];
  events: { action: string; details: string; timestamp: string }[];
}
interface SiteContextValue extends SiteState {
  setMetrics: React.Dispatch<React.SetStateAction<LandingMetrics>>;
  addSiteLead: (lead: Omit<PersonRecord, 'id' | 'createdAt'>) => void;
  logSiteEvent: (action: string, details: string) => void;
}
const SiteContext = createContext<SiteContextValue | null>(null);

/** Separate browser-local product-site data. Never writes to the merchant CRM or metrics. */
export function Code76SiteProvider({ children }: { children: React.ReactNode }) {
  const [saved] = useState<Partial<SiteState>>(() => {
    try { const value = JSON.parse(localStorage.getItem(CODE76_SITE_STORAGE_KEY) || '{}'); return value && typeof value === 'object' ? value : {}; } catch { return {}; }
  });
  const [metrics, setMetrics] = useState<LandingMetrics>({ ...ZERO_METRICS, ...saved.metrics });
  const [leads, setLeads] = useState<SiteLead[]>(Array.isArray(saved.leads) ? saved.leads : []);
  const [events, setEvents] = useState<SiteState['events']>(Array.isArray(saved.events) ? saved.events : []);
  useEffect(() => {
    try { localStorage.setItem(CODE76_SITE_STORAGE_KEY, JSON.stringify({ metrics, leads, events })); }
    catch { console.warn('Unable to save CODE76 product-site data'); }
  }, [metrics, leads, events]);

  const addSiteLead: SiteContextValue['addSiteLead'] = lead => {
    setLeads(previous => [{ ...lead, id: `site-lead-${crypto.randomUUID()}`, createdAt: new Date().toISOString() }, ...previous]);
  };
  const logSiteEvent: SiteContextValue['logSiteEvent'] = (action, details) => {
    setEvents(previous => [{ action, details, timestamp: new Date().toISOString() }, ...previous].slice(0, 200));
  };
  return <SiteContext.Provider value={{ metrics, leads, events, setMetrics, addSiteLead, logSiteEvent }}>{children}</SiteContext.Provider>;
}

export function useCode76Site(): SiteContextValue {
  const context = useContext(SiteContext);
  if (!context) throw new Error('CODE76 site content must be inside Code76SiteProvider');
  return context;
}
