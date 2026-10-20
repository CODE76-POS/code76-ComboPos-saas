import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  AppSettings,
  AuditLog,
  AuthUser,
  CompanyData,
  CustomerReview,
  ExpenseItem,
  InvoiceItem,
  LandingMetrics,
  PersonRecord,
  PlatformId,
  ProductItem,
  SaleTransaction,
  UserRole,
  SettingsSection,
} from '../types/index.ts';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_COMPANY,
  INITIAL_COMPANY_MEMBERS,
  INITIAL_CUSTOMERS,
  INITIAL_EXPENSES,
  INITIAL_INVOICES,
  INITIAL_LANDING_METRICS,
  INITIAL_MARKETING_TEAM,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_SALES,
  INITIAL_SETTINGS,
  INITIAL_TRANSPORTERS,
  INITIAL_VENDORS,
} from '../data/initialData.ts';

import { mergeAppSettings } from '../utils/businessPageSettings.ts';
import { EMPTY_BUSINESS_METRICS } from '../config/businessPage.ts';
import { AppRoute, AppView, parseAppRoute, viewUrl } from '../utils/appRouting.ts';
import { isCompanyConfigured, readSetupProgress } from '../utils/onboarding.ts';

interface POSContextType {
  // Data
  company: CompanyData;
  setCompany: React.Dispatch<React.SetStateAction<CompanyData>>;
  products: ProductItem[];
  setProducts: React.Dispatch<React.SetStateAction<ProductItem[]>>;
  sales: SaleTransaction[];
  setSales: React.Dispatch<React.SetStateAction<SaleTransaction[]>>;
  expenses: ExpenseItem[];
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseItem[]>>;
  invoices: InvoiceItem[];
  setInvoices: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
  customers: PersonRecord[];
  setCustomers: React.Dispatch<React.SetStateAction<PersonRecord[]>>;
  vendors: PersonRecord[];
  setVendors: React.Dispatch<React.SetStateAction<PersonRecord[]>>;
  transporters: PersonRecord[];
  setTransporters: React.Dispatch<React.SetStateAction<PersonRecord[]>>;
  marketingTeam: PersonRecord[];
  setMarketingTeam: React.Dispatch<React.SetStateAction<PersonRecord[]>>;
  companyMembers: PersonRecord[];
  setCompanyMembers: React.Dispatch<React.SetStateAction<PersonRecord[]>>;
  reviews: CustomerReview[];
  setReviews: React.Dispatch<React.SetStateAction<CustomerReview[]>>;
  auditLogs: AuditLog[];
  landingMetrics: LandingMetrics;
  setLandingMetrics: React.Dispatch<React.SetStateAction<LandingMetrics>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;

  settingsSection: SettingsSection;
  setSettingsSection: (section: SettingsSection) => void;

  // App & View State
  currentUser: AuthUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  activePlatform: PlatformId;
  setActivePlatform: (p: PlatformId) => void;
  viewportMode: 'desktop' | 'laptop' | 'tablet' | 'phone';
  setViewportMode: (v: 'desktop' | 'laptop' | 'tablet' | 'phone') => void;

  // Modals & UI Actions
  demoWarningOpen: boolean;
  setDemoWarningOpen: (open: boolean) => void;
  hoverHelpPlatform: PlatformId | null;
  setHoverHelpPlatform: (p: PlatformId | null) => void;
  marketingModalItem: ProductItem | null;
  setMarketingModalItem: (item: ProductItem | null) => void;
  receiptModalSale: SaleTransaction | null;
  setReceiptModalSale: (sale: SaleTransaction | null) => void;
  reviewModalSale: SaleTransaction | null;
  setReviewModalSale: (sale: SaleTransaction | null) => void;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  companyQAModalOpen: boolean;
  setCompanyQAModalOpen: (open: boolean) => void;
  hasDismissedCompanyQA: boolean;
  setHasDismissedCompanyQA: (val: boolean) => void;

  // Actions
  loadDemoData: () => void;
  wipeDataToCleanState: () => void;
  wipeSelectedDatabases: (selectedKeys: string[]) => void;
  logAuditAction: (action: string, details: string) => void;
  hasPrivilege: (permission: keyof AppSettings['privileges'][UserRole]) => boolean;
  addSale: (sale: Omit<SaleTransaction, 'id' | 'receiptNo' | 'timestamp'>) => SaleTransaction;
  settleDebt: (saleId: string, amount: number, method: string) => void;
  addPerson: (category: PersonRecord['category'], person: Omit<PersonRecord, 'id' | 'createdAt'>) => PersonRecord;
  updatePerson: (category: PersonRecord['category'], person: PersonRecord) => void;
  deletePerson: (category: PersonRecord['category'], id: string) => void;
  addProduct: (product: Omit<ProductItem, 'id' | 'createdAt'> & { id?: string }) => void;
  updateProduct: (product: ProductItem) => void;
  deleteProduct: (id: string) => void;
  addExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  deleteExpense: (id: string) => void;
  addInvoice: (invoice: Omit<InvoiceItem, 'id'>) => void;
  updateInvoice: (invoice: InvoiceItem) => void;
  deleteInvoice: (id: string) => void;
  addReview: (review: Omit<CustomerReview, 'id' | 'date'>) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  adjustProductStock: (productId: string, newStock: number, reason: string, notes?: string) => void;
  createSalesInvoiceFromCart: (
    customerName: string,
    items: { product: ProductItem; quantity: number; unitPrice: number; total: number }[],
    subtotal: number,
    tax: number,
    total: number,
    isPaid: boolean,
    dueDate: string,
    notes?: string
  ) => InvoiceItem;
  loginUser: (email: string, pass: string, role: UserRole) => { success: boolean; message: string };
  registerUser: (fullName: string, email: string, pass: string, role: UserRole) => { success: boolean; message: string };
  logoutUser: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'code76_pos_state_v1';

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from localStorage or fallback
  const loadSaved = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved POS state', e);
    }
    return null;
  };

  const initial = loadSaved();

  const [company, setCompany] = useState<CompanyData>(initial?.company || INITIAL_COMPANY);
  // App starts in clean empty state unless demo data is loaded or user has saved items
  const [products, setProducts] = useState<ProductItem[]>(initial?.products || []);
  const [sales, setSales] = useState<SaleTransaction[]>(initial?.sales || []);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initial?.expenses || []);
  const [invoices, setInvoices] = useState<InvoiceItem[]>(initial?.invoices || []);
  const [customers, setCustomers] = useState<PersonRecord[]>(initial?.customers || []);
  const [vendors, setVendors] = useState<PersonRecord[]>(initial?.vendors || []);
  const [transporters, setTransporters] = useState<PersonRecord[]>(initial?.transporters || []);
  const [marketingTeam, setMarketingTeam] = useState<PersonRecord[]>(initial?.marketingTeam || []);
  const [companyMembers, setCompanyMembers] = useState<PersonRecord[]>(initial?.companyMembers || []);
  const [reviews, setReviews] = useState<CustomerReview[]>(initial?.reviews || []);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initial?.auditLogs || []);
  const [landingMetrics, setLandingMetrics] = useState<LandingMetrics>(initial?.landingMetrics || EMPTY_BUSINESS_METRICS);
  const [settings, setSettings] = useState<AppSettings>(() => mergeAppSettings(INITIAL_SETTINGS, initial?.settings));

  // One persisted source of truth for both Settings and the setup assistant.
  const theme = settings.appearance.theme;
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('payments');

  // Authentication stays explicit. Saved merchant data is not an authenticated session.
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // A small hash router: no hosting rewrite is needed for /#/pos/... links.
  // The base URL and normal marketing section anchors always select the public site.
  const [route, setRoute] = useState<AppRoute>(() => parseAppRoute(typeof window === 'undefined' ? '' : window.location.hash));
  const routeRef = useRef(route);
  const activeView = route.view;
  const activePlatform = route.platform;
  const navigate = useCallback((nextRoute: AppRoute) => {
    routeRef.current = nextRoute;
    setRoute(nextRoute);
    if (typeof window !== 'undefined') {
      const next = viewUrl(nextRoute.view, window.location.href, nextRoute.platform);
      if (next !== window.location.href) window.history.pushState({ route: nextRoute }, '', next);
      window.scrollTo({ top: 0 });
    }
  }, []);
  const setActiveView = useCallback((view: AppView) => {
    navigate({ view, platform: view === 'pos' ? routeRef.current.platform : 'selling' });
  }, [navigate]);
  const setActivePlatform = useCallback((platform: PlatformId) => {
    navigate({ view: 'pos', platform });
  }, [navigate]);
  useEffect(() => {
    const readRoute = () => {
      const next = parseAppRoute(window.location.hash);
      routeRef.current = next;
      setRoute(next);
    };
    window.addEventListener('popstate', readRoute);
    window.addEventListener('hashchange', readRoute);
    return () => {
      window.removeEventListener('popstate', readRoute);
      window.removeEventListener('hashchange', readRoute);
    };
  }, []);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'laptop' | 'tablet' | 'phone'>('desktop');

  // Modals
  const [demoWarningOpen, setDemoWarningOpen] = useState(false);
  const [hoverHelpPlatform, setHoverHelpPlatform] = useState<PlatformId | null>(null);
  const [marketingModalItem, setMarketingModalItem] = useState<ProductItem | null>(null);
  const [receiptModalSale, setReceiptModalSale] = useState<SaleTransaction | null>(null);
  const [reviewModalSale, setReviewModalSale] = useState<SaleTransaction | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [hasDismissedCompanyQA, setHasDismissedCompanyQA] = useState<boolean>(() => {
    try {
      return localStorage.getItem('code76_company_qa_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [companyQAModalOpen, setCompanyQAModalOpen] = useState(false);

  // Trigger company Q&A modal if company data is missing or not entered by merchant
  useEffect(() => {
    if (currentUser && activeView === 'pos' && !hasDismissedCompanyQA) {
      const needsSetup = !isCompanyConfigured(company) || readSetupProgress()?.status === 'in_progress';
      if (needsSetup) {
        const timer = setTimeout(() => {
          setCompanyQAModalOpen(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser, activeView, company.isConfiguredByMerchant, company.name, company.address, company.tel1, hasDismissedCompanyQA]);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      const stateToSave = {
        company,
        products,
        sales,
        expenses,
        invoices,
        customers,
        vendors,
        transporters,
        marketingTeam,
        companyMembers,
        reviews,
        auditLogs,
        landingMetrics,
        settings,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Unable to persist to localStorage', e);
    }
  }, [
    company,
    products,
    sales,
    expenses,
    invoices,
    customers,
    vendors,
    transporters,
    marketingTeam,
    companyMembers,
    reviews,
    auditLogs,
    landingMetrics,
    settings,
  ]);

  // Audit Logger helper
  const logAuditAction = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Unauthenticated User',
      userRole: currentUser?.roles[0] || 'Other',
      action,
      details,
      ipOrDevice: `${navigator.platform || 'Device'} (${navigator.userAgent.slice(0, 32)})`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Check RBAC privileges
  const hasPrivilege = (permission: keyof AppSettings['privileges'][UserRole]): boolean => {
    if (!currentUser) return false;
    if (currentUser.isAdmin) return true;
    const role1 = currentUser.roles[0];
    const role2 = currentUser.roles[1];

    if (permission === 'canAdjustStock') {
      const p1 = settings.privileges[role1]?.canAdjustStock ?? settings.privileges[role1]?.canEditInventory ?? false;
      const p2 = role2 ? (settings.privileges[role2]?.canAdjustStock ?? settings.privileges[role2]?.canEditInventory ?? false) : false;
      return p1 || p2;
    }

    const priv1 = settings.privileges[role1]?.[permission] ?? false;
    const priv2 = role2 ? settings.privileges[role2]?.[permission] ?? false : false;

    return priv1 || priv2;
  };

  // Load Demo Data
  const loadDemoData = () => {
    setCompany({ ...INITIAL_COMPANY, isConfiguredByMerchant: true });
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setExpenses(INITIAL_EXPENSES);
    setInvoices(INITIAL_INVOICES);
    setCustomers(INITIAL_CUSTOMERS);
    setVendors(INITIAL_VENDORS);
    setTransporters(INITIAL_TRANSPORTERS);
    setMarketingTeam(INITIAL_MARKETING_TEAM);
    setCompanyMembers(INITIAL_COMPANY_MEMBERS);
    setReviews(INITIAL_REVIEWS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setLandingMetrics(INITIAL_LANDING_METRICS);
    setSettings(INITIAL_SETTINGS);

    if (!currentUser) {
      setCurrentUser({
        id: 'user-demo-admin',
        email: 'code76pos@gmail.com',
        name: 'CODE76 Developer Admin',
        roles: ['Developer', 'Manager'],
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        isAdmin: true,
      });
    }

    logAuditAction('Loaded Demo Data', 'Populated rich system demo data across all platforms.');
    setDemoWarningOpen(false);
  };

  // Clear to blank
  const wipeDataToCleanState = () => {
    setProducts([]);
    setSales([]);
    setExpenses([]);
    setInvoices([]);
    setCustomers([]);
    setVendors([]);
    setTransporters([]);
    setMarketingTeam([]);
    setCompanyMembers([]);
    setReviews([]);
    logAuditAction('Wiped System Data', 'Reset all platforms to empty state.');
    setDemoWarningOpen(false);
  };

  // Modular Selective Platform Database Wipe
  const wipeSelectedDatabases = (selectedKeys: string[]) => {
    if (selectedKeys.includes('all')) {
      wipeDataToCleanState();
      return;
    }
    const wipedNames: string[] = [];
    if (selectedKeys.includes('products')) {
      setProducts([]);
      wipedNames.push('Inventory & Products');
    }
    if (selectedKeys.includes('sales')) {
      setSales([]);
      wipedNames.push('Sales History');
    }
    if (selectedKeys.includes('invoices')) {
      setInvoices([]);
      wipedNames.push('Invoices');
    }
    if (selectedKeys.includes('expenses')) {
      setExpenses([]);
      wipedNames.push('Expenses');
    }
    if (selectedKeys.includes('customers')) {
      setCustomers([]);
      wipedNames.push('Customers Directory');
    }
    if (selectedKeys.includes('vendors')) {
      setVendors([]);
      wipedNames.push('Vendors');
    }
    if (selectedKeys.includes('transporters')) {
      setTransporters([]);
      wipedNames.push('Transporters');
    }
    if (selectedKeys.includes('marketingTeam')) {
      setMarketingTeam([]);
      wipedNames.push('Marketing Team');
    }
    if (selectedKeys.includes('companyMembers')) {
      setCompanyMembers([]);
      wipedNames.push('Company Members');
    }
    if (selectedKeys.includes('reviews')) {
      setReviews([]);
      wipedNames.push('Customer Reviews');
    }
    if (selectedKeys.includes('auditLogs')) {
      setAuditLogs([]);
      wipedNames.push('Audit Logs');
    }
    if (selectedKeys.includes('settings')) {
      setSettings(INITIAL_SETTINGS);
      wipedNames.push('System Settings');
    }
    logAuditAction(
      'Selective Platform Wipe',
      `Selectively wiped ${wipedNames.length} databases: ${wipedNames.join(', ')}`
    );
    setDemoWarningOpen(false);
  };

  // Add Sale
  const addSale = (saleData: Omit<SaleTransaction, 'id' | 'receiptNo' | 'timestamp'>): SaleTransaction => {
    const seq = sales.length + 7601;
    const receiptNo = `REC-${seq}`;
    const newSale: SaleTransaction = {
      ...saleData,
      id: `sale-${Date.now()}`,
      receiptNo,
      timestamp: new Date().toISOString(),
    };

    setSales((prev) => [newSale, ...prev]);

    // Automated Trigger: cross-reference and deduct inventory quantities
    setProducts((prev) =>
      prev.map((prod) => {
        const cartItem = saleData.items.find((item) => item.product.id === prod.id);
        if (cartItem && prod.type === 'product') {
          const newStock = Math.max(0, prod.stock - cartItem.quantity);
          if (newStock <= prod.minStockAlert) {
            logAuditAction(
              'Low Stock Alert',
              `Product "${prod.name}" (SKU: ${prod.sku}) dropped to ${newStock} units (Threshold: ${prod.minStockAlert}) upon Sale #${receiptNo}`
            );
          }
          return { ...prod, stock: newStock };
        }
        return prod;
      })
    );

    // Update referrer stats if applicable
    if (saleData.referredBy?.id) {
      const refId = saleData.referredBy.id;
      const updateRefRecord = (list: PersonRecord[]) =>
        list.map((p) =>
          p.id === refId
            ? {
                ...p,
                referralCount: (p.referralCount || 0) + 1,
                totalReferralVolume: (p.totalReferralVolume || 0) + saleData.netTotal,
                isTopReferrer: (p.referralCount || 0) + 1 >= 5,
              }
            : p
        );

      setCustomers((prev) => updateRefRecord(prev));
      setCompanyMembers((prev) => updateRefRecord(prev));
      setMarketingTeam((prev) => updateRefRecord(prev));
    }

    // Increment landing metrics
    setLandingMetrics((prev) => ({
      ...prev,
      totalLandingSales: prev.totalLandingSales + 1,
    }));

    logAuditAction(
      'Completed Sale',
      `Receipt ${receiptNo} for ${saleData.customerName || 'Walk-in'} - Net: $${saleData.netTotal.toFixed(2)}`
    );

    return newSale;
  };

  // Settle Debt
  const settleDebt = (saleId: string, amount: number, method: string) => {
    setSales((prev) =>
      prev.map((sale) => {
        if (sale.id !== saleId) return sale;
        const newPaid = sale.amountPaid + amount;
        const remainingDebt = Math.max(0, sale.netTotal - newPaid);
        const status = remainingDebt <= 0 ? 'completed' : 'debt_partial';
        return {
          ...sale,
          amountPaid: newPaid,
          debtAmount: remainingDebt,
          status,
          debtSettledDate: remainingDebt <= 0 ? new Date().toISOString() : undefined,
          payments: [...sale.payments, { method: method as any, amount }],
        };
      })
    );
    logAuditAction('Debt Settled', `Received debt payment of $${amount} for Sale ID: ${saleId} via ${method}`);
  };

  // Add Person with Auto-Sync for Transporter & Marketer
  const addPerson = (
    category: PersonRecord['category'],
    personData: Omit<PersonRecord, 'id' | 'createdAt'>
  ): PersonRecord => {
    const id = `${category.slice(0, 4)}-${Date.now()}`;
    const newPerson: PersonRecord = {
      ...personData,
      id,
      category,
      createdAt: new Date().toISOString(),
      referralCount: personData.referralCount || 0,
      totalReferralVolume: personData.totalReferralVolume || 0,
    };

    switch (category) {
      case 'customer':
        setCustomers((prev) => [newPerson, ...prev]);
        break;
      case 'vendor':
        setVendors((prev) => [newPerson, ...prev]);
        break;
      case 'transporter':
        setTransporters((prev) => [newPerson, ...prev]);
        break;
      case 'marketer':
        setMarketingTeam((prev) => [newPerson, ...prev]);
        break;
      case 'company_member': {
        setCompanyMembers((prev) => [newPerson, ...prev]);

        // AUTO-SYNC REQUIREMENTS:
        // "if the user has one of their role Transporter/Driver then as their info is added to company member database
        // let it be added to the transporter database, do the same for marketor."
        const roles = newPerson.roles || ['Other', 'Other'];
        const isTransporter = roles.includes('Transporter/Driver');
        const isMarketer = roles.includes('Marketor');

        if (isTransporter) {
          const syncedTransporter: PersonRecord = {
            ...newPerson,
            id: `trans-sync-${id}`,
            category: 'transporter',
            notes: `Auto-synced from Company Member: ${newPerson.firstName} ${newPerson.secondName}`,
          };
          setTransporters((prev) => [syncedTransporter, ...prev]);
        }

        if (isMarketer) {
          const syncedMarketer: PersonRecord = {
            ...newPerson,
            id: `mkt-sync-${id}`,
            category: 'marketer',
            notes: `Auto-synced from Company Member: ${newPerson.firstName} ${newPerson.secondName}`,
          };
          setMarketingTeam((prev) => [syncedMarketer, ...prev]);
        }
        break;
      }
    }

    logAuditAction('Added Person', `Added ${category}: ${newPerson.firstName} ${newPerson.secondName}`);
    return newPerson;
  };

  const updatePerson = (category: PersonRecord['category'], person: PersonRecord) => {
    const updater = (list: PersonRecord[]) => list.map((p) => (p.id === person.id ? person : p));
    switch (category) {
      case 'customer':
        setCustomers(updater);
        break;
      case 'vendor':
        setVendors(updater);
        break;
      case 'transporter':
        setTransporters(updater);
        break;
      case 'marketer':
        setMarketingTeam(updater);
        break;
      case 'company_member':
        setCompanyMembers(updater);
        break;
    }
    logAuditAction('Updated Person', `Updated ${category}: ${person.firstName} ${person.secondName}`);
  };

  const deletePerson = (category: PersonRecord['category'], id: string) => {
    const filterer = (list: PersonRecord[]) => list.filter((p) => p.id !== id);
    switch (category) {
      case 'customer':
        setCustomers(filterer);
        break;
      case 'vendor':
        setVendors(filterer);
        break;
      case 'transporter':
        setTransporters(filterer);
        break;
      case 'marketer':
        setMarketingTeam(filterer);
        break;
      case 'company_member':
        setCompanyMembers(filterer);
        break;
    }
    logAuditAction('Deleted Person', `Deleted record ID ${id} from ${category}`);
  };

  // Products
  const addProduct = (product: Omit<ProductItem, 'id' | 'createdAt'> & { id?: string }) => {
    const newProd: ProductItem = {
      ...product,
      id: product.id || `ITEM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProd, ...prev]);
    logAuditAction('Added Product', `Created ${product.type}: ${product.name} (ID: ${newProd.id})`);
  };

  const updateProduct = (product: ProductItem) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    logAuditAction('Updated Product', `Updated ${product.name} (SKU: ${product.sku})`);
  };

  const deleteProduct = (id: string) => {
    const item = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    logAuditAction('Deleted Product', `Deleted item ${item?.name || id}`);
  };

  // Expenses
  const addExpense = (expense: Omit<ExpenseItem, 'id'>) => {
    const newExp: ExpenseItem = {
      ...expense,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
    logAuditAction('Added Expense', `Logged expense: ${expense.title} - $${expense.amount}`);
  };

  const deleteExpense = (id: string) => {
    const item = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    logAuditAction('Deleted Expense', `Removed expense: ${item?.title || id}`);
  };

  // Theme toggle
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setSettings(previous => ({ ...previous, appearance: { ...previous.appearance, theme: next } }));
    logAuditAction('Theme Toggled', `Switched POS theme to ${next.toUpperCase()}`);
  };

  // Adjust product stock with audit logging
  const adjustProductStock = (productId: string, newStock: number, reason: string, notes?: string) => {
    let oldStock = 0;
    let prodName = '';
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          oldStock = p.stock;
          prodName = p.name;
          return { ...p, stock: Math.max(0, newStock) };
        }
        return p;
      })
    );
    const diff = newStock - oldStock;
    logAuditAction(
      'Stock Quantity Adjusted',
      `Stock for ${prodName} (ID: ${productId}) adjusted from ${oldStock} to ${newStock} (${diff >= 0 ? '+' : ''}${diff}) - Reason: ${reason}${notes ? ` [${notes}]` : ''}`
    );
  };

  // Quick Sales Invoicing: Convert cart into official sales invoice & sync to sales history
  const createSalesInvoiceFromCart = (
    customerName: string,
    items: { product: ProductItem; quantity: number; unitPrice: number; total: number }[],
    subtotal: number,
    tax: number,
    total: number,
    isPaid: boolean,
    dueDate: string,
    notes?: string
  ): InvoiceItem => {
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    const newInvId = `inv-${Date.now()}`;
    const invoice: InvoiceItem = {
      id: newInvId,
      invoiceNo,
      type: 'sales',
      partyName: customerName || 'Enterprise Client',
      partyType: 'Customer',
      date: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: items.map((i) => ({
        description: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total,
      })),
      subtotal,
      tax,
      total,
      amountPaid: isPaid ? total : 0,
      status: isPaid ? 'paid' : 'pending',
      notes: notes || 'Generated from Sales POS quick invoice conversion.',
    };

    setInvoices((prev) => [invoice, ...prev]);

    // Create matching sale transaction
    const newSale: SaleTransaction = {
      id: `sale-inv-${Date.now()}`,
      receiptNo: invoiceNo,
      timestamp: new Date().toISOString(),
      customerId: `cust-inv-${Date.now().toString().slice(-4)}`,
      customerName: invoice.partyName,
      customerContact: '',
      cashierId: currentUser?.id || 'admin',
      cashierName: currentUser?.name || 'Sales Staff',
      items: items.map((i) => ({
        product: i.product,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountType: 'percentage',
        discountValue: 0,
        total: i.total,
      })),
      subtotal,
      overallDiscountType: 'percentage',
      overallDiscountValue: 0,
      extraCharges: [],
      taxAmount: tax,
      netTotal: total,
      payments: isPaid ? [{ method: 'Bank Transfer', amount: total }] : [],
      amountPaid: isPaid ? total : 0,
      debtAmount: isPaid ? 0 : total,
      status: isPaid ? 'completed' : 'debt_pending',
      saleType: 'sales_invoice',
      invoiceId: newInvId,
      notes: `Sales Invoice #${invoiceNo} (Due: ${invoice.dueDate})`,
    };

    setSales((prev) => [newSale, ...prev]);

    // Deduct stock for physical products
    setProducts((prev) =>
      prev.map((prod) => {
        const cartItem = items.find((item) => item.product.id === prod.id);
        if (cartItem && prod.type === 'product') {
          return { ...prod, stock: Math.max(0, prod.stock - cartItem.quantity) };
        }
        return prod;
      })
    );

    logAuditAction(
      'Created Sales Invoice',
      `Converted cart into sales invoice #${invoiceNo} for ${invoice.partyName} - Total: $${total.toFixed(2)} (${isPaid ? 'PAID' : 'DEBT / PENDING'})`
    );

    return invoice;
  };

  // Invoices (with automatic stock invoice & sales invoice synchronization)
  const addInvoice = (invoice: Omit<InvoiceItem, 'id'>) => {
    const newInvId = `inv-${Date.now()}`;
    const newInv: InvoiceItem = {
      ...invoice,
      id: newInvId,
    };
    setInvoices((prev) => [newInv, ...prev]);

    // 1. IF STOCK PURCHASE INVOICE: Auto-sync stock items to inventory
    if (invoice.type === 'stock_purchase') {
      setProducts((prev) => {
        const updated = [...prev];
        for (const item of invoice.items) {
          const matchIdx = updated.findIndex(
            (p) => p.name.toLowerCase().trim() === item.description.toLowerCase().trim()
          );
          if (matchIdx >= 0) {
            updated[matchIdx] = {
              ...updated[matchIdx],
              stock: updated[matchIdx].stock + item.quantity,
              costPrice: item.unitPrice > 0 ? item.unitPrice : updated[matchIdx].costPrice,
            };
          } else {
            const newProd: ProductItem = {
              id: `ITEM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              sku: `SKU-${Date.now().toString().slice(-4)}`,
              barcode: `7600${Math.floor(100000 + Math.random() * 900000)}`,
              name: item.description,
              category: 'Hardware',
              type: 'product',
              costPrice: item.unitPrice,
              sellingPrice: item.unitPrice > 0 ? Number((item.unitPrice * 1.35).toFixed(2)) : 50,
              stock: item.quantity,
              minStockAlert: 5,
              description: `Restocked via purchase invoice ${invoice.invoiceNo} from ${invoice.partyName}`,
              imageUrl: '',
              createdAt: new Date().toISOString(),
            };
            updated.push(newProd);
          }
        }
        return updated;
      });
      logAuditAction(
        'Stock Invoice Synced',
        `Auto-synchronized ${invoice.items.length} items from stock purchase invoice ${invoice.invoiceNo} to inventory`
      );
    }

    // 2. IF SALES INVOICE: Auto-record into sales history as a Sales Invoice
    if (invoice.type === 'sales') {
      const isPaid = invoice.status === 'paid';
      const isPartial = invoice.status === 'pending' && invoice.amountPaid > 0;
      const debtAmount = Math.max(0, invoice.total - invoice.amountPaid);
      const status: SaleTransaction['status'] = isPaid
        ? 'completed'
        : isPartial
        ? 'debt_partial'
        : 'debt_pending';

      const invoiceSale: SaleTransaction = {
        id: `sale-inv-${Date.now()}`,
        receiptNo: invoice.invoiceNo,
        timestamp: new Date().toISOString(),
        customerId: `cust-inv-${Date.now().toString().slice(-4)}`,
        customerName: invoice.partyName,
        customerContact: '',
        cashierId: currentUser?.id || 'admin',
        cashierName: currentUser?.name || 'Sales Staff',
        items: invoice.items.map((it) => {
          const matchedProduct = products.find(
            (p) => p.name.toLowerCase() === it.description.toLowerCase()
          );
          return {
            product: matchedProduct || {
              id: `prod-${Date.now()}`,
              name: it.description,
              sku: 'INV-ITEM',
              barcode: '760000',
              category: 'Commercial',
              type: 'product',
              costPrice: it.unitPrice * 0.7,
              sellingPrice: it.unitPrice,
              stock: 99,
              minStockAlert: 5,
              description: it.description,
              imageUrl: '',
              createdAt: new Date().toISOString(),
            },
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discountType: 'percentage',
            discountValue: 0,
            total: it.total,
          };
        }),
        subtotal: invoice.subtotal,
        overallDiscountType: 'percentage',
        overallDiscountValue: 0,
        extraCharges: [],
        taxAmount: invoice.tax,
        netTotal: invoice.total,
        payments:
          invoice.amountPaid > 0
            ? [{ method: 'Bank Transfer', amount: invoice.amountPaid }]
            : [],
        amountPaid: invoice.amountPaid,
        debtAmount,
        status,
        saleType: 'sales_invoice',
        invoiceId: newInvId,
        notes: `Sales Invoice #${invoice.invoiceNo} (Due: ${invoice.dueDate})`,
      };

      setSales((prev) => [invoiceSale, ...prev]);

      // Deduct stock for matched physical products
      setProducts((prev) =>
        prev.map((prod) => {
          const it = invoice.items.find(
            (i) => i.description.toLowerCase().trim() === prod.name.toLowerCase().trim()
          );
          if (it && prod.type === 'product') {
            return { ...prod, stock: Math.max(0, prod.stock - it.quantity) };
          }
          return prod;
        })
      );

      logAuditAction(
        'Sales Invoice Generated',
        `Issued sales invoice ${invoice.invoiceNo} for ${invoice.partyName} - Net: $${invoice.total.toFixed(2)} (${isPaid ? 'PAID' : 'DEBT / PENDING'})`
      );
    } else {
      logAuditAction('Added Invoice', `Issued ${invoice.type} invoice: ${invoice.invoiceNo} - $${invoice.total}`);
    }
  };

  const updateInvoice = (invoice: InvoiceItem) => {
    setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? invoice : i)));
    logAuditAction('Updated Invoice', `Updated invoice ${invoice.invoiceNo}`);
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    logAuditAction('Deleted Invoice', `Removed invoice record ID: ${id}`);
  };

  // Reviews
  const addReview = (review: Omit<CustomerReview, 'id' | 'date'>) => {
    const newRev: CustomerReview = {
      ...review,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setReviews((prev) => [newRev, ...prev]);

    // Mark sale as having review
    if (review.saleId) {
      setSales((prev) =>
        prev.map((s) => (s.id === review.saleId ? { ...s, hasReview: true } : s))
      );
    }

    logAuditAction('Added Customer Review', `Received ${review.rating}-star review from ${review.customerName}`);
  };

  // Registered user accounts persisted in localStorage
  const USERS_STORAGE_KEY = 'code76_pos_registered_users_v1';
  const loadSavedUsers = (): Record<string, { name: string; password: string; roles: [UserRole, UserRole]; isAdmin: boolean }> => {
    const defaults: Record<string, { name: string; password: string; roles: [UserRole, UserRole]; isAdmin: boolean }> = {
      'code76pos@gmail.com': { name: 'Lead Developer Admin', password: '7676', roles: ['CEO', 'Developer'], isAdmin: true },
      'admin@code76.com': { name: 'System Administrator', password: 'admin123', roles: ['Manager', 'Associate'], isAdmin: true },
      'sarah.k@code76.com': { name: 'Sarah Kiprono', password: 'password123', roles: ['Cashier', 'Associate'], isAdmin: false },
      'samuel.m@code76.com': { name: 'Samuel Mwangi', password: 'password123', roles: ['Manager', 'Developer'], isAdmin: true },
      'david.k@code76.com': { name: 'Dr. David Kimani', password: 'password123', roles: ['CEO', 'Director'], isAdmin: true },
    };
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load registered accounts', e);
    }
    return defaults;
  };

  const [registeredAccounts, setRegisteredAccounts] = useState(loadSavedUsers);

  const saveRegisteredAccount = (email: string, pass: string, name: string, role: UserRole) => {
    const normEmail = email.trim().toLowerCase();
    const updated = {
      ...registeredAccounts,
      [normEmail]: {
        name: name || normEmail.split('@')[0],
        password: pass,
        roles: [role, 'Associate'] as [UserRole, UserRole],
        isAdmin: normEmail === 'code76pos@gmail.com' || role === 'CEO' || role === 'Developer',
      },
    };
    setRegisteredAccounts(updated);
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save user account', e);
    }
  };

  const registerUser = (fullName: string, email: string, pass: string, role: UserRole): { success: boolean; message: string } => {
    const normEmail = email.trim().toLowerCase();
    if (!normEmail || !pass) {
      return { success: false, message: 'Please enter both your email address and password.' };
    }
    if (pass.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }
    if (registeredAccounts[normEmail] && normEmail === 'code76pos@gmail.com') {
      return { success: false, message: 'This official admin account already exists. Please sign in with password 7676.' };
    }
    saveRegisteredAccount(normEmail, pass, fullName, role);
    const auth: AuthUser = {
      id: `user-${Date.now()}`,
      email: normEmail,
      name: fullName.trim() || normEmail.split('@')[0],
      roles: [role, 'Associate'],
      isAdmin: normEmail === 'code76pos@gmail.com' || role === 'CEO' || role === 'Developer',
    };
    setCurrentUser(auth);
    setActiveView('pos');
    logAuditAction('User Registered', `New user ${normEmail} registered with role: ${role}`);
    return { success: true, message: `Account registered for ${fullName || normEmail}! Launching POS...` };
  };

  const loginUser = (email: string, pass: string, role: UserRole): { success: boolean; message: string } => {
    const normEmail = email.trim().toLowerCase();
    
    // 1. Strict verification for code76pos@gmail.com
    if (normEmail === 'code76pos@gmail.com') {
      if (pass !== '7676') {
        logAuditAction('Failed Login Attempt', `Invalid password entered for admin ${normEmail}`);
        return { success: false, message: 'Incorrect password for administrator account code76pos@gmail.com. Please enter the correct password.' };
      }
      const auth: AuthUser = {
        id: 'user-admin-76',
        email: normEmail,
        name: 'Lead Developer Admin',
        roles: [role || 'CEO', 'Developer'],
        isAdmin: true,
      };
      setCurrentUser(auth);
      setActiveView('pos');
      logAuditAction('User Logged In', `Admin ${normEmail} signed in successfully`);
      return { success: true, message: 'Welcome back Administrator! Authentication successful.' };
    }

    // 2. Check registered accounts and demo profiles
    const account = registeredAccounts[normEmail];
    if (account) {
      if (account.password !== pass) {
        logAuditAction('Failed Login Attempt', `Failed login for ${normEmail} - wrong password`);
        return { success: false, message: 'Incorrect password for this account. Please verify your credentials and try again.' };
      }
      const auth: AuthUser = {
        id: `user-${Date.now()}`,
        email: normEmail,
        name: account.name,
        roles: [role || account.roles[0], account.roles[1] || 'Associate'],
        isAdmin: account.isAdmin,
      };
      setCurrentUser(auth);
      setActiveView('pos');
      logAuditAction('User Logged In', `User ${normEmail} signed in with role: ${role || account.roles[0]}`);
      return { success: true, message: 'Welcome back! Authentication successful.' };
    }

    // 3. Email not found
    logAuditAction('Failed Login Attempt', `Login attempted for unknown email: ${normEmail}`);
    return { success: false, message: `No account found with email "${normEmail}". Please click "Create Account" or use a quick demo profile.` };
  };

  const logoutUser = () => {
    logAuditAction('User Logged Out', `User ${currentUser?.email} signed out`);
    setCurrentUser(null);
    setCompanyQAModalOpen(false);
    setDemoWarningOpen(false);
    setHoverHelpPlatform(null);
    setMarketingModalItem(null);
    setReceiptModalSale(null);
    setReviewModalSale(null);
    setLoginModalOpen(false);
    setActiveView('landing');
  };

  return (
    <POSContext.Provider
      value={{
        company,
        setCompany,
        products,
        setProducts,
        sales,
        setSales,
        expenses,
        setExpenses,
        invoices,
        setInvoices,
        customers,
        setCustomers,
        vendors,
        setVendors,
        transporters,
        setTransporters,
        marketingTeam,
        setMarketingTeam,
        companyMembers,
        setCompanyMembers,
        reviews,
        setReviews,
        auditLogs,
        landingMetrics,
        setLandingMetrics,
        settings,
        setSettings,
        settingsSection,
        setSettingsSection,
        currentUser,
        setCurrentUser,
        activeView,
        setActiveView,
        activePlatform,
        setActivePlatform,
        viewportMode,
        setViewportMode,
        demoWarningOpen,
        setDemoWarningOpen,
        hoverHelpPlatform,
        setHoverHelpPlatform,
        marketingModalItem,
        setMarketingModalItem,
        receiptModalSale,
        setReceiptModalSale,
        reviewModalSale,
        setReviewModalSale,
        loginModalOpen,
        setLoginModalOpen,
        loadDemoData,
        wipeDataToCleanState,
        wipeSelectedDatabases,
        logAuditAction,
        hasPrivilege,
        addSale,
        settleDebt,
        addPerson,
        updatePerson,
        deletePerson,
        addProduct,
        updateProduct,
        deleteProduct,
        addExpense,
        deleteExpense,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addReview,
        theme,
        toggleTheme,
        adjustProductStock,
        createSalesInvoiceFromCart,
        loginUser,
        logoutUser,
        registerUser,
        companyQAModalOpen,
        setCompanyQAModalOpen,
        hasDismissedCompanyQA,
        setHasDismissedCompanyQA,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = (): POSContextType => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
