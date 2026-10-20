import { canOpenPlatform } from './utils/plans.ts';
import { PlanNotice } from './components/common/PlanNotice.tsx';
import React, { useEffect } from 'react';
import { resolveAppSurface } from './utils/appRouting.ts';
import { applyDocumentSeo } from './utils/siteSeo.ts';
import { Code76SiteProvider } from './context/Code76SiteContext.tsx';
import { POSProvider, usePOS } from './context/POSContext.tsx';
import { TopNavBar } from './components/navigation/TopNavBar.tsx';
import { SalesPlatform } from './components/platforms/SalesPlatform.tsx';
import { SalesHistoryPlatform } from './components/platforms/SalesHistoryPlatform.tsx';
import { InventoryPlatform } from './components/platforms/InventoryPlatform.tsx';
import { ExpensesPlatform } from './components/platforms/ExpensesPlatform.tsx';
import { InvoicesPlatform } from './components/platforms/InvoicesPlatform.tsx';
import { AnalyticsPlatform } from './components/platforms/AnalyticsPlatform.tsx';
import { DirectoryPlatform } from './components/platforms/DirectoryPlatform.tsx';
import { MyCompanyPlatform } from './components/platforms/MyCompanyPlatform.tsx';
import { MessagingPlatform } from './components/platforms/MessagingPlatform.tsx';
import { SettingsPlatform } from './components/platforms/SettingsPlatform.tsx';
import { AuditLogPlatform } from './components/platforms/AuditLogPlatform.tsx';
import { AboutPlatform } from './components/platforms/AboutPlatform.tsx';
import { LandingPage } from './components/landing/LandingPage.tsx';
import { BusinessStorefrontLandingPage } from './components/landing/BusinessStorefrontLandingPage.tsx';

// Modals
import { DemoWarningModal } from './components/modals/DemoWarningModal.tsx';
import { HoverHelpModal } from './components/modals/HoverHelpModal.tsx';
import { MarketingCampaignModal } from './components/modals/MarketingCampaignModal.tsx';
import { ReceiptModal } from './components/modals/ReceiptModal.tsx';
import { ReviewCaptureModal } from './components/modals/ReviewCaptureModal.tsx';
import { LoginModal } from './components/modals/LoginModal.tsx';
import { CompanyQAOnboardingModal } from './components/modals/CompanyQAOnboardingModal.tsx';

const POSContent: React.FC = () => {
  const { activeView, activePlatform, viewportMode, setViewportMode, settings, theme, currentUser, hasFeature, hasPrivilege } = usePOS();
  const isLight = theme === 'light';
  const authenticatedWorkspace = !!currentUser && activeView === 'pos';
  const surface = resolveAppSurface({ view: activeView, platform: activePlatform }, !!currentUser);
  useEffect(() => {
    if (authenticatedWorkspace) applyDocumentSeo(document, true, activePlatform === 'landing_page_builder');
  }, [authenticatedWorkspace, activePlatform]);

  // Viewport mode sizing wrapper
  const getViewportClass = () => {
    const bgClass = isLight ? 'bg-slate-50' : 'bg-slate-950';
    const borderClass = isLight ? 'border-slate-300' : 'border-slate-800';
    switch (viewportMode) {
      case 'phone':
        return `max-w-[390px] mx-auto min-h-screen border-x ${borderClass} shadow-2xl overflow-x-clip transition-all duration-300 ${bgClass}`;
      case 'tablet':
        return `max-w-[768px] mx-auto min-h-screen border-x ${borderClass} shadow-2xl overflow-x-clip transition-all duration-300 ${bgClass}`;
      case 'laptop':
        return `max-w-[1024px] mx-auto min-h-screen border-x ${borderClass} shadow-2xl overflow-x-clip transition-all duration-300 ${bgClass}`;
      default:
        return `w-full min-h-screen transition-all duration-300 ${bgClass}`;
    }
  };

  // Font family inline style
  const getFontStyle = () => {
    switch (settings.font.fontFamily) {
      case 'Plus Jakarta Sans':
        return { fontFamily: '"Plus Jakarta Sans", sans-serif' };
      case 'Outfit':
        return { fontFamily: '"Outfit", sans-serif' };
      case 'Roboto':
        return { fontFamily: '"Roboto", sans-serif' };
      case 'Playfair':
        return { fontFamily: '"Playfair Display", serif' };
      default:
        return { fontFamily: '"Inter", sans-serif' };
    }
  };

  const renderActivePlatform = () => {
    if (!canOpenPlatform(settings, activePlatform)) return <PlanNotice feature={activePlatform.replace(/_/g, ' ')} />;
    const platformPermissions: Partial<Record<typeof activePlatform, Parameters<typeof hasPrivilege>[0]>> = { selling:'canSell', sales_history:'canSell', inventory:'canViewInventory', expenses:'canViewExpenses', invoices:'canViewInvoices', analytics:'canViewAnalytics', company_members:'canManagePeople' };
    const permission = platformPermissions[activePlatform];
    if(permission && !hasPrivilege(permission)) return <div role="alert" className="m-8 rounded-xl border border-amber-800 p-6">Your current role does not have permission to open this platform. Ask your administrator.</div>;
    switch (activePlatform) {
      case 'selling':
        return <SalesPlatform />;
      case 'sales_history':
        return <SalesHistoryPlatform />;
      case 'inventory':
        return <InventoryPlatform />;
      case 'expenses':
        return <ExpensesPlatform />;
      case 'invoices':
        return <InvoicesPlatform />;
      case 'analytics':
        return <AnalyticsPlatform />;
      case 'customers':
        return (
          <DirectoryPlatform
            category="customer"
            title="Customers Directory"
            subtitle="Verified client records, purchase history, and referral point attribution."
            platformId="customers"
          />
        );
      case 'vendors':
        return (
          <DirectoryPlatform
            category="vendor"
            title="Vendors & Suppliers"
            subtitle="People, vendor companies and supplier branches, linked to your company directory."
            platformId="vendors"
          />
        );
      case 'transporters':
        return (
          <DirectoryPlatform
            category="transporter"
            title="Transporters & Freight Logistics"
            subtitle="External drivers, transport companies and staff with Transporter/Driver roles share linked identities."
            platformId="transporters"
          />
        );
      case 'marketing_team':
        return (
          <DirectoryPlatform
            category="marketer"
            title="Marketing & Growth Team"
            subtitle="Individual agents, marketing companies and staff with Marketor roles, without duplicate identities."
            platformId="marketing_team"
          />
        );
      case 'company_members':
        return (
          <DirectoryPlatform
            category="company_member"
            title="Company Members & Staff Directory"
            subtitle="Internal staff with mandatory dual-role job titles and auto-synchronization to Transporters and Marketing Team."
            platformId="company_members"
          />
        );
      case 'my_company':
        return <MyCompanyPlatform />;
      case 'messaging':
        return <MessagingPlatform />;
      case 'landing_page_builder':
        return <BusinessStorefrontLandingPage />;
      case 'settings':
        return <SettingsPlatform />;
      case 'audit_logs':
        return <AuditLogPlatform />;
      case 'about':
        return <AboutPlatform />;
      default:
        return <SalesPlatform />;
    }
  };

  return (
    <div
      data-surface={surface}
      data-pos-theme={surface === 'pos' ? theme : undefined}
      data-text-size={surface === 'pos' ? settings.textSizing : undefined}
      style={surface === 'pos' ? getFontStyle() : { fontFamily: 'Inter, sans-serif' }}
      className={`min-h-screen transition-colors duration-200 ${surface === 'pos' ? 'pos-workspace' : ''} ${
        surface === 'pos' && isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Device Simulation Banner when in non-desktop viewport */}
      {viewportMode !== 'desktop' && (
        <div className="bg-slate-900/90 border-b border-teal-500/30 px-4 py-2 sticky top-0 z-50 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
            <span className="font-bold text-teal-300">
              {viewportMode === 'phone'
                ? '📱 Mobile Phone Viewport (390px simulated)'
                : viewportMode === 'tablet'
                ? '📱 Tablet Viewport (768px simulated)'
                : '💻 Laptop Viewport (1024px simulated)'}
            </span>
            <span className="text-slate-400 hidden sm:inline">
              — All widgets, tables, charts & navigation auto-resize smoothly
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setViewportMode('desktop')}
              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold transition cursor-pointer text-[11px]"
            >
              Reset to Full Desktop
            </button>
          </div>
        </div>
      )}

      <div className={getViewportClass()}>
        {/* Navigation Bar (Protected Internal POS Routes Only) */}
        {authenticatedWorkspace && <TopNavBar />}

        {/* All merchant screens, including the builder, share the same authentication guard. */}
        <main className="min-w-0">
          {authenticatedWorkspace ? renderActivePlatform() : <LandingPage requiresSignIn={activeView === 'pos'} />}
        </main>
      </div>

      {/* Private dialogs must never mount on the public website or after sign-out. */}
      {authenticatedWorkspace && <>
        <DemoWarningModal />
        <HoverHelpModal />
        {hasFeature('inventory_marketing') && hasFeature('email') && <MarketingCampaignModal />}
        <ReceiptModal />
        {hasFeature('business_landing') && <ReviewCaptureModal />}
        <LoginModal />
        <CompanyQAOnboardingModal />
      </>}
    </div>
  );
};

export default function App() {
  return (
    <Code76SiteProvider>
      <POSProvider>
        <POSContent />
      </POSProvider>
    </Code76SiteProvider>
  );
}
