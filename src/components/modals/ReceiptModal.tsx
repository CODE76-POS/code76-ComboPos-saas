import { Code76Credit } from '../common/Code76Credit.tsx';
import { useRegionalFormat } from '../../hooks/useRegionalFormat.ts';
import { serviceUnitLabel } from '../../utils/serviceUnits.ts';
import { buildReceiptDocument, receiptShareMessage } from '../../utils/receiptDocument.ts';
import { copyText, downloadReceipt, openShareLink, receiptShareLink } from '../../utils/receiptFiles.ts';
import { RECEIPT_CHANNELS, RECEIPT_FORMATS } from '../../config/assistant.ts';
import { appDialogs } from '../../utils/appDialogs.ts';
import React, { useEffect, useMemo, useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import type { ReceiptChannel, ReceiptFormat } from '../../types/index.ts';
import { CheckCircle, Copy, Download, Mail, MessageCircle, Printer, Receipt, Send, Smartphone, X } from 'lucide-react';

const channelIcon: Record<ReceiptChannel, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: Smartphone,
  copy: Copy,
};

type ReceiptTab = 'preview' | 'send' | 'download';

export const ReceiptModal: React.FC = () => {
  const regionalFormat = useRegionalFormat();
  const {
    receiptModalSale,
    setReceiptModalSale,
    receiptModalIntent,
    setReceiptModalIntent,
    company,
    settings,
    receiptDispatches,
    recordReceiptDispatch,
    hasPrivilege,
    currentUser,
  } = usePOS();
  const currency = company.currency || 'USD';

  const [tab, setTab] = useState<ReceiptTab>('preview');
  const [recipient, setRecipient] = useState('');
  const [channel, setChannel] = useState<ReceiptChannel>('email');
  const [format, setFormat] = useState<ReceiptFormat>('pdf');
  const [busy, setBusy] = useState(false);
  const [lastShared, setLastShared] = useState<string | null>(null);

  const sale = receiptModalSale;
  const document = useMemo(() => sale ? buildReceiptDocument({ sale, company, settings }) : null, [sale, company, settings]);
  const saleDispatches = useMemo(
    () => sale ? receiptDispatches.filter((entry) => entry.saleId === sale.id) : [],
    [receiptDispatches, sale],
  );

  useEffect(() => {
    if (!sale) return;
    setTab(receiptModalIntent === 'send' ? 'send' : receiptModalIntent === 'download' ? 'download' : 'preview');
    setRecipient(sale.customerContact || '');
    setChannel(settings.receipts.defaultChannel || 'email');
    const formats = settings.receipts.enabledFormats || RECEIPT_FORMATS.map((entry) => entry.id);
    setFormat(formats.includes('pdf') ? 'pdf' : formats[0] || 'pdf');
    setLastShared(null);
  }, [sale?.id, receiptModalIntent, settings.receipts.defaultChannel, settings.receipts.enabledFormats]);

  if (!sale || !document) return null;

  const canSend = !!currentUser?.isAdmin || hasPrivilege('canSendReceipts');
  const enabledFormats = (settings.receipts.enabledFormats || RECEIPT_FORMATS.map((entry) => entry.id)).filter((entry) => RECEIPT_FORMATS.some((formatEntry) => formatEntry.id === entry));
  const enabledChannelIds = settings.receipts.enabledChannels || RECEIPT_CHANNELS.map((entry) => entry.id);
  const enabledChannels = RECEIPT_CHANNELS.filter((entry) => enabledChannelIds.includes(entry.id));

  const close = () => {
    setReceiptModalSale(null);
    setReceiptModalIntent('preview');
    setTab('preview');
    setLastShared(null);
  };

  const handlePrint = () => window.print();

  const handleDownload = async (selected: ReceiptFormat) => {
    setBusy(true);
    try {
      const fileName = await downloadReceipt(document, selected, document.fileNameBase);
      setLastShared(`Downloaded ${fileName}`);
      appDialogs.toast(`${selected.toUpperCase()} receipt downloaded.`, 'success');
      recordReceiptDispatch({
        saleId: sale.id, receiptNo: sale.receiptNo, channel: 'copy', recipient: 'Local download',
        format: selected, status: 'copied', note: `Downloaded ${fileName}`,
      });
    } catch (error) {
      await appDialogs.alert({
        title: 'Download failed',
        message: error instanceof Error ? error.message : 'The receipt file could not be generated in this browser.',
        detail: 'Try TXT or CSV instead, or use Print → Save as PDF.',
        tone: 'danger',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    if (!canSend) {
      await appDialogs.alert({ title: 'Receipt sharing not permitted', message: 'Your role does not have the “Send / download customer receipts” privilege. Ask an administrator.', tone: 'warning' });
      return;
    }
    if (channel !== 'copy' && !recipient.trim()) {
      await appDialogs.alert({ title: 'Recipient needed', message: `Enter the customer’s ${channel === 'email' ? 'email address' : 'phone number'} before sharing the receipt.`, tone: 'warning' });
      return;
    }
    const message = receiptShareMessage({ sale, company, settings });
    if (channel === 'copy') {
      const copied = await copyText(`${message}\n\n${document.text}`);
      if (!copied) {
        await appDialogs.alert({ title: 'Clipboard unavailable', message: 'The browser blocked clipboard access. Open the Download tab and save the TXT receipt instead.', tone: 'warning' });
        return;
      }
      recordReceiptDispatch({ saleId: sale.id, receiptNo: sale.receiptNo, channel: 'copy', recipient: 'Clipboard', format: 'txt', status: 'copied' });
      setLastShared('Receipt text copied to the clipboard.');
      appDialogs.toast('Receipt text copied. Paste it into any message or email.', 'success');
      return;
    }
    const link = receiptShareLink(channel, recipient, `Receipt ${sale.receiptNo} · ${company.name}`, message);
    const opened = openShareLink(link);
    recordReceiptDispatch({
      saleId: sale.id,
      receiptNo: sale.receiptNo,
      channel,
      recipient: recipient.trim(),
      format,
      status: 'opened',
      note: 'A pre-filled device share/draft window was opened. CODE76 did not transmit the message.',
    });
    setLastShared(opened
      ? `Opened a pre-filled ${channel === 'email' ? 'email draft' : channel === 'whatsapp' ? 'WhatsApp chat' : 'SMS composer'} for ${recipient.trim()}.`
      : 'The share window could not be opened. Copy the receipt text instead.');
    appDialogs.toast(opened ? 'Share window opened — review and send it from your device.' : 'Share window blocked. Use Copy text instead.', opened ? 'success' : 'warning');
  };

  const openChannel = (next: ReceiptChannel) => {
    setChannel(next);
    setTab('send');
  };

  return (
    <div data-code76-receipt-overlay="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div
        data-code76-receipt-shell="true"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-modal-title"
        className="relative max-h-[96vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-300 bg-white p-4 text-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:p-6"
      >
        <button
          onClick={close}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 no-print"
          aria-label="Close receipt"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="no-print mb-4 flex items-center gap-2 pr-10">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Receipt className="h-4 w-4" /></span>
          <div className="min-w-0">
            <h2 id="receipt-modal-title" className="truncate text-sm font-black">Receipt {sale.receiptNo}</h2>
            <p className="text-[11px] text-slate-500">{regionalFormat.dateTime(sale.timestamp)} · {sale.customerName || 'Walk-in Customer'}</p>
          </div>
        </div>

        <div role="tablist" aria-label="Receipt actions" className="no-print mb-4 grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold">
          {([
            { id: 'preview', label: 'Preview', icon: Receipt },
            { id: 'send', label: 'Send', icon: Send },
            { id: 'download', label: 'Download', icon: Download },
          ] as const).map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.id}
                role="tab"
                aria-selected={tab === entry.id}
                onClick={() => setTab(entry.id)}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${tab === entry.id ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Icon className="h-3.5 w-3.5" />{entry.label}
              </button>
            );
          })}
        </div>

        {tab === 'preview' && (
          <div id="printable-receipt" className="font-mono text-xs">
            <div className="border-b border-dashed border-slate-400 pb-4 text-center">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-900">{company.name}</h2>
              <p className="mt-0.5 font-sans text-[11px] text-slate-600">{company.slogan}</p>
              <p className="mt-1 font-sans text-[10px] text-slate-500">{company.address}, {company.location}</p>
              <p className="font-sans text-[10px] text-slate-500">Tel: {company.tel1} | {company.email}</p>
              {settings.receipts.showTaxPin && company.taxPin && <p className="mt-1 text-[10px] font-bold text-slate-700">TAX PIN: {company.taxPin}</p>}
            </div>

            <div className="space-y-1 border-b border-dashed border-slate-400 py-2.5 text-[11px]">
              <div className="flex justify-between"><span className="text-slate-600">RECEIPT NO:</span><span className="font-bold">{sale.receiptNo}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">DATE:</span><span>{regionalFormat.dateTime(sale.timestamp)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">CASHIER:</span><span>{sale.cashierName}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">CUSTOMER:</span><span className="font-semibold">{sale.customerName || 'Walk-in Customer'}</span></div>
              {sale.referredBy && <div className="flex justify-between text-emerald-800"><span>REFERRED BY:</span><span>{sale.referredBy.role}</span></div>}
            </div>

            <div className="border-b border-dashed border-slate-400 py-3">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-300 text-[10px] uppercase text-slate-500">
                    <th className="pb-1">Item</th><th className="pb-1 text-center">Qty</th><th className="pb-1 text-right">Price</th><th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="text-[11px]">
                      <td className="py-1.5 pr-2">
                        <div className="font-semibold">{item.product.name}</div>
                        {item.product.type === 'service' && item.product.serviceUnit && <div className="text-[9px] text-slate-600">{serviceUnitLabel(item.product)}</div>}
                        {item.discountValue > 0 && <div className="text-[9px] text-emerald-700">Disc: -{item.discountType === 'percentage' ? `${item.discountValue}%` : `$${item.discountValue}`}</div>}
                      </td>
                      <td className="py-1.5 text-center">{item.quantity}</td>
                      <td className="py-1.5 text-right">{currency} {item.unitPrice.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-bold">{currency} {item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 border-b border-dashed border-slate-400 py-2.5 text-[11px]">
              <div className="flex justify-between"><span className="text-slate-600">SUBTOTAL:</span><span>{currency} {sale.subtotal.toFixed(2)}</span></div>
              {sale.overallDiscountValue > 0 && (
                <div className="flex justify-between text-emerald-700"><span>CART DISCOUNT:</span><span>-{sale.overallDiscountType === 'percentage' ? `${sale.overallDiscountValue}%` : `$${sale.overallDiscountValue.toFixed(2)}`}</span></div>
              )}
              {sale.extraCharges.map((charge) => (
                <div key={charge.id} className="flex justify-between text-slate-600"><span>EXTRA ({charge.reason}):</span><span>+${charge.amount.toFixed(2)}</span></div>
              ))}
              <div className="flex justify-between border-t border-slate-300 pt-1.5 text-base font-extrabold text-slate-900"><span>TOTAL DUE:</span><span>{currency} {sale.netTotal.toFixed(2)}</span></div>
            </div>

            <div className="space-y-1 border-b border-dashed border-slate-400 py-2.5 text-[11px]">
              <div className="mb-1 text-[10px] font-bold uppercase text-slate-700">Payment breakdown:</div>
              {sale.payments.filter((payment) => payment.method !== 'Credit / Debt').map((payment, idx) => (
                <div key={idx} className="flex justify-between"><span>{payment.method} {payment.referenceNo ? `(${payment.referenceNo})` : ''}:</span><span className="font-semibold">{currency} {payment.amount.toFixed(2)}</span></div>
              ))}
              <div className="flex justify-between pt-1"><span className="text-slate-600">AMOUNT PAID:</span><span className="font-bold text-emerald-700">{currency} {sale.amountPaid.toFixed(2)}</span></div>
              {sale.debtAmount > 0 && (
                <div className="flex justify-between rounded bg-rose-50 px-1 py-0.5 font-bold text-rose-700"><span>REMAINING BALANCE (DEBT):</span><span>{currency} {sale.debtAmount.toFixed(2)}</span></div>
              )}
            </div>

            {sale.payments.some((payment) => payment.method === 'Credit / Debt') && <p className="mt-2 text-[9px] text-slate-600">Credit/debt at checkout is an unpaid allocation, not a received payment. Only actual received channels are listed above.</p>}
            {!!sale.debtPayments?.length && <div className="mt-3 border-t border-dashed border-slate-400 pt-2 text-[9px]"><strong>Recorded debt-payment history</strong>{sale.debtPayments.map((payment) => <p key={payment.id} className="mt-1">{regionalFormat.dateTime(payment.timestamp)} · {currency} {payment.amount.toFixed(2)} · {payment.method} · Ref: {payment.reference || 'not supplied'} · Balance: {currency} {payment.balanceAfter.toFixed(2)}</p>)}</div>}

            <div className="space-y-2 pt-4 text-center">
              {settings.receipts.showBarcode && (
                <div className="flex flex-col items-center justify-center">
                  <div className="font-mono text-lg font-black tracking-[6px]">||| | |||| | ||| || ||| |</div>
                  <div className="text-[9px] text-slate-500">*{sale.receiptNo}*</div>
                </div>
              )}
              {settings.receipts.paymentInstructions && <p className="font-sans text-[10px] text-slate-700">{settings.receipts.paymentInstructions}</p>}
              <p className="font-sans text-[10px] text-slate-600">{settings.receipts.footerNotice}</p>
              <p className="font-sans text-[9px] italic text-slate-500">{settings.receipts.returnPolicy}</p>
              <Code76Credit compact />
            </div>
          </div>
        )}

        {tab === 'send' && (
          <div className="no-print space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-bold text-slate-800">Send this receipt to the customer</p>
              <p className="mt-1 leading-relaxed">This opens a pre-filled draft in your mail, WhatsApp or SMS app. Review it and send it yourself. CODE76 does not transmit the message and no delivery receipt is claimed.</p>
            </div>

            {!canSend && (
              <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">Your role cannot share receipts. Ask an administrator for the “Send / download customer receipts” privilege. You can still ask a permitted cashier, or use Print.</p>
            )}

            <label className="block text-xs font-bold text-slate-700">{channel === 'email' ? 'Customer email' : 'Customer phone (with country code)'}
              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder={channel === 'email' ? 'customer@example.com' : '+254 700 000 000'}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
              {!recipient && <span className="mt-1 block text-[10px] font-normal text-slate-500">No contact is saved on this sale. Ask the customer or add it to their directory record.</span>}
            </label>

            <div>
              <p className="text-xs font-bold text-slate-700">Channel</p>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {enabledChannels.map((entry) => {
                  const Icon = channelIcon[entry.id];
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setChannel(entry.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${channel === entry.id ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Icon className="h-4 w-4" />{entry.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Message preview</p>
              <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-700">{receiptShareMessage({ sale, company, settings })}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !canSend}
                onClick={() => void handleSend()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-600 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />{channel === 'copy' ? 'Copy receipt text' : 'Open share draft'}
              </button>
              <button type="button" onClick={() => void handleDownload('txt')} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <Download className="h-4 w-4" />Attach TXT copy
              </button>
            </div>

            {lastShared && <p className="flex items-start gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] text-emerald-900"><CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{lastShared}</p>}

            {!!saleDispatches.length && (
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Share history for this receipt</p>
                <ul className="mt-1 space-y-1 text-[11px] text-slate-600">
                  {saleDispatches.map((entry) => (
                    <li key={entry.id}>{regionalFormat.dateTime(entry.sentAt)} · {entry.channel} · {entry.recipient || 'no recipient'} · {entry.format.toUpperCase()} · {entry.status}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tab === 'download' && (
          <div className="no-print space-y-3">
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              Files are generated in this browser. PDF does not need a print dialog or pop-up permission. The TXT copy is also suitable for pasting into a message.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {RECEIPT_FORMATS.filter((entry) => enabledFormats.includes(entry.id)).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDownload(entry.id)}
                  className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-left transition hover:border-teal-400 hover:bg-teal-50 disabled:opacity-40"
                >
                  <Download className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                  <span>
                    <span className="block text-xs font-bold text-slate-800">{entry.label}</span>
                    <span className="block text-[10px] leading-relaxed text-slate-500">{entry.description}</span>
                  </span>
                </button>
              ))}
            </div>
            {lastShared && <p className="flex items-start gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] text-emerald-900"><CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{lastShared}</p>}
            <p className="text-[10px] leading-relaxed text-slate-500">Downloads are recorded in the local receipt send history with the channel “copy”, so the audit log shows what was exported.</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4 no-print">
          <button onClick={close} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Close</button>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setTab('send')} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">
              <Send className="h-3.5 w-3.5" />Send
            </button>
            <button onClick={() => void handleDownload('pdf')} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40">
              <Download className="h-3.5 w-3.5" />PDF
            </button>
            <button onClick={handlePrint} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800">
              <Printer className="h-4 w-4" />Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
