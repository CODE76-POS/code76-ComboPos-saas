import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { Mail, Send, X, Sparkles, CheckCircle2, User, Megaphone, Tag, MessageSquare } from 'lucide-react';

export const MarketingCampaignModal: React.FC = () => {
  const {
    marketingModalItem,
    setMarketingModalItem,
    customers,
    marketingTeam,
    company,
    settings,
    logAuditAction,
  } = usePOS();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedMarketerId, setSelectedMarketerId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [customSubject, setCustomSubject] = useState<string>('');
  const [customBody, setCustomBody] = useState<string>('');
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  // Default selection when item changes
  useEffect(() => {
    if (marketingModalItem) {
      if (customers.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(customers[0].id);
      }
      if (marketingTeam.length > 0 && !selectedMarketerId) {
        setSelectedMarketerId(marketingTeam[0].id);
      }
      if (settings.emailTemplates.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(settings.emailTemplates[0].id);
      }
      setSentSuccess(false);
    }
  }, [marketingModalItem, customers, marketingTeam, settings]);

  // Compute message preview whenever customer, marketer, product, or template changes
  useEffect(() => {
    if (!marketingModalItem) return;

    const currentCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
    const currentMarketer = marketingTeam.find((m) => m.id === selectedMarketerId) || marketingTeam[0];
    const template = settings.emailTemplates.find((t) => t.id === selectedTemplateId) || settings.emailTemplates[0];

    if (!template) return;

    const custName = currentCustomer ? `${currentCustomer.firstName} ${currentCustomer.secondName}` : 'Valued Customer';
    const mktName = currentMarketer ? `${currentMarketer.firstName} ${currentMarketer.secondName}` : 'Account Executive';

    const renderedSubject = template.subject
      .replace(/{discount}/g, String(discountPercent))
      .replace(/{product_name}/g, marketingModalItem.name)
      .replace(/{company_name}/g, company.name)
      .replace(/{customer_name}/g, custName);

    const renderedBody = template.body
      .replace(/{discount}/g, String(discountPercent))
      .replace(/{product_name}/g, marketingModalItem.name)
      .replace(/{company_name}/g, company.name)
      .replace(/{customer_name}/g, custName)
      .replace(/{marketer_name}/g, mktName)
      .replace(/{company_tel}/g, company.tel1)
      .replace(/{stock_count}/g, String(marketingModalItem.stock));

    setCustomSubject(renderedSubject);
    setCustomBody(renderedBody);
  }, [selectedCustomerId, selectedMarketerId, selectedTemplateId, discountPercent, marketingModalItem, customers, marketingTeam, company, settings]);

  if (!marketingModalItem) return null;

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
  const currentMarketer = marketingTeam.find((m) => m.id === selectedMarketerId);

  const handleSend = () => {
    logAuditAction(
      'Prepared Marketing Email Draft',
      `Prepared campaign "${customSubject}" to ${currentCustomer?.firstName || 'Customer'} via marketer ${currentMarketer?.firstName || 'Team'}`
    );
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setMarketingModalItem(null);
    }, 2000);
  };

  const handleGenerateWithAI = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/gemini/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: selectedTemplateId,
          product: marketingModalItem,
          customer: currentCustomer,
          marketer: currentMarketer,
          company,
          customDiscount: discountPercent,
        }),
      });
      const data = await res.json();
      if (data.subject) setCustomSubject(data.subject);
      if (data.body) setCustomBody(data.body);
    } catch (e) {
      console.error('AI marketing error', e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setMarketingModalItem(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Close marketing modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-violet-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Direct Sales Marketing Widget
            </span>
            <h3 className="text-xl font-bold text-slate-100">
              Promote: {marketingModalItem.name}
            </h3>
          </div>
        </div>

        {sentSuccess ? (
          <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl p-8 text-center my-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-emerald-200">Campaign draft prepared</h4>
            <p className="text-sm text-emerald-300/90 mt-1">
              No email or notification was delivered. This preview was prepared for {currentCustomer?.firstName} {currentCustomer?.secondName}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Target Product Badge */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {marketingModalItem.imageUrl && (
                  <img
                    src={marketingModalItem.imageUrl}
                    alt={marketingModalItem.name}
                    className="w-12 h-12 object-cover rounded-lg border border-slate-600"
                  />
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-100">{marketingModalItem.name}</div>
                  <div className="text-xs text-slate-400">
                    SKU: {marketingModalItem.sku} | Price: ${marketingModalItem.sellingPrice.toFixed(2)} | In Stock: {marketingModalItem.stock}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium">
                {marketingModalItem.category}
              </span>
            </div>

            {/* Select Customer & Marketer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-400" />
                  Target Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.secondName} ({c.email1})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-violet-400" />
                  Marketer Involved
                </label>
                <select
                  value={selectedMarketerId}
                  onChange={(e) => setSelectedMarketerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  {marketingTeam.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.secondName} (Growth/Marketing)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Select Template & Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  Email Campaign Template (Configured in Settings)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {settings.emailTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-rose-400" />
                  Discount %
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-slate-400 font-semibold">%</span>
                </div>
              </div>
            </div>

            {/* AI Refine button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={isGeneratingAI}
                className="px-3 py-1.5 bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                {isGeneratingAI ? 'Gemini AI Refining Copy...' : 'AI Polish with Gemini'}
              </button>
            </div>

            {/* Subject Line */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Message Body Preview */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Message Body (What customer will receive)
              </label>
              <textarea
                rows={6}
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-teal-500 leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-2">
              <div className="text-xs text-slate-400">
                To: <span className="text-slate-200 font-medium">{currentCustomer?.email1 || 'customer@example.com'}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMarketingModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/30 transition flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Send Campaign Email
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
