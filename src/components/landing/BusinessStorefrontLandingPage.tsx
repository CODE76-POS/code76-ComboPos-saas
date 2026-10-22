import { Code76Credit } from '../common/Code76Credit.tsx';
import { LandingSectionNav } from './LandingSectionNav.tsx';
import { useMeasuredHeader } from '../../hooks/useMeasuredHeader.ts';
import { directoryPhoto } from '../../utils/directory.ts';
import { applicationUrl } from '../../utils/clipboard.ts';
import { LinkCopyField } from '../common/LinkCopyField.tsx';
import { serviceUnitLabel } from '../../utils/serviceUnits.ts';
import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
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
  Tag,
  Check,
  Building,
  Building2,
  DollarSign,
  Package,
  Settings,
  X,
  Globe,
  Heart,
  Target,
  Lightbulb,
  Gem,
  BookOpen,
  ChevronDown,
  Info,
  Compass,
  BadgeCheck,
  Zap,
  Truck,
} from 'lucide-react';
import { AIChatbotWidget, InquiryLeadData } from './AIChatbotWidget.tsx';
import { ProductItem } from '../../types/index.ts';
import {
  getCustomerReviewAvatar,
  getDefaultCatalogImageAndEmoji,
} from '../../data/catalogKnowledgeBase.ts';
import { landingPageData } from '../../utils/landingPages.ts';
import { viewUrl } from '../../utils/appRouting.ts';

export const BusinessStorefrontLandingPage: React.FC = () => {
  const {
    company,
    products,
    companyMembers,
    marketingTeam,
    sales,
    reviews,
    hasFeature,
    customers,
    landingMetrics,
    settings,
    setActiveView,
    setActivePlatform,
    setSettingsSection,
    loadDemoData,
    setLandingMetrics,
    addPerson,
    logAuditAction,
    currentUser,
    logoutUser,
  } = usePOS();

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

  // Storefront Share Modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Commercial Matcher Filter Category
  const [selectedMatcherCategory, setSelectedMatcherCategory] = useState<string>('all');
  const [matcherSearch, setMatcherSearch] = useState<string>('');

  // Slideshow state for remaining items (after the first 6)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Referral generator state
  const [referralName, setReferralName] = useState('');
  const [generatedReferralLink, setGeneratedReferralLink] = useState('');

  // Catalogue browsing controls
  const [catalogType, setCatalogType] = useState<'all' | 'product' | 'service'>('all');
  const [catalogSort, setCatalogSort] = useState<'featured' | 'price-low' | 'price-high'>('featured');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');

  // Merchant-owned data only. An empty catalog is an empty catalog, never a CODE76 demo.
  const { company: displayCompany, products: displayProducts, reviews: displayReviews } = landingPageData('business', { company, products, reviews });
  const isCleanEmptyCatalog = displayProducts.length === 0;
  const currency = displayCompany.currency || settings.payments.defaultCurrency;
  const featuredLimit = settings.landingPage.featuredCount || 6;
  const baseFeatured = displayProducts.filter(product => product.isFeatured !== false).slice(0, featuredLimit);
  const featuredIds = new Set(baseFeatured.map(product => product.id));
  const featuredSix = baseFeatured
    .filter((product) => catalogType === 'all' || product.type === catalogType)
    .filter((product) => catalogCategory === 'all' || product.category === catalogCategory)
    .sort((a, b) => catalogSort === 'price-low' ? a.sellingPrice - b.sellingPrice : catalogSort === 'price-high' ? b.sellingPrice - a.sellingPrice : 0);
  const serviceCount = displayProducts.filter((product) => product.type === 'service').length;
  const productCount = displayProducts.length - serviceCount;
  const slideshowItems = displayProducts.filter(product => !featuredIds.has(product.id));
  const catalogCategories = [...new Set(displayProducts.map(product => product.category).filter(Boolean))];
  const openOwnerPlatform = (platform: 'inventory' | 'settings' | 'selling') => {
    if (platform === 'settings') setSettingsSection('landingPage');
    setActivePlatform(platform);
    setActiveView('pos');
  };

  // Slideshow auto-advance
  useEffect(() => {
    if (slideshowItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slideshowItems.length);
    }, settings.landingPage.slideshowSpeedMs || 4000);
    return () => clearInterval(interval);
  }, [slideshowItems, settings.landingPage.slideshowSpeedMs]);

  // Private owner-preview visits only; this component never tracks anonymous visitors.
  useEffect(() => {
    if (!currentUser) return;
    setLandingMetrics((prev) => ({
      ...prev,
      visitors: prev.visitors + 1,
    }));
  }, [currentUser, setLandingMetrics]);

  const handleGenerateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralName.trim()) return;
    const url = new URL(getInternalPreviewUrl());
    url.searchParams.set('ref', referralName.trim());
    setGeneratedReferralLink(url.toString());
  };



  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryFirstName.trim() || (!inquiryEmail.trim() && !inquiryPhone.trim()) || !inquiryModalProduct) {
      return;
    }

    const leadFullName = `${inquiryFirstName.trim()} ${inquirySecondName.trim()}`.trim();
    const primaryPhone = inquiryPhone.trim();
    const primaryEmail = inquiryEmail.trim();

    // 1. Save this merchant inquiry in the browser-local merchant CRM.
    addPerson('customer', {
      firstName: inquiryFirstName.trim(),
      secondName: inquirySecondName.trim() || '',
      tel1: primaryPhone,
      tel2: '',
      whatsappNo: primaryPhone,
      email1: primaryEmail,
      email2: '',
      address: inquiryLocation.trim() || 'Store Location Pending',
      location: inquiryLocation.trim() || displayCompany.location || 'Retail Hub',
      country: displayCompany.country || 'Global',
      photoUrl: '',
      photoConsentForLanding: false,
      category: 'customer',
      notes: `Business page inquiry for ${inquiryModalProduct.name} (${currency} ${inquiryModalProduct.sellingPrice}). Channel: ${inquiryPreferredContact.toUpperCase()}. Customer Notes: ${inquiryNotes || 'None provided'}`,
    });

    // 2. LOG AUDIT ACTION FOR ENTERPRISE SECURITY
    logAuditAction(
      'Storefront Lead Captured',
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
      setInquiryFirstName('');
      setInquirySecondName('');
      setInquiryEmail('');
      setInquiryPhone('');
      setInquiryLocation('');
      setInquiryNotes('');
    }, 1400);
  };

  const merchantHeader=useRef<HTMLElement>(null);
  useMeasuredHeader(merchantHeader,'--business-site-header-height');

  // This link remains inside the authenticated POS. It is NOT a public storefront.
  const getInternalPreviewUrl = () => typeof window === 'undefined' ? '' : viewUrl('pos', applicationUrl(window.location.href, import.meta.env.BASE_URL), 'landing_page_builder');

  // Native #section links would overwrite the hash route; scroll without leaving the builder.
  const scrollToSection = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById(event.currentTarget.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };



  // Filter products for the Interactive Commercial Matcher
  const filteredMatcherProducts = displayProducts.filter((p) => {
    const matchesCat = selectedMatcherCategory === 'all' || `category:${p.category}` === selectedMatcherCategory;
    const matchesSearch =
      !matcherSearch.trim() ||
      p.name.toLowerCase().includes(matcherSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(matcherSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(matcherSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Top Referrers for Social Proof
  const topReferrers = [...customers, ...marketingTeam, ...companyMembers]
    .filter((p) => (p.referralCount || 0) > 0)
    .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0))
    .slice(0, settings.landingPage.topReferrersLimit || 4);

  // Verified reviews
  const approvedReviews = displayReviews.filter((r) => r.isApprovedForLanding);
  const showReviews = settings.landingPage.showSocialProof && approvedReviews.length > 0;
  const averageRating = approvedReviews.length ? (approvedReviews.reduce((total, review) => total + review.rating, 0) / approvedReviews.length).toFixed(1) : null;

  // Defence in depth if this component is accidentally mounted outside App's guard.
  if (!currentUser) return null;

  return (
    <div className="business-landing-page min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white pb-24">
      {/* Top Announcement Bar */}
      {hasFeature('referrals') && settings.landingPage.referralBonusText.trim() && <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 border-b border-teal-800/40 text-center py-2 px-4 text-xs font-medium text-teal-200">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>
            <strong>Store Special Offer:</strong> {settings.landingPage.referralBonusText}
          </span>
        </span>
      </div>}

      {/* Authenticated Business Landing Page preview navigation */}
      <header ref={merchantHeader} data-business-site-header="true" className="sticky z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md" style={{top:'var(--pos-header-height, 0px)'}}>
      <nav aria-label="Business identity and private actions" className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          {displayCompany.logoUrl ? (
            <img
              src={displayCompany.logoUrl}
              alt={displayCompany.name}
              className="w-10 h-10 rounded-xl object-cover border border-teal-500/40 shadow-md"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-black text-lg flex items-center justify-center shadow-md">
              <Store className="w-5 h-5" aria-hidden="true" />
            </div>
          )}
          <div>
            <span className="font-extrabold text-lg text-slate-100 tracking-tight block">
              {displayCompany.name}
            </span>
            <span className="text-[10px] text-teal-400 block font-semibold">
              {displayCompany.slogan || 'Products & services from our business'}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            aria-label="Open private business page link"
            onClick={() => setShareModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            title="Copy a private workspace link — sign-in required"
          >
            <Share2 className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Private Link</span>
          </button>

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
              <button type="button" onClick={() => openOwnerPlatform('settings')} title="Edit your Business Landing Page settings — not the CODE76 main site" aria-label="Business page settings" className="p-2 rounded-xl border border-slate-700 text-teal-400 hover:bg-slate-800 cursor-pointer"><Settings className="w-4 h-4" /></button>
              <button
                onClick={() => openOwnerPlatform('selling')}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/30 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Return to POS</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveView('landing')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-teal-400" />
              <span>Sign In to POS</span>
            </button>
          )}
        </div>
      </nav>
      <LandingSectionNav label="Business page sections" preserveHash sections={[{id:'business-start',label:'Overview'},{id:'featured',label:'Featured'},{id:'matcher',label:'Catalog'},{id:'buying-guide',label:'How to choose'},{id:'why-choose-business',label:'Why Choose Us'},{id:'about-business',label:'About Us'},...(showReviews?[{id:'reviews',label:'Reviews'}]:[]),...(hasFeature('referrals')&&settings.landingPage.referralBonusText.trim()?[{id:'referrals',label:'Referrals'}]:[]),{id:'business-faqs',label:'FAQs'},...(hasFeature('chatbot')&&settings.landingPage.showChatbot?[{id:'assistant',label:'Ask the business'}]:[]),{id:'contact',label:'Contact'}]}/>
      </header>

      <div className="border-b border-teal-800/60 bg-teal-950/70 px-4 py-3 text-center text-xs text-teal-100" role="note">
        <strong>Private Business Landing Page preview.</strong> Only signed-in POS users can access this screen. This page is not published to the public website. Its content is managed separately from CODE76 product marketing.
      </div>

      {/* Merchant Site Creation Setup Alert */}
      {(!company.isConfiguredByMerchant || isCleanEmptyCatalog) && (
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 border-b border-teal-500/30 px-4 py-3 text-xs text-slate-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping shrink-0" />
              <div>
                <strong className="text-teal-300">Action Required to Complete Your Business Storefront:</strong>{' '}
                <span className="text-slate-300">
                  {isCleanEmptyCatalog && !company.isConfiguredByMerchant
                    ? 'Your Business Landing Page is waiting for your company profile and inventory items.'
                    : isCleanEmptyCatalog
                    ? 'No products or services found in inventory. Add catalog items in Inventory to showcase them to customers.'
                    : 'Company details not yet personalized. Configure your business name, address, and contacts in My Company.'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!company.isConfiguredByMerchant && (
                <button
                  onClick={() => {
                    setActivePlatform('my_company');
                    setActiveView('pos');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Configure My Company &rarr;
                </button>
              )}
              {isCleanEmptyCatalog && (
                <button
                  onClick={() => {
                    setActivePlatform('inventory');
                    setActiveView('pos');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Add Inventory Items &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STOREFRONT HERO SECTION */}
      <section id="business-start" className="relative overflow-hidden pt-12 pb-16 px-4 max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Our products & services</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
            {settings.landingPage.heroTitle || displayCompany.name}
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {settings.landingPage.heroSubtitle || displayCompany.slogan || 'Explore our products and services. Contact us for availability and more information.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800 shadow-md">
              <Package className="w-4 h-4 text-teal-400" />
              <span>
                <strong className="text-slate-100 font-extrabold">{displayProducts.length}</strong> catalog entries from Inventory
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800 shadow-md">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span><strong className="text-slate-100 font-extrabold">{serviceCount}</strong> services · {productCount} products</span>
            </div>

            {showReviews && (<div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800 shadow-md">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>
                <strong className="text-slate-100 font-extrabold">{`${averageRating} / 5.0`}</strong>{approvedReviews.length > 0 && ` · ${approvedReviews.length} approved reviews`}
              </span>
            </div>)}

            <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800 shadow-md">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>
                Hours: <strong className="text-slate-100">{displayCompany.operatingHours || 'Contact us for hours'}</strong>
              </span>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#featured" onClick={scrollToSection}
              className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore featured items</span>
            </a>
            <a
              href="#matcher" onClick={scrollToSection}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Find the right product or service</span>
            </a>
            {displayCompany.whatsapp && (
              <a
                href={`https://wa.me/${displayCompany.whatsapp.replace(/[^\d+]/g, '').replace(/^\+/, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="px-6 py-3 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-200 border border-emerald-800 font-bold text-xs transition flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message on WhatsApp</span>
              </a>
            )}
            {displayCompany.tel1 && (
              <a href={`tel:${displayCompany.tel1}`} className="px-6 py-3 rounded-2xl border border-slate-700 text-slate-200 font-bold text-xs transition hover:bg-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400" /><span>Call the business</span>
              </a>
            )}
          </div>
          <p className="text-[10px] text-slate-500">Prices, availability and service scope are confirmed directly with the business. This preview takes no payment and reserves nothing.</p>
        </div>
      </section>

      <section id="buying-guide" className="max-w-7xl mx-auto px-4 py-8"><div className="grid md:grid-cols-3 gap-3">{[{title:'1. Find a good fit',copy:'Browse the actual catalog, compare descriptions and check the displayed price or service billing unit.'},{title:'2. Confirm the details',copy:'Ask about current availability, service scope, timing and any applicable terms before making a decision.'},{title:'3. Choose your next step',copy:'Use the business contact details to arrange an order or service. This preview does not take payment, reserve stock or confirm appointments.'}].map(step=><article key={step.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><h2 className="font-bold text-sm text-teal-300">{step.title}</h2><p className="mt-2 text-xs leading-relaxed text-slate-400">{step.copy}</p></article>)}</div>
        <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-500"><strong className="text-slate-300">Payment & ordering:</strong> this page does not accept card, mobile-money or cash payments. Orders, deposits and delivery arrangements are agreed directly with the business using the contact details below. A quote request only records your interest in this browser.</p></section>

      {/* WHY CHOOSE US - MERCHANT */}
      <section id="why-choose-business" className="max-w-7xl mx-auto px-4 py-14 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Award className="w-4 h-4" /> Why Choose Us
          </span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Why Choose {displayCompany.name}?
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            We combine quality products, honest pricing and personal service — every item is verified from our live Inventory and every review is from real customers.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: BadgeCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', title: 'Quality Assured', desc: 'Every product and service listing comes directly from our Inventory with accurate descriptions, pricing and stock — no bait-and-switch.' },
            { icon: DollarSign, color: 'text-teal-400', bg: 'bg-teal-500/15', border: 'border-teal-500/30', title: 'Fair & Transparent Pricing', desc: `Clear pricing in ${currency} with no hidden fees. What you see is what you confirm with us before any commitment.` },
            { icon: Truck, color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30', title: 'Fast & Reliable Fulfilment', desc: 'Coordinated logistics and local delivery options ensure your order or service is handled professionally and on time.' },
            { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', title: 'Verified Customer Reviews', desc: 'Approved reviews with ratings from genuine buyers — not fabricated testimonials. See what neighbours say about us.' },
            { icon: MapPin, color: 'text-indigo-400', bg: 'bg-indigo-500/15', border: 'border-indigo-500/30', title: 'Local & Accessible', desc: `${displayCompany.location ? `Proudly serving ${displayCompany.location}${displayCompany.country ? `, ${displayCompany.country}` : ''}.` : 'Rooted in your community — visit us, call or WhatsApp anytime.'} ${displayCompany.operatingHours ? `Open: ${displayCompany.operatingHours}.` : ''}` },
            { icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30', title: 'Customer-First Support', desc: 'Direct contact via phone, WhatsApp or email — no bots, no queue. We answer questions about availability, scope and terms honestly.' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-teal-500/40 transition shadow-lg">
                <div className={`w-12 h-12 rounded-xl ${item.bg} border ${item.border} ${item.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ABOUT US - MERCHANT */}
      <section id="about-business" className="max-w-7xl mx-auto px-4 py-14 scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <span className="text-xs uppercase font-extrabold tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> About {displayCompany.name}
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              The Story Behind Our Business
            </h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              {displayCompany.vision || displayCompany.slogan || 'We are committed to delivering excellent products and dependable services that make everyday life easier for our customers.'}
            </p>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Based in {displayCompany.location || 'your community'}{displayCompany.country ? `, ${displayCompany.country}` : ''} {displayCompany.address ? `at ${displayCompany.address}` : ''}, we have built our reputation on trust, consistency and personal care. {displayCompany.operatingHours ? `We operate ${displayCompany.operatingHours} to be there when you need us.` : ''} Whether you browse our catalog online or visit us in person, you get the same honest pricing, verified stock and friendly guidance.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                <div className="text-lg font-black text-teal-300">{displayProducts.length}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Catalog Items</div>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                <div className="text-lg font-black text-amber-300">{approvedReviews.length || 0}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Verified Reviews</div>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                <div className="text-lg font-black text-sky-300">{companyMembers.length + marketingTeam.length}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Team Members</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-100">Our Promise</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex gap-2.5"><Target className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" /><span><strong className="text-slate-100">Mission:</strong> To provide quality products and reliable services at fair prices with transparent communication.</span></li>
                <li className="flex gap-2.5"><Globe className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" /><span><strong className="text-slate-100">Vision:</strong> To be the most trusted local provider — where every customer feels valued and every order is handled with care.</span></li>
                <li className="flex gap-2.5"><BookOpen className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /><span><strong className="text-slate-100">Location:</strong> {[displayCompany.address, displayCompany.location, displayCompany.country].filter(Boolean).join(', ') || 'Contact us for directions'}.</span></li>
                <li className="flex gap-2.5"><Clock className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" /><span><strong className="text-slate-100">Hours:</strong> {displayCompany.operatingHours || 'Contact us for hours'}.</span></li>
                <li className="flex gap-2.5"><ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span><strong className="text-slate-100">Contact:</strong> {displayCompany.tel1 || 'Phone pending'} {displayCompany.whatsapp ? `· WhatsApp ${displayCompany.whatsapp}` : ''} {displayCompany.email ? `· ${displayCompany.email}` : ''}</span></li>
              </ul>
              <div className="mt-5 flex gap-2">
                <a href="#featured" onClick={scrollToSection} className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold text-center transition">Browse Catalog</a>
                <a href="#contact" onClick={scrollToSection} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-200 text-xs font-bold text-center transition">Contact Us</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1. PRIMARY LIVE CATALOG (ITEMS 1 TO 6) */}
      <section id="featured" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400 flex items-center gap-1.5 mb-1">
              <Package className="w-4 h-4" />
              From our Inventory
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
              Featured Products & Services
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Products, prices and stock from this business’s Inventory. Contact the business to confirm availability.
          </p>
        </div>

        {isCleanEmptyCatalog && <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center" role="status"><Package className="w-9 h-9 mx-auto mb-3 text-teal-400" /><h3 className="font-bold text-lg">No products or services yet</h3><p className="text-sm text-slate-400 mt-2">This business has not added any catalog items. There are no sample products here.</p>{currentUser && <button type="button" onClick={() => openOwnerPlatform('inventory')} className="mt-5 px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer">Add your first item in Inventory</button>}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!!displayProducts.length && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Browse</span>
              {(['all', 'product', 'service'] as const).map((type) => (
                <button key={type} type="button" onClick={() => setCatalogType(type)} className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${catalogType === type ? 'bg-teal-600 text-white' : 'border border-slate-800 text-slate-400 hover:text-slate-200'}`}>
                  {type === 'all' ? 'All types' : type === 'product' ? 'Products' : 'Services'}
                </button>
              ))}
              <select aria-label="Filter catalogue category" value={catalogCategory} onChange={(event) => setCatalogCategory(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-200">
                <option value="all">Every category</option>
                {catalogCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <select aria-label="Sort catalogue" value={catalogSort} onChange={(event) => setCatalogSort(event.target.value as typeof catalogSort)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-200">
                <option value="featured">Featured order</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
              <span className="ml-auto text-[10px] text-slate-500">{featuredSix.length} of {displayProducts.length} shown</span>
            </div>
          )}

          {featuredSix.map((item) => {
            const hasPromo = item.isOnPromo && item.promoDiscountPrice;
            const fallbackGraphic = getDefaultCatalogImageAndEmoji(item.type, item.category);

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 group"
              >
                <div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 mb-4 border border-slate-800 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallbackGraphic.imageUrl;
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                        <span className="text-4xl">{fallbackGraphic.emoji}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</span>
                      </div>
                    )}

                    {/* Stock Status Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      {item.type === 'service' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-800/80 backdrop-blur-md">
                          {serviceUnitLabel(item)}
                        </span>
                      ) : item.stock <= item.minStockAlert ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-950/90 text-rose-300 border border-rose-800/90 backdrop-blur-md flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          {item.stock === 0 ? 'Out of stock' : `Low Stock (${item.stock} left)`}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-800/90 backdrop-blur-md flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          In Stock ({item.stock} units)
                        </span>
                      )}
                    </div>

                    {/* Promo Discount Tag */}
                    {hasPromo && (
                      <div className="absolute top-2.5 right-2.5 bg-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>SALE PROMO</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono text-teal-400">{item.sku}</span>
                      <span>{item.category}</span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-100 group-hover:text-teal-300 transition line-clamp-1">
                      {item.name}
                    </h3>

                    {item.name2 && (
                      <div className="text-[11px] text-slate-400 font-medium truncate">
                        {item.name2}
                      </div>
                    )}

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed pt-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    {hasPromo ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-emerald-400 font-mono">
                          {currency} {item.promoDiscountPrice?.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-500 line-through font-mono">
                          {currency} {item.sellingPrice.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-black text-slate-100 font-mono">
                        {currency} {item.sellingPrice.toFixed(2)}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-500 block">Excl. applicable tax</span>
                  </div>

                  <button
                    onClick={() => setInquiryModalProduct(item)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/30 transition cursor-pointer active:scale-95"
                  >
                    <span>Request Quote</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. INTERACTIVE COMMERCIAL MATCHER */}
      <section id="matcher" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-20">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mb-8">
            <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4" />
              Interactive Commercial Matcher
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
              Find What You’re Looking For
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              Browse this business’s categories, or search for a product or service by name, description or SKU.
            </p>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[{ id: 'all', label: 'All Items' }, ...catalogCategories.map(category => ({ id: `category:${category}`, label: category }))].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedMatcherCategory(tab.id)}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer border ${
                    selectedMatcherCategory === tab.id
                      ? 'bg-teal-600 border-teal-400 text-white shadow-md shadow-teal-600/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog SKUs..."
                value={matcherSearch}
                onChange={(e) => setMatcherSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Matched Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredMatcherProducts.slice(0, 8).map((p) => (
              <div
                key={p.id}
                className="bg-slate-950/80 border border-slate-800/80 hover:border-teal-500/40 rounded-2xl p-4 flex flex-col justify-between transition group"
              >
                <div>
                  <div className="w-full h-28 rounded-xl bg-slate-900 overflow-hidden mb-3 border border-slate-800 flex items-center justify-center">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <span className="text-3xl">{getDefaultCatalogImageAndEmoji(p.type, p.category).emoji}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-teal-400 block">{p.sku}</span>
                  <h4 className="font-bold text-xs text-slate-100 truncate mt-0.5">{p.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-normal">{p.description}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="font-extrabold text-sm text-emerald-400 font-mono">{currency} {p.sellingPrice.toFixed(2)}</span>
                  <button
                    onClick={() => setInquiryModalProduct(p)}
                    className="px-2.5 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white text-[11px] font-bold transition cursor-pointer"
                  >
                    Match Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. EXTENDED CATALOG SLIDESHOW (ITEMS 7+) */}
      {slideshowItems.length > 0 && (
        <section id="slideshow" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400 flex items-center gap-1.5 mb-1">
                <Layers className="w-4 h-4" />
                Explore our full collection
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
                More from Our Catalog
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Discover more products and services from this business.
            </p>
          </div>

          {/* Active Slideshow Item Card */}
          {(() => {
            const currentItem = slideshowItems[currentSlideIndex] || slideshowItems[0];
            return (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 aspect-video sm:aspect-square max-h-72 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {currentItem.imageUrl ? (
                      <img src={currentItem.imageUrl} alt={currentItem.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">{getDefaultCatalogImageAndEmoji(currentItem.type, currentItem.category).emoji}</span>
                    )}
                  </div>

                  <div className="lg:col-span-7 space-y-4 text-left">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold text-[10px] border border-teal-500/30">
                        {currentItem.category}
                      </span>
                      <span className="font-mono text-slate-400 text-xs">SKU: {currentItem.sku}</span>
                      <span className="text-emerald-400 text-xs font-semibold">
                        • {currentItem.type === 'service' ? `${serviceUnitLabel(currentItem)} · contact to arrange` : `Stock: ${currentItem.stock} units`}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-slate-100">{currentItem.name}</h3>
                    {currentItem.name2 && <p className="text-xs text-teal-300 font-semibold">{currentItem.name2}</p>}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{currentItem.description}</p>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Live Inventory Price</span>
                        <span className="text-2xl font-black text-emerald-400 font-mono">{currency} {currentItem.sellingPrice.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + slideshowItems.length) % slideshowItems.length)}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Previous Item"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % slideshowItems.length)}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Next Item"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setInquiryModalProduct(currentItem)}
                          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/30 cursor-pointer"
                        >
                          <span>Request Quotation</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slideshow Indicator Dots */}
                <div className="flex justify-center gap-1.5 mt-6">
                  {slideshowItems.slice(0, 12).map((_, idx) => (
                    <button
                      key={idx}
                      aria-label={`Show catalog item ${idx + 1}`}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        currentSlideIndex === idx ? 'w-8 bg-teal-400' : 'w-2 bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* 4. VERIFIED STORE REVIEWS */}
      {showReviews && (
        <section id="reviews" className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
              Customer Reviews
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
              What Customers Say About {displayCompany.name}
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
                  <p className="text-xs text-slate-300 italic leading-relaxed">&quot;{rev.comment}&quot;</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                  <img
                    src={rev.customerPhotoUrl || directoryPhoto({firstName:rev.customerName,secondName:'',photoUrl:'',avatarStyle:rev.avatarStyle})}
                    alt={rev.customerName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-100 flex items-center gap-1">
                      {rev.customerName}
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <div className="text-[10px] text-slate-400">{rev.customerLocation || 'Customer'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. STORE REFERRAL REWARDS */}
      {hasFeature('referrals') && settings.landingPage.referralBonusText.trim() && <section id="referrals" className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-purple-950/40 border border-amber-800/40 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <Gift className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
              Referral Section Preview
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              {settings.landingPage.referralBonusText}
            </p>

            <p className="text-xs text-amber-200">Links generated here are private previews requiring POS sign-in, not published customer referral links.</p>
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
                Generate Private Preview Link
              </button>
            </form>

            {generatedReferralLink && (
              <div className="mt-4"><LinkCopyField value={generatedReferralLink} label="Private referral preview link" /></div>
            )}
          </div>
        </div>
      </section>}

      {/* 6. STORE OFFICIAL CONTACT & LOCATION DETAILS */}
      {hasFeature('chatbot') && settings.landingPage.showChatbot && <section id="assistant" className="max-w-7xl mx-auto px-4 py-8"><div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="max-w-2xl"><h2 className="text-xl font-bold">{settings.chatbot?.assistantName || 'A question before you decide?'}</h2><p className="mt-2 text-sm text-slate-400">Ask about this business's actual catalog and contacts. Confirm availability and terms directly; the assistant does not take payment, reserve stock or confirm appointments.</p></div><div className="mt-3 flex flex-wrap gap-1.5">{(settings.chatbot?.quickPrompts || []).slice(0, 4).map((prompt) => <span key={prompt} className="rounded-full border border-teal-800 px-2.5 py-1 text-[10px] text-teal-300">{prompt}</span>)}</div><AIChatbotWidget surface="business" inquiryLead={activeInquiryLead} inlineLauncher /></div></section>}

      {/* BUSINESS FAQs */}
      <section id="business-faqs" className="max-w-7xl mx-auto px-4 py-14 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs uppercase font-extrabold tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" /> FAQs — {displayCompany.name}
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">Common Questions</h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">Answers about orders, delivery, payments and returns. For anything else, use the contacts below or WhatsApp us directly.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {[
            { q: `How do I place an order with ${displayCompany.name}?`, a: `Browse our Featured or Catalog sections, click Request Quote on any item, and submit your details. We receive your inquiry instantly and contact you via ${displayCompany.tel1 ? `phone ${displayCompany.tel1}` : 'phone'}${displayCompany.whatsapp ? ` or WhatsApp ${displayCompany.whatsapp}` : ''} to confirm availability, pricing and next steps. No payment is taken on this preview.` , icon: ShoppingBag },
            { q: 'Do you deliver?', a: `Delivery availability, fees and timing depend on your location and order size. ${displayCompany.location ? `We operate from ${displayCompany.location} —` : ''} contact us with your delivery address for an accurate quote. Logistics partners are coordinated for reliable fulfilment.`, icon: Truck },
            { q: 'How do I know the price is current?', a: `Prices shown are live from our Inventory (SKU and category listed). Confirm the final total before commitment — promotions, taxes and stock levels can change.`, icon: DollarSign },
            { q: 'Can I request a service, not a product?', a: `Yes — ${serviceCount} of our ${displayProducts.length} listings are services (per ${displayProducts.find(p=>p.type==='service') ? serviceUnitLabel(displayProducts.find(p=>p.type==='service')!) : 'hour/day/project'} etc.). Share your scope/timing and we will quote accordingly.`, icon: Layers },
            { q: 'How are reviews verified?', a: 'Only approved reviews from real customers appear here, with ratings and locations. We never fabricate testimonials — authenticity builds trust.', icon: Star },
            { q: 'What payment methods do you accept?', a: 'Payment terms are agreed directly with us — we discuss cash, mobile-money, card or transfer options after confirming your order. This page does not collect payments.', icon: CheckCircle2 },
            { q: `What are your hours?`, a: displayCompany.operatingHours ? `We operate ${displayCompany.operatingHours}. Messages outside hours are answered on the next working period.` : 'Contact us for current operating hours — we respond promptly during business periods.', icon: Clock },
            { q: 'How do I contact you fastest?', a: `${displayCompany.whatsapp ? `WhatsApp ${displayCompany.whatsapp} is fastest.` : ''} ${displayCompany.tel1 ? ` Call ${displayCompany.tel1} for urgent queries.` : ''} Email ${displayCompany.email || 'us via the contact section'} also works for detailed requests.`, icon: MessageSquare },
          ].map(item => {
            const Icon = item.icon;
            return (
              <details key={item.q} className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 open:border-sky-500/40 open:bg-slate-900/90 transition">
                <summary className="flex items-center gap-3 cursor-pointer list-none">
                  <span className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-sky-300 flex items-center justify-center shrink-0 group-open:bg-sky-500/15 group-open:border-sky-500/30">
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
      </section>

      <section id="contact" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-20">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Building className="w-5 h-5 text-teal-400" />
                <h3 className="font-extrabold text-base text-slate-100">{displayCompany.name}</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">{displayCompany.vision || displayCompany.slogan}</p>
              <div className="font-mono text-[11px] text-teal-400">TAX PIN: {displayCompany.taxPin || 'Not provided'}</div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Direct Contacts</h4>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                <span>{displayCompany.tel1 || 'Phone not provided'}</span>
              </div>
              {displayCompany.whatsapp && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp: {displayCompany.whatsapp}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>{displayCompany.email || 'Email not provided'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Store Hours & Location</h4>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span>{[displayCompany.address, displayCompany.location, displayCompany.country].filter(Boolean).join(', ') || 'Location not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>{displayCompany.operatingHours || 'Contact us for hours'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile quick actions: always visible, no pop-up required */}
      <div className="sticky bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 px-3 py-2 backdrop-blur md:hidden no-print">
        <div className="flex gap-2 text-[11px] font-bold">
          {displayCompany.tel1 && <a href={`tel:${displayCompany.tel1}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-2 py-2.5 text-white"><Phone className="h-3.5 w-3.5" />Call</a>}
          {displayCompany.whatsapp && <a href={`https://wa.me/${displayCompany.whatsapp.replace(/[^\d+]/g, '').replace(/^\+/, '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-2 py-2.5 text-white"><MessageSquare className="h-3.5 w-3.5" />WhatsApp</a>}
          {hasFeature('chatbot') && settings.landingPage.showChatbot && <a href="#assistant" onClick={scrollToSection} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700 px-2 py-2.5 text-slate-200"><Sparkles className="h-3.5 w-3.5 text-teal-400" />Ask</a>}
        </div>
      </div>

      <footer className="max-w-7xl mx-auto px-4 pb-8" aria-label="Website creator credit"><Code76Credit /></footer>

      {/* PRODUCT QUOTATION INQUIRY MODAL */}
      {inquiryModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
            <button
              aria-label="Close product inquiry"
              onClick={() => setInquiryModalProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Instant Quote Request</span>
                <h3 className="text-lg font-black text-slate-100">{inquiryModalProduct.name}</h3>
                <span className="font-mono text-emerald-400 text-xs font-bold">{currency} {inquiryModalProduct.sellingPrice.toFixed(2)}</span>
              </div>
            </div>

            {inquirySuccess ? (
              <div className="p-6 bg-emerald-950/60 border border-emerald-600 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-emerald-200">Quote Inquiry Recorded!</h4>
                <p className="text-xs text-emerald-300">
                  Your request was logged in our store directory. Connecting you to our AI sales consultant...
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={inquiryFirstName}
                      onChange={(e) => setInquiryFirstName(e.target.value)}
                      placeholder="e.g. John"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Last Name</label>
                    <input
                      type="text"
                      value={inquirySecondName}
                      onChange={(e) => setInquirySecondName(e.target.value)}
                      placeholder="e.g. Doe"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Location / Delivery City</label>
                  <input
                    type="text"
                    value={inquiryLocation}
                    onChange={(e) => setInquiryLocation(e.target.value)}
                    placeholder="e.g. Downtown Central Hub"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preferred Contact Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'whatsapp', label: 'WhatsApp' },
                      { id: 'call', label: 'Phone Call' },
                      { id: 'email', label: 'Email' },
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setInquiryPreferredContact(ch.id as any)}
                        className={`py-2 rounded-xl text-center font-bold text-xs transition cursor-pointer border ${
                          inquiryPreferredContact === ch.id
                            ? 'bg-teal-600 border-teal-400 text-white shadow-xs'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Notes / Questions</label>
                  <textarea
                    rows={2}
                    value={inquiryNotes}
                    onChange={(e) => setInquiryNotes(e.target.value)}
                    placeholder="Describe your till requirements or expected quantities..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setInquiryModalProduct(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/30"
                  >
                    Send Quotation Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* INTERNAL WORKSPACE LINK — NEVER PUBLIC PUBLISHING */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="private-business-link-heading" className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white text-center">
            <button
              aria-label="Close business page link dialog"
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>

            <Share2 className="w-10 h-10 text-teal-400 mx-auto mb-3" />
            <h3 id="private-business-link-heading" className="text-lg font-black text-slate-100">Private Business Page Link</h3>
            <p className="text-xs text-slate-400 mt-1">
              Sign-in is required. This link opens the internal landing_page_builder screen inside the POS, not a public storefront. Merchant data remains browser-local.
            </p>

            <div className="mt-4"><LinkCopyField value={getInternalPreviewUrl()} label="Private business page link" openLink /></div>
          </div>
        </div>
      )}

      {/* FLOATING AI CHATBOT CONCIERGE */}

    </div>
  );
};
