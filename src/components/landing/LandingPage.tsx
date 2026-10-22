import { brandAssetUrl } from '../../config/code76Brand.ts';
import { Code76SocialLinks } from '../common/Code76Credit.tsx';
import { LandingSectionNav } from './LandingSectionNav.tsx';
import { useMeasuredHeader } from '../../hooks/useMeasuredHeader.ts';
import { PlanOverview } from './PlanOverview.tsx';
import { CODE76_PLATFORMS } from '../../config/code76Platforms.ts';
import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { useCode76Site } from '../../context/Code76SiteContext.tsx';
import { CODE76_SITE } from '../../config/code76Site.ts';
import { PublicLandingMetadata } from './PublicLandingMetadata.tsx';
import {
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Users,
  Database,
  Store,
  Clock,
  LogIn,
  LogOut,
  Lock,
  UserPlus,
  AlertCircle,
  Zap,
  BarChart3,
  Receipt,
  Check,
  Printer,
  QrCode,
  DollarSign,
  TrendingUp,
  Award,
  HelpCircle,
  Monitor,
  Smartphone,
  Send,
  Shield,
  FileText,
  FileSpreadsheet,
  HardDrive,
  Eye,
  History,
  KeyRound,
  Download,
  Upload,
  FileDown,
  FileUp,
  MailCheck,
  Fingerprint,
  Building2,
  Globe,
  Target,
  Heart,
  Lightbulb,
  Sparkles,
  BadgeCheck,
  BookOpen,
  MessageCircle,
  ChevronDown,
  Info,
  Compass,
  Layers,
  Gem,
} from 'lucide-react';
import { AIChatbotWidget } from './AIChatbotWidget.tsx';
import { SecurityQuestionFields } from '../common/SecurityQuestionFields.tsx';
import { RECOVERY_QUESTION_COUNT, type SecurityDraft } from '../../utils/accounts.ts';

export const LandingPage: React.FC<{ requiresSignIn?: boolean }> = ({ requiresSignIn = false }) => {
  const siteHeader = useRef<HTMLElement>(null);
  useMeasuredHeader(siteHeader, '--public-site-header-height');

  // Contexts: Only authentication & routing are connected to POSContext
  const { setActiveView, currentUser, loginUser, logoutUser, registerUser } = usePOS();
  const { setMetrics: setLandingMetrics, addSiteLead } = useCode76Site();
  const { company } = CODE76_SITE;

  // Authentication State for Portal Access Card
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authCompanyName, setAuthCompanyName] = useState('');
  const [authSecurity, setAuthSecurity] = useState<SecurityDraft[]>(() =>
    Array.from({ length: RECOVERY_QUESTION_COUNT }, () => ({ questionId: '', answer: '' }))
  );
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Track page visit once on mount
  useEffect(() => {
    setLandingMetrics((prev) => ({
      ...prev,
      visitors: prev.visitors + 1,
    }));
  }, [setLandingMetrics]);

  // Contact Form State (Direct Email to code76pos@gmail.com)
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactResponse, setContactResponse] = useState<{
    inquiryId: string;
    mailtoUrl: string;
    smtpDispatched: boolean;
  } | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    setContactSubmitting(true);

    addSiteLead({
      firstName: contactName.trim().split(' ')[0] || contactName.trim(),
      secondName: contactName.trim().split(' ').slice(1).join(' ') || '',
      tel1: contactPhone.trim(),
      tel2: '',
      whatsappNo: contactPhone.trim() || '',
      email1: contactEmail.trim(),
      email2: '',
      address: contactCompany.trim() || 'Direct Inquiry Lead',
      location: company.location || 'Global',
      country: company.country || 'Global',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      photoConsentForLanding: false,
      category: 'customer',
      notes: `Official Landing Contact Form message to code76pos@gmail.com: Subject: ${contactSubject || 'General Inquiry'}. Message: ${contactMessage}`,
    });

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          company: contactCompany.trim(),
          subject: contactSubject.trim() || 'General Inquiry',
          message: contactMessage.trim(),
        }),
      });

      const data = await res.json();
      setContactResponse({
        inquiryId: data.inquiryId || `INQ-${Date.now().toString(36).toUpperCase()}`,
        mailtoUrl:
          data.mailtoUrl ||
          `mailto:code76pos@gmail.com?subject=${encodeURIComponent(contactSubject || 'Inquiry')}&body=${encodeURIComponent(contactMessage)}`,
        smtpDispatched: !!data.smtpDispatched,
      });
    } catch {
      const fallbackMailto = `mailto:code76pos@gmail.com?subject=${encodeURIComponent(
        `[CODE76 Official Inquiry] ${contactSubject || 'Inquiry'} (${contactCompany || 'General'})`
      )}&body=${encodeURIComponent(
        `From: ${contactName} (${contactEmail}, ${contactPhone || 'No phone'})\nCompany: ${contactCompany || 'N/A'}\n\n${contactMessage}`
      )}`;
      setContactResponse({
        inquiryId: `INQ-${Date.now().toString(36).toUpperCase()}`,
        mailtoUrl: fallbackMailto,
        smtpDispatched: false,
      });
    } finally {
      setContactSubmitting(false);
      setContactSuccess(true);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!authEmail.trim() || !authPassword) {
      setAuthError('Please enter both your email address and password.');
      return;
    }

    const res =
      authMode === 'register'
        ? registerUser({
            companyName: authCompanyName,
            adminName: authFullName,
            email: authEmail.trim(),
            password: authPassword,
            security: authSecurity,
          })
        : loginUser(authEmail.trim(), authPassword);

    if (res.success) {
      setAuthSuccess(
        authMode === 'register'
          ? `Account created for ${authFullName || authEmail}! Launching CODE76 POS...`
          : 'Authentication successful! Launching CODE76 POS terminal...'
      );
    } else {
      setAuthError(res.message);
    }
  };

  return (
    <div className="public-landing-page min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white pb-24">
      <PublicLandingMetadata protectedEntry={requiresSignIn} />

      {/* Security Interception Banner if unauthorized /pos request occurred */}
      {requiresSignIn && (
        <div
          role="status"
          className="border-b border-teal-800 bg-teal-950 px-4 py-3 text-center text-xs sm:text-sm text-teal-100 flex items-center justify-center gap-2"
        >
          <Lock className="w-4 h-4 text-teal-400 shrink-0" />
          <span>
            <strong>Authentication Required:</strong> You must sign in or register below to enter the private POS workspace.
          </span>
        </div>
      )}

      {/* Public Landing Navbar - CODE76 POS Official */}
      <header
        ref={siteHeader}
        data-public-site-header="true"
        className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md"
      >
        <nav
          aria-label="CODE76 product navigation"
          className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-teal-500/25">
              <img src={brandAssetUrl()} alt="CODE76 POS logo" className="w-full h-full rounded-xl object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl text-slate-100 tracking-tight">
                  CODE<span className="text-teal-400">76</span> POS
                </span>
                <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Official SaaS
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-teal-400/90 block font-semibold leading-none mt-0.5">
                Enterprise Point of Sale &amp; ERP Operations Suite
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-[10px]">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-100 text-[11px] leading-tight">{currentUser.name}</div>
                    <div className="text-[9px] text-teal-400 leading-tight">{currentUser.roles[0]}</div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveView('pos')}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/30 cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Enter POS App &rarr;</span>
                </button>
                <button
                  onClick={logoutUser}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <a
                href="#portal-access"
                onClick={(e) => {
                  if (requiresSignIn) {
                    e.preventDefault();
                    document.getElementById('portal-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/30 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Portal Access</span>
              </a>
            )}
          </div>
        </nav>

        {/* Section Navigation Tabs */}
        <LandingSectionNav
          label="CODE76 page sections"
          preserveHash={requiresSignIn}
          sections={[
            { id: 'start', label: 'Overview' },
            { id: 'benefits', label: 'Why Choose CODE76 POS' },
            { id: 'data-secured', label: 'My Business Data Secured' },
            { id: 'platforms', label: 'Over 15+ Platforms/Features' },
            { id: 'plans', label: 'Plans & Pricing' },
            { id: 'contact', label: 'Contact Sales' },
            { id: 'about-us', label: 'About Us' },
            { id: 'faqs', label: 'FAQs' },
            { id: 'portal-access', label: 'Sign In / Register' },
          ]}
        />
      </header>

      {/* 1. HERO SECTION WITH INTEGRATED PORTAL CARD */}
      <section id="start" className="relative overflow-hidden pt-10 pb-16 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Product Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Next-Gen Point of Sale, ERP &amp; Operations Suite</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
              The Complete Modern POS Software Built for High-Velocity Business
            </h1>

            {/* Requested Enterprise Paragraph - Combined with same style/color */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-medium">
              CODE76 POS is an All-in-One Business ToolKit, enterprise-grade Point of Sale and ERP management suite crafted specifically for supermarkets, pharmacies, restaurants, wholesale distributors, and retail businesses. From multi-split checkouts to automated stock deduction and compliance audit trails, we empower businesses with uncompromised speed and transparency. Bring products, services, checkouts, Data Protection and business records into one workspace.
            </p>

            <div className="space-y-3 max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
              <p className="font-semibold text-slate-300">The Best Part about CODE76 POS, you can run business stimulation operation using the built-in Demo Data feature in just 5 super-easy steps right now for free:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <li><span className="font-bold text-teal-300">Step 1:</span> Go to free plan and register an account.</li>
                <li><span className="font-bold text-teal-300">Step 2:</span> Login with your registered password and email/username</li>
                <li><span className="font-bold text-teal-300">Step 3:</span> skip setup wizard. Dont worry, the demo data feature will fill in the my company and inventory with demo data.</li>
                <li><span className="font-bold text-teal-300">Step 4:</span> Go to the top side of the navbar menu click <span className="font-mono text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded">Demo Data</span>.</li>
                <li><span className="font-bold text-teal-300">Step 5:</span> On the Demo Data pop up widget select or tick <span className="italic text-slate-300">" I understand ..."</span> button and finally click <span className="font-bold text-emerald-300">"Load confirmed demo workspace"</span> button.</li>
              </ol>
              <p className="text-emerald-300 font-bold text-sm">That's it!!! Now you get some dummy/demo data to practice running a business operation using CODE76 POS. And dont worry you can delete the entire demo data with delete all settings and start afresh with your own business data.</p>
              <div className="bg-slate-900/60 border border-teal-800/50 rounded-xl p-4">
                <p className="font-semibold text-slate-200 text-sm mb-2">With demo data feature:</p>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-300">
                  <li>You get to test the CODE76 without worry.</li>
                  <li>You get to see how you business runs smoothly with CODE76.</li>
                  <li>You see what fits before making a commitment.</li>
                </ul>
              </div>
              <p>Start with Free, grow into Pro, or go lifetime with CODE76 with everything unlocked for life without paying more than once. Get started now.</p>
            </div>

            {/* Interactive Questions Grid - Neon Clickable Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <a
                href="#benefits"
                onClick={(e) => { e.preventDefault(); document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                className="group flex items-center gap-3 bg-slate-900/80 p-4 rounded-xl border border-teal-500/30 hover:border-teal-400 hover:shadow-[0_0_18px_rgba(20,184,166,0.45)] hover:bg-slate-900 transition-all cursor-pointer"
              >
                <span className="w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center shrink-0 group-hover:bg-teal-500/25 group-hover:shadow-[0_0_10px_rgba(20,184,166,0.5)] transition-all">
                  <HelpCircle className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-slate-200 group-hover:text-teal-200 group-hover:drop-shadow-[0_0_6px_rgba(20,184,166,0.8)] transition-all">Why Choose CODE76 POS ?</span>
              </a>
              <a
                href="#data-secured"
                onClick={(e) => { e.preventDefault(); document.getElementById('data-secured')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                className="group flex items-center gap-3 bg-slate-900/80 p-4 rounded-xl border border-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_18px_rgba(16,185,129,0.45)] hover:bg-slate-900 transition-all cursor-pointer"
              >
                <span className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/25 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-200 group-hover:drop-shadow-[0_0_6px_rgba(16,185,129,0.8)] transition-all">How Secure is my Business Data with CODE76 POS ?</span>
              </a>
              <a
                href="#platforms"
                onClick={(e) => { e.preventDefault(); document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                className="group flex items-center gap-3 bg-slate-900/80 p-4 rounded-xl border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_18px_rgba(6,182,212,0.45)] hover:bg-slate-900 transition-all cursor-pointer"
              >
                <span className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/25 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all">
                  <Database className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-200 group-hover:drop-shadow-[0_0_6px_rgba(6,182,212,0.8)] transition-all">What Other Problems &amp; How CODE76 POS platforms/features solves them ?</span>
              </a>
              <a
                href="#plans"
                onClick={(e) => { e.preventDefault(); document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                className="group flex items-center gap-3 bg-slate-900/80 p-4 rounded-xl border border-amber-500/30 hover:border-amber-400 hover:shadow-[0_0_18px_rgba(245,158,11,0.45)] hover:bg-slate-900 transition-all cursor-pointer"
              >
                <span className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 group-hover:bg-amber-500/25 group-hover:shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all">
                  <DollarSign className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-slate-200 group-hover:text-amber-200 group-hover:drop-shadow-[0_0_6px_rgba(245,158,11,0.8)] transition-all">Is CODE76 POS Free ?</span>
              </a>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="#portal-access"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('portal-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="inline-flex rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white hover:bg-teal-500 shadow-lg shadow-teal-600/30 transition cursor-pointer"
              >
                Sign In to POS Workspace &rarr;
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
              <span>✓ 99.9% Uptime Reliability</span>
              <span>·</span>
              <span>✓ Zero Hardware Lock-in</span>
              <span>·</span>
              <span>✓ Local-First Offline Speed</span>
              <span>·</span>
              <span>✓ Automated Cloud Backups</span>
            </div>

            {/* Official Social Media Channels */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-teal-400 block mb-2">
                Official CODE76 Channels &amp; Community:
              </span>
              <Code76SocialLinks />
            </div>
          </div>

          {/* Right Column: Portal Access (Sign In / Register) Card */}
          <div id="portal-access" className="lg:col-span-5 scroll-mt-24">
            <div className="relative rounded-3xl bg-slate-900/95 border-2 border-teal-500/40 shadow-2xl p-6 text-white backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/40">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-100">CODE76 POS Portal Access</h3>
                    <p className="text-[11px] text-slate-400">Secure entry for authorized business operators</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[9px] uppercase font-extrabold rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  Protected
                </span>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl mb-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'login' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'register' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Error & Success Alerts */}
              {authError && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Business Name</label>
                    <input
                      type="text"
                      required
                      value={authCompanyName}
                      onChange={(e) => setAuthCompanyName(e.target.value)}
                      placeholder="e.g. Apex Hardware &amp; Supermarket"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      Creates an isolated business workspace with dedicated catalog and staff.
                    </p>
                  </div>
                )}

                {authMode === 'register' && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Administrator Full Name</label>
                    <input
                      type="text"
                      required
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="e.g. Samuel Kiprono"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="user@business.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                {authMode === 'register' ? (
                  <SecurityQuestionFields
                    value={authSecurity}
                    onChange={setAuthSecurity}
                    label="Recovery Question"
                    hint="Choose one question so you can recover access or reset credentials safely."
                  />
                ) : (
                  <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5 text-[10px] leading-relaxed text-slate-400">
                    💡 <em>Authorized demo access available for reviewers — contact your system administrator for secure credentials.</em>
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>{authMode === 'login' ? 'Sign In & Enter POS' : 'Register Account & Launch POS'}</span>
                </button>

                <div className="text-[10px] text-center text-slate-500 pt-1">
                  🔒 Role-based privilege enforcement with complete audit trail.
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHY CHOOSE CODE76 POS SECTION */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 py-14 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400 flex items-center justify-center gap-1.5 mb-1">
            <Zap className="w-4 h-4 text-teal-400" />
            The CODE76 Advantage
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Why choose CODE76 POS?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            Unlike generic cash registers, CODE76 POS integrates all operational touchpoints into a unified, high-performance engine that prevents inventory shrinkage, cuts queue times, and protects your margins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Benefit 1 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-teal-500/50 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Sub-Second Multi-Split Checkout</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bust queues in seconds. Accept split tender combinations across Cash, M-Pesa, Credit/Debit cards, and Bank transfers with automatic change calculations, barcode auto-scanning, and customer debt ledgering.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800 pt-3">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Custom line-item &amp; transaction discounts</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Instant customer lookup &amp; loyalty attribution</span>
              </li>
            </ul>
          </div>

          {/* Benefit 2 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-teal-500/50 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Unified Stock &amp; Service Units</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Eliminate stockout surprises. Live inventory tracking decreases stock instantly with every scan, notifies staff when threshold alerts are triggered, and handles physical goods alongside billable service hours.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800 pt-3">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Physical SKUs, Barcodes &amp; Promotional Codes</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Hourly, Daily &amp; Project Service Units</span>
              </li>
            </ul>
          </div>

          {/* Benefit 3 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-teal-500/50 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/30">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Dual-Role Staff HR &amp; Granular RBAC</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every team member can hold 2 operational job roles (e.g. Manager + Developer or Cashier + Associate), auto-synchronizing personnel with logistics transporters and marketing campaigns without duplicate profiles.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800 pt-3">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Strict role-based permissions matrix</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Working days, shift hours &amp; payroll tracking</span>
              </li>
            </ul>
          </div>

          {/* Benefit 4 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-teal-500/50 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Real-Time Financial Health &amp; P&amp;L</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Know your true bottom line in real time. Automated Cost of Goods Sold (COGS), gross profit, operating expense deductions, and net margins are calculated dynamically on every completed sale.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800 pt-3">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Categorized expense ledgers (Rent, Salaries, Tax)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Profitability warnings on loss-making items</span>
              </li>
            </ul>
          </div>

          {/* Benefit 5 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-teal-500/50 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Thermal Receipts &amp; Digital E-Receipts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Print clean standard ESC/POS 80mm and 58mm thermal receipts with store logos, legal Tax PINs, barcode numbers, and custom footer slogans, or dispatch instant PDF receipts via WhatsApp and Email.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800 pt-3">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>80mm and 58mm printer compatibility</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Instant PDF download &amp; WhatsApp sharing</span>
              </li>
            </ul>
          </div>

          {/* Benefit 6 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-teal-500/50 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/30">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Built-In Business Landing Page Creator</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every merchant automatically receives an in-app Business Landing Page that showcases their real inventory items, prices, customer reviews, store hours, and location for direct customer orders.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800 pt-3">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Direct customer quote &amp; inquiry capture</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Private workspace preview for merchants</span>
              </li>
            </ul>
          </div>

          {/* Benefit 7 - Business Data Security */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-emerald-500/50 transition shadow-lg flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Military-Grade Business Data Security</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your business records never leave secure boundaries. CODE76 POS isolates each workspace, encrypts backups with AES-256, and enforces strict login restrictions and privilege checks so only authorized staff can view or edit sensitive data.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800 pt-3 flex-1">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Login restrictions, session lock &amp; device binding</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Granular privilege enforcement &amp; role approvals</span>
              </li>
            </ul>
            <a href="#data-secured" onClick={(e) => { e.preventDefault(); document.getElementById('data-secured')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="mt-4 inline-flex items-center gap-1.5 self-start px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer">
              Learn more <span aria-hidden>→</span>
            </a>
          </div>

          {/* Benefit 8 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-teal-500/50 transition shadow-lg flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/30">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Zero Data Loss &amp; Instant Recovery</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Prevent catastrophic loss from theft, hardware failure or accidental deletion. Automated local and cloud backups, plus PDF &amp; Excel exports, guarantee you can restore your entire business in minutes.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800 pt-3 flex-1">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>PDF Data exports &amp; Excel exports/imports</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Automated BackUp operations with one-click restore</span>
              </li>
            </ul>
            <a href="#data-secured" onClick={(e) => { e.preventDefault(); document.getElementById('data-secured')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="mt-4 inline-flex items-center gap-1.5 self-start px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md shadow-teal-600/20 cursor-pointer">
              Learn more <span aria-hidden>→</span>
            </a>
          </div>

          {/* Benefit 9 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-amber-500/50 transition shadow-lg flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Full Accountability &amp; Access Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Know who did what, when and where. Every login, price change, discount and export is tracked in immutable audit logs with user access login tracking visible only to authorized admins.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800 pt-3 flex-1">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>User Access Login tracking with device &amp; IP logs</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Privileges features &amp; forensic audit history</span>
              </li>
            </ul>
            <a href="#data-secured" onClick={(e) => { e.preventDefault(); document.getElementById('data-secured')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="mt-4 inline-flex items-center gap-1.5 self-start px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-md shadow-amber-600/20 cursor-pointer">
              Learn more <span aria-hidden>→</span>
            </a>
          </div>

          {/* Benefit 10 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-cyan-500/50 transition shadow-lg flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/30">
              <MailCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Emailing Data &amp; Offline-First Resilience</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Keep business moving even offline. Local-first operations store every sale locally then sync in cloud. Email reports, backups and receipts directly to owners and accountants without manual downloads.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800 pt-3 flex-1">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Emailing Data to users &amp; automated report dispatch</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Offline vault with cloud sync &amp; and more recovery tools</span>
              </li>
            </ul>
            <a href="#data-secured" onClick={(e) => { e.preventDefault(); document.getElementById('data-secured')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="mt-4 inline-flex items-center gap-1.5 self-start px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-md shadow-cyan-600/20 cursor-pointer">
              Learn more <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. MY BUSINESS DATA SECURED - IN-DEPTH DATA PROTECTION */}
      <section id="data-secured" className="max-w-7xl mx-auto px-4 py-14 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> My Business Data Secured
          </span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
            How CODE76 POS Secures Your Data &amp; Prevents Data Loss
          </h2>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed font-medium">
            Your business is your livelihood — we treat every record like a vault asset. From encrypted local storage to cloud backups, granular privileges and forensic login tracking, CODE76 POS ensures your data is protected, portable, and always recoverable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* PDF Exports */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-teal-500/50 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">PDF Data Exports</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export any ledger — sales, expenses, invoices, inventory, staff payroll and audit logs — as print-ready PDFs with your company logo, Tax PIN, serial numbers and legal footers. Generate monthly P&amp;L, stock valuation and receipt reprints in one click, and share them offline without needing the app open.
            </p>
          </div>

          {/* Excel Exports/Imports */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-emerald-500/50 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Excel Data Exports and Imports</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bulk-import thousands of products, customers, suppliers and opening balances from Excel/CSV (.xlsx, .csv) with validation and duplicate detection. Export any table to Excel for accountant reconciliation, pivot analysis or external reporting — then re-import updates without losing audit history. No retyping, no data entry backlog.
            </p>
          </div>

          {/* Backup Operations */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-cyan-500/50 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/30">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">BackUp Operations</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated local and encrypted cloud backups run in the background. Create full workspace snapshots containing products, sales, customers and settings. One-click restore brings your entire business back after theft, hard-drive crash or accidental deletion — with SHA-256 checksums verifying integrity before restore.
            </p>
          </div>

          {/* Emailing Data */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-amber-500/50 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
              <MailCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Emailing Data to Users</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Send daily sales summaries, low-stock alerts, backup files, PDF invoices and salary slips directly to owners, managers or accountants via email. Configure automated dispatches or trigger manual sends from any report view — ensuring stakeholders have records even without app access.
            </p>
          </div>

          {/* Login Restrictions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-rose-500/50 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Login Restrictions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Protect every entry point. Enforce CEO/Admin approval for new devices, session timeouts, protected routes that require sign-in, and isolated business workspaces. Failed logins are flagged, and sensitive operations require re-authentication — stopping unauthorized access even on shared till devices.
            </p>
          </div>

          {/* Privileges Features */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-indigo-500/50 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/30">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Privileges Features</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fine-grained RBAC — assign up to 2 roles per member (e.g. Cashier + Inventory Clerk) with granular toggles for price edits, discounts, refunds, payroll, backups and data exports. Only users with explicit permissions see or change critical data, reducing internal fraud and accidental overwrites.
            </p>
          </div>

          {/* User Access Login Tracking */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 hover:border-sky-500/50 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/30">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">User Access Login Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every sign-in, sign-out, failed attempt, stock adjustment, discount override and export is written to an immutable audit log with timestamps, device signatures and user identity. Filter by user, date or action, export logs as PDF/TXT/CSV, and prove compliance during disputes or financial reviews.
            </p>
          </div>

          {/* And More */}
          <div className="rounded-2xl border border-teal-500/40 bg-gradient-to-br from-teal-950/40 via-slate-900/90 to-emerald-950/30 p-6 hover:border-teal-400 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center mb-4 shadow-md">
              <Fingerprint className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">And More — Continuous Protection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Offline-first vault keeps selling without internet then syncs safely, localStorage isolation per business, configurable retention policies, duplicate-safe idempotent payroll/expense posting, and future-ready encrypted cloud vault — so your business data stays yours, secure and never lost.
            </p>
            <ul className="mt-3 space-y-1 text-[11px] text-teal-200/90">
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-teal-400" /> Offline vault &amp; cloud sync</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-teal-400" /> Isolated workspaces &amp; retention controls</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-teal-400" /> Idempotent exports &amp; recovery verification</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. OVER 15+ INTEGRATED PLATFORMS SHOWCASE WITH DEEP-DIVE BREAKDOWNS */}
      <section id="platforms" aria-label="CODE76 platforms and features" className="max-w-7xl mx-auto px-4 py-14 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/30 px-3 py-1 rounded-full">
            Unified Enterprise Operations Engine
          </span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Over 15+ Built-In Platforms To Empower your Business Workflow.
          </h2>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed font-medium">
            One login grants your team access to sales, procurement, inventory, HR, accounting, marketing and many other platforms with granular access control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CODE76_PLATFORMS.map((platform, index) => {
            const Icon = platform.icon;
            return (
              <article
                key={platform.id}
                data-code76-platform={platform.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/90 hover:border-teal-500/60 transition shadow-xl p-5 sm:p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="rounded-2xl border border-teal-800/60 bg-teal-900/30 p-2.5 text-teal-300 shadow-sm group-hover:scale-105 transition">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950/80 border border-teal-800/50 px-2.5 py-1 rounded-xl">
                      Platform #{String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base sm:text-lg text-slate-100 group-hover:text-teal-200 transition">
                    {platform.name}
                  </h3>
                  <p className="mt-1 text-xs text-teal-300/90 font-medium leading-relaxed">
                    {platform.benefit}
                  </p>

                  {/* Deep-Dive 3-Part Structural Analysis */}
                  <div className="mt-4 space-y-2.5 text-xs border-t border-slate-800 pt-3">
                    {/* 1. What It Does */}
                    <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80">
                      <span className="text-[10px] uppercase font-black tracking-wider text-teal-400 flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                        <span>What It Does in Your Business</span>
                      </span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        {platform.whatItDoes}
                      </p>
                    </div>

                    {/* 2. How It Does It */}
                    <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80">
                      <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>How It Works Under the Hood</span>
                      </span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        {platform.howItDoesIt}
                      </p>
                    </div>

                    {/* 3. Deep Problem Solved */}
                    <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80">
                      <span className="text-[10px] uppercase font-black tracking-wider text-rose-400 flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        <span>The Painful Problem It Solves</span>
                      </span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        {platform.problemItSolves}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 gap-2">
                  <span className="text-teal-400/80 font-medium">✓ Granular RBAC Controlled</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <a href="#plans" className="text-teal-300 hover:text-teal-200 font-bold hover:underline">
                      Get Started Now. For Free !!! &rarr;
                    </a>
                    <span className="text-slate-500">or</span>
                    <a href="#portal-access" className="text-teal-300 hover:text-teal-200 font-bold hover:underline">
                      Login POS &rarr;
                    </a>
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <a
            href="#portal-access"
            className="inline-flex rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3.5 text-sm font-bold text-white hover:from-teal-500 hover:to-emerald-500 shadow-xl shadow-teal-600/30 transition cursor-pointer"
          >
            Sign in or Register to Explore All Platforms &rarr;
          </a>
        </div>
      </section>

      {/* 5. TRANSPARENT PRICING PLANS */}
      <section id="plans" className="scroll-mt-20">
        <PlanOverview />
      </section>

      {/* 6. AI SALES ASSISTANT QUESTIONS */}
      <section id="product-help" className="max-w-7xl mx-auto px-4 py-8 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="max-w-2xl">
            <span className="text-xs uppercase font-extrabold tracking-wider text-teal-400">Have Questions?</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-1">Ask the CODE76 AI Product Specialist</h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
              Get immediate answers about hardware setup, data import from Excel, plan capabilities, or bespoke multi-branch pricing.
            </p>
          </div>
          <AIChatbotWidget surface="code76" inlineLauncher />
        </div>
      </section>

      {/* 7. OFFICIAL SALES & SUPPORT CONTACT FORM */}
      <section id="contact" className="max-w-7xl mx-auto px-4 py-14 scroll-mt-20">
        <div className="bg-gradient-to-r from-slate-900 via-teal-950/30 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400 flex items-center justify-center gap-1.5 mb-1">
                <Mail className="w-4 h-4 text-teal-400" />
                Direct Official Inquiries
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-100">
                Contact CODE76 POS Official Support &amp; Sales
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                Have questions about hardware compatibility, barcode scanners, multi-branch licensing, or bespoke deployments? Fill out the form below or write directly to{' '}
                <a href="mailto:code76pos@gmail.com" className="text-teal-300 font-bold hover:underline">
                  code76pos@gmail.com
                </a>.
              </p>
            </div>

            {contactSuccess ? (
              <div className="bg-emerald-950/80 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 text-center my-4 animate-in zoom-in-95 max-w-xl mx-auto shadow-2xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-bounce" />
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40 inline-block mb-2">
                  Reference: {contactResponse?.inquiryId || 'INQ-OFFICIAL-CODE76'}
                </span>
                <h3 className="text-xl font-black text-emerald-100">Inquiry Dispatched &amp; Registered!</h3>
                <p className="text-xs text-emerald-200 mt-2 leading-relaxed">
                  Thank you, <strong>{contactName}</strong>! Your inquiry was registered in our system and routed to{' '}
                  <strong className="text-white underline">code76pos@gmail.com</strong>.
                  {contactResponse?.smtpDispatched ? (
                    <span className="block mt-1 text-emerald-300 font-semibold">
                      ✓ Direct SMTP transmission confirmed by server.
                    </span>
                  ) : (
                    <span className="block mt-1 text-teal-200">
                      Our engineering desk has received your request. You can also open your mail app below for instant backup verification.
                    </span>
                  )}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-5">
                  {contactResponse?.mailtoUrl && (
                    <a
                      href={contactResponse.mailtoUrl}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Open in Email App (code76pos@gmail.com)</span>
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setContactSuccess(false);
                      setContactName('');
                      setContactEmail('');
                      setContactPhone('');
                      setContactCompany('');
                      setContactSubject('');
                      setContactMessage('');
                      setContactResponse(null);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 max-w-2xl mx-auto text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Your Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Samuel Kiprono"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. samuel@business.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Phone / WhatsApp Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +254 700 000 000"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Company / Store Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Hypermarket Ltd"
                      value={contactCompany}
                      onChange={(e) => setContactCompany(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Inquiry Subject / Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. POS Hardware Pricing &amp; Multi-Till Deployment Consultation"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Message Details <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your current store setup, number of cashier tills, daily sales volume, or specific hardware questions..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Send className="w-4 h-4 text-emerald-200" />
                    <span>Send Message to code76pos@gmail.com</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 px-1">
                  <span>🔒 Direct official sales inbox</span>
                  <a href="mailto:code76pos@gmail.com" className="text-teal-400 hover:underline flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>code76pos@gmail.com</span>
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 8. ABOUT US - CODE76 STORY */}
      <section id="about-us" className="max-w-7xl mx-auto px-4 py-16 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Building2 className="w-4 h-4" /> About CODE76 POS
          </span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Built for Businesses That Refuse to Compromise
          </h2>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed font-medium">
            CODE76 POS was founded to give every supermarket, pharmacy, restaurant and retailer the same enterprise-grade tools previously reserved for large chains — without complexity or hardware lock-in.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20 p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-black text-slate-100">Who We Are</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                We are <strong className="text-white">CODE76 POS Systems Inc.</strong> — a team of retail operators, engineers and support specialists who have run stores, closed tills, reconciled stock and answered angry customers. We built CODE76 POS because generic registers leak cash, hide stock and slow queues. Our platform unifies sales, inventory, staff, expenses and analytics into one secure workspace.
              </p>
              <p className="text-sm text-slate-400 leading-relaxed mt-3">
                From Nairobi to global deployments, we power daily operations for businesses that value speed, transparency and data ownership. Every feature — from multi-split M-Pesa/Visa handling to AES-256 backups — was shaped by real shop-floor pain.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                  <div className="text-xl font-black text-teal-300">15+</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Platforms</div>
                </div>
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                  <div className="text-xl font-black text-emerald-300">99.9%</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Uptime</div>
                </div>
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                  <div className="text-xl font-black text-indigo-300">24/7</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Secure Vault</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-teal-800/40 bg-teal-950/20 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-teal-400" />
                  <h4 className="font-bold text-sm text-slate-100">Our Mission</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">To make powerful retail operations simple, secure and affordable — so any business can sell faster, track accurately and grow profitably without IT complexity.</p>
              </div>
              <div className="rounded-2xl border border-sky-800/40 bg-sky-950/20 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Compass className="w-5 h-5 text-sky-400" />
                  <h4 className="font-bold text-sm text-slate-100">Our Vision</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">A world where every store — from kiosk to hypermarket — runs on transparent, owner-controlled data that never gets lost, leaked or locked.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl h-full">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center">
                  <Gem className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black text-slate-100">Core Values</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', title: 'Security First', desc: 'AES-256, RBAC and audit trails by default.' },
                  { icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30', title: 'Customer Obsession', desc: 'Built from shop-floor frustrations, not boardrooms.' },
                  { icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', title: 'Innovation', desc: 'Offline-first, split-tender, service units — solved early.' },
                  { icon: BadgeCheck, color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30', title: 'Integrity', desc: 'No hidden fees, no data hostage, no fake stock.' },
                  { icon: Globe, color: 'text-teal-400', bg: 'bg-teal-500/15', border: 'border-teal-500/30', title: 'Ownership', desc: 'Your business data stays yours — always exportable.' },
                  { icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/15', border: 'border-indigo-500/30', title: 'Growth', desc: 'Free to Pro to Max — scale without re-platforming.' },
                ].map(v => {
                  const Icon = v.icon;
                  return (
                    <div key={v.title} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <span className={`w-9 h-9 rounded-lg ${v.bg} border ${v.border} ${v.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-100">{v.title}</div>
                        <div className="text-[11px] text-slate-400 leading-relaxed">{v.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQs - NEAR FOOTER */}
      <section id="faqs" className="max-w-7xl mx-auto px-4 py-16 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" /> Frequently Asked Questions
          </span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Everything You Want to Know
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Quick answers about pricing, security, offline use, imports and more. Still stuck? Ask our AI or contact <span className="text-teal-300 font-semibold">code76pos@gmail.com</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {[
            { q: 'Is CODE76 POS Free?', a: 'Yes — start on Free with core POS, inventory and sales. Upgrade to Pro or Max only when you need advanced analytics, multi-branch and team-service features. Or go lifetime once. No card required to try with Demo Data.', icon: DollarSign },
            { q: 'How secure is my business data with CODE76 POS?', a: 'Your workspace is isolated and encrypted. We enforce login restrictions, role-based privileges, session locks, AES-256 backups and immutable audit logs. Exports (PDF/Excel) and cloud vault restores keep you in control — see My Business Data Secured for details.', icon: ShieldCheck },
            { q: 'Can I work offline?', a: 'Absolutely. Sales, inventory and receipts work offline-first and sync when you reconnect. Local-first vault ensures no sale is lost during internet downtime.', icon: Smartphone },
            { q: 'Do I need special hardware?', a: 'No lock-in. Use any barcode scanner, 80mm/58mm ESC/POS thermal printer, and any browser device. Bring your own till — we adapt.', icon: Monitor },
            { q: 'How do I import my existing products?', a: 'Bulk-import via Excel/CSV (.xlsx, .csv) with validation and duplicates check, or export any table to Excel for your accountant. No retyping thousands of SKUs.', icon: FileSpreadsheet },
            { q: 'Can I manage multiple branches & staff?', a: 'Yes. Assign 2 roles per member, track shifts, working days and payroll, and enforce granular RBAC (price edits, discounts, refunds, backups). Branch/company directory keeps vendors, transporters and clients organized.', icon: Users },
            { q: 'What if I lose my device or data?', a: 'One-click restore from encrypted local or cloud backups. Automated BackUp operations with SHA-256 checksums verify integrity, plus you can email backups to owners/accountants automatically.', icon: HardDrive },
            { q: 'How do payments work (M-Pesa, cards, cash)?', a: 'Sub-second multi-split checkout: combine Cash + M-Pesa + Visa/MC + Bank transfer in one sale with auto change, discounts and debt ledgering. No payment is taken on the landing page itself.', icon: Zap },
            { q: 'Will you lock or leak my data?', a: 'Never. Your data is yours — always exportable (PDF/Excel), emailable and restorable. No hostage, no hidden fees, no third-party resale.', icon: Lock },
            { q: 'How do I get started right now?', a: 'Use Demo Data: register Free → skip setup wizard → click Demo Data in the top navbar → tick I understand → Load confirmed demo workspace. You instantly get dummy data to practice. Delete all settings anytime to start fresh.', icon: Sparkles },
          ].map(item => {
            const Icon = item.icon;
            return (
              <details key={item.q} className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 open:border-teal-500/40 open:bg-slate-900/90 transition">
                <summary className="flex items-center gap-3 cursor-pointer list-none">
                  <span className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-teal-300 flex items-center justify-center shrink-0 group-open:bg-teal-500/15 group-open:border-teal-500/30 group-open:text-teal-300">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-bold text-slate-100 flex-1 text-left">{item.q}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition" />
                </summary>
                <p className="mt-3 ml-12 text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-3">{item.a}</p>
              </details>
            );
          })}
        </div>

        <div className="mt-8 max-w-5xl mx-auto rounded-2xl border border-teal-800/50 bg-gradient-to-r from-teal-950/30 via-slate-900 to-indigo-950/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </span>
            <div>
              <div className="text-sm font-bold text-slate-100">Still have questions?</div>
              <div className="text-xs text-slate-400">Chat with CODE76 AI or email our engineering desk.</div>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="#product-help" className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition">Ask AI Assistant</a>
            <a href="#contact" className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-200 text-xs font-bold transition">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* 10. PUBLIC CORPORATE FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 mt-12 px-4 py-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3">
              <img src={brandAssetUrl()} alt="CODE76 POS logo" className="w-12 h-12 rounded-xl object-contain" />
              <div>
                <strong className="text-xl font-black text-slate-100">
                  CODE<span className="text-teal-400">76</span> POS
                </strong>
                <span className="text-[10px] text-teal-400 block font-semibold">Point of Sale &amp; ERP SaaS</span>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-400">
              The high-performance operating software for modern commerce. Sell with sub-second split checkouts, track stock and services, manage dual-role staff, and monitor live P&amp;L profitability.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-slate-200 mb-3">Official Communication Channels</h4>
            <Code76SocialLinks />
            <p className="mt-3 text-xs text-slate-500">
              Contact our central engineering and deployments desk at{' '}
              <a href="mailto:code76pos@gmail.com" className="text-teal-400 underline">
                code76pos@gmail.com
              </a>.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-slate-200 mb-3">Explore Product Suite</h4>
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              <a href="#benefits" className="hover:text-teal-300">
                Why Choose CODE76 POS
              </a>
              <span>·</span>
              <a href="#platforms" className="hover:text-teal-300">
                Over 15+ Platforms
              </a>
              <span>·</span>
              <a href="#plans" className="hover:text-teal-300">
                Plans &amp; Pricing
              </a>
              <span>·</span>
              <a href="#contact" className="hover:text-teal-300">
                Contact Sales
              </a>
            </div>
            <button
              className="mt-5 rounded-xl bg-teal-700 hover:bg-teal-600 px-4 py-2.5 text-xs font-bold text-white transition shadow-md cursor-pointer flex items-center gap-1.5"
              onClick={() => {
                document.getElementById('portal-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Open POS Portal Access</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900">
          <p className="text-[11px] text-slate-500 text-center">
            © {new Date().getFullYear()} CODE76 POS Systems Inc. · Enterprise Point of Sale &amp; ERP Software Platform · All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
