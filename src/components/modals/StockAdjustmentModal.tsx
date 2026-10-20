import React, { useState, useEffect } from 'react';
import { ProductItem } from '../../types/index.ts';
import { Package, Plus, Equal, ArrowRight, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import { getDefaultCatalogImageAndEmoji } from '../../data/catalogKnowledgeBase.ts';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  onSave: (newStock: number, reason: string, notes?: string) => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
}) => {
  const [addQuantity, setAddQuantity] = useState<number>(10);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>('Supplier Restock / Inbound Shipment');
  const [notes, setNotes] = useState<string>('');
  const [mode, setMode] = useState<'add' | 'direct'>('add');

  useEffect(() => {
    if (product) {
      const prev = product.stock || 0;
      setAddQuantity(10);
      setNewQuantity(prev + 10);
      setReason('Supplier Restock / Inbound Shipment');
      setNotes('');
      setMode('add');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const previousStock = product.stock || 0;
  const fallback = getDefaultCatalogImageAndEmoji(product.type, product.category);

  const handleAddQtyChange = (val: number) => {
    setAddQuantity(val);
    setNewQuantity(previousStock + val);
  };

  const handleNewQtyChange = (val: number) => {
    setNewQuantity(val);
    setAddQuantity(val - previousStock);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuantity < 0) return;
    onSave(newQuantity, reason, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 text-white max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
              Inventory Restock & Stock Control
            </span>
            <h3 className="text-lg font-bold text-slate-100">
              Add Stock Quantity
            </h3>
          </div>
        </div>

        {/* Selected Product Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">{fallback.emoji}</span>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-100 text-sm truncate">{product.name}</h4>
            <div className="text-[11px] text-teal-400 font-mono">ID: {product.id} | SKU: {product.sku}</div>
            <div className="text-[10px] text-slate-400">Category: {product.category}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('add');
                setNewQuantity(previousStock + addQuantity);
              }}
              className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'add'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Stock (+)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('direct');
                setAddQuantity(newQuantity - previousStock);
              }}
              className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'direct'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Equal className="w-3.5 h-3.5" />
              <span>Set Direct Count (=)</span>
            </button>
          </div>

          {/* Previous Stock vs Added vs New Total Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Previous Stock */}
            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block mb-0.5">Previous Stock</span>
              <span className="text-base font-extrabold text-slate-200 font-mono">
                {previousStock}
              </span>
              <span className="text-[9px] text-slate-500 block">units on hand</span>
            </div>

            {/* Quantity to Add */}
            <div className={`p-2.5 rounded-xl border transition ${
              mode === 'add' ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-slate-950 border-slate-800'
            }`}>
              <label className="text-[10px] text-emerald-300 block mb-0.5 font-bold">Qty to Add</label>
              <input
                type="number"
                min={-previousStock}
                value={addQuantity}
                onChange={(e) => handleAddQtyChange(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-center font-extrabold text-emerald-400 font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[9px] text-emerald-400/80 block mt-0.5">
                {addQuantity >= 0 ? `+${addQuantity}` : `${addQuantity}`}
              </span>
            </div>

            {/* New Total Quantity */}
            <div className={`p-2.5 rounded-xl border transition ${
              mode === 'direct' ? 'bg-teal-950/40 border-teal-500/50' : 'bg-slate-950 border-slate-800'
            }`}>
              <label className="text-[10px] text-teal-300 block mb-0.5 font-bold">New Quantity</label>
              <input
                type="number"
                min={0}
                value={newQuantity}
                onChange={(e) => handleNewQtyChange(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-center font-extrabold text-teal-300 font-mono text-sm focus:outline-none focus:border-teal-500"
              />
              <span className="text-[9px] text-teal-400/80 block mt-0.5">final units</span>
            </div>
          </div>

          {/* Adjustment Reason */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Adjustment Reason / Source</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="Supplier Restock / Inbound Shipment">Supplier Restock / Inbound Shipment</option>
              <option value="Customer Return Restocked">Customer Return Restocked</option>
              <option value="Physical Inventory Recount / Audit">Physical Inventory Recount / Audit</option>
              <option value="Damaged / Broken / Shrinkage Deduction">Damaged / Broken / Shrinkage Deduction</option>
              <option value="Stock Invoice Auto-Sync">Stock Invoice Auto-Sync</option>
              <option value="Store Location Transfer">Store Location Transfer</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Reference Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. PO #8890, delivered by Freight Transporter"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition cursor-pointer font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer text-xs active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Update Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
