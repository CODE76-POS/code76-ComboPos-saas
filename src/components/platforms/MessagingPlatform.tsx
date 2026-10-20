import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  MessageSquare,
  Send,
  Users,
  Mail,
  Phone,
  HelpCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';
import { PersonRecord } from '../../types/index.ts';

export const MessagingPlatform: React.FC = () => {
  const { customers, vendors, transporters, marketingTeam, companyMembers, company, logAuditAction, setHoverHelpPlatform } =
    usePOS();

  const [targetCategory, setTargetCategory] = useState<'customer' | 'vendor' | 'transporter' | 'marketer' | 'company_member'>('customer');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [messageText, setMessageText] = useState<string>('');
  const [dispatchedSuccess, setDispatchedSuccess] = useState<boolean>(false);

  // Message activity history log
  const [sentLogs, setSentLogs] = useState<
    { id: string; timestamp: string; recipient: string; channel: string; preview: string }[]
  >([
    {
      id: 'msg-1',
      timestamp: '2026-10-15 14:20',
      recipient: 'Michael Ouma (Customer)',
      channel: 'WhatsApp',
      preview: 'Hello Michael, your Touch POS terminal dispatch #76001 is on transit.',
    },
    {
      id: 'msg-2',
      timestamp: '2026-10-15 10:45',
      recipient: 'David Kamau (Transporter)',
      channel: 'SMS',
      preview: 'Hardware pickup scheduled at Silicon Towers Bay 4 at 11:30 AM.',
    },
  ]);

  const getRecipientList = (): PersonRecord[] => {
    switch (targetCategory) {
      case 'customer':
        return customers;
      case 'vendor':
        return vendors;
      case 'transporter':
        return transporters;
      case 'marketer':
        return marketingTeam;
      case 'company_member':
        return companyMembers;
      default:
        return [];
    }
  };

  const recipientList = getRecipientList();
  const currentRecipient = recipientList.find((p) => p.id === selectedPersonId) || recipientList[0];

  const handleApplyQuickTemplate = (tpl: string) => {
    const name = currentRecipient ? currentRecipient.firstName : 'Partner';
    switch (tpl) {
      case 'discount':
        setMessageText(
          `Hello ${name}, ${company.name} is pleased to share our newest 10% commercial discount on all POS scanners and paper rolls. Let us know if you need to restock!`
        );
        break;
      case 'order_ready':
        setMessageText(
          `Hi ${name}, your hardware order at ${company.name} is packed and ready for dispatch. Please confirm delivery location.`
        );
        break;
      case 'debt_reminder':
        setMessageText(
          `Dear ${name}, this is a gentle reminder regarding your outstanding invoice balance at ${company.name}. Please contact us to reconcile payment.`
        );
        break;
      case 'logistics_dispatch':
        setMessageText(
          `Attention ${name}: New dispatch manifest ready for pickup. Please verify the serial numbers upon loading.`
        );
        break;
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const recipientLabel = currentRecipient
      ? `${currentRecipient.firstName} ${currentRecipient.secondName} (${targetCategory})`
      : 'Recipient';

    const newLog = {
      id: `msg-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recipient: recipientLabel,
      channel: channel.toUpperCase(),
      preview: messageText,
    };

    setSentLogs((prev) => [newLog, ...prev]);
    logAuditAction('Sent Direct Message', `Dispatched ${channel.toUpperCase()} message to ${recipientLabel}`);

    setDispatchedSuccess(true);
    setMessageText('');
    setTimeout(() => setDispatchedSuccess(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Messaging & Communications</h1>
            <button
              onClick={() => setHoverHelpPlatform('messaging')}
              title="Click for platform guidance & settings"
              className="p-1 rounded-lg text-teal-400 hover:text-teal-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Multi-channel outreach to Customers, Vendors, Transporters, Marketing Team, and Company Members via WhatsApp, SMS, and Email.
          </p>
        </div>

        {dispatchedSuccess && (
          <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl px-3.5 py-1.5 text-xs text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Message sent & logged!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Compose Form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-teal-400" />
            Compose Message
          </h2>

          <form onSubmit={handleSend} className="space-y-4">
            {/* Target Directory Group */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Target Directory Group</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {(
                  [
                    { id: 'customer', label: 'Customers' },
                    { id: 'vendor', label: 'Vendors' },
                    { id: 'transporter', label: 'Transporters' },
                    { id: 'marketer', label: 'Marketing' },
                    { id: 'company_member', label: 'Staff' },
                  ] as const
                ).map((grp) => (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => {
                      setTargetCategory(grp.id);
                      setSelectedPersonId('');
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      targetCategory === grp.id
                        ? 'bg-teal-600 text-white font-bold shadow-xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific Recipient */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Select Specific Recipient</label>
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              >
                {recipientList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.secondName} — {p.tel1} | {p.email1} ({p.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery Channel */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Delivery Channel</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    channel === 'whatsapp'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  WhatsApp ({currentRecipient?.whatsappNo || 'N/A'})
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    channel === 'sms'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  SMS Mobile ({currentRecipient?.tel1 || 'N/A'})
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    channel === 'email'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  Email ({currentRecipient?.email1 || 'N/A'})
                </button>
              </div>
            </div>

            {/* Quick Templates */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Insert Quick Template</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyQuickTemplate('discount')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-teal-300 cursor-pointer"
                >
                  + New Discount Offer
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyQuickTemplate('order_ready')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-sky-300 cursor-pointer"
                >
                  + Order Ready Notification
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyQuickTemplate('debt_reminder')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-rose-300 cursor-pointer"
                >
                  + Polite Debt Reminder
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyQuickTemplate('logistics_dispatch')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-amber-300 cursor-pointer"
                >
                  + Freight Dispatch Run
                </button>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Message Content</label>
              <textarea
                rows={5}
                required
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500 leading-relaxed font-sans"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-lg shadow-teal-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Dispatch {channel.toUpperCase()} Message
              </button>
            </div>
          </form>
        </div>

        {/* Message Activity Logs */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              Recent Dispatch Log
            </h3>
            <span className="text-xs text-slate-400">{sentLogs.length} logged</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {sentLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-1.5"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">{log.recipient}</span>
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                </div>
                <div className="text-[10px] uppercase font-bold text-teal-400">
                  Channel: {log.channel}
                </div>
                <p className="text-xs text-slate-300 font-sans line-clamp-2 leading-relaxed">
                  {log.preview}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
