import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  Building,
  Save,
  HelpCircle,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { isCompanyConfigured, blankMerchantCompany, readSetupProgress, writeSetupProgress } from '../../utils/onboarding.ts';
import { CompanyData } from '../../types/index.ts';
import { UniversalPhotoInput } from '../common/UniversalPhotoInput.tsx';

export const MyCompanyPlatform: React.FC = () => {
  const { company, setCompany, setHoverHelpPlatform, logAuditAction, products, setCompanyQAModalOpen, settings } = usePOS();

  const [formData, setFormData] = useState<CompanyData>(() => isCompanyConfigured(company) ? company : blankMerchantCompany(settings.payments.defaultCurrency));
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    const saved = { ...formData, name: formData.name.trim(), isConfiguredByMerchant: true };
    setCompany(saved);
    setFormData(saved);
    if (products.length === 0) {
      const previous = readSetupProgress();
      writeSetupProgress({ version: 2, stage: 'inventory', status: 'in_progress', addedProductIds: previous?.addedProductIds || [], draftCompany: saved });
      setCompanyQAModalOpen(true);
    }
    logAuditAction('Updated Company Profile', `Updated brand profile for ${formData.name}`);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">My Company Profile</h1>
            <button
              onClick={() => setHoverHelpPlatform('my_company')}
              title="Click for platform guidance & settings"
              className="p-1 rounded-lg text-teal-400 hover:text-teal-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Define your business identity, contacts and legal details for your Business Landing Page and receipts. This does not edit the CODE76 main site.
          </p>
        </div>

        <button type="button" onClick={() => setCompanyQAModalOpen(true)} className="px-4 py-2 rounded-xl border border-teal-500/40 text-teal-400 text-xs font-bold flex items-center gap-2 cursor-pointer"><Sparkles className="w-4 h-4" />Open guided setup</button>
        {savedSuccess && (
          <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl px-3 py-1.5 text-xs text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Company profile updated!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Company Slogan / Tagline</label>
                <input
                  type="text"
                  value={formData.slogan}
                  onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Mission & Vision Statement</label>
              <textarea
                rows={2}
                value={formData.vision}
                onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-teal-500 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Business Registration No</label>
                <input
                  type="text"
                  value={formData.regNumber}
                  onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tax / VAT PIN</label>
                <input
                  type="text"
                  value={formData.taxPin}
                  onChange={(e) => setFormData({ ...formData, taxPin: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Primary Telephone *</label>
                <input
                  type="text"
                  value={formData.tel1}
                  onChange={(e) => setFormData({ ...formData, tel1: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Secondary Telephone</label>
                <input
                  type="text"
                  value={formData.tel2}
                  onChange={(e) => setFormData({ ...formData, tel2: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Official WhatsApp</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Primary Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Operating Currency</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">City / Region</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700/80">
              <UniversalPhotoInput
                label="Official Company Logo / Stamp (Link, Google Drive, Device Upload / Drag, Live Camera Snapshot)"
                value={formData.logoUrl}
                onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                helperText="Brand logo appears on thermal receipts, PDF commercial invoices, and Business Landing Page header."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Operating Hours</label>
              <input
                type="text"
                value={formData.operatingHours}
                onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-lg shadow-teal-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Company Changes
              </button>
            </div>
          </form>
        </div>

        {/* Live Brand Preview Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block mb-3">
              Business Page & Receipt Brand Preview
            </span>

            {formData.logoUrl && (
              <img
                src={formData.logoUrl}
                alt={formData.name}
                className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3 border-2 border-teal-500/40 shadow-md"
              />
            )}

            <h3 className="text-lg font-black text-slate-100">{formData.name}</h3>
            <p className="text-xs text-teal-300 font-medium mt-1">{formData.slogan}</p>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 mt-4 text-left text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{formData.address}, {formData.location}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>{formData.tel1}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">{formData.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{formData.operatingHours}</span>
              </div>
              {formData.taxPin && (
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 font-mono">
                  TAX PIN: <span className="text-slate-200 font-bold">{formData.taxPin}</span>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-teal-950/40 rounded-xl border border-teal-800/40 text-[11px] text-teal-200 text-left">
              <div className="font-bold flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-teal-300" />
                Autonomous Sync Active
              </div>
              This data feeds your Business Landing Page, PDF vouchers and receipts. It never edits the CODE76 main website.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
