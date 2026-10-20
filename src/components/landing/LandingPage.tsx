import { PlanOverview } from './PlanOverview.tsx';
import { CODE76_PLATFORMS } from '../../config/code76Platforms.ts';
import { LinkCopyField } from '../common/LinkCopyField.tsx';
import React, { useState, useEffect } from 'react';
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
export const COMPANIES_USING_CODE76 = [
  {
    name: 'Apex Supermarket & Hyperstore',
    sector: 'Supermarket & FMCG',
    locations: '8 Locations • 45,000 SKUs',
    stat: '65% Faster Checkout',
    logoText: 'APEX',
    color: 'from-emerald-600 to-teal-500',
    quote: 'CODE76 transformed our peak weekend rushes. Real-time barcode scanning and instant M-Pesa & Card reconciliation cut checkout queues in half.',
    manager: 'Samuel M. • Operations Director',
    icon: Store,
  },
  {
    name: 'Java Peak Roastery & Cafés',
    sector: 'Restaurant & Hospitality',
    locations: '4 Branches • 60 Tables',
    stat: 'Zero Lost Orders',
    logoText: 'JAVA',
    color: 'from-amber-600 to-orange-500',
    quote: 'Orders taken on mobile tablets hit kitchen displays in real time. Table bill splitting is effortless, and daily cash-up takes under 3 minutes.',
    manager: 'Beatrice W. • General Manager',
    icon: Utensils,
  },
  {
    name: 'MediCare Regional Pharmacy',
    sector: 'Healthcare & Pharma',
    locations: '12 Branches • 18,000 Items',
    stat: '100% Expiry & Batch Tracked',
    logoText: 'MEDI',
    color: 'from-sky-600 to-cyan-500',
    quote: 'Automated batch number tracking, expiry warnings, and strict pharmacist PIN authorizations keep our multi-branch inventory fully compliant.',
    manager: 'Dr. Kevin O. • Lead Pharmacist',
    icon: Pill,
  },
  {
    name: 'Skyline Logistics & Wholesale Depot',
    sector: 'Wholesale & Warehousing',
    locations: '3 Central Depots • 500+ Daily Pallets',
    stat: '$140k+ Monthly Tracked Credit',
    logoText: 'SKY',
    color: 'from-indigo-600 to-blue-500',
    quote: 'Our B2B customers demand automated commercial invoices and net-30 debt statements. CODE76 handles bulk tier pricing with automated PDF delivery.',
    manager: 'Hassan A. • Distribution Head',
    icon: Truck,
  },
  {
    name: 'NexGen Smart Electronics',
    sector: 'Hardware & Tech Boutiques',
    locations: '5 Stores • Serialized IMEI',
    stat: 'Zero Duplicate Reconciliation',
    logoText: 'NEXT',
    color: 'from-purple-600 to-violet-500',
    quote: 'When an iPhone or laptop sells, stock is deducted instantly across all branches. The automated trigger ensures our online store never oversells.',
    manager: 'Daniel K. • Store Operations Lead',
    icon: Cpu,
  },
  {
    name: 'Prime Auto Spares & Garage Services',
    sector: 'Automotive & Technical Repairs',
    locations: '2 Workshop Hubs • 14 Mechanics',
    stat: '28% Profit Margin Increase',
    logoText: 'PRIME',
    color: 'from-rose-600 to-pink-500',
    quote: 'We combine physical spare parts sales with mechanic labor in one bill. Converting job cards to official tax invoices takes one click.',
    manager: 'Patrick N. • Workshop Manager',
    icon: Wrench,
  },
];

export const LandingPage: React.FC<{ requiresSignIn?: boolean }> = ({ requiresSignIn = false }) => {
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
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

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

  // Slideshow auto-advance
  useEffect(() => {
    if (slideshowItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slideshowItems.length);
    }, settings.landingPage.slideshowSpeedMs || 4000);
    return () => clearInterval(interval);
  }, [slideshowItems, settings.landingPage.slideshowSpeedMs]);

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
  const [activeCompanyIdx, setActiveCompanyIdx] = useState(0);

  // Auto-advance companies carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCompanyIdx((prev) => (prev + 1) % COMPANIES_USING_CODE76.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    setContactSubmitting(true);

    // 1. Save to the independent CODE76 product-site lead store (not merchant CRM).
    addSiteLead({
      firstName: contactName.trim().split(' ')[0] || contactName.trim(),
      secondName: contactName.trim().split(' ').slice(1).join(' ') || '',
      tel1: contactPhone.trim() || '+1 (555) 000-0000',
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
      `Name: ${contactName}\nEmail: ${contactEmail}\nPhone / WhatsApp: ${contactPhone}\nCompany / Business: ${contactCompany}\nSubject: ${contactSubject}\n\nMessage Details:\n${contactMessage}\n\n---\nDispatched from CODE76 Point of Sale & ERP Commercial Portal`
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
    const primaryPhone = inquiryPhone.trim() || '+1 (555) 000-0000';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white pb-24">
      <PublicLandingMetadata protectedEntry={requiresSignIn} />
      {requiresSignIn && <div role="status" className="border-b border-teal-800 bg-teal-950 px-4 py-3 text-center text-sm text-teal-100">
        This is a private POS workspace. <a href="#portal-access" className="font-bold underline">Sign in or register</a> to continue. Business Landing Pages are available only inside the authenticated POS.
      </div>}
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 border-b border-teal-800/40 text-center py-2 px-4 text-xs font-medium text-teal-200">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>
            <strong>Official CODE76 POS Release:</strong> Enterprise Retail, Supermarket & Restaurant Point of Sale Suite. Refer a fellow business owner and earn $50 instant cash reward!
          </span>
        </span>
      </div>

      {/* Public Landing Navbar - CODE76 POS Official */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800/80 sticky top-0 bg-slate-950/90 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-teal-500/25">
            76
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

        <div className="hidden lg:flex items-center gap-6 text-xs text-slate-300 font-medium">
          <a href="#about" className="hover:text-teal-400 transition">About CODE76</a>
          <a href="#features" className="hover:text-teal-400 transition">Platforms & Features</a>
          <a href="#plans" className="hover:text-teal-400 transition">App Plans</a>
          <a href="#companies" className="hover:text-teal-400 transition">Companies Using CODE76</a>
          <a href="#reviews" className="hover:text-teal-400 transition">Customer Proof</a>
          <a href="#referrals" className="hover:text-teal-400 transition">Referral Rewards</a>
          <a href="#contact" className="hover:text-teal-400 transition">Contact Sales</a>
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
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/30 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </a>
          )}
        </div>
      </nav>

      {/* HERO SECTION WITH PORTAL LOGIN & REGISTRATION INTEGRATION */}
      <section className="relative overflow-hidden pt-10 pb-16 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Brand, Value Proposition & Key Capabilities */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Enterprise Point of Sale & Commercial ERP Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
              Next-Generation Point of Sale & Retail Management Suite
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
              Engineered for high-velocity supermarkets, busy restaurants, pharmacies, wholesale distributors, and retail boutiques. Experience lightning-fast barcode checkout, dual-role staff permissions, automated stock deduplication, and multi-split payments.
            </p>

            {/* Key SaaS ERP Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-Split Payment: Cash, M-Pesa, Card & Wire</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Real-Time Stock Adjustment & Protected PIN Authorization</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>B2B Sales Invoices & Purchase Stock Auto-Sync</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>High-Contrast Light/Dark Themes & Multi-Device Views</span>
              </div>
            </div>

                {/* Live Real-Time Sales Metrics to Incite Social Proof */}
                <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-300">
                  <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800 shadow-md">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      <strong className="text-slate-100 font-extrabold">{CODE76_SITE.exampleSalesCount + 7600}+</strong> Sales Logged
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800 shadow-md">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>
                      <strong className="text-slate-100 font-extrabold">4.9 / 5.0</strong> Client Satisfaction
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800 shadow-md">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>
                      <strong className="text-slate-100 font-extrabold">24/7</strong> AI Sales Concierge
                    </span>
                  </div>
                </div>
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
                        <p className="text-[10px] text-teal-400 font-medium">Enterprise Authentication Gate</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-300 border border-teal-500/30">
                      Encrypted
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
                    <h3 className="font-bold text-slate-100 text-xs mb-1">Zero Downtime Checkout</h3>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Multi-split payments (Cash, M-Pesa, Card, Wire) process in under 3 seconds per customer lane.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 font-bold">
                      <Database className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-100 text-xs mb-1">Automated Stock Sync</h3>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Every sale cross-references inventory in real-time, preventing duplicate reconciliation and stockouts.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-100 text-xs mb-1">Audit-Grade Security</h3>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Role-based privilege enforcement, manager PIN verification, and one-click PDF/CSV audit trail export.
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

          {/* 4. COMPANIES & BRANDS USING CODE76 POS */}
          <section id="companies" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400 flex items-center gap-1.5 mb-1">
                  <Building2 className="w-4 h-4" />
                  Enterprise Adoption
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
                  Companies Using CODE76 POS
                </h2>
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                Over 850+ stores, supermarkets, pharmacies, cafes, and logistics hubs run their daily checkout on CODE76.
              </p>
            </div>

            {/* Featured Active Company Card Showcase */}
            {(() => {
              const comp = COMPANIES_USING_CODE76[activeCompanyIdx] || COMPANIES_USING_CODE76[0];
              const CompIcon = comp.icon;
              return (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-4 flex flex-col items-start gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${comp.color} flex items-center justify-center font-black text-white text-xl shadow-lg border border-white/20`}>
                        {comp.logoText}
                      </div>

                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                          {comp.sector}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-100 mt-1">
                          {comp.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {comp.locations}
                        </p>
                      </div>

                      <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{comp.stat}</span>
                      </div>
                    </div>

                    <div className="lg:col-span-8 bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-4">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>

                      <blockquote className="text-sm sm:text-base text-slate-200 italic leading-relaxed">
                        &quot;{comp.quote}&quot;
                      </blockquote>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-xs text-slate-300 font-bold">
                          {comp.manager}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setActiveCompanyIdx(
                                (activeCompanyIdx - 1 + COMPANIES_USING_CODE76.length) %
                                  COMPANIES_USING_CODE76.length
                              )
                            }
                            className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Previous Company"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setActiveCompanyIdx((activeCompanyIdx + 1) % COMPANIES_USING_CODE76.length)
                            }
                            className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Next Company"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Indicator Dots */}
                  <div className="flex justify-center gap-2 mt-6">
                    {COMPANIES_USING_CODE76.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveCompanyIdx(idx)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          activeCompanyIdx === idx ? 'w-8 bg-teal-400' : 'w-2 bg-slate-800'
                        }`}
                        title={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Quick Grid of all 6 companies */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {COMPANIES_USING_CODE76.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCompanyIdx(i)}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                    activeCompanyIdx === i
                      ? 'bg-teal-950/60 border-teal-500 shadow-md text-white'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${c.color} text-white font-black text-xs flex items-center justify-center mx-auto mb-2`}>
                    {c.logoText}
                  </div>
                  <div className="font-bold text-xs truncate text-slate-100">{c.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-teal-400 truncate">{c.sector.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </section>

          {/* 5. VERIFIED SOCIAL PROOF & TESTIMONIALS */}
          <section id="reviews" className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                Verified Social Proof
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
                Trusted by Retailers & Modern Businesses
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {approvedReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                    <img
                      src={getCustomerReviewAvatar(rev.customerName, rev.customerPhotoUrl)}
                      alt={rev.customerName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-md"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-100 flex items-center gap-1">
                        {rev.customerName}
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {rev.customerLocation || 'Verified Retailer'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 6. VIRAL FRIEND REFERRAL PROGRAM (HOW TO ENSURE EVEN NON-BUYERS REFER SOMEONE) */}
          <section id="referrals" className="max-w-7xl mx-auto px-4 py-12">
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-purple-950/40 border border-amber-800/40 rounded-3xl p-6 sm:p-10 shadow-2xl">
              <div className="max-w-3xl mx-auto text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                  <Gift className="w-6 h-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
                  Earn $50 Every Time You Refer a Friend or Relative
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                  Even if you are not purchasing equipment today, you probably know a fellow retailer, friend, or relative who needs a reliable POS terminal. Generate your referral link below!
                </p>

                <form onSubmit={handleGenerateReferral} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter your name or business..."
                    value={referralName}
                    onChange={(e) => setReferralName(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    Generate Link
                  </button>
                </form>

                {generatedReferralLink && (
                  <div className="mt-4"><LinkCopyField value={generatedReferralLink} label="CODE76 referral link" /></div>
                )}

                {/* Top Referrers on Landing Page */}
                {topReferrers.length > 0 && (
                  <div className="pt-6 border-t border-slate-800/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-3">
                      Our Top Community Referrers
                    </span>
                    <div className="flex flex-wrap justify-center gap-4">
                      {topReferrers.map((ref, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-800 flex items-center gap-2 text-xs"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-slate-200">{ref.firstName} {ref.secondName}</span>
                          <span className="text-[10px] text-amber-300">({ref.referralCount} refs)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 7. DEDICATED CONTACT FORM (EMAILS DIRECTLY TO code76pos@gmail.com) */}
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
                      Message Dispatched to code76pos@gmail.com!
                    </h3>
                    <p className="text-xs text-emerald-300 mt-2 leading-relaxed">
                      Thank you, <strong>{contactName}</strong>! Your inquiry was recorded into our enterprise CRM directory and dispatched to <strong>code76pos@gmail.com</strong>. Our senior technical consultant will reply within 15 minutes.
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
          <section className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 block mb-1">
                  Connect & Follow CODE76 POS
                </span>
                <h3 className="text-lg font-black text-slate-100">
                  Stay Updated Across Our Social Channels
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Join our retailer community, watch video walkthroughs, or chat live on WhatsApp.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent('Hello CODE76 POS Team, I would like to inquire about point of sale setup for my shop.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-bold text-xs flex items-center gap-2 transition"
                >
                  <span>💬 WhatsApp</span>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 text-sky-300 font-bold text-xs flex items-center gap-2 transition"
                >
                  <span>🐦 Twitter / X</span>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-blue-300 font-bold text-xs flex items-center gap-2 transition"
                >
                  <span>💼 LinkedIn</span>
                </a>
                <a
                  href="mailto:code76pos@gmail.com"
                  className="px-4 py-2.5 rounded-xl bg-teal-950/80 hover:bg-teal-900 border border-teal-700/60 text-teal-300 font-bold text-xs flex items-center gap-2 transition"
                >
                  <span>✉️ Email: code76pos@gmail.com</span>
                </a>
              </div>
            </div>
          </section>

          {/* 9. CODE76 POS CORPORATE FOOTER */}
          <footer className="border-t border-slate-800 bg-slate-950 mt-12 pt-12 pb-8 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs">
              <div className="space-y-3">
                <div className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                    76
                  </div>
                  <span>CODE76 POS Systems Inc.</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Empowering supermarkets, restaurants, pharmacies, wholesale depots, and retail enterprises worldwide with lightning-fast checkout and audit-grade commercial ERP architecture.
                </p>
                <div className="text-[11px] text-teal-400 font-mono">
                  TAX PIN: C76-ENTERPRISE-REG-84729
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-200 text-sm mb-3">Direct Technical Contacts</div>
                <ul className="space-y-2 text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-teal-400" />
                    <span>+1 (800) 76-CODE76</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-teal-400" />
                    <a href="mailto:code76pos@gmail.com" className="text-teal-300 hover:underline">
                      code76pos@gmail.com
                    </a>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>24/7 Global Operations & Technical Desk</span>
                  </li>
                </ul>
              </div>

              <div>
                <div className="font-bold text-slate-200 text-sm mb-3">Global Headquarters & Showroom</div>
                <p className="text-slate-400 leading-relaxed flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    CODE76 Technology Towers, 76 Silicon Avenue, Enterprise District, Global Hub
                  </span>
                </p>
              </div>

              <div>
                <div className="font-bold text-slate-200 text-sm mb-3">Enterprise License Tier</div>
                <p className="text-slate-400 leading-relaxed">
                  Authorized installation key: <strong className="text-amber-300 font-mono">C76-PRO-9842</strong>
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={() => setActiveView('pos')}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition cursor-pointer text-center"
                  >
                    Open POS Terminal
                  </button>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
              <div>
                &copy; {new Date().getFullYear()} CODE76 POS Systems Inc. All Rights Reserved. Enterprise Edition.
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-slate-400">
                <a href="#about" className="hover:text-teal-400">About</a>
                <a href="#features" className="hover:text-teal-400">Platforms & Features</a>
                <a href="#companies" className="hover:text-teal-400">Companies</a>
                <a href="#contact" className="hover:text-teal-400">Contact Sales</a>
                <a href="mailto:code76pos@gmail.com" className="text-teal-400 hover:underline">code76pos@gmail.com</a>
              </div>
            </div>
          </footer>

          {/* 8. EMBEDDED LIVE AI SALES CHATBOT WITH PSYCHOLOGICAL PERSUASION */}
          <AIChatbotWidget surface="code76" inquiryLead={activeInquiryLead} />
    </div>
  );
};
