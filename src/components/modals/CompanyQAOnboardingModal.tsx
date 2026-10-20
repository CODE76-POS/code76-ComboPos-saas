import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  Building2,
  Sparkles,
  Receipt,
  Globe,
  FileText,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Info,
} from 'lucide-react';
import { CompanyData } from '../../types/index.ts';

export const CompanyQAOnboardingModal: React.FC = () => {
  const {
    company,
    setCompany,
    companyQAModalOpen,
    setCompanyQAModalOpen,
    setHasDismissedCompanyQA,
    setActivePlatform,
    logAuditAction,
  } = usePOS();

  // Local state for all Q&A fields initialized with existing company or sensible defaults
  const [formData, setFormData] = useState<CompanyData>({
    ...company,
    name: company.name === 'CODE76 ENTERPRISE SOLUTIONS' ? '' : company.name,
    isConfiguredByMerchant: true,
  });

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [successToast, setSuccessToast] = useState<string>('');

  if (!companyQAModalOpen) return null;

  const totalSteps = 6;

  const handleSkip = () => {
    try {
      localStorage.setItem('code76_company_qa_dismissed', 'true');
    } catch {
      // ignore
    }
    setHasDismissedCompanyQA(true);
    setCompanyQAModalOpen(false);
  };

  const handleFinish = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const finalizedCompany: CompanyData = {
      ...formData,
      name: formData.name.trim() || 'My Business Store',
      isConfiguredByMerchant: true,
    };

    setCompany(finalizedCompany);
    try {
      localStorage.setItem('code76_company_qa_dismissed', 'true');
    } catch {
      // ignore
    }
    setHasDismissedCompanyQA(true);
    logAuditAction(
      'Configured Company via Q&A',
      `Merchant completed company setup for "${finalizedCompany.name}". Landing page and receipts updated.`
    );

    setSuccessToast('Company profile saved! Your receipts, invoices, and business landing page are now customized.');
    setTimeout(() => {
      setSuccessToast('');
      setCompanyQAModalOpen(false);
    }, 1500);
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-teal-500/30 shadow-2xl p-5 sm:p-7 text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close / Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          title="Skip setup for now"
          aria-label="Skip setup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30 shadow-lg shadow-teal-500/10">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60">
                Setup Assistant
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Question {currentStep + 1} of {totalSteps}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Company Data Q&amp;A Session
            </h2>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Importance Education Card */}
        <div className="bg-gradient-to-r from-teal-950/40 via-slate-950/60 to-emerald-950/40 border border-teal-800/40 rounded-2xl p-4 mb-5 text-xs text-slate-300 space-y-2.5 shadow-inner">
          <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Why is your Company Data so important in CODE76 POS?</span>
          </div>
          <p className="text-[11px] text-slate-300/90 leading-relaxed">
            CODE76 POS automatically turns this information into vital customer-facing tools:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div className="flex items-start gap-1.5 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
              <span><strong>Business Landing Page:</strong> Showcases your real items, location, and contacts to buyers.</span>
            </div>
            <div className="flex items-start gap-1.5 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <Receipt className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Receipts:</strong> Branded thermal prints &amp; WhatsApp e-receipts for customers.</span>
            </div>
            <div className="flex items-start gap-1.5 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span><strong>Invoices &amp; Taxes:</strong> Compliant tax invoices with PIN and company registration.</span>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successToast && (
          <div className="mb-4 bg-emerald-950/70 border border-emerald-800/80 rounded-2xl p-3 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Step-by-Step Questions */}
        <div className="min-h-[220px] bg-slate-950/70 border border-slate-800 rounded-2xl p-5 mb-5 flex flex-col justify-between">
          {/* QUESTION 1: NAME */}
          {currentStep === 0 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                <span>Question 1: Official Brand Identity</span>
              </div>
              <h3 className="text-lg font-black text-slate-100">
                What is your Official Business or Company Name?
              </h3>
              <p className="text-xs text-slate-400">
                This name will appear as the main title on your printed POS receipts, customer invoices, and at the top of your custom Business Landing Page.
              </p>
              <div className="pt-2">
                <input
                  type="text"
                  autoFocus
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Electronics &amp; Hardware Store"
                  className="w-full bg-slate-900 border border-teal-500/40 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                />
              </div>
            </div>
          )}

          {/* QUESTION 2: SLOGAN & VISION */}
          {currentStep === 1 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Question 2: Slogan &amp; Company Vision</span>
              </div>
              <h3 className="text-lg font-black text-slate-100">
                What is your company slogan or customer promise?
              </h3>
              <p className="text-xs text-slate-400">
                Printed on the bottom of customer receipts as a thank-you note and featured on your business landing page hero banner.
              </p>
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Company Slogan / Motto</label>
                  <input
                    type="text"
                    value={formData.slogan}
                    onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                    placeholder="e.g. Quality, Innovation &amp; Speed in Every Deal"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Vision / Mission Statement</label>
                  <input
                    type="text"
                    value={formData.vision}
                    onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                    placeholder="e.g. Empowering businesses with superior quality hardware and equipment"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* QUESTION 3: CONTACT INFORMATION */}
          {currentStep === 2 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <Phone className="w-4 h-4" />
                <span>Question 3: Customer Contact Channels</span>
              </div>
              <h3 className="text-lg font-black text-slate-100">
                How should your customers contact your business?
              </h3>
              <p className="text-xs text-slate-400">
                Included on every customer receipt and enables 1-click WhatsApp order requests from your Business Landing Page.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Primary Telephone</label>
                  <input
                    type="tel"
                    value={formData.tel1}
                    onChange={(e) => setFormData({ ...formData, tel1: e.target.value })}
                    placeholder="+1 (555) 760-0199"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+1 (555) 760-0199"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Official Support / Sales Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sales@mycompany.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* QUESTION 4: PHYSICAL LOCATION */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>Question 4: Physical Business Location</span>
              </div>
              <h3 className="text-lg font-black text-slate-100">
                Where is your store, shop, or office located?
              </h3>
              <p className="text-xs text-slate-400">
                Printed on formal invoices and shows up on your Business Landing Page so nearby customers can visit you in person.
              </p>
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Physical Street Address / Building</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 76 Commerce Avenue, Suite 400"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">City / Region / State</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Silicon Valley, CA"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g. United States"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QUESTION 5: LEGAL & TAX INFO */}
          {currentStep === 4 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Question 5: Legal &amp; Tax Compliance</span>
              </div>
              <h3 className="text-lg font-black text-slate-100">
                What are your Registration &amp; Tax Identification numbers?
              </h3>
              <p className="text-xs text-slate-400">
                Required on standard tax compliance receipts and customer invoices to make them legally valid for audits and expense claims.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tax PIN / VAT / EIN Number</label>
                  <input
                    type="text"
                    value={formData.taxPin}
                    onChange={(e) => setFormData({ ...formData, taxPin: e.target.value })}
                    placeholder="e.g. P051234567Z / EIN-998877"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Business Registration / License No.</label>
                  <input
                    type="text"
                    value={formData.regNumber}
                    onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                    placeholder="e.g. CPR/2026/7600"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* QUESTION 6: OPERATING HOURS & CURRENCY */}
          {currentStep === 5 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Question 6: Operating Schedule &amp; Currency</span>
              </div>
              <h3 className="text-lg font-black text-slate-100">
                What are your operating hours and primary currency?
              </h3>
              <p className="text-xs text-slate-400">
                Your store hours are displayed on your Business Landing Page, and your currency symbol is applied across all POS transactions and product tags.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Weekly Operating Schedule</label>
                  <input
                    type="text"
                    value={formData.operatingHours}
                    onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                    placeholder="e.g. Mon - Sat: 8:00 AM - 7:00 PM"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Currency Code / Symbol</label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="e.g. USD ($) or KES (KSh) or EUR (€)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          {/* Skip Button */}
          <button
            type="button"
            onClick={handleSkip}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs font-semibold transition cursor-pointer text-center"
          >
            Skip for Now (Enter Later on My Company Platform)
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/30 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Save &amp; Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinish()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black shadow-lg shadow-teal-600/30 flex items-center gap-2 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Finish &amp; Apply Company Data</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 text-center text-[11px] text-slate-500">
          💡 You can also update all company details anytime under the <button onClick={() => { handleSkip(); setActivePlatform('my_company'); }} className="text-teal-400 underline hover:text-teal-300 cursor-pointer">My Company</button> platform tab.
        </div>
      </div>
    </div>
  );
};
