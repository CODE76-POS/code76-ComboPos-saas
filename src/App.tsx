import React from 'react';
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
  const { activeView, activePlatform, viewportMode, setViewportMode, settings, theme, currentUser } = usePOS();
  const isLight = theme === 'light';

  // Viewport mode sizing wrapper
  const getViewportClass = () => {
    const bgClass = isLight ? 'bg-slate-50' : 'bg-slate-950';
    const borderClass = isLight ? 'border-slate-300' : 'border-slate-800';
    switch (viewportMode) {
      case 'phone':
        return `max-w-[390px] mx-auto min-h-screen border-x ${borderClass} shadow-2xl overflow-x-hidden transition-all duration-300 ${bgClass}`;
      case 'tablet':
        return `max-w-[768px] mx-auto min-h-screen border-x ${borderClass} shadow-2xl overflow-x-hidden transition-all duration-300 ${bgClass}`;
      case 'laptop':
        return `max-w-[1024px] mx-auto min-h-screen border-x ${borderClass} shadow-2xl overflow-x-hidden transition-all duration-300 ${bgClass}`;
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

  // Text scale class
  const getTextSizingClass = () => {
    switch (settings.textSizing) {
      case 'compact':
        return 'text-xs';
      case 'large':
        return 'text-base';
      case 'xlarge':
        return 'text-lg';
      default:
        return 'text-sm';
    }
  };

  const renderActivePlatform = () => {
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
            title="Vendors & Hardware Suppliers"
            subtitle="Hardware importers, thermal paper manufacturers, and wholesale distributor accounts."
            platformId="vendors"
          />
        );
      case 'transporters':
        return (
          <DirectoryPlatform
            category="transporter"
            title="Transporters & Freight Logistics"
            subtitle="Delivery fleet and dispatch couriers handling on-site customer deliveries. (Auto-synced from Company Members)."
            platformId="transporters"
          />
        );
      case 'marketing_team':
        return (
          <DirectoryPlatform
            category="marketer"
            title="Marketing & Growth Team"
            subtitle="Sales agents, social media growth specialists, and brand ambassadors. (Auto-synced from Company Members)."
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
      style={getFontStyle()}
      className={`min-h-screen transition-colors duration-200 ${
        isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      } ${getTextSizingClass()}`}
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
        {currentUser && activeView === 'pos' && <TopNavBar />}

        {/* Content Body: Public Landing Page vs Business Storefront vs Protected POS Platforms */}
        <main className="min-w-0">
          {activeView === 'storefront' ? (
            <BusinessStorefrontLandingPage />
          ) : !currentUser || activeView === 'landing' ? (
            <LandingPage />
          ) : (
            renderActivePlatform()
          )}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <DemoWarningModal />
      <HoverHelpModal />
      <MarketingCampaignModal />
      <ReceiptModal />
      <ReviewCaptureModal />
      <LoginModal />
      <CompanyQAOnboardingModal />
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <POSContent />
    </POSProvider>
  );
}
