import { LinkCopyField } from '../common/LinkCopyField.tsx';
import { applicationUrl, isWorkspacePreview } from '../../utils/clipboard.ts';
import { accessHistoryPermissions } from '../../utils/accessHistory.ts';
import React from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Database,
  HelpCircle,
  Store,
  User,
  ShieldCheck,
  ChevronDown,
  ShoppingBag,
  History,
  Package,
  Receipt,
  FileText,
  BarChart3,
  Users,
  Truck,
  TrendingUp,
  Building2,
  Building,
  MessageSquare,
  Settings,
  Info,
  LogIn,
  Link2,
} from 'lucide-react';
import { PlatformId } from '../../types/index.ts';

const PLATFORMS: { id: PlatformId; label: string; icon: any }[] = [
  { id: 'selling', label: 'Sales POS', icon: ShoppingBag },
  { id: 'sales_history', label: 'Sales History', icon: History },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'analytics', label: 'Analytics & P&L', icon: BarChart3 },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'vendors', label: 'Vendors', icon: Building2 },
  { id: 'transporters', label: 'Transporters', icon: Truck },
  { id: 'marketing_team', label: 'Marketing Team', icon: TrendingUp },
  { id: 'company_members', label: 'Company Members', icon: Users },
  { id: 'my_company', label: 'My Company', icon: Building },
  { id: 'messaging', label: 'Messaging', icon: MessageSquare },
  { id: 'landing_page_builder', label: 'Business Landing Page', icon: Store },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'audit_logs', label: 'Audit & Access Logs', icon: ShieldCheck },
  { id: 'about', label: 'About & Manual', icon: Info },
];

export const TopNavBar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    activePlatform,
    setActivePlatform,
    viewportMode,
    setViewportMode,
    setDemoWarningOpen,
    setHoverHelpPlatform,
    currentUser,
    setLoginModalOpen,
    theme,
    settings,
  } = usePOS();

  const isLight = theme === 'light';
  const appUrl = applicationUrl(window.location.href, import.meta.env.BASE_URL);
  const historyAccess = accessHistoryPermissions(currentUser, settings);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-200 ${
        isLight
          ? 'bg-white border-b border-slate-200 text-slate-800 shadow-sm'
          : 'bg-slate-900 border-b border-slate-800 text-white shadow-md'
      }`}
    >
      {/* Upper Brand & Global Actions Strip */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        {/* Brand & User on mobile top bar */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveView('pos');
              setActivePlatform('selling');
            }}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center font-black text-white text-sm sm:text-base shadow-lg shadow-teal-500/20 group-hover:scale-105 transition">
              76
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span
                  className={`font-extrabold tracking-tight text-base sm:text-lg ${
                    isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  CODE<span className="text-teal-500">76</span> POS
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider rounded ${
                    isLight
                      ? 'bg-teal-100 text-teal-800 border border-teal-300'
                      : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  }`}
                >
                  Enterprise
                </span>
              </div>
              <p
                className={`text-[9px] sm:text-[10px] hidden md:block ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Product & Service SaaS ERP System
              </p>
            </div>
          </button>

          {/* Active session and help on mobile */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <button
              onClick={() => setHoverHelpPlatform(activePlatform)}
              title="Click to view help guide and settings for this platform"
              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-slate-100 text-teal-700 border-slate-300'
                  : 'bg-slate-800 text-teal-400 border-slate-700'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLoginModalOpen(true)}
              aria-label="Active user session and access controls" aria-haspopup="dialog"
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border text-xs transition cursor-pointer ${
                isLight
                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-slate-800/80 text-slate-200 border-slate-700'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-500 font-bold flex items-center justify-center text-[10px]">
                {currentUser?.name?.slice(0, 2).toUpperCase() || '76'}
              </div>
            </button>
          </div>
        </div>

        {/* Viewport Switcher & Right Actions */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
          {/* Viewport Sizing Switcher (Desktop, Laptop, Tablet, Phone) */}
          <div
            className={`flex items-center p-0.5 sm:p-1 rounded-xl border shrink-0 ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <button
              onClick={() => setViewportMode('desktop')}
              title="Desktop View (Full Width)"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewportMode === 'desktop'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setViewportMode('laptop')}
              title="Laptop View (1024px)"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewportMode === 'laptop'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setViewportMode('tablet')}
              title="Tablet View (768px)"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewportMode === 'tablet'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setViewportMode('phone')}
              title="Phone Mobile View (390px)"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewportMode === 'phone'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Demo data, private business preview, help and the active session */}
          <div className="flex items-center gap-1.5 sm:gap-2">


            {/* Demo Data button with confirmation modal */}
            <button
              onClick={() => setDemoWarningOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap"
              title="Load comprehensive test demo data or wipe database"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Demo Data</span>
            </button>

            {/* Internal business-page shortcut; public return is through session sign-out */}
            {currentUser && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActivePlatform('landing_page_builder')}
                  title="Open your private Business Landing Page inside the POS"
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                    activePlatform === 'landing_page_builder'
                      ? 'bg-emerald-600 text-white'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-teal-400" />
                  <span className="hidden sm:inline">Business Page</span>
                </button>
              </div>
            )}

            {/* Platform Hover Help trigger (Desktop) */}
            <button
              onClick={() => setHoverHelpPlatform(activePlatform)}
              title="Click to view help guide and settings for this platform"
              className={`hidden sm:block p-1.5 rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-teal-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Current User & Login/Logout trigger (Desktop) */}
            {currentUser ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLoginModalOpen(true)}
              aria-label="Active user session and access controls" aria-haspopup="dialog"
                  className={`hidden sm:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs transition cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
                      : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-100'
                  }`}
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-teal-500/20 text-teal-500 font-bold flex items-center justify-center text-[10px]">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="font-semibold leading-none">{currentUser.name}</div>
                    <div className="text-[10px] text-teal-500 leading-none mt-0.5">
                      Role: {currentUser.roles[0] || 'Member'}
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
              aria-label="Active user session and access controls" aria-haspopup="dialog"
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Copy the actual application root, never a private route or access token. */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <Link2 className="w-4 h-4 shrink-0 text-teal-500" aria-hidden="true" />
          <span className="hidden sm:block shrink-0 text-xs font-semibold">App link</span>
          <LinkCopyField value={appUrl} label="App link" compact openLink />
        </div>
        <p className={`mt-1 text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {isWorkspacePreview(appUrl) ? 'Workspace preview: another browser may need authorized Arena preview access. ' : 'Open this root link to reach CODE76 sign-in/register. '}
          Browser-local records and sessions do not sync between browsers.
        </p>
      </div>

      {/* Lower Platform Navigation Strip (Only shown when authenticated in POS view) */}
      {currentUser && activeView === 'pos' && (
        <div className="border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 py-1.5 min-w-max">
            {PLATFORMS.filter(platform => platform.id !== 'audit_logs' || historyAccess.canView).map((plat) => {
              const Icon = plat.icon;
              const isActive = activePlatform === plat.id;
              return (
                <button
                  key={plat.id}
                  onClick={() => setActivePlatform(plat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-600/30 text-teal-300 border border-teal-500/40 shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                  {plat.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
