import { calendarDate } from '../utils/regional.ts';
import {createDemoWorkspace} from '../data/demoWorkspace.ts';
import {applyDebtPayment,applyDebtPayments,type DebtPaymentOptions,type DebtSplitInput,buildDebtReminder,buildDebtHandlingHistory} from '../utils/debt.ts';
import { TEAM_SERVICES } from '../config/teamServices.ts';
import { invoiceDraftTotals } from '../utils/invoiceDraft.ts';
import { directoryFeature, hasPlanFeature, planTier, requirePlanFeature, PLAN_TIERS, type Feature } from '../utils/plans.ts';
import { canonicalDirectoryId, directoryName, snapshotParty, uniqueParties, upsertDirectory, removeDirectory, validateDirectory, type DirectoryCollections } from '../utils/directory.ts';
import { prepareSalaryPayment } from '../utils/staffing.ts';
import { serviceUnitLabel } from '../utils/serviceUnits.ts';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  AppSettings,
  TeamServiceBrief,
  TeamServiceBriefDraft,
  PlanTier,
  SalaryPayment,
  SalaryPaymentDraft,
  ReceiptDispatch,
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
import { privilegeValue, type PrivilegeKey } from '../utils/privileges.ts';
import { DATASET_DEFINITIONS, type DatasetKey } from '../utils/dataDeletion.ts';
import {
  ensureAccountStore, readStore, authenticate, registerBusiness, createTeamAccount,
  updateTeamAccount, removeTeamAccount, findRecoveryProfile, verifyRecoveryAnswers,
  resetPasswordWithRecovery, writeActiveWorkspaceId,
  readWorkspaceData, writeWorkspaceData, updateWorkspaceLicense, DEFAULT_WORKSPACE_ID,
  type AccountRecord, type AccountResult, type BusinessRegistrationInput,
  type RecoveryProfile, type TeamLoginInput, type TeamLoginUpdate, type WorkspaceRecord,
} from '../utils/accounts.ts';
import { calculateLicenseDetails, getStoredLicense, saveStoredLicense } from '../utils/licenseManager.ts';

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
  teamServiceBriefs: TeamServiceBrief[];
  saveTeamServiceBrief: (draft:TeamServiceBriefDraft)=>TeamServiceBrief;
  relatedCompanies: PersonRecord[];
  salaryPayments: SalaryPayment[];
  recordSalaryPayment: (draft: SalaryPaymentDraft) => SalaryPayment;
  setDemoPlan: (tier: PlanTier) => void;
  hasFeature: (feature: Feature) => boolean;
  reviews: CustomerReview[];
  setReviews: React.Dispatch<React.SetStateAction<CustomerReview[]>>;
  receiptDispatches: ReceiptDispatch[];
  /** Records a local receipt hand-off attempt. Never claims server delivery. */
  recordReceiptDispatch: (draft: Omit<ReceiptDispatch, 'id' | 'sentAt' | 'sentBy'>) => ReceiptDispatch;
  clearReceiptDispatchLog: () => void;
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
  /** Which tab the receipt modal opens on. */
  receiptModalIntent: 'preview' | 'send' | 'download';
  setReceiptModalIntent: (intent: 'preview' | 'send' | 'download') => void;
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
  /** Deletes only the selected platform datasets and returns their human-readable names. */
  wipeSelectedDatabases: (selectedKeys: string[]) => string[];
  logAuditAction: (action: string, details: string) => void;
  hasPrivilege: (permission: PrivilegeKey) => boolean;
  addSale: (sale: Omit<SaleTransaction, 'id' | 'receiptNo' | 'timestamp'>) => SaleTransaction;
  settleDebt: (saleId: string, amount: number, method: string, options?:DebtPaymentOptions) => SaleTransaction;
  settleDebtMultiple: (saleId: string, splits: DebtSplitInput[], options?: Omit<DebtPaymentOptions,'paymentId'|'reference'> & { basePaymentId?: string }) => SaleTransaction;
  assignDebtHandler: (saleId: string, handlerId: string | null) => SaleTransaction;
  recordDebtReminder: (saleId: string, reminder: { recipientEmail: string; recipientName: string; ccEmails?: string[]; subject: string; bodyPreview: string; channel: 'email' | 'copy' }) => SaleTransaction;
  emailDebtHistory: (saleId: string, recipients: { email: string; name: string }[]) => string;
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
  loginUser: (email: string, pass: string, role?: UserRole) => { success: boolean; message: string };
  registerUser: (input: BusinessRegistrationInput) => {
    success: boolean;
    message: string;
    workspaceId?: string;
    email?: string;
    adminName?: string;
    companyName?: string;
  };
  logoutUser: () => void;
  /** Business workspace for the signed-in session; null while signed out. */
  workspace: WorkspaceRecord | null;
  workspaceAccounts: AccountRecord[];
  lookupRecoveryAccount: (query: string, companyName?: string) => AccountResult<RecoveryProfile>;
  verifyRecoveryAnswersFor: (email: string, answers: Record<string, string>) => boolean;
  resetAccountPassword: (email: string, answers: Record<string, string>, newPassword: string) => { success: boolean; message: string };
  createTeamLogin: (input: Omit<TeamLoginInput, 'workspaceId'>) => { success: boolean; message: string };
  updateTeamLogin: (email: string, update: TeamLoginUpdate) => { success: boolean; message: string };
  removeTeamLogin: (email: string) => { success: boolean; message: string };
  updateUserLicense: (
    tier: PlanTier,
    licenseKey: string,
    productKey: string,
    expiresAt: string,
    gateway?: string,
    targetWorkspaceId?: string,
    targetCompanyName?: string,
    targetEmail?: string
  ) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'code76_pos_state_v1';

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from localStorage or fallback
  // Accounts are browser-local. Nothing merchant-specific is preloaded before
  // sign-in: a signed-out browser shows only the public CODE76 website.
  const loadSaved = (): Record<string, any> | null => {
    try {
      // Seeds demo logins and migrates the old single-business snapshot once.
      ensureAccountStore();
    } catch (e) {
      console.error('Unable to prepare the local account store', e);
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
  const [teamServiceBriefs,setTeamServiceBriefs]=useState<TeamServiceBrief[]>(initial?.teamServiceBriefs || []);
  const [relatedCompanies, setRelatedCompanies] = useState<PersonRecord[]>(initial?.relatedCompanies || []);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>(initial?.salaryPayments || []);
  const [reviews, setReviews] = useState<CustomerReview[]>(initial?.reviews || []);
  const [receiptDispatches, setReceiptDispatches] = useState<ReceiptDispatch[]>(initial?.receiptDispatches || []);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initial?.auditLogs || []);
  const [landingMetrics, setLandingMetrics] = useState<LandingMetrics>(initial?.landingMetrics || EMPTY_BUSINESS_METRICS);
  const [settings, setSettings] = useState<AppSettings>(() => mergeAppSettings(INITIAL_SETTINGS, initial?.settings));
  const directoriesRef = useRef<DirectoryCollections>({ customers, vendors, transporters, marketingTeam, companyMembers, relatedCompanies });
  directoriesRef.current = { customers, vendors, transporters, marketingTeam, companyMembers, relatedCompanies };
  const salaryRef = useRef(salaryPayments); salaryRef.current = salaryPayments;
  const salesRef=useRef(sales);salesRef.current=sales;
  const hasFeature = (feature: Feature) => hasPlanFeature(planTier(settings), feature);
  const applyDirectories = (next: DirectoryCollections) => {
    directoriesRef.current = next;
    setCustomers(next.customers); setVendors(next.vendors); setTransporters(next.transporters);
    setMarketingTeam(next.marketingTeam); setCompanyMembers(next.companyMembers); setRelatedCompanies(next.relatedCompanies);
  };


  // One persisted source of truth for both Settings and the setup assistant.
  const theme = settings.appearance.theme;
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('payments');

  // Authentication stays explicit. Saved merchant data is not an authenticated session.
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const workspaceIdRef = useRef<string | null>(null);
  const [workspaceAccounts, setWorkspaceAccounts] = useState<AccountRecord[]>([]);
  const workspaceRecord = (() => {
    if (!workspaceId) return null;
    try { return ensureAccountStore().workspaces[workspaceId] || null; } catch { return null; }
  })();

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
  const [receiptModalIntent, setReceiptModalIntent] = useState<'preview' | 'send' | 'download'>('preview');
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
        relatedCompanies,
        salaryPayments,
        teamServiceBriefs,
        reviews,
        receiptDispatches: receiptDispatches.slice(0, 500),
        auditLogs,
        landingMetrics,
        settings,
      };
      const active = workspaceIdRef.current;
      if (active) {
        writeWorkspaceData(active, stateToSave);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...stateToSave, workspaceId: active }));
      }
      // Signed out: nothing merchant-specific is written or restored.
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
    relatedCompanies,
    salaryPayments,
    teamServiceBriefs,
    reviews,
    receiptDispatches,
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

  // Check RBAC privileges. Administrators keep every right; missing newer
  // controls fall back to their documented legacy permission.
  const hasPrivilege = (permission: PrivilegeKey): boolean => {
    if (!currentUser) return false;
    const feature: Partial<Record<PrivilegeKey, Feature>> = {
      canSell:'selling', canSendReceipts:'receipts', canSettleDebt:'debts',
      canViewInventory:'inventory', canEditInventory:'inventory', canAdjustStock:'inventory',
      canViewExpenses:'expenses', canEditExpenses:'expenses', canViewInvoices:'invoices',
      canViewAnalytics:'analytics', canManageSchedules:'payroll',
      canExportPdf:'data_export', canImportCsv:'imports', canViewAuditLogs:'audit',
      canModifySettings:'appearance', canEditLandingPage:'business_landing',
      canManageChatbot:'chatbot', canDeleteData:'delete_data',
    };
    if (feature[permission] && !hasFeature(feature[permission]!)) return false;
    if (currentUser.isAdmin) return true;
    const role1 = currentUser.roles[0];
    const role2 = currentUser.roles[1];
    return privilegeValue(settings.privileges[role1], permission) || (role2 ? privilegeValue(settings.privileges[role2], permission) : false);
  };

  // Opt-in administrator confirmation occurs in DemoWarningModal.
  const loadDemoData=()=>{
    if(!currentUser?.isAdmin)throw new Error('Only an administrator can replace business records with demo data.');
    const demo=createDemoWorkspace(settings);
    setCompany(demo.company);setProducts(demo.products);setSales(demo.sales);salesRef.current=demo.sales;
    setExpenses(demo.expenses);setInvoices(demo.invoices);applyDirectories(demo.directories);
    setSalaryPayments(demo.salaryPayments);salaryRef.current=demo.salaryPayments;
    setReviews(demo.reviews);setLandingMetrics(demo.landingMetrics);setTeamServiceBriefs([]);
    setAuditLogs(previous=>[...demo.auditLogs,...previous]);
    setSettings(previous=>({...previous,landingPage:{...previous.landingPage,heroTitle:demo.company.name,heroSubtitle:'DEMO ONLY — synthetic inventory, contacts and feedback. No real orders or results are represented.',referralBonusText:'',showPromoCountdown:false},receipts:{...previous.receipts,headerTitle:demo.company.name,footerNotice:'DEMO ONLY — no actual payment or purchase.',returnPolicy:'Training record only; not a real returns or warranty policy.'}}));
    setHasDismissedCompanyQA(true);setCompanyQAModalOpen(false);setMarketingModalItem(null);setReceiptModalSale(null);setReviewModalSale(null);
    logAuditAction('Loaded Synthetic Demo Workspace','Administrator-confirmed replacement with fictional training records; tier/preferences retained; no real funds, emails or endorsements created.');
    setDemoWarningOpen(false);
  };

  // Clear to blank
  const wipeDataToCleanState = () => {
    if (!currentUser) throw new Error('Sign in before deleting business data.');
    if (!currentUser.isAdmin && !hasPrivilege('canDeleteData')) throw new Error('This role cannot delete business data. Ask an administrator.');
    setCompany(previous=>previous.isDemo?{...previous,isDemo:false,isConfiguredByMerchant:false,name:'',slogan:'',logoUrl:''}:previous);
    setTeamServiceBriefs([]);
    setRelatedCompanies([]); setSalaryPayments([]); salaryRef.current = [];
    directoriesRef.current = { customers: [], vendors: [], transporters: [], marketingTeam: [], companyMembers: [], relatedCompanies: [] };
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
    setRelatedCompanies([]);
    setReceiptDispatches([]);
    setLandingMetrics(EMPTY_BUSINESS_METRICS);
    logAuditAction('Wiped System Data', 'Reset all platform records to an empty state. Account, plan, display preferences and audit history were retained.');
    setDemoWarningOpen(false);
  };

  // Modular Selective Platform Database Wipe
  const wipeSelectedDatabases = (selectedKeys: string[]): string[] => {
    if (!currentUser) throw new Error('Sign in before deleting platform data.');
    if (!currentUser.isAdmin && !hasPrivilege('canDeleteData')) throw new Error('This role cannot delete platform data. Ask an administrator.');
    if (selectedKeys.includes('all')) {
      wipeDataToCleanState();
      return DATASET_DEFINITIONS.map(definition => definition.label);
    }
    const requested = new Set(selectedKeys as DatasetKey[]);
    const wipedNames: string[] = [];
    const wipe = (key: DatasetKey, apply: () => void, name: string) => {
      if (!requested.has(key)) return;
      apply();
      wipedNames.push(name);
    };

    wipe('products', () => setProducts([]), 'Inventory & services');
    wipe('sales', () => setSales([]), 'Sales & receipts');
    wipe('invoices', () => setInvoices([]), 'Invoices');
    wipe('expenses', () => setExpenses([]), 'Expenses');
    wipe('customers', () => setCustomers([]), 'Customers');
    wipe('vendors', () => setVendors([]), 'Vendors & suppliers');
    wipe('transporters', () => setTransporters([]), 'Transporters');
    wipe('marketingTeam', () => setMarketingTeam([]), 'Marketing team');
    wipe('companyMembers', () => setCompanyMembers([]), 'Company members');
    wipe('relatedCompanies', () => setRelatedCompanies([]), 'Related companies & branches');
    wipe('salaryPayments', () => { setSalaryPayments([]); salaryRef.current = []; }, 'Salary payments');
    wipe('reviews', () => setReviews([]), 'Customer reviews');
    wipe('landingMetrics', () => setLandingMetrics(EMPTY_BUSINESS_METRICS), 'Landing page metrics');
    wipe('teamServiceBriefs', () => setTeamServiceBriefs([]), 'CODE76 service briefs');
    wipe('auditLogs', () => setAuditLogs([]), 'Audit & access logs');
    wipe('settings', () => setSettings(previous => mergeAppSettings(INITIAL_SETTINGS, { planTier: previous.planTier, regional: previous.regional })), 'System settings');

    if (requested.has('customers') || requested.has('vendors') || requested.has('transporters') || requested.has('marketingTeam') || requested.has('companyMembers') || requested.has('relatedCompanies')) {
      directoriesRef.current = {
        customers: requested.has('customers') ? [] : directoriesRef.current.customers,
        vendors: requested.has('vendors') ? [] : directoriesRef.current.vendors,
        transporters: requested.has('transporters') ? [] : directoriesRef.current.transporters,
        marketingTeam: requested.has('marketingTeam') ? [] : directoriesRef.current.marketingTeam,
        companyMembers: requested.has('companyMembers') ? [] : directoriesRef.current.companyMembers,
        relatedCompanies: requested.has('relatedCompanies') ? [] : directoriesRef.current.relatedCompanies,
      };
    }
    if (requested.has('companyMembers')) { setSalaryPayments(previous => previous); }

    logAuditAction(
      'Selective Platform Wipe',
      `Selectively deleted ${wipedNames.length} platform database(s): ${wipedNames.join(', ')}. Account, plan and untouched platforms were retained.`
    );
    setDemoWarningOpen(false);
    return wipedNames;
  };

  // Local receipt hand-off log. Linking to an external mail/WhatsApp client is
  // recorded as an opened share sheet, never as confirmed server delivery.
  const recordReceiptDispatch = (draft: Omit<ReceiptDispatch, 'id' | 'sentAt' | 'sentBy'>): ReceiptDispatch => {
    const record: ReceiptDispatch = {
      ...draft,
      id: `receipt-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sentAt: new Date().toISOString(),
      sentBy: currentUser?.name || 'Workspace user',
    };
    setReceiptDispatches(previous => [record, ...previous].slice(0, 500));
    logAuditAction(
      'Receipt shared',
      `${record.channel} receipt ${record.receiptNo} for ${record.recipient || 'no recipient'} (${record.format.toUpperCase()}). No server delivery is claimed.`
    );
    return record;
  };
  const clearReceiptDispatchLog = () => setReceiptDispatches([]);

  // Add Sale
  const addSale = (saleData: Omit<SaleTransaction, 'id' | 'receiptNo' | 'timestamp'>): SaleTransaction => {
    requirePlanFeature(settings, 'selling');
    if(saleData.referredBy&&!hasFeature('referrals'))throw new Error('Referral attribution is not included in this plan.');
    if (!hasFeature('debts') && (saleData.debtAmount > 0 || saleData.amountPaid + 0.001 < saleData.netTotal || saleData.payments.some(p => p.method === 'Credit / Debt'))) throw new Error('The Free plan requires full payment and cannot create debt.');
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

  // Record an already-received payment, never a new sale or money transfer.
  const settleDebt=(saleId:string,amount:number,method:string,options:DebtPaymentOptions={}):SaleTransaction=>{
    requirePlanFeature(settings,'debts');
    if(!hasPrivilege('canSettleDebt')&&!hasPrivilege('canSell')&&!hasPrivilege('canViewInvoices'))throw new Error('Recording debt collections requires Sales, Invoices or Debt-settlement permission.');
    const original=salesRef.current.find(sale=>sale.id===saleId);if(!original)throw new Error('The original sale no longer exists.');
    const linked=invoices.find(invoice=>invoice.type==='sales'&&(invoice.id===original.invoiceId||invoice.saleId===saleId));
    if(linked&&(Math.abs(linked.total-original.netTotal)>0.01||Math.abs(linked.amountPaid-original.amountPaid)>0.01))throw new Error('The linked invoice and sale balances disagree. Review the original records before collecting another payment.');
    const result=applyDebtPayment(original,amount,method,{...options,recordedBy:currentUser?.name||'User'});
    if(result.duplicate)return result.sale;
    salesRef.current=salesRef.current.map(sale=>sale.id===saleId?result.sale:sale);setSales(salesRef.current);
    setInvoices(previous=>previous.map(invoice=>invoice.type==='sales'&&(invoice.id===original.invoiceId||invoice.saleId===saleId)?{...invoice,amountPaid:result.sale.amountPaid,status:result.sale.debtAmount===0?'paid':invoice.dueDate<calendarDate(new Date(),settings)?'overdue':'pending'}:invoice));
    const isClearedDebt=result.sale.debtAmount===0;
    if(isClearedDebt) logAuditAction('Debt cleared',`Debt for ${original.receiptNo} fully settled (${result.payment.method} ${result.payment.amount.toFixed(2)} ${company.currency}). Remaining ${result.sale.debtAmount}.`);
    else logAuditAction('Recorded Debt Payment',`Recorded ${result.payment.amount} ${company.currency} for ${original.receiptNo}; remaining ${result.sale.debtAmount}. Bookkeeping only; no transfer initiated.`);
    return result.sale;
  };

  const settleDebtMultiple=(saleId:string,splits:DebtSplitInput[],options:Omit<DebtPaymentOptions,'paymentId'|'reference'> & {basePaymentId?:string}={}):SaleTransaction=>{
    requirePlanFeature(settings,'debts');
    if(!hasPrivilege('canSettleDebt')&&!hasPrivilege('canSell')&&!hasPrivilege('canViewInvoices'))throw new Error('Recording debt collections requires Sales, Invoices or Debt-settlement permission.');
    const original=salesRef.current.find(sale=>sale.id===saleId);if(!original)throw new Error('The original sale no longer exists.');
    const linked=invoices.find(invoice=>invoice.type==='sales'&&(invoice.id===original.invoiceId||invoice.saleId===saleId));
    if(linked&&(Math.abs(linked.total-original.netTotal)>0.01||Math.abs(linked.amountPaid-original.amountPaid)>0.01))throw new Error('The linked invoice and sale balances disagree. Review the original records before collecting another payment.');
    const result=applyDebtPayments(original,splits,{recordedBy:currentUser?.name||'User',handlerId:options.handlerId,handlerName:options.handlerName,basePaymentId:options.basePaymentId,timestamp:options.timestamp});
    salesRef.current=salesRef.current.map(sale=>sale.id===saleId?result.sale:sale);setSales(salesRef.current);
    const isCleared=result.sale.debtAmount===0;
    setInvoices(previous=>previous.map(invoice=>invoice.type==='sales'&&(invoice.id===original.invoiceId||invoice.saleId===saleId)?{...invoice,amountPaid:result.sale.amountPaid,status:isCleared?'paid':invoice.dueDate<calendarDate(new Date(),settings)?'overdue':'pending'}:invoice));
    if(isCleared) logAuditAction('Debt cleared',`Debt for ${original.receiptNo} fully settled with ${result.payments.length} split(s) totalling ${result.payments.reduce((a,p)=>a+p.amount,0).toFixed(2)} ${company.currency}. Remaining ${result.sale.debtAmount}.`);
    else logAuditAction('Recorded Debt Payment (multi)',`Recorded ${result.payments.length} splits totalling ${result.payments.reduce((a,p)=>a+p.amount,0).toFixed(2)} ${company.currency} for ${original.receiptNo}; remaining ${result.sale.debtAmount}.`);
    return result.sale;
  };

  const assignDebtHandler=(saleId:string,handlerId:string|null):SaleTransaction=>{
    requirePlanFeature(settings,'debts');
    if(!hasPrivilege('canSell')&&!hasPrivilege('canSettleDebt')&&!hasPrivilege('canViewInvoices'))throw new Error('Assigning a debt handler requires Sales, Invoices or Debt permission.');
    const original=salesRef.current.find(sale=>sale.id===saleId);if(!original)throw new Error('Sale not found.');
    if(!handlerId){
      const cleared={...original,debtHandlerId:undefined,debtHandlerName:undefined,debtAssignedAt:undefined,debtAssignedBy:undefined};
      salesRef.current=salesRef.current.map(s=>s.id===saleId?cleared:s);setSales(salesRef.current);
      logAuditAction('Debt handler unassigned',`Removed responsible handler from ${original.receiptNo} by ${currentUser?.name||'User'}.`);
      return cleared;
    }
    const member=directoriesRef.current.companyMembers.find(m=>canonicalDirectoryId(m.id)===canonicalDirectoryId(handlerId))||directoriesRef.current.relatedCompanies.find(m=>canonicalDirectoryId(m.id)===canonicalDirectoryId(handlerId));
    if(!member) throw new Error('Select a valid company member or related company.');
    const name=directoryName(member);
    const now=new Date().toISOString();
    const updated:SaleTransaction={...original,debtHandlerId:member.id,debtHandlerName:name,debtAssignedAt:now,debtAssignedBy:currentUser?.name||'User'};
    salesRef.current=salesRef.current.map(s=>s.id===saleId?updated:s);setSales(salesRef.current);
    logAuditAction('Debt handler assigned',`Assigned ${name} to handle debt for ${original.receiptNo}; remaining ${original.debtAmount} ${company.currency}.`);
    return updated;
  };

  const recordDebtReminder=(saleId:string,reminder:{recipientEmail:string;recipientName:string;ccEmails?:string[];subject:string;bodyPreview:string;channel:'email'|'copy'}):SaleTransaction=>{
    if(!hasFeature('email')) throw new Error('Email reminders require the email feature.');
    const original=salesRef.current.find(sale=>sale.id===saleId);if(!original)throw new Error('Sale not found.');
    if(!original.debtAmount || original.debtAmount<=0) throw new Error('This sale has no outstanding debt to remind about.');
    const entry={id:`reminder-${Date.now()}-${Math.floor(Math.random()*1000)}`,sentAt:new Date().toISOString(),sentBy:currentUser?.name||'User',recipientEmail:reminder.recipientEmail,recipientName:reminder.recipientName,ccEmails:reminder.ccEmails,subject:reminder.subject,bodyPreview:reminder.bodyPreview.slice(0,280),channel:reminder.channel,dueDate:original.debtDueDate} as import('../types/index.ts').DebtReminderRecord;
    const updated:SaleTransaction={...original,debtReminderCount:(original.debtReminderCount||0)+1,debtLastReminderAt:entry.sentAt,debtReminderHistory:[entry,...(original.debtReminderHistory||[])].slice(0,50)};
    salesRef.current=salesRef.current.map(s=>s.id===saleId?updated:s);setSales(salesRef.current);
    logAuditAction('Debt reminder prepared',`Prepared ${reminder.channel} reminder for ${original.receiptNo} to ${reminder.recipientName} <${reminder.recipientEmail}>${reminder.ccEmails?.length?` cc ${reminder.ccEmails.join(', ')}`:''}. Subject: ${reminder.subject}`);
    return updated;
  };

  const emailDebtHistory=(saleId:string,recipients:{email:string;name:string}[]):string=>{
    if(!hasFeature('email')) throw new Error('Email history requires the email feature.');
    const sale=salesRef.current.find(s=>s.id===saleId);if(!sale) throw new Error('Sale not found.');
    const history=buildDebtHandlingHistory({sale,companyName:company.name,currency:company.currency||settings.payments.defaultCurrency,issuedAt:new Date().toISOString()});
    logAuditAction('Debt history emailed',`Emailed debt handling history for ${sale.receiptNo} to ${recipients.map(r=> r.name+' <'+r.email+'>').join(', ')} by ${currentUser?.name||'User'}.`);
    return history;
  };

  // Stable identities project into selected directories; historical snapshots remain immutable.
  const addPerson = (category: PersonRecord['category'], personData: Omit<PersonRecord, 'id' | 'createdAt'>): PersonRecord => {
    requirePlanFeature(settings, directoryFeature(category));
    if (!hasPrivilege('canManagePeople')) throw new Error('Directory changes require Manage People permission.');
    const person: PersonRecord = { ...personData, id: `party-${crypto.randomUUID()}`, category, sourceCategory: category, createdAt: new Date().toISOString() };
    validateDirectory(person, directoriesRef.current.relatedCompanies);
    applyDirectories(upsertDirectory(directoriesRef.current, person));
    logAuditAction('Added Person', `Added ${category}: ${directoryName(person)}`);
    return person;
  };
  const updatePerson = (category: PersonRecord['category'], person: PersonRecord) => {
    requirePlanFeature(settings, directoryFeature(category || person.category));
    if (!hasPrivilege('canManagePeople')) throw new Error('Directory changes require Manage People permission.');
    validateDirectory(person, directoriesRef.current.relatedCompanies);
    applyDirectories(upsertDirectory(directoriesRef.current, person));
    logAuditAction('Updated Person', `Updated linked identity ${canonicalDirectoryId(person.id)}: ${directoryName(person)}`);
  };
  const deletePerson = (category: PersonRecord['category'], id: string) => {
    requirePlanFeature(settings, directoryFeature(category));
    if (!hasPrivilege('canManagePeople')) throw new Error('Directory deletion requires Manage People permission.');
    applyDirectories(removeDirectory(directoriesRef.current, id));
    logAuditAction('Deleted Person', `Removed linked identity ${canonicalDirectoryId(id)} from directories; historical transactions/payments retained`);
  };
  const recordSalaryPayment = (draft: SalaryPaymentDraft): SalaryPayment => {
    requirePlanFeature(settings, 'payroll');
    if (!hasPrivilege('canManagePeople')) throw new Error('Salary recording requires Manage People permission.');
    const previous = salaryRef.current.find(p => p.id === draft.id); if (previous) return previous;
    const member = directoriesRef.current.companyMembers.find(p => canonicalDirectoryId(p.id) === canonicalDirectoryId(draft.memberId));
    if (!member) throw new Error('Select an existing individual company member.');
    if (draft.recordExpense && !hasPrivilege('canEditExpenses')) throw new Error('Posting an expense also requires Edit Expenses permission.');
    const result = prepareSalaryPayment(draft, member, company.currency || settings.payments.defaultCurrency, currentUser?.name || 'User');
    salaryRef.current = [result.payment, ...salaryRef.current]; setSalaryPayments(salaryRef.current);
    if (result.expense) setExpenses(previous => previous.some(e => e.id === result.expense!.id) ? previous : [result.expense!, ...previous]);
    logAuditAction('Recorded Salary Payment', `Recorded ${result.payment.amount} ${result.payment.currency} for ${result.payment.memberName}${result.expense ? ' with one linked salary expense' : ' without posting an expense'}`);
    return result.payment;
  };
  const saveTeamServiceBrief=(draft:TeamServiceBriefDraft):TeamServiceBrief=>{
    requirePlanFeature(settings,'team_services');
    if(!currentUser?.isAdmin&&!hasPrivilege('canModifySettings'))throw new Error('Preparing team briefs requires workspace-administration permission.');
    if(!TEAM_SERVICES.some(service=>service.id===draft.serviceId)||!draft.businessName.trim()||!draft.goal.trim()||!draft.authorized)throw new Error('Select a service, enter a business/goal and confirm authorization.');
    if(draft.website){const website=new URL(draft.website);if(!['http:','https:'].includes(website.protocol)||website.username||website.password)throw new Error('Use a normal HTTP(S) business URL without credentials.');}
    if(draft.businessName.length>160||draft.goal.length>2000||draft.scope.length>2500||draft.contact.length>300)throw new Error('Keep the brief within the displayed field limits.');
    const brief:TeamServiceBrief={...draft,id:`service-${crypto.randomUUID()}`,createdAt:new Date().toISOString(),createdBy:currentUser?.name||'User',status:'local_draft'};
    setTeamServiceBriefs(previous=>[brief,...previous]);
    logAuditAction('Saved Local Team-Service Brief',`Saved ${draft.serviceId} draft only; no team delivery, ads, lead contacts or security testing initiated`);
    return brief;
  };
  const setDemoPlan = (tier: PlanTier) => {
    if (!currentUser?.isAdmin || !PLAN_TIERS.includes(tier)) throw new Error('Only an administrator can select a valid demo plan.');
    setSettings(previous => ({ ...previous, planTier: tier }));
    setMarketingModalItem(null); setReviewModalSale(null);
    logAuditAction('Changed Demo Plan', `Selected ${tier}; no charge or real subscription created; existing data retained`);
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
    requirePlanFeature(settings, 'expenses');
    if (!hasPrivilege('canEditExpenses')) throw new Error('Expense changes require Edit Expenses permission.');
    const party = expense.relatedCompanyId ? uniqueParties(Object.values(directoriesRef.current)).find(p => canonicalDirectoryId(p.id) === canonicalDirectoryId(expense.relatedCompanyId!)) : undefined;
    if (expense.relatedCompanyId && !party) throw new Error('The selected company/contact no longer exists. Select it again.');
    const partySnapshot = party ? snapshotParty(party, directoriesRef.current.relatedCompanies) : undefined;
    const newExp: ExpenseItem = {
      ...expense,
      partySnapshot, vendorName: partySnapshot?.name || expense.vendorName,
      id: `exp-${crypto.randomUUID()}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
    logAuditAction('Added Expense', `Logged expense: ${expense.title} - $${expense.amount}`);
  };

  const deleteExpense = (id: string) => {
    requirePlanFeature(settings, 'expenses');
    if (!hasPrivilege('canEditExpenses')) throw new Error('Expense changes require Edit Expenses permission.');
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
    requirePlanFeature(settings, 'invoices');
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
        description: i.product.type === 'service' && i.product.serviceUnit ? `${i.product.name} (${serviceUnitLabel(i.product)})` : i.product.name,
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
    requirePlanFeature(settings, 'invoices');
    invoice={...invoice,...invoiceDraftTotals(invoice.items,invoice.tax,invoice.amountPaid)};
    if(invoices.some(existing=>existing.type===invoice.type && existing.invoiceNo===invoice.invoiceNo && existing.partyName===invoice.partyName)) throw new Error('This invoice number is already recorded for this party.');
    if(invoice.type==='stock_purchase' && invoice.items.some(item=>!Number.isSafeInteger(item.quantity) || products.some(product=>product.type==='service' && product.name.toLowerCase().trim()===item.description.toLowerCase().trim()))) throw new Error('Stock purchase invoices require whole physical-product quantities; record service purchases as expenses.');
    const party = invoice.relatedCompanyId ? uniqueParties(Object.values(directoriesRef.current)).find(p => canonicalDirectoryId(p.id) === canonicalDirectoryId(invoice.relatedCompanyId!)) : undefined;
    if (invoice.relatedCompanyId && !party) throw new Error('The selected company/contact no longer exists. Select it again.');
    invoice = { ...invoice, partySnapshot: party ? snapshotParty(party, directoriesRef.current.relatedCompanies) : undefined, partyName: party ? directoryName(party) : invoice.partyName };
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
              sellingPrice: item.unitPrice > 0 ? Number((item.unitPrice * 1.35).toFixed(2)) : 0,
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
    requirePlanFeature(settings, 'invoices');
    setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? invoice : i)));
    logAuditAction('Updated Invoice', `Updated invoice ${invoice.invoiceNo}`);
  };

  const deleteInvoice = (id: string) => {
    requirePlanFeature(settings, 'invoices');
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

  // ------------------------------------------------------------------
  // Multi-business accounts. Each business is a workspace; signing in as a
  // member of another business swaps the whole dataset instead of merging it.
  // ------------------------------------------------------------------
  const snapshotWorkspace = () => ({
    company, products, sales, expenses, invoices, customers, vendors, transporters,
    marketingTeam, companyMembers, relatedCompanies, salaryPayments, teamServiceBriefs,
    reviews, receiptDispatches, auditLogs, landingMetrics, settings,
  });

  const refreshAccounts = () => {
    try {
      const active = workspaceIdRef.current;
      if (!active) { setWorkspaceAccounts([]); return; }
      const scoped = Object.values(ensureAccountStore().accounts)
        .filter((account) => account.workspaceId === active);
      setWorkspaceAccounts(scoped);
    } catch { /* storage blocked */ }
  };

  const applyWorkspaceData = (data: Record<string, any> | null, record: WorkspaceRecord) => {
    const next = data || {};
    const blankCompany: CompanyData = {
      ...INITIAL_COMPANY,
      name: record.companyName,
      slogan: '', vision: '', logoUrl: '', coverUrl: '', regNumber: '', taxPin: '',
      email: record.ownerEmail, tel1: '', tel2: '', whatsapp: '', address: '',
      location: '', country: '', operatingHours: '',
      isConfiguredByMerchant: false, isDemo: false,
    };
    setCompany(next.company || blankCompany);
    setProducts(next.products || []);
    setSales(next.sales || []);
    salesRef.current = next.sales || [];
    setExpenses(next.expenses || []);
    setInvoices(next.invoices || []);
    setCustomers(next.customers || []);
    setVendors(next.vendors || []);
    setTransporters(next.transporters || []);
    setMarketingTeam(next.marketingTeam || []);
    setCompanyMembers(next.companyMembers || []);
    setRelatedCompanies(next.relatedCompanies || []);
    directoriesRef.current = {
      customers: next.customers || [], vendors: next.vendors || [], transporters: next.transporters || [],
      marketingTeam: next.marketingTeam || [], companyMembers: next.companyMembers || [], relatedCompanies: next.relatedCompanies || [],
    };
    setSalaryPayments(next.salaryPayments || []);
    salaryRef.current = next.salaryPayments || [];
    setTeamServiceBriefs(next.teamServiceBriefs || []);
    setReviews(next.reviews || []);
    setReceiptDispatches(next.receiptDispatches || []);
    setAuditLogs(next.auditLogs || []);
    setLandingMetrics(next.landingMetrics || EMPTY_BUSINESS_METRICS);
    setSettings(mergeAppSettings(
      INITIAL_SETTINGS,
      data ? { ...next.settings, planTier: record.planTier || next.settings?.planTier } : { ...INITIAL_SETTINGS, planTier: record.planTier },
    ));
  };

  /** Switches the in-memory dataset to one business and remembers the choice. */
  const enterWorkspace = (account: AccountRecord, record: WorkspaceRecord, action: string) => {
    const previousId = workspaceIdRef.current;
    if (previousId && previousId !== record.id) {
      writeWorkspaceData(previousId, snapshotWorkspace());
    }
    const existingWorkspaceData = readWorkspaceData(record.id);
    applyWorkspaceData(existingWorkspaceData, record);

    workspaceIdRef.current = record.id;
    setWorkspaceId(record.id);
    writeActiveWorkspaceId(record.id);

    const storedLic = getStoredLicense(record.id) ||
      calculateLicenseDetails(
        record.planTier || 'free',
        record.companyName,
        account.email,
        record.licenseKey,
        record.productKey,
        record.createdAt,
        record.licenseExpiresAt
      );

    // Ensure settings.planTier matches the workspace/stored license tier upon login
    if (storedLic.tier) {
      setSettings((prev) => ({ ...prev, planTier: storedLic.tier }));
    }

    const auth: AuthUser = {
      id: account.id,
      email: account.email,
      name: account.name,
      roles: account.roles,
      isAdmin: account.isAdmin,
      workspaceId: record.id,
      licenseKey: storedLic.licenseKey,
      productKey: storedLic.productKey,
      tier: storedLic.tier,
      licenseExpiresAt: storedLic.expiresAt,
      licenseStatus: storedLic.status,
    };
    setCurrentUser(auth);
    setActiveView('pos');
    setLoginModalOpen(false);
    if (!record.isDemo && !(existingWorkspaceData?.company as CompanyData | undefined)?.isConfiguredByMerchant) {
      setHasDismissedCompanyQA(false);
      setCompanyQAModalOpen(true);
    }
    setAuditLogs((previous) => [{
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: account.id,
      userName: account.name,
      userRole: account.roles[0],
      action,
      details: `${account.email} signed in to ${record.companyName} (${account.isAdmin ? 'administrator' : 'team member'}). License: ${storedLic.licenseKey}`,
      ipOrDevice: `${navigator.platform || 'Device'} (${navigator.userAgent.slice(0, 32)})`,
    }, ...previous]);
    refreshAccounts();
  };

  const registerUser = (input: BusinessRegistrationInput): {
    success: boolean;
    message: string;
    workspaceId?: string;
    email?: string;
    adminName?: string;
    companyName?: string;
  } => {
    const result = registerBusiness(input);
    if (!result.success || !result.value) {
      return { success: false, message: result.message };
    }
    const { account, workspace: record } = result.value;

    const initialLic = calculateLicenseDetails('free', record.companyName, account.email);
    saveStoredLicense(record.id, initialLic);
    updateWorkspaceLicense(record.id, {
      planTier: 'free',
      licenseKey: initialLic.licenseKey,
      productKey: initialLic.productKey,
      licenseExpiresAt: initialLic.expiresAt,
      licenseStatus: initialLic.status,
    });

    // IMPORTANT: Do NOT auto-login (setCurrentUser) or redirect into the POS platform (setActiveView('pos'))!
    // Users registering for a paid tier must be directed to the real payment gateway next,
    // and users must explicitly sign in with their registered credentials to enter the POS platform.
    refreshAccounts();
    return {
      success: true,
      message: `${record.companyName} account registered for ${account.name} (${account.email}).`,
      workspaceId: record.id,
      email: account.email,
      adminName: account.name,
      companyName: record.companyName,
    };
  };

  const loginUser = (email: string, pass: string, role?: UserRole): { success: boolean; message: string } => {
    const result = authenticate(email, pass);
    if (!result.success || !result.value) {
      logAuditAction('Failed Login Attempt', `${email || 'unknown email'}: ${result.message}`);
      return { success: false, message: result.message };
    }
    const account = result.value;
    const store = ensureAccountStore();
    const record = store.workspaces[account.workspaceId];
    if (!record) {
      return { success: false, message: 'This login no longer belongs to a business workspace. Ask an administrator to recreate it.' };
    }
    if (role && !account.roles.includes(role)) {
      // The UI no longer lets people pick a different role at sign-in.
      logAuditAction('Role Override Refused', `${account.email} tried to sign in as ${role}; stored role(s) kept.`);
    }
    enterWorkspace(account, record, 'User Logged In');
    return {
      success: true,
      message: `Welcome back, ${account.name}. You are signed in to ${record.companyName} only.`,
    };
  };

  const logoutUser = () => {
    const activeId = workspaceIdRef.current;
    if (activeId) writeWorkspaceData(activeId, snapshotWorkspace());
    logAuditAction('User Logged Out', `User ${currentUser?.email} signed out`);
    // Drop merchant records from memory. They stay in their own workspace file
    // and are only restored when that same business signs in again.
    workspaceIdRef.current = null;
    setWorkspaceId(null);
    setCompany(INITIAL_COMPANY);
    setProducts([]);
    setSales([]);
    salesRef.current = [];
    setExpenses([]);
    setInvoices([]);
    setCustomers([]);
    setVendors([]);
    setTransporters([]);
    setMarketingTeam([]);
    setCompanyMembers([]);
    setRelatedCompanies([]);
    directoriesRef.current = { customers: [], vendors: [], transporters: [], marketingTeam: [], companyMembers: [], relatedCompanies: [] };
    setSalaryPayments([]);
    salaryRef.current = [];
    setTeamServiceBriefs([]);
    setReviews([]);
    setReceiptDispatches([]);
    setAuditLogs([]);
    setLandingMetrics(EMPTY_BUSINESS_METRICS);
    setSettings(INITIAL_SETTINGS);
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

  const lookupRecoveryAccount = (query: string, companyName = '') => findRecoveryProfile(query, companyName);
  const verifyRecoveryAnswersFor = (email: string, answers: Record<string, string>) => verifyRecoveryAnswers(email, answers);
  const resetAccountPassword = (email: string, answers: Record<string, string>, newPassword: string) => {
    const result = resetPasswordWithRecovery(email, answers, newPassword);
    if (result.success) {
      logAuditAction('Password Reset', `Recovery questions verified locally for ${email}; password changed in this browser.`);
      refreshAccounts();
    }
    return { success: result.success, message: result.message };
  };

  const assertWorkspaceAdmin = (action: string): { success: boolean; message: string } | null => {
    if (!currentUser) return { success: false, message: 'Sign in before managing team access.' };
    if (!currentUser.isAdmin) return { success: false, message: `Only the business administrator can ${action}.` };
    if (!workspaceIdRef.current) return { success: false, message: 'No business workspace is open.' };
    return null;
  };

  const createTeamLogin = (input: Omit<TeamLoginInput, 'workspaceId'>): { success: boolean; message: string } => {
    const denied = assertWorkspaceAdmin('create staff logins');
    if (denied) return denied;
    const result = createTeamAccount({ ...input, workspaceId: workspaceIdRef.current! });
    if (result.success) {
      refreshAccounts();
      logAuditAction('Team Login Created', `${input.memberName} (${input.email}) can now sign in to ${company.name} only.`);
    }
    return { success: result.success, message: result.message };
  };

  const updateTeamLogin = (email: string, update: TeamLoginUpdate): { success: boolean; message: string } => {
    const denied = assertWorkspaceAdmin('change staff logins');
    if (denied) return denied;
    const store = ensureAccountStore();
    const target = store.accounts[email.trim().toLowerCase()];
    if (!target || target.workspaceId !== workspaceIdRef.current) {
      return { success: false, message: 'That login belongs to another business workspace and cannot be changed here.' };
    }
    if (target.isAdmin && update.roles) {
      return { success: false, message: 'Administrator roles cannot be reduced from the team panel.' };
    }
    const result = updateTeamAccount(email, update);
    if (result.success) {
      refreshAccounts();
      logAuditAction('Team Login Updated', `Credentials for ${target.name} were updated by ${currentUser?.name}.`);
    }
    return { success: result.success, message: result.message };
  };

  const removeTeamLogin = (email: string): { success: boolean; message: string } => {
    const denied = assertWorkspaceAdmin('remove staff logins');
    if (denied) return denied;
    const store = ensureAccountStore();
    const target = store.accounts[email.trim().toLowerCase()];
    if (!target || target.workspaceId !== workspaceIdRef.current) {
      return { success: false, message: 'That login belongs to another business workspace and cannot be removed here.' };
    }
    if (currentUser?.email === target.email) {
      return { success: false, message: 'You cannot delete the login you are using. Sign in as another administrator first.' };
    }
    const result = removeTeamAccount(email);
    if (result.success) {
      refreshAccounts();
      logAuditAction('Team Login Removed', `${target.name} can no longer sign in. Their historical records stay in this workspace.`);
    }
    return { success: result.success, message: result.message };
  };

  const updateUserLicense = (
    tier: PlanTier,
    licenseKey: string,
    productKey: string,
    expiresAt: string,
    gateway: string = 'selar',
    targetWorkspaceId?: string,
    targetCompanyName?: string,
    targetEmail?: string
  ) => {
    const wsId = targetWorkspaceId || workspaceIdRef.current || currentUser?.workspaceId || DEFAULT_WORKSPACE_ID;
    const store = ensureAccountStore();
    const targetRecord = store.workspaces[wsId];
    const wsName = targetCompanyName || targetRecord?.companyName || workspaceRecord?.companyName || company.name || 'Business Workspace';
    const adminEmail = targetEmail || targetRecord?.ownerEmail || currentUser?.email || 'admin@business.com';
    const status: 'active' | 'grace_period' | 'expired' | 'perpetual' = tier === 'lifetime' ? 'perpetual' : 'active';

    const licDetails = calculateLicenseDetails(
      tier,
      wsName,
      adminEmail,
      licenseKey,
      productKey,
      new Date().toISOString(),
      expiresAt,
      gateway === 'gumroad' ? 'gumroad' : 'selar'
    );

    saveStoredLicense(wsId, licDetails);
    updateWorkspaceLicense(wsId, {
      planTier: tier,
      licenseKey,
      productKey,
      licenseExpiresAt: expiresAt,
      licenseStatus: status,
    });

    const existingData = readWorkspaceData(wsId);
    if (existingData) {
      writeWorkspaceData(wsId, {
        ...existingData,
        settings: { ...((existingData.settings as Record<string, unknown>) || {}), planTier: tier },
      });
    }

    refreshAccounts();

    if (currentUser && (currentUser.workspaceId === wsId || !targetWorkspaceId)) {
      setSettings((prev) => ({ ...prev, planTier: tier }));
      setCurrentUser((prev) => prev ? {
        ...prev,
        tier,
        licenseKey,
        productKey,
        licenseExpiresAt: expiresAt,
        licenseStatus: status,
      } : null);

      logAuditAction(
        'Updated Workspace Plan & License',
        `Activated ${tier.toUpperCase()} license (${licenseKey}) via ${gateway}. Product Key: ${productKey}. Expiration: ${expiresAt}`
      );
    }
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
        relatedCompanies,
        salaryPayments,
        teamServiceBriefs,
        saveTeamServiceBrief,
        recordSalaryPayment,
        setDemoPlan,
        hasFeature,
        reviews,
        setReviews,
        receiptDispatches,
        recordReceiptDispatch,
        clearReceiptDispatchLog,
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
        receiptModalIntent,
        setReceiptModalIntent,
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
        settleDebtMultiple,
        assignDebtHandler,
        recordDebtReminder,
        emailDebtHistory,
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
        workspace: workspaceRecord,
        workspaceAccounts,
        lookupRecoveryAccount,
        verifyRecoveryAnswersFor,
        resetAccountPassword,
        createTeamLogin,
        updateTeamLogin,
        removeTeamLogin,
        updateUserLicense,
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
