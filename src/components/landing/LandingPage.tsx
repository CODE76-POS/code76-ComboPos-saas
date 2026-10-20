import { CODE76_BRAND,brandAssetUrl } from '../../config/code76Brand.ts';
import { Code76Credit,Code76SocialLinks } from '../common/Code76Credit.tsx';
import { LandingSectionNav } from './LandingSectionNav.tsx';
import { MaxServicesSection } from './MaxServicesSection.tsx';
import { GrowthPlanner } from './GrowthPlanner.tsx';
import { useMeasuredHeader } from '../../hooks/useMeasuredHeader.ts';
import { PlanOverview } from './PlanOverview.tsx';
import { CODE76_PLATFORMS } from '../../config/code76Platforms.ts';
import { LinkCopyField } from '../common/LinkCopyField.tsx';
import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { useCode76Site } from '../../context/Code76SiteContext.tsx';
import { CODE76_SITE } from '../../config/code76Site.ts';
import { PublicLandingMetadata } from './PublicLandingMetadata.tsx';
import {
  ShoppingBag,
  Star,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Users,
  Award,
  Gift,
  HelpCircle,
  Database,
  Store,
  Clock,
  Layers,
  Search,
  MessageSquare,
  AlertTriangle,
  Share2,
  Copy,
  ExternalLink,
  QrCode,
  LogIn,
  LogOut,
  Lock,
  UserPlus,
  Shield,
  User,
  AlertCircle,
  Utensils,
  Pill,
  Truck,
  Building2,
  Zap,
  BarChart3,
  FileText,
  Send,
  Smartphone,
  Laptop,
  Sliders,
  Receipt,
  Wrench,
  Check,
  Cpu,
} from 'lucide-react';
import { AIChatbotWidget, InquiryLeadData } from './AIChatbotWidget.tsx';
import { ALL_ROLES, ProductItem, UserRole } from '../../types/index.ts';
import {
  getCustomerReviewAvatar,
  getDefaultCatalogImageAndEmoji,
} from '../../data/catalogKnowledgeBase.ts';


// Real-World Commercial Businesses CODE76 Powers & Works On


// Top 12 Powerful Features of CODE76 POS Supercharging Modern Businesses


// Commercial Companies and Brands Running Daily on CODE76 POS


export const LandingPage: React.FC<{ requiresSignIn?: boolean }> = ({ requiresSignIn = false }) => {
  const siteHeader=useRef<HTMLElement>(null);
  useMeasuredHeader(siteHeader,'--public-site-header-height');
  // Only authentication and navigation are shared with the POS. No merchant data or settings here.
  const { setActiveView, setActivePlatform, currentUser, loginUser, logoutUser, registerUser } = usePOS();
  const { metrics: landingMetrics, setMetrics: setLandingMetrics, addSiteLead, logSiteEvent } = useCode76Site();
  const { company, products, companyMembers, marketingTeam, reviews, customers } = CODE76_SITE;
  const settings = { landingPage: CODE76_SITE.landingPage };

  // Selected business type for "Find What Fits Your Needs" guided matcher
  // Inquiry modal state with rich customer lead details
  const [inquiryModalProduct, setInquiryModalProduct] = useState<ProductItem | null>(null);
  const [inquiryFirstName, setInquiryFirstName] = useState('');
  const [inquirySecondName, setInquirySecondName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryLocation, setInquiryLocation] = useState('');
  const [inquiryPreferredContact, setInquiryPreferredContact] = useState<'whatsapp' | 'call' | 'email' | 'social'>('whatsapp');
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [activeInquiryLead, setActiveInquiryLead] = useState<InquiryLeadData | null>(null);

  // Slideshow state for remaining items (after the first 6)

  // Referral generator state
  const [referralName, setReferralName] = useState('');
  const [generatedReferralLink, setGeneratedReferralLink] = useState('');

  // CODE76 illustrative catalogue. Merchant edits cannot replace this website's content.
  const displayCompany = company;
  const displayProducts = products;
  const displayReviews = reviews;
  const displayCustomers = customers;
  const isCleanEmptyCatalog = false;

  // Split products: First 6 for featured cards, remaining for slideshow
  const featuredSix = displayProducts.slice(0, settings.landingPage.featuredCount || 6);
  const slideshowItems = displayProducts.slice(settings.landingPage.featuredCount || 6);

  // Authentication State for Landing Page Portal Card
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authRole, setAuthRole] = useState<UserRole>('Cashier');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');



  // Track page visit once on mount
  useEffect(() => {
    setLandingMetrics((prev) => ({
      ...prev,
      visitors: prev.visitors + 1,
    }));
  }, [setLandingMetrics]);

  const handleGenerateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralName.trim()) return;
    const code = referralName.toUpperCase().replace(/\s+/g, '') + '76';
    const url = new URL(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || window.location.origin);
    url.searchParams.set('ref', code);
    setGeneratedReferralLink(url.href);
  };



  // Contact Form State (Direct Email to code76pos@gmail.com)
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Active Company Slide in Companies Carousel



  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    setContactSubmitting(true);

    // 1. Save to the independent CODE76 product-site lead store (not merchant CRM).
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

    // 2. Audit Trail Logging
    logSiteEvent(
      'Contact Form Submitted',
      `Direct message to code76pos@gmail.com by ${contactName} (${contactEmail}) - Subject: ${contactSubject || 'General Inquiry'}`
    );

    // 3. Trigger mailto client to code76pos@gmail.com
    const mailtoUrl = `mailto:code76pos@gmail.com?subject=${encodeURIComponent(
      `[CODE76 POS Official Inquiry] ${contactSubject || 'Business Consultation Request'} - ${contactName}`
    )}&body=${encodeURIComponent(
      `Name: ${contactName}\nEmail: ${contactEmail}\nPhone / WhatsApp: ${contactPhone}\nCompany / Business: ${contactCompany}\nSubject: ${contactSubject}\n\nMessage Details:\n${contactMessage}\n\n---\nPrepared in the CODE76 product-site demo; confirm all details directly`
    )}`;

    try {
      window.location.href = mailtoUrl;
    } catch {
      // safe fallback
    }

    setContactSubmitting(false);
    setContactSuccess(true);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryFirstName.trim() || (!inquiryEmail.trim() && !inquiryPhone.trim()) || !inquiryModalProduct) {
      return;
    }

    const leadFullName = `${inquiryFirstName.trim()} ${inquirySecondName.trim()}`.trim();
    const primaryPhone = inquiryPhone.trim();
    const primaryEmail = inquiryEmail.trim() || `${inquiryFirstName.toLowerCase()}@lead.code76pos.com`;

    // 1. SAVE LEAD SECURELY IN CRM CUSTOMER DIRECTORY
    addSiteLead({
      firstName: inquiryFirstName.trim(),
      secondName: inquirySecondName.trim() || '',
      tel1: primaryPhone,
      tel2: '',
      whatsappNo: primaryPhone,
      email1: primaryEmail,
      email2: '',
      address: inquiryLocation.trim() || 'Store Location Pending',
      location: inquiryLocation.trim() || 'Retail Hub',
      country: company.country || 'Global',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      photoConsentForLanding: false,
      category: 'customer',
      notes: `Landing Page Quote Request for ${inquiryModalProduct.name} ($${inquiryModalProduct.sellingPrice}). Channel: ${inquiryPreferredContact.toUpperCase()}. Customer Notes: ${inquiryNotes || 'None provided'}`,
    });

    // 2. LOG AUDIT ACTION FOR ENTERPRISE SECURITY
    logSiteEvent(
      'Landing Lead Captured',
      `Captured quotation inquiry from ${leadFullName} (${primaryPhone} / ${primaryEmail}) for ${inquiryModalProduct.name}`
    );

    // 3. INCREMENT ANALYTICS FUNNEL METRICS
    setLandingMetrics((prev) => ({
      ...prev,
      leadsCaptured: prev.leadsCaptured + 1,
    }));

    // 4. PREPARE PSYCHOLOGY CHATBOT CONTEXT & REDIRECT
    const newLeadContext: InquiryLeadData = {
      name: leadFullName,
      email: primaryEmail,
      phone: primaryPhone,
      location: inquiryLocation.trim(),
      preferredContact: inquiryPreferredContact,
      product: inquiryModalProduct,
      notes: inquiryNotes,
    };

    setActiveInquiryLead(newLeadContext);
    setInquirySuccess(true);

    setTimeout(() => {
      setInquirySuccess(false);
      setInquiryModalProduct(null);
      // Reset form
      setInquiryFirstName('');
      setInquirySecondName('');
      setInquiryEmail('');
      setInquiryPhone('');
      setInquiryLocation('');
      setInquiryNotes('');
    }, 1400);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!authEmail.trim() || !authPassword) {
      setAuthError('Please enter both your email address and password.');
      return;
    }

    const res = authMode === 'register'
      ? registerUser(authFullName, authEmail.trim(), authPassword, authRole)
      : loginUser(authEmail.trim(), authPassword, authRole);
    if (res.success) {
      setAuthSuccess(
        authMode === 'register'
          ? `Account created for ${authFullName || authEmail}! Launching CODE76 POS...`
          : 'Authentication successful! Launching CODE76 POS terminal...'
      );
      // loginUser/registerUser perform navigation immediately; a delayed redirect
      // must not override a user's subsequent choice to return to the public root.
    } else {
      setAuthError(res.message);
    }
  };

  // Top Referrers for Social Proof
  const topReferrers = [...displayCustomers, ...marketingTeam, ...companyMembers]
    .filter((p) => (p.referralCount || 0) > 0)
    .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0))
    .slice(0, settings.landingPage.topReferrersLimit || 4);

  // Verified reviews
  const approvedReviews = displayReviews.filter((r) => r.isApprovedForLanding);

  return (
    <div className="public-landing-page min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white pb-24">
      <PublicLandingMetadata protectedEntry={requiresSignIn} />
      {requiresSignIn && <div role="status" className="border-b border-teal-800 bg-teal-950 px-4 py-3 text-center text-sm text-teal-100">
        This is a private POS workspace. <a href="#portal-access" onClick={event=>{event.preventDefault();document.getElementById('portal-access')?.scrollIntoView({block:'start'});}} className="font-bold underline">Sign in or register</a> to continue. Business Landing Pages are available only inside the authenticated POS.
      </div>}
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 border-b border-teal-800/40 text-center py-2 px-4 text-xs font-medium text-teal-200">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>
            <strong>CODE76 POS:</strong> Clear operations, transparent plans and team-assisted growth. Explore the workspace at your own pace.
          </span>
        </span>
      </div>

      {/* Public Landing Navbar - CODE76 POS Official */}
      <header ref={siteHeader} data-public-site-header="true" className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <nav aria-label="CODE76 product navigation" className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-teal-500/25">
            <img src={brandAssetUrl()} alt="CODE76 POS logo" className="w-full h-full rounded-xl object-contain"/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl text-slate-100 tracking-tight">
                CODE<span className="text-teal-400">76</span> POS
              </span>
              <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Official
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-teal-400/90 block font-semibold leading-none mt-0.5">
              Enterprise Point of Sale & ERP SaaS Software
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
                <span>Enter POS App</span>
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
              onClick={event=>{if(requiresSignIn){event.preventDefault();document.getElementById('portal-access')?.scrollIntoView({block:'start'});}}}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/30 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </a>
          )}
        </div>
      </nav>
      <LandingSectionNav label="CODE76 page sections" preserveHash={requiresSignIn} sections={[{id:'start',label:'Overview'},{id:'features',label:'Platforms'},{id:'plans',label:'Plans & prices'},{id:'product-help',label:'Questions'},{id:'max-services',label:'Max services'},{id:'growth-planner',label:'Growth planner'},{id:'companies',label:'How it works'},{id:'reviews',label:'Before you choose'},{id:'contact',label:'Contact'}]}/>
      </header>

      {/* HERO SECTION WITH PORTAL LOGIN & REGISTRATION INTEGRATION */}
      <section id="start" className="relative overflow-hidden pt-10 pb-16 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Brand, Value Proposition & Key Capabilities */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Your next operational step, made clearer</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
              Sell with clarity. Run the rest with confidence.
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
              Bring products, services, checkout and business records into one workspace. Start with Free, grow into Pro, or add CODE76 team assistance with Max. See what fits before making a commitment.
            </p>

            {/* Key SaaS ERP Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-Split Payment: Cash, M-Pesa, Card & Wire</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Product stock and clear service billing units</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Company-linked invoices, expenses and staff records</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>High-Contrast Light/Dark Themes & Multi-Device Views</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#portal-access" onClick={event=>{if(requiresSignIn){event.preventDefault();document.getElementById('portal-access')?.scrollIntoView({block:'start'});}}} className="inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-600">Start with Free</a>
              <a href="#plans" className="inline-flex rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-900">Find your plan</a>
              <a href="#max-services" className="inline-flex rounded-xl border border-teal-900 px-5 py-3 text-sm font-bold text-teal-300 hover:bg-teal-950">Explore Max support</a>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-slate-400"><span>No card needed for the demo</span><span>·</span><span>5 clearly compared plans</span><span>·</span><span>You choose the pace</span></div>
              </div>

              {/* Right Column: Interactive Portal Access (Sign In / Register) */}
              <div id="portal-access" className="lg:col-span-5 scroll-mt-24">
                <div className="relative rounded-3xl bg-slate-900/95 border-2 border-teal-500/40 shadow-2xl p-6 text-white backdrop-blur-md">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/40">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-100">CODE76 POS Portal Access</h3>
                        <p className="text-[10px] text-teal-400 font-medium">Workspace account portal</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-300 border border-teal-500/30">
                      Demo access
                    </span>
                  </div>

                  {currentUser ? (
                    <div className="space-y-4 py-2">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-base flex items-center justify-center mx-auto border border-emerald-500/40">
                          {currentUser.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-100 text-sm">{currentUser.name}</h4>
                          <p className="text-xs text-slate-400">{currentUser.email}</p>
                          <div className="inline-block px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold mt-1">
                            Primary Role: {currentUser.roles[0]}
                          </div>
                        </div>
                        <p className="text-xs text-emerald-300/90 pt-1">
                          You are authenticated. Launch the terminal to process sales, manage stock, and view analytics.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button
                          onClick={() => setActiveView('pos')}
                          className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Store className="w-4 h-4" />
                          Launch POS Terminal
                        </button>
                        <button
                          onClick={logoutUser}
                          className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Tabs: Sign In / Create Account */}
                      <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('login');
                            setAuthError('');
                            setAuthSuccess('');
                          }}
                          className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            authMode === 'login'
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
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
                            authMode === 'register'
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
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
                            <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
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

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-teal-400" />
                            Role / Permission Level
                          </label>
                          <select
                            value={authRole}
                            onChange={(e) => setAuthRole(e.target.value as UserRole)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                          >
                            {ALL_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                        >
                          {authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                          <span>{authMode === 'login' ? 'Sign In & Enter POS' : 'Register Account & Launch POS'}</span>
                        </button>

                        {/* 1-Click Quick Demo Login Shortcuts */}
                        <div className="pt-2 border-t border-slate-800/80">
                          <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                            Quick 1-Click Demo Profiles:
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                loginUser('sarah.k@code76.com', 'password123', 'Cashier');
                                setActiveView('pos');
                              }}
                              className="px-2 py-1.5 rounded-lg bg-teal-950/60 hover:bg-teal-900 border border-teal-700/50 text-teal-300 font-bold text-[10px] text-center transition cursor-pointer"
                            >
                              ⚡ Cashier
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                loginUser('samuel.m@code76.com', 'password123', 'Manager');
                                setActiveView('pos');
                              }}
                              className="px-2 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 font-bold text-[10px] text-center transition cursor-pointer"
                            >
                              ⚡ Manager
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                loginUser('david.k@code76.com', 'password123', 'CEO');
                                setActiveView('pos');
                              }}
                              className="px-2 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-700/50 text-purple-300 font-bold text-[10px] text-center transition cursor-pointer"
                            >
                              ⚡ CEO / Admin
                            </button>
                          </div>
                        </div>

                        <div className="text-[10px] text-center text-slate-500 pt-1">
                          🔒 Secure confidential authentication with role-based privilege enforcement.
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 1. ABOUT CODE76 POS SECTION */}
          <section id="about" className="max-w-7xl mx-auto px-4 py-12">
            <div className="bg-gradient-to-r from-slate-900 via-teal-950/30 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="max-w-3xl mx-auto text-center space-y-4">
                <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400 flex items-center justify-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  About CODE76 POS System
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
                  Engineered for High-Velocity Modern Commerce
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  CODE76 POS is an enterprise-grade Point of Sale and ERP management suite crafted specifically for supermarkets, pharmacies, restaurants, wholesale distributors, and retail businesses. From multi-split checkouts to automated stock deduction and compliance audit trails, we empower businesses with uncompromised speed and transparency.
                </p>

                {/* 3 Core Architecture Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2 font-bold">
                      <Zap className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-100 text-xs mb-1">A clearer checkout workflow</h3>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Build a cart, record one or split payments and inspect the resulting receipt with test data.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 font-bold">
                      <Database className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-100 text-xs mb-1">Connected product records</h3>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Review product stock, service billing units and records together. Check inventory before committing to fulfilment.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-100 text-xs mb-1">Visible workspace controls</h3>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Explore role privileges and permitted exports. Production authentication, billing and tenant security still need a backend.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. BUSINESSES CODE76 WORKS ON & POWERS */}
          <section id="features" aria-label="CODE76 platforms and features" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-20">
            <span id="businesses" className="block scroll-mt-20" aria-hidden="true" />
            <span id="platforms" className="block scroll-mt-20" aria-hidden="true" />
            <div className="text-center max-w-3xl mx-auto mb-8">
              <span className="text-xs uppercase font-bold tracking-widest text-teal-400">One workspace, practical tools</span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-100">CODE76 Platforms & Features for Your Business</h2>
              <p className="mt-3 text-sm text-slate-400">Explore 18 tools and the everyday business jobs they help you handle. Sign in to explore the POS workspace; merchant business pages remain private.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {CODE76_PLATFORMS.map((platform, index) => {
                const Icon = platform.icon;
                return <article key={platform.id} data-code76-platform={platform.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:border-teal-600 transition">
                  <div className="flex items-center justify-between mb-4"><span className="rounded-xl border border-teal-800 bg-teal-900/30 p-2 text-teal-300"><Icon size={21} aria-hidden="true" /></span><span className="text-xs font-mono text-slate-500">{String(index + 1).padStart(2, '0')}</span></div>
                  <h3 className="font-bold text-base text-slate-100">{platform.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{platform.benefit}</p>
                </article>;
              })}
            </div>
            <div className="mt-7 text-center"><a href="#portal-access" className="inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-600">Sign in or register to explore</a></div>
          </section>

          <PlanOverview />
          <section id="product-help" className="max-w-7xl mx-auto px-4 py-7"><div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="max-w-2xl"><h2 className="text-xl font-bold">Not sure which plan fits?</h2><p className="mt-2 text-sm text-slate-400">Ask about the software, current published prices or the team-service package. No purchase, service booking or reward is created by the conversation.</p></div><AIChatbotWidget surface="code76" inquiryLead={activeInquiryLead} inlineLauncher /></div></section>


          <MaxServicesSection />
          <GrowthPlanner />
          <section id="companies" className="max-w-7xl mx-auto px-4 py-12"><div className="max-w-3xl mb-7"><span className="text-xs uppercase tracking-widest font-bold text-teal-400">A practical first success</span><h2 className="mt-2 text-3xl font-black">See the workflow, not just a feature list</h2><p className="mt-3 text-sm text-slate-400">Use your own test entries. No claimed client results or invented customer testimonials are needed to see whether the workflow suits you.</p></div><div className="grid md:grid-cols-3 gap-4">{[{title:'1. Make it yours',copy:'Choose readable text and a theme, enter your company details, then add a real test product or service.'},{title:'2. Try the daily job',copy:'Build a cart, record a payment and inspect a receipt. Move through the actual forms rather than a staged sales claim.'},{title:'3. Review the fit',copy:'Explore the records, compare the plan limits and decide whether software alone or team assistance is your next step.'}].map(step=><article key={step.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h3 className="font-bold">{step.title}</h3><p className="mt-3 text-sm leading-relaxed text-slate-400">{step.copy}</p></article>)}</div><a href="#portal-access" className="mt-5 inline-flex font-bold text-sm text-teal-300 underline">Try the guided workspace</a></section>
          <section id="reviews" className="max-w-7xl mx-auto px-4 py-12"><h2 className="text-3xl font-black">Choose with clear expectations</h2><div className="mt-6 grid sm:grid-cols-2 gap-4">{[{title:'See prices before choosing',copy:'List and promotional prices are shown in USD with monthly versus one-time terms. The demo has no connected payment gateway.'},{title:'Keep control of the decision',copy:'No fabricated countdown, sales volume or client-rating claim is used here. Try Free and compare the actual entitlements.'},{title:'Know the current data boundary',copy:'This is a browser-local prototype, not production tenant security or cloud synchronization. Use test records, not real passwords, payroll or customer data.'},{title:'Know what is—and is not—published',copy:'The CODE76 site is public product information. Your merchant Business Landing Page remains an authenticated internal preview, not a public storefront.'}].map(item=><article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h3 className="font-bold text-teal-300">{item.title}</h3><p className="mt-3 text-sm leading-relaxed text-slate-400">{item.copy}</p></article>)}</div></section>

          <section id="referrals" className="max-w-7xl mx-auto px-4 py-12"><div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-8"><h2 className="text-2xl font-black">Referrals work better with clear terms</h2><p className="mt-3 text-sm text-slate-400">Max and Lifetime include team assistance to plan a referral program. Agree eligibility, attribution, consent and any reward before sharing. This demo does not promise cash, reserve rewards or track a real referral payout.</p><form onSubmit={handleGenerateReferral} className="mt-5 flex flex-wrap gap-2"><label className="min-w-0 flex-1 text-xs text-slate-400">Demo referral name<input aria-label="Demo referral name" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" value={referralName} onChange={event=>setReferralName(event.target.value)} required/></label><button type="submit" className="self-end rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white">Create demo share link</button></form>{generatedReferralLink&&<div className="mt-4"><LinkCopyField value={generatedReferralLink} label="CODE76 referral link"/><p className="mt-2 text-[10px] text-slate-500">An illustrative ref query only; no backend attribution or reward is created. Share only with people who welcome the recommendation.</p></div>}</div></section>

          <section id="contact" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-20">
            <div className="bg-gradient-to-r from-slate-900 via-teal-950/30 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
              <div className="max-w-4xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-8">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400 flex items-center justify-center gap-1.5 mb-1">
                    <Mail className="w-4 h-4 text-teal-400" />
                    Direct Official Inquiries
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
                    Contact CODE76 POS Official Support & Sales
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                    Have questions about hardware compatibility, barcode scanners, multi-branch licensing, or bespoke deployments? Fill out the form below or write directly to{' '}
                    <a
                      href="mailto:code76pos@gmail.com"
                      className="text-teal-300 font-bold hover:underline"
                    >
                      code76pos@gmail.com
                    </a>.
                  </p>
                </div>

                {contactSuccess ? (
                  <div className="bg-emerald-950/70 border border-emerald-600 rounded-2xl p-8 text-center my-4 animate-in zoom-in-95 max-w-xl mx-auto">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-bounce" />
                    <h3 className="text-lg font-black text-emerald-200">
                      Email draft prepared—not delivered by this app
                    </h3>
                    <p className="text-xs text-emerald-300 mt-2 leading-relaxed">
                      Thank you, <strong>{contactName}</strong>! Your inquiry was saved locally and an email draft was prepared for <strong>code76pos@gmail.com</strong>. Complete sending in your email app; this demo cannot confirm delivery or a response time.
                    </p>
                    <button
                      onClick={() => {
                        setContactSuccess(false);
                        setContactName('');
                        setContactEmail('');
                        setContactPhone('');
                        setContactCompany('');
                        setContactSubject('');
                        setContactMessage('');
                      }}
                      className="mt-5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Send Another Message
                    </button>
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
                        <label className="block text-slate-300 font-semibold mb-1">
                          Phone / WhatsApp Number
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. +254 700 000 000"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Company / Business Name
                        </label>
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
                      <label className="block text-slate-300 font-semibold mb-1">
                        Inquiry Subject / Topic
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. POS Hardware Pricing & Multi-Cashier Setup Consultation"
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
                        placeholder="Describe your current store setup, number of tills, expected daily sales volume, or questions..."
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
                      <span>🔒 Direct delivery to code76pos@gmail.com</span>
                      <a
                        href="mailto:code76pos@gmail.com"
                        className="text-teal-400 hover:underline flex items-center gap-1"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>code76pos@gmail.com</span>
                      </a>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </section>

          {/* 8. SOCIAL MEDIAS BAR */}
          <section className="max-w-7xl mx-auto px-4 py-8"><h2 className="text-2xl font-bold mb-4">Connect with CODE76</h2><p className="mb-4 text-sm text-slate-400">Watch tutorials, follow updates or contact the team using the supplied official links.</p><Code76SocialLinks/></section>

          <footer className="border-t border-slate-800 bg-slate-950 mt-12 px-4 py-10"><div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-7"><div><div className="flex items-center gap-3"><img src={brandAssetUrl()} alt="CODE76 POS logo" className="w-14 h-14 rounded-xl object-contain"/><strong className="text-xl">CODE76 POS</strong></div><p className="mt-4 text-sm leading-relaxed text-slate-400">A workspace for sales, products, services and business records. Explore clear plan limits and scoped team assistance before deciding what fits.</p></div><div><h2 className="font-bold mb-3">Watch, follow or contact CODE76</h2><Code76SocialLinks/><p className="mt-3 text-xs text-slate-500">Use the links provided by the CODE76 team. No generic social profile, office address, tax number or verified licence is implied.</p></div><div><h2 className="font-bold mb-3">Explore at your pace</h2><div className="flex flex-wrap gap-3 text-sm text-slate-400"><a href="#features">Platforms</a><a href="#plans">Plans & prices</a><a href="#max-services">Team services</a><a href="#contact">Contact</a></div><button className="mt-5 rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white" onClick={()=>setActiveView('pos')}>Open POS account access</button><p className="mt-3 text-xs text-slate-500">Demo billing is not connected. Browser-local records do not sync between browsers.</p></div></div><div className="max-w-7xl mx-auto"><Code76Credit/><p className="mt-5 text-[11px] text-slate-500">© {new Date().getFullYear()} CODE76 POS · Workspace preview</p></div></footer>

          {/* 8. EMBEDDED LIVE AI SALES CHATBOT WITH PSYCHOLOGICAL PERSUASION */}

    </div>
  );
};
