export type UserRole =
  | 'CEO'
  | 'Manager'
  | 'Ass-Manager'
  | 'Supervisor'
  | 'Marketor'
  | 'Associate'
  | 'Ass-Supervisor'
  | 'Director'
  | 'Company HR'
  | 'Company HR 2'
  | 'Ass-Cashier'
  | 'Cashier'
  | 'Accountant'
  | 'Basor'
  | 'Technician'
  | 'Maintainance'
  | 'Cleaner'
  | 'Erands-Person'
  | 'Developer'
  | 'Transporter/Driver'
  | 'Other';

export const ALL_ROLES: UserRole[] = [
  'CEO',
  'Manager',
  'Ass-Manager',
  'Supervisor',
  'Marketor',
  'Associate',
  'Ass-Supervisor',
  'Director',
  'Company HR',
  'Company HR 2',
  'Ass-Cashier',
  'Cashier',
  'Accountant',
  'Basor',
  'Technician',
  'Maintainance',
  'Cleaner',
  'Erands-Person',
  'Developer',
  'Transporter/Driver',
  'Other',
];

export type PlatformId =
  | 'selling'
  | 'sales_history'
  | 'inventory'
  | 'expenses'
  | 'invoices'
  | 'analytics'
  | 'customers'
  | 'vendors'
  | 'transporters'
  | 'marketing_team'
  | 'company_members'
  | 'my_company'
  | 'messaging'
  | 'landing_page_builder'
  | 'settings'
  | 'audit_logs'
  | 'about';

export type AvatarStyle = 'neutral' | 'masculine' | 'feminine';
export type DirectoryCategory = 'customer' | 'vendor' | 'transporter' | 'marketer' | 'company_member' | 'related_company';
export type CompanyFunction = 'vendor' | 'transporter' | 'marketer';
export type PayBasis = 'month' | 'week' | 'day' | 'hour' | 'task' | 'delivery' | 'session' | 'project';
export type PlanTier = 'free' | 'starter' | 'pro' | 'max' | 'lifetime';
export interface TeamServiceBrief {
  id:string; serviceId:string; businessName:string; website:string; goal:string;
  scope:string; contact:string; authorized:boolean; createdAt:string;
  createdBy:string; status:'local_draft';
}
export type TeamServiceBriefDraft=Omit<TeamServiceBrief,'id'|'createdAt'|'createdBy'|'status'>;
export interface RegionalSettings {
  timeZone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  holidayDates: string[];
}

export interface PersonRecord {
  id: string;
  firstName: string;
  secondName: string;
  tel1: string;
  tel2: string;
  whatsappNo: string;
  email1: string;
  email2: string;
  address: string;
  location: string;
  country: string;
  photoUrl: string;
  photoConsentForLanding: boolean;
  category: DirectoryCategory;
  entityType?: 'person' | 'company' | 'branch';
  avatarStyle?: AvatarStyle;
  organisationName?: string;
  companyType?: string;
  companyFunctions?: CompanyFunction[];
  parentCompanyId?: string;
  regNumber?: string;
  taxPin?: string;
  sourceCategory?: DirectoryCategory;
  companyMember?: boolean;
  customerCompany?: boolean;
  shiftPreset?: string;
  shiftStart?: string;
  shiftEnd?: string;
  offDays?: string[];
  salaryRate?: number;
  salaryBasis?: PayBasis;
  roles?: [UserRole, UserRole]; // Exactly 2 roles for company members
  workingDays?: string[]; // e.g. ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  workingHours?: string; // e.g. '08:00 AM - 05:00 PM'
  notes?: string;
  createdAt: string;
  referralCount?: number;
  totalReferralVolume?: number;
  isTopReferrer?: boolean;
}

export type ServiceBillingUnit = 'task' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'session' | 'visit' | 'project';

export interface ProductItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  name2?: string; // Item Name 2 / Nickname
  category: string; // Main Category / Main Niche
  subCategory?: string; // Sub-Category / Sub-Niche
  type: 'product' | 'service'; // Product stock or a billable service
  serviceUnit?: ServiceBillingUnit; // Service rate basis; never a stock quantity
  ageRestriction?: string; // Age restriction (e.g. 'All Ages', '13+', '18+', '21+')
  costPrice: number;
  sellingPrice: number;
  isOnPromo?: boolean;
  promoCode?: string;
  promoDiscountType?: 'percentage' | 'fixed';
  promoDiscountValue?: number;
  promoDiscountPrice?: number;
  promoExpiresAt?: string;
  stock: number;
  minStockAlert: number;
  description: string;
  imageUrl: string;
  isFeatured?: boolean;
  createdAt: string;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
  unitPrice: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  total: number;
}

export type PaymentMethod = 'Cash' | 'M-Pesa' | 'Airtel Money' | 'T-Kash' | 'Credit Card' | 'Bank Transfer' | 'Debit Card' | 'Credit / Debt' | 'Cheque' | 'PayPal' | 'Gift Card' | 'Voucher' | 'Crypto' | 'Other' | 'Card' | 'Bank Wire';
export interface PartySnapshot {
  id: string; name: string; entityType: string; companyType: string;
  parentCompanyName?: string; address: string; location: string; country: string;
  tel: string; whatsapp: string; email: string; regNumber: string; taxPin: string;
}
export interface SalaryPayment {
  id: string; memberId: string; memberName: string; amount: number; currency: string;
  basis: PayBasis; paidOn: string; paidFor: string; method: string; reference: string;
  recordedAt: string; recordedBy: string; expenseId?: string;
}
export interface SalaryPaymentDraft {
  id: string; memberId: string; amount: number; basis: PayBasis; paidOn: string;
  paidFor: string; method: string; reference: string; recordExpense: boolean;
}

export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
  referenceNo?: string;
}

export interface ExtraCharge {
  id: string;
  reason: 'Tax' | 'Transportation' | 'Packaging' | 'Delivery' | 'Service Fee' | 'Installation' | 'Custom';
  amount: number;
  description?: string;
}

export interface SaleTransaction {
  id: string;
  receiptNo: string;
  timestamp: string;
  customerId: string;
  customerName: string;
  customerContact?: string;
  cashierId: string;
  cashierName: string;
  items: CartItem[];
  subtotal: number;
  overallDiscountType: 'percentage' | 'fixed';
  overallDiscountValue: number;
  extraCharges: ExtraCharge[];
  taxAmount: number;
  netTotal: number;
  payments: PaymentSplit[];
  amountPaid: number;
  debtAmount: number;
  debtSettledDate?: string;
  debtDueDate?: string;
  debtPayments?: import('../utils/debt.ts').DebtPaymentRecord[];
  referredBy?: {
    id: string;
    name: string;
    role: string; // e.g. "Peter Nick (Customer)"
  };
  status: 'completed' | 'debt_partial' | 'debt_pending';
  saleType?: 'pos_sale' | 'sales_invoice';
  invoiceId?: string;
  hasReview?: boolean;
  notes?: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  category: 'Rent' | 'Utilities' | 'Salaries' | 'Logistics' | 'Marketing' | 'Supplies' | 'Maintenance' | 'Tax' | 'Other';
  amount: number;
  date: string;
  vendorName: string;
  paymentMethod: string;
  description: string;
  receiptUrl?: string;
  relatedCompanyId?: string;
  partySnapshot?: PartySnapshot;
  salaryPaymentId?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNo: string;
  type: 'sales' | 'stock_purchase';
  saleId?: string;
  partyName: string;
  partyType: 'Customer' | 'Vendor';
  relatedCompanyId?: string;
  partySnapshot?: PartySnapshot;
  date: string;
  dueDate: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  status: 'paid' | 'pending' | 'overdue';
  notes?: string;
}

export interface CustomerReview {
  isDemo?: boolean;
  avatarStyle?: AvatarStyle;
  id: string;
  customerName: string;
  customerPhotoUrl?: string;
  customerLocation?: string;
  rating: number; // 1-5
  comment: string;
  saleId?: string;
  productName?: string;
  date: string;
  isApprovedForLanding: boolean;
  isVerifiedPurchase: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string; // e.g. "User Logged In", "Completed Sale #7601", "Imported Inventory CSV"
  details: string;
  ipOrDevice: string;
}

export interface CompanyData {
  name: string;
  slogan: string;
  vision: string;
  logoUrl: string;
  coverUrl: string;
  regNumber: string;
  taxPin: string;
  email: string;
  tel1: string;
  tel2: string;
  whatsapp: string;
  address: string;
  location: string;
  country: string;
  currency: string;
  operatingHours: string;
  isConfiguredByMerchant?: boolean;
  isDemo?: boolean;
}

export interface FinancialHealth {
  grossRevenue: number;
  totalExpenses: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
  netProfitMarginPercent: number;
  isProfitable: boolean;
  inventoryValuation: number;
}

export interface LandingMetrics {
  visitors: number;
  avgTimeOnPageSeconds: number;
  chatbotConversations: number;
  leadsCaptured: number;
  referralVisits: number;
  totalLandingSales: number;
}

export interface InquiryLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  location?: string;
  preferredContact: 'WhatsApp' | 'Phone Call' | 'Email';
  productId: string;
  productName: string;
  productPrice: number;
  productType: 'product' | 'service';
  notes?: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'appointment_booked' | 'converted' | 'closed';
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: 'discount' | 'new_product' | 'stock_alert' | 'review_request' | 'general';
  body: string;
}

export type SettingsSection = 'payments' | 'textSizing' | 'landingPage' | 'receipts' | 'appearance' | 'font' | 'backup' | 'privileges' | 'pdfExcel' | 'emailTemplates' | 'auditLogs' | 'dataEraser' | 'regional' | 'plans' | 'teamServices' | 'demoData' | 'chatbot' | 'teamAccess';

/** Output formats a receipt can be exported to without a print dialog. */
export type ReceiptFormat = 'pdf' | 'txt' | 'csv' | 'json' | 'html';
export type ReceiptChannel = 'email' | 'whatsapp' | 'sms' | 'copy';

/** One recorded attempt to hand a receipt to a customer. Local bookkeeping only. */
export interface ReceiptDispatch {
  id: string;
  saleId: string;
  receiptNo: string;
  channel: ReceiptChannel;
  recipient: string;
  format: ReceiptFormat;
  sentAt: string;
  sentBy: string;
  /** `opened` = an OS/share link or mail client was opened; no server delivery is claimed. */
  status: 'opened' | 'copied';
  note?: string;
}

/** Merchant chatbot / assistant configuration for the private business page. */
export interface ChatbotSettings {
  enabled: boolean;
  assistantName: string;
  greeting: string;
  /** Short description of how the assistant should speak. */
  tone: 'friendly' | 'professional' | 'concise';
  quickPrompts: string[];
  /** Shown when the assistant cannot answer from the catalogue. */
  fallbackMessage: string;
  handoffContact: string;
  showPrices: boolean;
  showStock: boolean;
  collectLeads: boolean;
  offlineNotice: string;
  /** Public CODE76-site assistant is controlled by CODE76, not the merchant. */
  code76SurfaceEnabled?: boolean;
}

export interface AppSettings {
  /** Demo entitlements only, not a verified paid subscription. */
  planTier?: PlanTier;
  regional?: RegionalSettings;
  payments: {
    acceptedMethods: string[];
    defaultCurrency: string;
    taxRatePercentage: number;
    allowDebtSales: boolean;
  };
  textSizing: 'compact' | 'normal' | 'large' | 'xlarge';
  /** Merchant Business Landing Page ONLY. CODE76 public-site content lives in config/code76Site.ts. */
  landingPage: {
    contentVersion?: number;
    heroTitle: string;
    heroSubtitle: string;
    featuredCount: number;
    slideshowSpeedMs: number;
    showSocialProof: boolean;
    showChatbot: boolean;
    referralBonusText: string;
    topReferrersLimit: number;
    showPromoCountdown?: boolean;
    customInstagram?: string;
    customTwitter?: string;
    customWhatsappDirect?: string;
    shareableLinkSlogan?: string;
  };
  receipts: {
    headerTitle: string;
    subtitle: string;
    footerNotice: string;
    returnPolicy: string;
    showBarcode: boolean;
    showTaxPin: boolean;
    /** Ask the cashier to send/download the receipt right after checkout. */
    promptAfterSale?: boolean;
    /** Formats offered in the receipt download menu. PDF is always available. */
    enabledFormats?: ReceiptFormat[];
    /** Channels offered in the receipt send panel. */
    enabledChannels?: ReceiptChannel[];
    defaultChannel?: ReceiptChannel;
    /** Message used when sharing a receipt link/text. Tokens: {customer} {company} {receipt} {total} {currency} {date}. */
    sendMessageTemplate?: string;
    /** Automatically open the receipt preview after a completed sale. */
    autoOpenAfterSale?: boolean;
    /** Show the merchant's bank/till details on the receipt. */
    paymentInstructions?: string;
  };
  appearance: {
    theme: 'light' | 'dark';
    accentColor: string; // 'emerald' | 'blue' | 'purple' | 'amber' | 'cyan'
    cartPosition: 'left' | 'right';
    showProductGridBelowSearch: boolean;
    neonGlowIntensity?: 'vibrant' | 'subtle' | 'off';
    enableHoverEffects?: boolean;
  };
  font: {
    fontFamily: 'Inter' | 'Plus Jakarta Sans' | 'Outfit' | 'Roboto' | 'Playfair';
  };
  privileges: Record<UserRole, {
    canSell: boolean;
    canViewInventory: boolean;
    canEditInventory: boolean;
    canAdjustStock?: boolean;
    canViewExpenses: boolean;
    canEditExpenses: boolean;
    canViewInvoices: boolean;
    canViewAnalytics: boolean;
    canManagePeople: boolean;
    canExportPdf: boolean;
    canImportCsv: boolean;
    canViewAuditLogs: boolean;
    canModifySettings: boolean;
    /** Optional newer controls; legacy saved settings fall back to a documented default. */
    canSettleDebt?: boolean;
    canSendReceipts?: boolean;
    canEditLandingPage?: boolean;
    canManageChatbot?: boolean;
    canDeleteData?: boolean;
    canManageSchedules?: boolean;
  }>;
  emailTemplates: EmailTemplate[];
  /** Merchant business-page assistant. Never used by the CODE76 public site. */
  chatbot?: ChatbotSettings;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: [UserRole, UserRole];
  avatarUrl?: string;
  isAdmin: boolean;
  /** Business workspace this session may read. Data from other workspaces is never loaded. */
  workspaceId?: string;
}
