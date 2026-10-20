import { SERVICE_UNITS, serviceUnitLabel } from '../../utils/serviceUnits.ts';
import React, { useEffect, useRef, useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { ArrowLeft, ArrowRight, Building, Check, CheckCircle2, HelpCircle, Info, Moon, Package, Palette, Plus, Settings, ShoppingBag, Store, Sun, Type, X } from 'lucide-react';
import type { CompanyData, PlatformId, SettingsSection } from '../../types/index.ts';
import { blankMerchantCompany, emptyStarterProduct, isCompanyConfigured, makeStarterProduct, readSetupProgress, SETUP_STAGES, TEXT_SIZE_OPTIONS, writeSetupProgress } from '../../utils/onboarding.ts';
import type { SetupProgress, SetupStage, StarterProductDraft } from '../../utils/onboarding.ts';

const STAGE_LABELS = ['Your workspace', 'My Company', 'First inventory', 'Find your way'];

export const CompanyQAOnboardingModal: React.FC = () => {
  const {
    company, setCompany, products, addProduct, settings, setSettings, theme,
    companyQAModalOpen, setCompanyQAModalOpen, setHasDismissedCompanyQA,
    setActivePlatform, setActiveView, setSettingsSection, setHoverHelpPlatform,
    logAuditAction, currentUser, activeView, hasPrivilege,
  } = usePOS();
  const canEditInventory = hasPrivilege('canEditInventory');
  const canConfigureCompany = hasPrivilege('canModifySettings') || hasPrivilege('canManagePeople');
  const canOpenSettings = hasPrivilege('canModifySettings');
  const [stage, setStage] = useState<SetupStage>('appearance');
  const [companyDraft, setCompanyDraft] = useState<CompanyData>(() => blankMerchantCompany());
  const [itemDraft, setItemDraft] = useState<StarterProductDraft>(emptyStarterProduct);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [itemError, setItemError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const visible = companyQAModalOpen && activeView === 'pos' && !!currentUser;
  const stageIndex = SETUP_STAGES.indexOf(stage);
  const addedItems = products.filter(product => addedIds.includes(product.id));

  useEffect(() => {
    if (!visible) return;
    const saved = readSetupProgress();
    const continuing = saved && saved.status !== 'complete';
    setStage(continuing ? saved.stage : 'appearance');
    setAddedIds(continuing ? saved.addedProductIds : []);
    setCompanyDraft(continuing && saved.draftCompany ? saved.draftCompany
      : isCompanyConfigured(company) ? { ...company }
      : blankMerchantCompany(settings.payments.defaultCurrency || company.currency || 'USD'));
    setItemDraft(emptyStarterProduct());
    setNotice('');
    setItemError('');
    previousFocus.current = document.activeElement as HTMLElement;
    const siblings = [...(dialogRef.current?.parentElement?.parentElement?.children || [])].filter(element => !element.contains(dialogRef.current));
    const inertState = siblings.map(element => [element as HTMLElement, (element as HTMLElement).inert] as const);
    inertState.forEach(([element]) => { element.inert = true; });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      inertState.forEach(([element, wasInert]) => { element.inert = wasInert; });
      previousFocus.current?.focus?.();
    };
    // Initialization happens on opening, not after every saved field update.
  }, [visible]);

  useEffect(() => {
    if (visible) dialogRef.current?.querySelector<HTMLElement>('[data-setup-heading]')?.focus();
  }, [visible, stage]);

  const persist = (nextStage: SetupStage, status: SetupProgress['status'] = 'in_progress', ids = addedIds, draft = companyDraft) => {
    const saved = writeSetupProgress({ version: 2, stage: nextStage, status, addedProductIds: ids, draftCompany: draft });
    if (!saved) setNotice('Your browser could not save setup progress. Keep this tab open until you finish.');
  };
  const goTo = (nextStage: SetupStage, draft = companyDraft) => {
    persist(nextStage, 'in_progress', addedIds, draft);
    setStage(nextStage);
    setItemError('');
  };
  const dismiss = (complete = false) => {
    persist(stage, complete ? 'complete' : 'deferred');
    try { localStorage.setItem('code76_company_qa_dismissed', 'true'); } catch { /* The current session can still proceed. */ }
    setHasDismissedCompanyQA(true);
    setCompanyQAModalOpen(false);
    if (complete) logAuditAction('Completed Guided Setup', `POS preferences reviewed; ${addedItems.length} starter inventory items added.`);
  };
  const openPlatform = (platform: PlatformId, section?: SettingsSection) => {
    if ((platform === 'settings' && !canOpenSettings) || (platform === 'inventory' && !hasPrivilege('canViewInventory'))) { setNotice('Please ask your company administrator for access to this platform.'); return; }
    dismiss(true);
    if (section) setSettingsSection(section);
    setActivePlatform(platform);
    setActiveView('pos');
  };
  const setCompanyField = (key: keyof CompanyData, value: string) => setCompanyDraft(previous => ({ ...previous, [key]: value }));
  const setItemField = (key: keyof StarterProductDraft, value: string) => setItemDraft(previous => ({ ...previous, [key]: value }));

  const saveCompany = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canConfigureCompany || !companyDraft.name.trim()) return;
    const savedCompany = { ...companyDraft, name: companyDraft.name.trim(), isConfiguredByMerchant: true };
    setCompany(savedCompany);
    if (savedCompany.currency.trim()) setSettings(previous => ({ ...previous, payments: { ...previous.payments, defaultCurrency: savedCompany.currency.trim() } }));
    setCompanyDraft(savedCompany);
    logAuditAction('Configured Company via Guided Setup', `Saved company profile for ${savedCompany.name}.`);
    setNotice('Company profile saved. Now add your first items, or choose to do it later.');
    goTo('inventory', savedCompany);
  };
  const saveItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEditInventory || addedItems.length >= 3) return;
    try {
      const item = makeStarterProduct(itemDraft);
      addProduct(item);
      const nextIds = [...addedItems.map(product => product.id), item.id];
      setAddedIds(nextIds);
      persist('inventory', 'in_progress', nextIds);
      setItemDraft(emptyStarterProduct());
      setItemError('');
      setNotice(`${item.name} saved to Inventory. ${nextIds.length} of 3 starter items added.`);
      requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLInputElement>('#setup-item-name')?.focus());
    } catch (error) {
      setItemError(error instanceof Error ? error.message : 'Please check the item details.');
    }
  };
  const onDialogKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); dismiss(); }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const controls = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]')]
      .filter(element => element.getClientRects().length > 0);
    const first = controls[0], last = controls[controls.length - 1];
    if (!first) return;
    if (event.shiftKey && (document.activeElement === first || document.activeElement?.hasAttribute('data-setup-heading'))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  };

  if (!visible) return null;

  return (
    <div className="setup-backdrop">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="setup-heading" aria-describedby="setup-description" className="setup-dialog" onKeyDown={onDialogKeyDown}>
        <header className="setup-header">
          <div className="setup-brand-mark"><span>76</span></div>
          <div className="setup-header-copy"><span className="setup-eyebrow">A good start, your way</span><p>CODE76 workspace setup</p></div>
          <button type="button" className="setup-icon-button" onClick={() => dismiss()} aria-label="Save progress and close setup" title="Continue later from My Company"><X size={20} /></button>
        </header>
        <ol className="setup-progress" aria-label="Setup progress">
          {STAGE_LABELS.map((label, index) => (
            <li key={label} aria-current={index === stageIndex ? 'step' : undefined} className={index === stageIndex ? 'is-current' : index < stageIndex ? 'is-done' : ''}>
              <span>{index < stageIndex ? <Check size={13} aria-hidden="true" /> : index + 1}</span><small>{label}</small>
            </li>
          ))}
        </ol>

        <div className="setup-content">
          <div className="setup-section-heading">
            <span className="setup-eyebrow">Step {stageIndex + 1} of 4 · {STAGE_LABELS[stageIndex]}</span>
            <h2 id="setup-heading" data-setup-heading tabIndex={-1}>
              {stage === 'appearance' ? 'Make yourself comfortable.' : stage === 'company' ? 'Introduce your business.' : stage === 'inventory' ? 'Your first sale starts here.' : 'You’re ready. Here’s your map.'}
            </h2>
            <p id="setup-description">
              {stage === 'appearance' ? 'Choose a look and text size that feel right. These preferences apply to your POS workspace—not the CODE76 website or your Business Landing Page.'
                : stage === 'company' ? 'Your details personalize receipts, invoices and your own Business Landing Page. They never replace the CODE76 main site.'
                : stage === 'inventory' ? 'Add up to three products or services now. One is a great start; all of this can also be done later in Inventory.'
                : 'Keep these icons in mind. Settings, platform guidance and the full manual are always available in the navigation.'}
            </p>
          </div>

          {notice && <p className="setup-status" role="status"><CheckCircle2 size={16} aria-hidden="true" />{notice}</p>}

          {stage === 'appearance' && (
            <>
              <fieldset className="setup-fieldset">
                <legend><Palette size={16} aria-hidden="true" /> Pick your theme</legend>
                <div className="setup-theme-grid">
                  {(['light', 'dark'] as const).map(mode => (
                    <button key={mode} type="button" aria-pressed={theme === mode} className={`setup-theme-choice ${theme === mode ? 'is-selected' : ''}`} onClick={() => setSettings(previous => ({ ...previous, appearance: { ...previous.appearance, theme: mode } }))}>
                      <div className={`setup-theme-example example-${mode}`} data-preserve-theme="true" aria-hidden="true">
                        <div className="example-nav"><i /><i /><i /></div>
                        <div className="example-body"><div className="example-sidebar"><i /><i /><i /></div><div className="example-main"><span className="example-title">Sales overview</span><strong>12,450.00</strong><div className="example-chart"><i /><i /><i /><i /><i /><i /></div><div className="example-row"><i /><i /></div></div></div>
                      </div>
                      <span className="setup-theme-caption">{mode === 'light' ? <Sun size={18} /> : <Moon size={18} />}<span><strong>{mode === 'light' ? 'Light' : 'Dark'}</strong><small>{mode === 'light' ? 'Bright surfaces, clear contrast' : 'Softer on the eyes after hours'}</small></span><span className="setup-choice-check">{theme === mode && <Check size={14} />}</span></span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="setup-fieldset">
                <legend><Type size={16} aria-hidden="true" /> Choose a text size</legend>
                <div className="setup-size-grid">
                  {TEXT_SIZE_OPTIONS.map(option => (
                    <button key={option.value} type="button" className={`setup-size-choice ${settings.textSizing === option.value ? 'is-selected' : ''}`} aria-pressed={settings.textSizing === option.value} onClick={() => setSettings(previous => ({ ...previous, textSizing: option.value }))}>
                      <span style={{ fontSize: `${18 * option.scale}px` }}>Aa</span><strong>{option.label}</strong><small>{option.sample}</small>
                    </button>
                  ))}
                </div>
                <div className="setup-live-sample" style={{ fontSize: `${14 * (TEXT_SIZE_OPTIONS.find(option => option.value === settings.textSizing)?.scale || 1)}px` }}><Package size={18} aria-hidden="true" /><span><strong>Every detail, easy to read.</strong><br />Your products, sales and totals will use this text size.</span></div>
              </fieldset>
            </>
          )}

          {stage === 'company' && (
            <form id="setup-company-form" onSubmit={saveCompany}>
              {!canConfigureCompany && <p className="setup-warning">Your role cannot configure the company profile. Ask an owner or permitted administrator, or choose Company details later.</p>}
              <fieldset disabled={!canConfigureCompany} className="setup-fieldset">
              <div className="setup-field-grid">
                <label className="setup-field setup-full" htmlFor="setup-company-name">Business / company name <span>Required</span><input id="setup-company-name" required maxLength={140} autoComplete="organization" placeholder="e.g. Acacia Market" value={companyDraft.name} onChange={event => setCompanyField('name', event.target.value)} /></label>
                <label className="setup-field setup-full" htmlFor="setup-company-slogan">Slogan or customer promise<input id="setup-company-slogan" maxLength={200} placeholder="e.g. Good things, close to home" value={companyDraft.slogan} onChange={event => setCompanyField('slogan', event.target.value)} /></label>
                <label className="setup-field" htmlFor="setup-company-phone">Primary phone<input id="setup-company-phone" type="tel" autoComplete="tel" placeholder="e.g. +254 700 000 000" value={companyDraft.tel1} onChange={event => setCompanyField('tel1', event.target.value)} /></label>
                <label className="setup-field" htmlFor="setup-company-email">Business email<input id="setup-company-email" type="email" autoComplete="email" placeholder="e.g. hello@yourbusiness.com" value={companyDraft.email} onChange={event => setCompanyField('email', event.target.value)} /></label>
                <label className="setup-field setup-full" htmlFor="setup-company-address">Street address / building<input id="setup-company-address" autoComplete="street-address" placeholder="Your shop, office or trading location" value={companyDraft.address} onChange={event => setCompanyField('address', event.target.value)} /></label>
                <label className="setup-field" htmlFor="setup-company-city">City / region<input id="setup-company-city" autoComplete="address-level2" placeholder="e.g. Nairobi" value={companyDraft.location} onChange={event => setCompanyField('location', event.target.value)} /></label>
                <label className="setup-field" htmlFor="setup-company-country">Country<input id="setup-company-country" autoComplete="country-name" placeholder="e.g. Kenya" value={companyDraft.country} onChange={event => setCompanyField('country', event.target.value)} /></label>
              </div>
              <details className="setup-more"><summary>More company details <span>Optional</span></summary><div className="setup-field-grid">
                <label className="setup-field" htmlFor="setup-company-whatsapp">WhatsApp number<input id="setup-company-whatsapp" type="tel" value={companyDraft.whatsapp} onChange={event => setCompanyField('whatsapp', event.target.value)} /></label>
                <label className="setup-field" htmlFor="setup-company-currency">Currency code or symbol<input id="setup-company-currency" placeholder="e.g. KES, USD or KSh" value={companyDraft.currency} onChange={event => setCompanyField('currency', event.target.value)} /></label>
                <label className="setup-field" htmlFor="setup-company-tax">Tax PIN / VAT number<input id="setup-company-tax" value={companyDraft.taxPin} onChange={event => setCompanyField('taxPin', event.target.value)} /></label>
                <label className="setup-field" htmlFor="setup-company-registration">Business registration number<input id="setup-company-registration" value={companyDraft.regNumber} onChange={event => setCompanyField('regNumber', event.target.value)} /></label>
                <label className="setup-field setup-full" htmlFor="setup-company-hours">Operating hours<input id="setup-company-hours" placeholder="e.g. Monday–Saturday, 8 am–6 pm" value={companyDraft.operatingHours} onChange={event => setCompanyField('operatingHours', event.target.value)} /></label>
                <label className="setup-field setup-full" htmlFor="setup-company-vision">Mission / vision<textarea id="setup-company-vision" rows={2} value={companyDraft.vision} onChange={event => setCompanyField('vision', event.target.value)} /></label>
              </div></details>
              </fieldset>
            </form>
          )}

          {stage === 'inventory' && (
            <>
              <div className="setup-inventory-summary"><div className="setup-round-icon"><Package size={22} /></div><div><strong>{addedItems.length} / 3 starter items added</strong><p>{products.length ? `${products.length} total items in your Inventory.` : 'Your inventory is empty. Let’s give it a first item.'}</p></div><span className="setup-inventory-count">{addedItems.length}/3</span></div>
              {addedItems.length > 0 && <ul className="setup-saved-items" aria-label="Items saved during setup">{addedItems.map(product => <li key={product.id}><CheckCircle2 size={16} /><span><strong>{product.name}</strong><small>{product.type === 'service' ? serviceUnitLabel(product) : `${product.stock} in stock`} · {company.currency} {product.sellingPrice.toFixed(2)}</small></span></li>)}</ul>}
              {!canEditInventory ? <p className="setup-warning">Your role cannot add inventory items. Ask your owner or inventory manager to add them, or skip this step for now.</p> : addedItems.length < 3 ? <form onSubmit={saveItem}>
                <div className="setup-item-form-heading"><Plus size={16} /><strong>Add item {addedItems.length + 1}</strong><span>Saved directly to Inventory</span></div>
                <div className="setup-field-grid">
                  <label className="setup-field setup-full" htmlFor="setup-item-name">Product or service name <span>Required</span><input id="setup-item-name" required maxLength={160} placeholder="e.g. House blend coffee, 250 g" value={itemDraft.name} onChange={event => setItemField('name', event.target.value)} /></label>
                  <label className="setup-field" htmlFor="setup-item-type">Item type<select id="setup-item-type" value={itemDraft.type} onChange={event => setItemField('type', event.target.value)}><option value="product">Product — track stock</option><option value="service">Service — no stock tracking</option></select></label>
                  <label className="setup-field" htmlFor="setup-item-category">Category<input id="setup-item-category" placeholder="e.g. Groceries or Consulting" value={itemDraft.category} onChange={event => setItemField('category', event.target.value)} /></label>
                  <label className="setup-field" htmlFor="setup-item-price">Selling price <span>{company.currency || companyDraft.currency}</span><input id="setup-item-price" type="number" min="0" step="0.01" required inputMode="decimal" placeholder="0.00" value={itemDraft.sellingPrice} onChange={event => setItemField('sellingPrice', event.target.value)} /></label>
                  {itemDraft.type === 'service' && <label className="setup-field setup-full" htmlFor="setup-service-unit">Service quantity / billing unit<select id="setup-service-unit" value={itemDraft.serviceUnit || 'task'} onChange={event => setItemField('serviceUnit', event.target.value)}>{SERVICE_UNITS.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select><small>Selling price is for one selected billing unit. Services have no stock count.</small></label>}
                  {itemDraft.type === 'product' && <><label className="setup-field" htmlFor="setup-item-cost">Cost / buying price<input id="setup-item-cost" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={itemDraft.costPrice} onChange={event => setItemField('costPrice', event.target.value)} /></label><label className="setup-field" htmlFor="setup-item-stock">Opening stock<input id="setup-item-stock" type="number" min="0" step="1" inputMode="numeric" placeholder="0" value={itemDraft.stock} onChange={event => setItemField('stock', event.target.value)} /></label><label className="setup-field" htmlFor="setup-item-barcode">Barcode <span>Optional</span><input id="setup-item-barcode" placeholder="Scan or enter an existing barcode" value={itemDraft.barcode} onChange={event => setItemField('barcode', event.target.value)} /></label></>}
                </div>
                {itemDraft.type === 'product' && Number(itemDraft.costPrice) > Number(itemDraft.sellingPrice) && itemDraft.sellingPrice !== '' && <p className="setup-warning">This selling price is below your buying price. Review the margin before saving.</p>}
                {itemError && <p className="setup-warning" role="alert">{itemError}</p>}
                <button type="submit" className="setup-button-secondary setup-add-item"><Plus size={16} />Save item to Inventory</button>
              </form> : <div className="setup-complete-items"><CheckCircle2 size={28} /><strong>Three items. A great start.</strong><p>You can keep growing your catalog in the Inventory platform.</p></div>}
            </>
          )}

          {stage === 'tour' && (
            <>
              <div className="setup-tour-grid">
                <button type="button" aria-label="Open Inventory" className="setup-tour-card" onClick={() => openPlatform('inventory')}><Package /><strong>Inventory</strong><p>Add, edit, price and restock products or services. Your starter items are already here.</p><span>Open Inventory <ArrowRight size={13} /></span></button>
                <button type="button" aria-label="Open Settings" className="setup-tour-card" disabled={!canOpenSettings} title={!canOpenSettings ? 'Requires settings permission' : undefined} onClick={() => openPlatform('settings', 'appearance')}><Settings /><strong>Settings</strong><p>Look for the gear. Change payments, appearance, text size, receipts and more.</p><span>Open Settings <ArrowRight size={13} /></span></button>
                <button type="button" aria-label="Open platform guidance" className="setup-tour-card" onClick={() => { dismiss(true); setHoverHelpPlatform('selling'); }}><HelpCircle /><strong>Platform guidance</strong><p>Look for the question-mark circle beside a platform title or in the top bar.</p><span>See a help guide <ArrowRight size={13} /></span></button>
                <button type="button" aria-label="Open About & Manual" className="setup-tour-card" onClick={() => openPlatform('about')}><Info /><strong>About & Manual</strong><p>Look for the information-circle icon in navigation for the full app guide.</p><span>Read the manual <ArrowRight size={13} /></span></button>
              </div>
              <div className="setup-page-boundary"><Store size={20} /><div><strong>Your Business Landing Page is yours.</strong><p>It uses My Company, Inventory and Settings → Business Landing Page. The <strong>CODE76 main site</strong> is the separate product and sign-in website.</p></div></div>
              <div className="setup-guide-shortcuts"><button type="button" disabled={!canOpenSettings} onClick={() => openPlatform('settings', 'textSizing')}><Type size={14} />Text Sizing</button><button type="button" disabled={!canOpenSettings} onClick={() => openPlatform('settings', 'landingPage')}><Store size={14} />Business page settings</button><button type="button" onClick={() => openPlatform('my_company')}><Building size={14} />My Company</button></div>
            </>
          )}
        </div>
        <footer className="setup-footer">
          {stage === 'appearance' && <><div className="setup-actions"><button type="button" className="setup-button-secondary" onClick={() => dismiss()}>Skip setup for now</button><button type="button" className="setup-button-primary" onClick={() => goTo('company')}>Continue to My Company <ArrowRight size={16} /></button></div><p className="setup-footnote"><Settings size={13} />Change this any time in Settings → App Appearance Settings or Text Sizing.</p></>}
          {stage === 'company' && <><div className="setup-actions"><button type="button" className="setup-button-secondary" onClick={() => goTo('appearance')}><ArrowLeft size={15} />Back</button><div className="setup-action-pair"><button type="button" className="setup-text-button" onClick={() => goTo('inventory')}>Company details later</button><button type="submit" form="setup-company-form" disabled={!canConfigureCompany} className="setup-button-primary">Save company & continue <ArrowRight size={16} /></button></div></div><p className="setup-footnote"><Building size={13} />You can add logos, photos and more details later in My Company.</p></>}
          {stage === 'inventory' && <><div className="setup-actions"><button type="button" className="setup-button-secondary" onClick={() => goTo('company')}><ArrowLeft size={15} />Back</button><div className="setup-action-pair"><button type="button" className="setup-text-button" onClick={() => goTo('tour')}>Skip inventory for now</button><button type="button" className="setup-button-primary" onClick={() => goTo('tour')}>Continue to quick tour <ArrowRight size={16} /></button></div></div><p className="setup-footnote"><Info size={13} />Only items saved above are added. You can finish after one or two, or skip all three.</p></>}
          {stage === 'tour' && <><div className="setup-actions"><button type="button" className="setup-button-secondary" onClick={() => goTo('inventory')}><ArrowLeft size={15} />Back</button><button type="button" className="setup-button-primary" onClick={() => openPlatform('selling')}><ShoppingBag size={16} />Done, start selling</button></div><p className="setup-footnote"><CheckCircle2 size={13} />Saved preferences, company details and inventory items stay in this browser. You can reopen this assistant from My Company.</p></>}
        </footer>
      </div>
    </div>
  );
};
