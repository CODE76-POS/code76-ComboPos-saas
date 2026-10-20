import { acceptedPaymentMethods } from '../../config/paymentMethods.ts';
import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { CreditCard, CheckCircle2, X, DollarSign, Wallet } from 'lucide-react';
import { SaleTransaction } from '../../types/index.ts';

interface DebtPaymentModalProps {
  sale: SaleTransaction | null;
  onClose: () => void;
}

export const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({ sale, onClose }) => {
  const { settleDebt, hasFeature, settings } = usePOS();

  const [paymentAmount, setPaymentAmount] = useState<number>(sale ? sale.debtAmount : 0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [success, setSuccess] = useState<boolean>(false);

  if (!sale || !hasFeature('debts')) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;

    settleDebt(sale.id, paymentAmount, paymentMethod);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
  };

  const remainingAfterPayment = Math.max(0, sale.debtAmount - paymentAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 sm:p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-rose-400">
              Accounts Receivable & Debt Settlement
            </span>
            <h3 className="text-xl font-bold text-slate-100">
              Clear Balance for #{sale.receiptNo}
            </h3>
          </div>
        </div>

        {success ? (
          <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl p-8 text-center my-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-emerald-200">Payment Processed Successfully!</h4>
            <p className="text-sm text-emerald-300/90 mt-1">
              Receipt ledger and customer debt records updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-slate-200">{sale.customerName || 'Walk-in'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Bill:</span>
                <span>${sale.netTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Already Paid:</span>
                <span className="text-emerald-400 font-semibold">${sale.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-1.5 font-bold text-sm">
                <span className="text-rose-400">Outstanding Debt:</span>
                <span className="text-rose-400">${sale.debtAmount.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Settlement Amount ($)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={sale.debtAmount}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-base font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute left-3 top-3 text-slate-500 font-bold">$</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Remaining Debt after payment:</span>
                <span className="font-semibold text-slate-200">${remainingAfterPayment.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {acceptedPaymentMethods(settings.payments.acceptedMethods,false).map(method=><option key={method}>{method}</option>)}
</select>
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
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                Record Debt Payment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
