import { DEFAULT_SERVICE_UNIT, serviceUnitLabel } from '../../utils/serviceUnits.ts';
import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  Package,
  Plus,
  Search,
  Megaphone,
  Trash2,
  Edit,
  Download,
  AlertTriangle,
  HelpCircle,
  Tag,
  Boxes,
  FileSpreadsheet,
  Clock,
  Sparkles,
  ShieldAlert,
  Lock,
  KeyRound,
  PackagePlus,
  ShieldCheck,
  X,
  Mail,
} from 'lucide-react';
import { ProductItem } from '../../types/index.ts';
import { exportToCSV, printPDFReport } from '../../utils/exportUtils.ts';
import { InventoryEntryModal } from '../modals/InventoryEntryModal.tsx';
import { StockAdjustmentModal } from '../modals/StockAdjustmentModal.tsx';
import { EmailExportModal } from '../modals/EmailExportModal.tsx';
import {
  getDefaultCatalogImageAndEmoji,
} from '../../data/catalogKnowledgeBase.ts';
import {
  calculateProductProfitMargin,
  generateUniqueInventoryId,
} from '../../utils/calculations.ts';

export const InventoryPlatform: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustProductStock,
    hasPrivilege,
    currentUser,
    setMarketingModalItem,
    setHoverHelpPlatform,
    company,
    hasFeature,
  } = usePOS();
  const currency = company.currency || 'USD';

  const canExport = hasFeature('inventory_export') && hasPrivilege('canExportPdf');
  const canEmail = hasFeature('email') && canExport;
  const canMarket = hasFeature('inventory_marketing');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'product' | 'service'>('All');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [stockModalProduct, setStockModalProduct] = useState<ProductItem | null>(null);
  const [pinAuthOpen, setPinAuthOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingStockProduct, setPendingStockProduct] = useState<ProductItem | null>(null);

  // Email to Party Modal State (.txt and .pdf formats)
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedProductForEmail, setSelectedProductForEmail] = useState<ProductItem | null>(null);

  const inventoryExportColumns = [
    { header: 'ID', dataKey: 'id' },
    { header: 'Name', dataKey: 'name' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Type', dataKey: 'type' },
    { header: 'SKU', dataKey: 'sku' },
    { header: 'Barcode', dataKey: 'barcode' },
    { header: 'Cost', dataKey: 'costPrice' },
    { header: 'Selling', dataKey: 'sellingPrice' },
    { header: 'Quantity / Billing Unit', dataKey: 'quantityBasis' },
    { header: 'Min Alert', dataKey: 'minStockAlert' },
  ];

  const handleOpenBulkEmail = () => {
    if (!canEmail) return;
    setSelectedProductForEmail(null);
    setEmailModalOpen(true);
  };

  const handleOpenRowEmail = (prod: ProductItem) => {
    if (!canEmail) return;
    setSelectedProductForEmail(prod);
    setEmailModalOpen(true);
  };

  const [nextAutoItemId, setNextAutoItemId] = useState<string>(() =>
    generateUniqueInventoryId(
      products.map((p) => p.id),
      'ITEM-2026'
    )
  );

  const handleOpenStockAdjust = (p: ProductItem) => {
    if (p.type === 'service') return;
    const authorized =
      hasPrivilege('canAdjustStock') ||
      currentUser?.isAdmin ||
      currentUser?.roles?.includes('Developer') ||
      currentUser?.roles?.includes('Manager') ||
      currentUser?.roles?.includes('CEO');

    if (!authorized) {
      setPendingStockProduct(p);
      setPinAuthOpen(true);
      setEnteredPin('');
      setPinError('');
      return;
    }
    setStockModalProduct(p);
  };

  const handleVerifyPinAndOpen = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin.trim() === '7676') {
      setPinAuthOpen(false);
      if (pendingStockProduct) {
        setStockModalProduct(pendingStockProduct);
      }
    } else {
      setPinError('Invalid Authorization PIN. Access restricted.');
    }
  };

  const handleSaveStockAdjust = (newStock: number, reason: string, notes?: string) => {
    if (stockModalProduct) {
      adjustProductStock(stockModalProduct.id, newStock, reason, notes);
      setStockModalProduct(null);
    }
  };

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchType = typeFilter === 'All' || p.type === typeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.name2 && p.name2.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q)) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.includes(q);
    return matchCat && matchType && matchQuery;
  });

  const handleOpenCreate = () => {
    const freshId = generateUniqueInventoryId(
      products.map((p) => p.id),
      'ITEM-2026'
    );
    setNextAutoItemId(freshId);
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setProductModalOpen(true);
  };

  const handleSaveProduct = (prodData: ProductItem) => {
    if (editingProduct) {
      updateProduct(prodData);
    } else {
      addProduct(prodData);
      setNextAutoItemId(
        generateUniqueInventoryId(
          [...products.map((p) => p.id), prodData.id],
          'ITEM-2026'
        )
      );
    }
    setProductModalOpen(false);
  };

  const handleDelete = (p: ProductItem) => {
    if (confirm(`Are you sure you want to delete ${p.name}?`)) {
      deleteProduct(p.id);
    }
  };

  // Export single product specification PDF
  const handleExportSinglePDF = (p: ProductItem) => {
    if (!canExport) return;
    const margin = calculateProductProfitMargin(p.costPrice, p.sellingPrice);
    printPDFReport(
      `Product Specification Sheet - ${p.name}`,
      company,
      [
        { header: 'Attribute', dataKey: 'key' },
        { header: 'Detail', dataKey: 'val' },
      ],
      [
        { key: 'Item ID No.', val: p.id },
        { key: 'Product / Service Name', val: p.name },
        { key: 'Alternative Name / Nickname', val: p.name2 || 'None' },
        { key: 'Classification', val: p.type === 'service' ? 'THIS IS A SERVICE' : 'THIS IS A PRODUCT' },
        { key: 'Main Category', val: p.category },
        { key: 'Sub-Category / Niche', val: p.subCategory || 'General' },
        { key: 'Age Restriction', val: p.ageRestriction || 'All Ages' },
        { key: 'SKU Code', val: p.sku },
        { key: 'Barcode / UPC', val: p.barcode },
        { key: 'Cost Acquisition Price', val: p.type === 'service' ? 'N/A (Commercial Service)' : `$${p.costPrice.toFixed(2)}` },
        { key: 'Standard Retail Selling Price', val: `$${p.sellingPrice.toFixed(2)}` },
        { key: 'Active Promo / Discount', val: p.isOnPromo ? `YES (Code: ${p.promoCode}, Price: $${(p.promoDiscountPrice || p.sellingPrice).toFixed(2)})` : 'No' },
        { key: 'Profit / Margin Status', val: p.type === 'service' ? '100% Service Margin' : margin.statusText },
        { key: 'Quantity / Billing Unit', val: p.type === 'service' ? serviceUnitLabel(p) : `${p.stock} units` },
        { key: 'Low Stock Alert Threshold', val: `${p.minStockAlert} units` },
        { key: 'Featured on Landing Page', val: p.isFeatured ? 'Yes (Visible to Buyers)' : 'No' },
        { key: 'Description', val: p.description },
      ]
    );
  };

  // Export Full Inventory Table to CSV
  const handleExportAllCSV = () => {
    if (!canExport) return;
    const rows = products.map((p) => {
      const margin = calculateProductProfitMargin(p.costPrice, p.sellingPrice);
      return {
        'Item ID': p.id,
        'Item Name': p.name,
        'Item Name 2 / Nickname': p.name2 || 'N/A',
        'Classification Type': p.type.toUpperCase(),
        'Main Category': p.category,
        'Sub-Category': p.subCategory || 'General',
        'Age Restriction': p.ageRestriction || 'All Ages',
        'SKU': p.sku,
        'Barcode': p.barcode,
        'Cost / Buying Price': p.type === 'service' ? 0 : p.costPrice,
        'Selling Price': p.sellingPrice,
        'On Promo': p.isOnPromo ? 'YES' : 'NO',
        'Promo Code': p.promoCode || 'N/A',
        'Promo Discount Price': p.isOnPromo ? (p.promoDiscountPrice || p.sellingPrice) : 'N/A',
        'Promo Expiration': p.promoExpiresAt || 'N/A',
        'Profit Diff': p.type === 'service' ? p.sellingPrice : margin.diffAmount,
        'Profit Margin (%)': p.type === 'service' ? 100 : margin.marginPercent,
        'Stock Units': p.type === 'service' ? serviceUnitLabel(p) : p.stock,
        serviceUnit: p.type === 'service' ? p.serviceUnit || DEFAULT_SERVICE_UNIT : '',
        'Min Alert Threshold': p.minStockAlert,
        'Landing Page Featured': p.isFeatured ? 'Yes' : 'No',
        'Description': p.description || 'This product is for sale.',
      };
    });

    exportToCSV(rows, `CODE76-Inventory-Ledger-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <p className="mb-2 text-[10px] text-slate-400">Operating currency: {currency}. Currency changes do not convert existing amounts.</p>
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Products & Commercial Services Inventory
            </h1>
            <button
              onClick={() => setHoverHelpPlatform('inventory')}
              title="Click for platform guidance & settings"
              className="p-1 rounded-lg text-teal-400 hover:text-teal-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Categorized catalog entries with smart autosuggestions, loss margin warnings, promotional countdowns, and multi-channel synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-teal-500/40 rounded-xl px-3 py-1.5 shadow-inner">
            <Lock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <label
              htmlFor="next-auto-item-id-preview"
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap"
            >
              Next Auto-ID:
            </label>
            <input
              id="next-auto-item-id-preview"
              type="text"
              readOnly
              aria-readonly="true"
              value={nextAutoItemId}
              title="Auto-generating read-only unique ID for new inventory items"
              className="w-28 bg-transparent text-xs font-mono font-bold text-teal-300 focus:outline-none cursor-not-allowed select-all"
            />
          </div>

          {canExport && (<button
            onClick={handleExportAllCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>)}

          {canEmail && (<button
            onClick={handleOpenBulkEmail}
            className="px-3.5 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            title="Email entire inventory ledger in .txt and .pdf formats to customer, marketer, company member, vendor, or transporter"
          >
            <Mail className="w-4 h-4 text-teal-300" />
            <span>Email Ledger (.txt & .pdf)</span>
          </button>)}

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Item
          </button>
        </div>
      </div>

      {/* Quick Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID, Item Name, Nickname, SKU, or Barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            {(['All', 'product', 'service'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  typeFilter === t
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'All' ? 'All Items' : t === 'product' ? '📦 Products Only' : '🛠️ Services Only'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-teal-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table with START and END Action columns */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1000px]">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
              <tr>
                {/* START ACTION COLUMN */}
                <th className="py-3 px-3 text-center w-28 text-teal-400">Actions (Start)</th>
                <th className="py-3 px-3">Item Details</th>
                <th className="py-3 px-3">Item ID & Codes</th>
                <th className="py-3 px-3">Taxonomy & Age</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-right">Cost (Buy)</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-center">Profit / Loss</th>
                <th className="py-3 px-3 text-center">Quantity / Billing Unit</th>
                <th className="py-3 px-3 text-center">Marketing Campaign</th>
                {/* END ACTION COLUMN */}
                <th className="py-3 px-3 text-center w-28 text-teal-400">Actions (End)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    No items found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isLowStock = item.type === 'product' && item.stock <= item.minStockAlert;
                  const profitMargin = calculateProductProfitMargin(item.costPrice, item.sellingPrice);
                  const fallback = getDefaultCatalogImageAndEmoji(item.type, item.category);

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      {/* START ACTION COLUMN: Add Stock, Delete, Update/Read, PDF Export */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenStockAdjust(item)}
                            title={
                              item.type === 'service'
                                ? 'Stock count not applicable for services'
                                : 'Add / Restock Stock Quantity (Privileged)'
                            }
                            disabled={item.type === 'service'}
                            className={`p-1 rounded transition cursor-pointer ${
                              item.type === 'service'
                                ? 'opacity-30 cursor-not-allowed bg-slate-900 text-slate-600'
                                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 hover:text-emerald-300 border border-emerald-500/40 shadow-xs'
                            }`}
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Update / Edit Item"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {canExport && (<button
                            onClick={() => handleExportSinglePDF(item)}
                            title="Export PDF Spec Sheet"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 transition cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>)}
                          {canEmail && (<button
                            onClick={() => handleOpenRowEmail(item)}
                            title="Email item spec sheet (.txt & .pdf) to customer/marketer/company member/vendor/transporter"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 transition cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>)}
                          <button
                            onClick={() => handleDelete(item)}
                            title="Delete Item"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* ITEM DETAILS: Name, Nickname, Image, Featured Badge */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xl">{fallback.emoji}</span>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <div className="font-bold text-slate-100 truncate">{item.name}</div>
                            {item.name2 && (
                              <div className="text-[10px] text-sky-300 font-medium truncate">
                                AKA: &quot;{item.name2}&quot;
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              {item.isFeatured && (
                                <span className="text-[9px] text-amber-300 font-semibold bg-amber-950/60 px-1 py-0.2 rounded border border-amber-800/60">
                                  Landing Featured
                                </span>
                              )}
                              {item.isOnPromo && (
                                <span className="text-[9px] text-violet-300 font-bold bg-violet-950/70 px-1.5 py-0.2 rounded border border-violet-500/40">
                                  PROMO: {item.promoCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ITEM ID & CODES */}
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <div className="text-teal-300 font-bold">{item.id}</div>
                        <div className="text-slate-400 text-[10px]">SKU: {item.sku}</div>
                        <div className="text-slate-500 text-[10px]">UPC: {item.barcode}</div>
                      </td>

                      {/* TAXONOMY & AGE RESTRICTION */}
                      <td className="py-2.5 px-3">
                        <div className="text-slate-200 font-semibold">{item.category}</div>
                        {item.subCategory && (
                          <div className="text-[10px] text-slate-400">{item.subCategory}</div>
                        )}
                        {item.ageRestriction && item.ageRestriction !== 'All Ages (General Public)' && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-800/60">
                            {item.ageRestriction}
                          </span>
                        )}
                      </td>

                      {/* TYPE BADGE */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            item.type === 'service'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {item.type === 'service' ? 'SERVICE' : 'PRODUCT'}
                        </span>
                      </td>

                      {/* COST PRICE */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {item.type === 'service' ? (
                          <span className="text-slate-600 text-[10px] italic">Service (N/A)</span>
                        ) : (
                          `$${item.costPrice.toFixed(2)}`
                        )}
                      </td>

                      {/* SELLING PRICE */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        {item.isOnPromo ? (
                          <div>
                            <span className="line-through text-slate-500 text-[10px] block">
                              {currency} {item.sellingPrice.toFixed(2)}
                            </span>
                            <span className="font-black text-amber-400 text-xs">
                              {currency} {(item.promoDiscountPrice || item.sellingPrice).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-black text-emerald-400 text-xs">
                            {currency} {item.sellingPrice.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* MARGIN / LOSS ALERT */}
                      <td className="py-2.5 px-3 text-center">
                        {item.type === 'service' ? (
                          <span className="text-purple-300 font-bold text-[10px]">100% Service</span>
                        ) : profitMargin.isLoss ? (
                          <div className="inline-flex items-center gap-1 bg-rose-950/80 text-rose-300 px-2 py-0.5 rounded-lg border border-rose-500/50 font-mono text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Loss ({profitMargin.marginPercent}%)</span>
                          </div>
                        ) : profitMargin.isBreakEven ? (
                          <span className="text-slate-400 text-[10px] font-mono">Break-Even</span>
                        ) : (
                          <span className="text-emerald-400 font-bold font-mono text-xs">
                            +{profitMargin.marginPercent}%
                          </span>
                        )}
                      </td>

                      {/* STOCK LEVEL */}
                      <td className="py-2.5 px-3 text-center">
                        {item.type === 'service' ? (
                          <span className="text-purple-300 text-[10px] font-semibold">
                            {serviceUnitLabel(item)}
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              className={`font-black font-mono ${
                                isLowStock
                                  ? 'text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded'
                                  : 'text-slate-100'
                              }`}
                            >
                              {item.stock}
                            </span>
                            {isLowStock && (
                              <span title="Low stock warning" className="text-rose-400">
                                <AlertTriangle className="w-3.5 h-3.5 inline" />
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* MARKETING PROMOTION */}
                      <td className="py-2.5 px-3 text-center">
                        {canMarket && (<button
                          onClick={() => { if(canMarket) setMarketingModalItem(item); }}
                          title="Open Marketing Widget: Dispatch email campaign for this product/discount"
                          className="px-2.5 py-1 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 text-[11px] font-bold flex items-center gap-1 mx-auto transition cursor-pointer shadow-xs"
                        >
                          <Megaphone className="w-3.5 h-3.5 text-violet-400" />
                          Promote Item
                        </button>)}
                      </td>

                      {/* END ACTION COLUMN: Delete, Update/Read, PDF Export */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenStockAdjust(item)}
                            title={
                              item.type === 'service'
                                ? 'Stock count not applicable for services'
                                : 'Add / Restock Stock Quantity (Privileged)'
                            }
                            disabled={item.type === 'service'}
                            className={`p-1 rounded transition cursor-pointer ${
                              item.type === 'service'
                                ? 'opacity-30 cursor-not-allowed bg-slate-900 text-slate-600'
                                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 hover:text-emerald-300 border border-emerald-500/40 shadow-xs'
                            }`}
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Update / Edit Item"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {canExport && (<button
                            onClick={() => handleExportSinglePDF(item)}
                            title="Export PDF Spec Sheet"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 transition cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>)}
                          {canEmail && (<button
                            onClick={() => handleOpenRowEmail(item)}
                            title="Email item spec sheet (.txt & .pdf) to customer/marketer/company member/vendor/transporter"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 transition cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>)}
                          <button
                            onClick={() => handleDelete(item)}
                            title="Delete Item"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Catalog Entry Modal */}
      <InventoryEntryModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
        autoGeneratedId={nextAutoItemId}
        existingIds={products.map((p) => p.id)}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={!!stockModalProduct}
        product={stockModalProduct}
        onClose={() => setStockModalProduct(null)}
        onSave={handleSaveStockAdjust}
      />

      {/* Stock Adjustment Privilege Authorization PIN Modal */}
      {pinAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl p-5 text-white animate-in zoom-in-95">
            <button
              onClick={() => setPinAuthOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Stock Privilege Authorization</h4>
                <p className="text-[10px] text-slate-400">Inventory adjustment permission required</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Modifying live warehouse inventory counts is restricted. Please enter your Administrator or Manager authorization PIN to adjust stock for{' '}
              <strong className="text-emerald-400">{pendingStockProduct?.name}</strong>.
            </p>

            <form onSubmit={handleVerifyPinAndOpen} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Manager / Admin Security PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    autoFocus
                    placeholder="Enter Security PIN"
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      setPinError('');
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 font-mono tracking-widest focus:outline-none focus:border-amber-500"
                  />
                </div>
                {pinError && (
                  <p className="text-[10px] text-rose-400 mt-1 font-semibold">{pinError}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPinAuthOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Export Modal for Inventory (.txt and .pdf formats) */}
      {emailModalOpen && (
        <EmailExportModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          title={
            selectedProductForEmail
              ? `Product Spec Sheet: ${selectedProductForEmail.name}`
              : 'Complete Commercial Inventory Ledger'
          }
          moduleName="Inventory"
          isSingleRow={Boolean(selectedProductForEmail)}
          entityName={selectedProductForEmail?.name}
          availableFormats={['txt', 'pdf']}
          data={selectedProductForEmail ? { ...selectedProductForEmail, quantityBasis: selectedProductForEmail.type === 'service' ? serviceUnitLabel(selectedProductForEmail) : selectedProductForEmail.stock } : filtered.map(product => ({ ...product, quantityBasis: product.type === 'service' ? serviceUnitLabel(product) : product.stock }))}
          columns={inventoryExportColumns}
          metadata={[
            { label: 'Category Filter', value: categoryFilter },
            { label: 'Type Filter', value: typeFilter },
            {
              label: 'Total Items',
              value: selectedProductForEmail ? 'Single Item Spec' : `${filtered.length} Items`,
            },
          ]}
        />
      )}
    </div>
  );
};
