import React from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { Printer, Download, X, CheckCircle, Receipt } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { receiptModalSale, setReceiptModalSale, company, settings } = usePOS();

  if (!receiptModalSale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md max-h-[95vh] overflow-y-auto rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setReceiptModalSale(null)}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition no-print"
          aria-label="Close receipt"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Receipt Content */}
        <div id="printable-receipt" className="font-mono text-xs">
          <div className="text-center pb-4 border-b border-dashed border-slate-400">
            <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
              {company.name}
            </h2>
            <p className="text-[11px] text-slate-600 font-sans mt-0.5">{company.slogan}</p>
            <p className="text-[10px] text-slate-500 font-sans mt-1">
              {company.address}, {company.location}
            </p>
            <p className="text-[10px] text-slate-500 font-sans">
              Tel: {company.tel1} | {company.email}
            </p>
            {settings.receipts.showTaxPin && company.taxPin && (
              <p className="text-[10px] text-slate-700 font-bold mt-1">TAX PIN: {company.taxPin}</p>
            )}
          </div>

          <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-600">RECEIPT NO:</span>
              <span className="font-bold">{receiptModalSale.receiptNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">DATE:</span>
              <span>{new Date(receiptModalSale.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">CASHIER:</span>
              <span>{receiptModalSale.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">CUSTOMER:</span>
              <span className="font-semibold">{receiptModalSale.customerName || 'Walk-in Customer'}</span>
            </div>
            {receiptModalSale.referredBy && (
              <div className="flex justify-between text-emerald-800">
                <span>REFERRED BY:</span>
                <span>{receiptModalSale.referredBy.role}</span>
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="py-3 border-b border-dashed border-slate-400">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] text-slate-500 uppercase">
                  <th className="pb-1">Item</th>
                  <th className="pb-1 text-center">Qty</th>
                  <th className="pb-1 text-right">Price</th>
                  <th className="pb-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receiptModalSale.items.map((item, idx) => (
                  <tr key={idx} className="text-[11px]">
                    <td className="py-1.5 pr-2">
                      <div className="font-semibold">{item.product.name}</div>
                      {item.discountValue > 0 && (
                        <div className="text-[9px] text-emerald-700">
                          Disc: -{item.discountType === 'percentage' ? `${item.discountValue}%` : `$${item.discountValue}`}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 text-center">{item.quantity}</td>
                    <td className="py-1.5 text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="py-1.5 text-right font-bold">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">SUBTOTAL:</span>
              <span>${receiptModalSale.subtotal.toFixed(2)}</span>
            </div>

            {receiptModalSale.overallDiscountValue > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>CART DISCOUNT:</span>
                <span>
                  -{receiptModalSale.overallDiscountType === 'percentage'
                    ? `${receiptModalSale.overallDiscountValue}%`
                    : `$${receiptModalSale.overallDiscountValue.toFixed(2)}`}
                </span>
              </div>
            )}

            {receiptModalSale.extraCharges.map((ch) => (
              <div key={ch.id} className="flex justify-between text-slate-600">
                <span>EXTRA ({ch.reason}):</span>
                <span>+${ch.amount.toFixed(2)}</span>
              </div>
            ))}

            <div className="flex justify-between text-base font-extrabold pt-1.5 border-t border-slate-300 text-slate-900">
              <span>TOTAL DUE:</span>
              <span>${receiptModalSale.netTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="font-bold text-slate-700 uppercase text-[10px] mb-1">Payment Breakdown:</div>
            {receiptModalSale.payments.map((p, idx) => (
              <div key={idx} className="flex justify-between">
                <span>
                  {p.method} {p.referenceNo ? `(${p.referenceNo})` : ''}:
                </span>
                <span className="font-semibold">${p.amount.toFixed(2)}</span>
              </div>
            ))}

            <div className="flex justify-between pt-1">
              <span className="text-slate-600">AMOUNT PAID:</span>
              <span className="font-bold text-emerald-700">${receiptModalSale.amountPaid.toFixed(2)}</span>
            </div>

            {receiptModalSale.debtAmount > 0 && (
              <div className="flex justify-between text-rose-700 font-bold bg-rose-50 px-1 py-0.5 rounded">
                <span>REMAINING BALANCE (DEBT):</span>
                <span>${receiptModalSale.debtAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Barcode & Notice */}
          <div className="pt-4 text-center space-y-2">
            {settings.receipts.showBarcode && (
              <div className="flex flex-col items-center justify-center">
                <div className="tracking-[6px] text-lg font-black font-mono">
                  ||| | |||| | ||| || ||| |
                </div>
                <div className="text-[9px] text-slate-500">*{receiptModalSale.receiptNo}*</div>
              </div>
            )}

            <p className="text-[10px] text-slate-600 font-sans">{settings.receipts.footerNotice}</p>
            <p className="text-[9px] text-slate-500 font-sans italic">{settings.receipts.returnPolicy}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between gap-3 no-print">
          <button
            onClick={() => setReceiptModalSale(null)}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
