import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { Mail, Send, X, CheckCircle2, HeartHandshake, Eye } from 'lucide-react';
import { SaleTransaction } from '../../types/index.ts';

interface SendEmailReminderModalProps {
  sale: SaleTransaction | null;
  onClose: () => void;
}

export const SendEmailReminderModal: React.FC<SendEmailReminderModalProps> = ({ sale, onClose }) => {
  const { company, settings, logAuditAction, hasFeature } = usePOS();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    if (!sale) return;

    const reviewTemplate =
      settings.emailTemplates.find((t) => t.type === 'review_request') ||
      settings.emailTemplates[3] || {
        subject: `Thank you for choosing ${company.name} - We'd love your feedback!`,
        body: `Dear {customer_name},\n\nThank you for your recent purchase at ${company.name} (Receipt: {receipt_no})!\n\nWe hope your new equipment is serving you well. Would you mind taking a minute to share your honest review or testimonial with us?\n\nWarm regards,\n{cashier_name}\n${company.name}\nTel: ${company.tel1}`,
      };

    const renderedSubj = reviewTemplate.subject
      .replace(/{company_name}/g, company.name)
      .replace(/{customer_name}/g, sale.customerName || 'Valued Customer')
      .replace(/{receipt_no}/g, sale.receiptNo);

    const renderedBody = reviewTemplate.body
      .replace(/{company_name}/g, company.name)
      .replace(/{customer_name}/g, sale.customerName || 'Valued Customer')
      .replace(/{receipt_no}/g, sale.receiptNo)
      .replace(/{cashier_name}/g, sale.cashierName || 'Customer Success Team')
      .replace(/{company_tel}/g, company.tel1);

    setSubject(renderedSubj);
    setBody(renderedBody);
    setSentSuccess(false);
  }, [sale, company, settings]);

  if (!sale || !hasFeature('email')) return null;

  const handleSend = () => {
    logAuditAction(
      'Sent Review Request Email',
      `Sent polite appreciation & testimonial request to ${sale.customerName} for Sale #${sale.receiptNo}`
    );
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 sm:p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-sky-400">
              Customer Appreciation & Testimonial Reminder
            </span>
            <h3 className="text-xl font-bold text-slate-100">
              Email Follow-Up: #{sale.receiptNo}
            </h3>
          </div>
        </div>

        {sentSuccess ? (
          <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl p-8 text-center my-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-emerald-200">Appreciation Email Sent!</h4>
            <p className="text-sm text-emerald-300/90 mt-1">
              Polite follow-up and review invitation has been dispatched to {sale.customerName}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400">Recipient: </span>
                <span className="text-slate-200 font-semibold">{sale.customerName || 'Walk-in'}</span>
              </div>
              <div>
                <span className="text-slate-400">Total: </span>
                <span className="text-emerald-400 font-bold">${sale.netTotal.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Email Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                <span>Message Template Preview</span>
                <span className="text-[11px] text-sky-400 font-normal">Editable before sending</span>
              </label>
              <textarea
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500 leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-lg shadow-sky-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Send Appreciation Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
