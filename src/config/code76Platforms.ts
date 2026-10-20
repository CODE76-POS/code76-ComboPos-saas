import { ShoppingBag, History, Package, Receipt, FileText, BarChart3, Users, Building2, Truck, TrendingUp, Building, MessageSquare, Store, Settings, ShieldCheck, Info, Sparkles } from 'lucide-react';

/** Actual app modules, not promises of unconfigured integrations or public publishing. */
export const CODE76_PLATFORMS = [
  { id: 'setup', name: 'Guided workspace setup', icon: Sparkles, benefit: 'Choose readable text and a theme, enter your company details, and add your first real products or services at your own pace.' },
  { id: 'selling', name: 'Sales POS & checkout', icon: ShoppingBag, benefit: 'Build a cart, apply discounts and record one payment or split payment methods in a single checkout workflow.' },
  { id: 'inventory', name: 'Products & service inventory', icon: Package, benefit: 'Organize SKUs and prices, track product stock, and set service billing units such as per task, per hour or per day.' },
  { id: 'sales_history', name: 'Sales history & receipts', icon: History, benefit: 'Find recorded transactions, review receipts and track outstanding balances without searching through paper notes.' },
  { id: 'expenses', name: 'Expense tracking', icon: Receipt, benefit: 'Keep operating costs and payment details together so you can review where business money is going.' },
  { id: 'invoices', name: 'Sales & purchase invoices', icon: FileText, benefit: 'Prepare invoices, review payment status and keep customer and supplier documents organized.' },
  { id: 'analytics', name: 'Business analytics & reporting', icon: BarChart3, benefit: 'Review recorded sales, expenses and inventory dashboards to support day-to-day business decisions.' },
  { id: 'customers', name: 'Customer directory', icon: Users, benefit: 'Keep customer contact records and inquiries together for easier follow-up and relationship management.' },
  { id: 'vendors', name: 'Vendor directory', icon: Building2, benefit: 'Organize supplier contacts and reference information for purchasing and restocking conversations.' },
  { id: 'transporters', name: 'Transport & delivery contacts', icon: Truck, benefit: 'Keep transporters and driver contact details accessible when coordinating business deliveries.' },
  { id: 'marketing_team', name: 'Marketing team directory', icon: TrendingUp, benefit: 'Maintain your marketing contacts and referral information in one place instead of scattered lists.' },
  { id: 'company_members', name: 'Company members & roles', icon: Users, benefit: 'Organize staff records and active roles so responsibilities are clearer across your workspace.' },
  { id: 'my_company', name: 'My Company profile', icon: Building, benefit: 'Manage the merchant identity and contact details used by business documents and your private business-page preview.' },
  { id: 'messaging', name: 'Messaging & communication drafts', icon: MessageSquare, benefit: 'Prepare customer communications and reusable message content. Delivery still depends on the configured communication service.' },
  { id: 'landing_page_builder', name: 'Private Business Landing Page', icon: Store, benefit: 'Preview your business identity, live inventory and approved reviews inside the authenticated POS—not as a publicly published storefront.' },
  { id: 'settings', name: 'Appearance & workspace settings', icon: Settings, benefit: 'Adjust light/dark appearance, text sizing, receipt preferences and role privileges without changing the public CODE76 website.' },
  { id: 'audit_logs', name: 'User access history & exports', icon: ShieldCheck, benefit: 'Authorized users can review activity and session records and download filtered PDF, TXT or CSV reports.' },
  { id: 'about', name: 'Platform help & user manual', icon: Info, benefit: 'Find workflow guidance and explanations of the actual navigation icons whenever you need a refresher.' },
] as const;
