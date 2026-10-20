import React from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  Database,
  Sparkles,
  CheckCircle2,
  X,
  Package,
  Layers,
  FileText,
  DollarSign,
  Users,
  Building,
  Truck,
  MessageSquare,
  Shield,
  Star,
  Settings,
  Trash2,
} from 'lucide-react';

export const DemoWarningModal: React.FC = () => {
  const {
    demoWarningOpen,
    setDemoWarningOpen,
    loadDemoData,
    setActivePlatform,
    products,
    sales,
    invoices,
    expenses,
    customers,
    vendors,
    transporters,
    marketingTeam,
    companyMembers,
    reviews,
  } = usePOS();

  if (!demoWarningOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-teal-500/30 shadow-2xl p-5 sm:p-7 text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button
          onClick={() => setDemoWarningOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30 shadow-lg shadow-teal-500/10">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60">
                System Administration
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Demo Data &amp; Database Administration
            </h3>
            <p className="text-xs text-slate-400">
              Populate rich simulation data or manage database records
            </p>
          </div>
        </div>

        {/* Current Database Summary Grid */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-400" />
              Current System Database Records
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="block font-black text-slate-100">{products.length}</span>
                <span className="text-[10px] text-slate-400">Products</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="block font-black text-slate-100">{sales.length}</span>
                <span className="text-[10px] text-slate-400">Sales</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="block font-black text-slate-100">{expenses.length}</span>
                <span className="text-[10px] text-slate-400">Expenses</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="block font-black text-slate-100">{invoices.length}</span>
                <span className="text-[10px] text-slate-400">Invoices</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="block font-black text-slate-100">{customers.length}</span>
                <span className="text-[10px] text-slate-400">Customers</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="block font-black text-slate-100">{vendors.length}</span>
                <span className="text-[10px] text-slate-400">Vendors</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="block font-black text-slate-100">{transporters.length}</span>
                <span className="text-[10px] text-slate-400">Transporters</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-400 shrink-0" />
              <div>
                <span className="block font-black text-slate-100">{companyMembers.length}</span>
                <span className="text-[10px] text-slate-400">Staff</span>
              </div>
            </div>
          </div>
        </div>

        {/* Load Demo Data Information Box */}
        <div className="bg-gradient-to-r from-teal-950/40 via-slate-950/60 to-emerald-950/40 border border-teal-800/40 rounded-2xl p-4 mb-5 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Load Rich Simulation Demo Dataset</span>
          </div>
          <p className="text-[11px] text-slate-300/90 leading-relaxed">
            Populates realistic, comprehensive records across all 15 platforms: hardware and grocery inventory items with active discount promo codes, historical sales transactions, dual-role staff members, marketing campaigns, suppliers, transporters, expenses, invoices, and verified 5-star customer reviews.
          </p>
        </div>

        {/* Tip description guiding user to DELETE ALL SETTINGS on Settings platform */}
        <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-4 mb-6 text-xs text-rose-200/90 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Tip: Need to Delete or Wipe Demo Data?</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            If you need a shortcut to delete all that demo data at once or selectively wipe specific platform databases, navigate to <strong className="text-rose-300">DELETE ALL SETTINGS (Database &amp; Platform Data Eraser)</strong> on the <strong className="text-teal-300">Settings Platform</strong>.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setDemoWarningOpen(false);
                setActivePlatform('settings');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-200 text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm"
            >
              <Settings className="w-3.5 h-3.5 text-rose-300" />
              <span>Go to DELETE ALL SETTINGS on Settings Platform &rarr;</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setDemoWarningOpen(false)}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              loadDemoData();
              setDemoWarningOpen(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Database className="w-4 h-4 text-emerald-200" />
            <span>Yes, Load Rich Demo Data</span>
          </button>
        </div>

      </div>
    </div>
  );
};
