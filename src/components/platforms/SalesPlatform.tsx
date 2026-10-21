import {calendarDate} from '../../utils/regional.ts';
import { acceptedPaymentMethods } from '../../config/paymentMethods.ts';
import { serviceUnitLabel } from '../../utils/serviceUnits.ts';
import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Tag,
  CreditCard,
  UserCheck,
  ShoppingBag,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Printer,
  Star,
  CheckCircle,
  Truck,
  Layers,
  FileText,
  X,
  CheckCircle2,
} from 'lucide-react';
import { CartItem, ExtraCharge, PaymentSplit, ProductItem, ReceiptChannel } from '../../types/index.ts';
import { appDialogs } from '../../utils/appDialogs.ts';
import { RECEIPT_CHANNELS } from '../../config/assistant.ts';
import { calculateCartTotals, calculatePaymentsAndDebt } from '../../utils/calculations.ts';

export const SalesPlatform: React.FC = () => {
  const {
    products,
    customers,
    marketingTeam,
    companyMembers,
    addSale,
    createSalesInvoiceFromCart,
    setReceiptModalSale,
    setReceiptModalIntent,
    setReviewModalSale,
    setHoverHelpPlatform,
    settings,
    company,
    hasFeature,
    currentUser,
  } = usePOS();
  const currency = company.currency || 'USD';

  const availableMethods = acceptedPaymentMethods(settings.payments.acceptedMethods, hasFeature('debts') && settings.payments.allowDebtSales);
  const [checkoutError,setCheckoutError] = useState('');
  const [debtDueDate,setDebtDueDate]=useState('');
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  // Optional receipt delivery chosen before the sale is completed.
  const [receiptDelivery, setReceiptDelivery] = useState(false);
  const [receiptChannel, setReceiptChannel] = useState<ReceiptChannel>('email');
  const [receiptRecipient, setReceiptRecipient] = useState('');
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceDueDate, setInvoiceDueDate] = useState<string>(() =>
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [invoiceIsPaid, setInvoiceIsPaid] = useState<boolean>(true);
  const [invoiceNotes, setInvoiceNotes] = useState<string>('Net 14 Days commercial invoice.');
  const [invoiceSuccessMsg, setInvoiceSuccessMsg] = useState<string>('');
  const [selectedReferrer, setSelectedReferrer] = useState<{ id: string; name: string; role: string } | null>(null);

  // Search & autocomplete
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoCompleteOpen, setAutoCompleteOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Overall discount & Extra charges
  const [overallDiscountType, setOverallDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [overallDiscountValue, setOverallDiscountValue] = useState<number>(0);
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [extraAmountInput, setExtraAmountInput] = useState<number>(0);
  const [extraReasonInput, setExtraReasonInput] = useState<ExtraCharge['reason']>('Transportation');
  const [extraCustomNote, setExtraCustomNote] = useState<string>('');

  // Multi-payment split
  const [payments, setPayments] = useState<PaymentSplit[]>([{ method: 'Cash', amount: 0 }]);

  // Referral list combining Customers, Marketers & Company Members
  const referrersList = useMemo(() => {
    const list: { id: string; name: string; role: string }[] = [];
    customers.forEach((c) => {
      list.push({
        id: c.id,
        name: `${c.firstName} ${c.secondName}`,
        role: `${c.firstName} ${c.secondName} (Customer)`,
      });
    });
    marketingTeam.forEach((m) => {
      list.push({
        id: m.id,
        name: `${m.firstName} ${m.secondName}`,
        role: `${m.firstName} ${m.secondName} (Marketor)`,
      });
    });
    companyMembers.forEach((mem) => {
      list.push({
        id: mem.id,
        name: `${mem.firstName} ${mem.secondName}`,
        role: `${mem.firstName} ${mem.secondName} (${mem.roles?.[0] || 'Staff'})`,
      });
    });
    return list;
  }, [customers, marketingTeam, companyMembers]);

  // Product categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products for search autocomplete and optional grid
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q);
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations using pure calculations utility
  const totals = useMemo(() => {
    return calculateCartTotals(
      cart,
      overallDiscountType,
      overallDiscountValue,
      extraCharges,
      settings.payments.taxRatePercentage
    );
  }, [cart, overallDiscountType, overallDiscountValue, extraCharges, settings]);

  // Payment reconciliation
  const paymentAnalysis = useMemo(() => {
    return calculatePaymentsAndDebt(totals.netTotal, payments);
  }, [totals.netTotal, payments]);

  // Add product to cart with quantity
  const addToCart = (product: ProductItem, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + qty;
        const sub = newQty * existing.unitPrice;
        const disc =
          existing.discountType === 'percentage'
            ? sub * (existing.discountValue / 100)
            : existing.discountValue;
        const total = Math.max(0, sub - disc);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty, total } : item
        );
      } else {
        const unitPrice =
          product.isOnPromo && product.promoDiscountPrice !== undefined
            ? product.promoDiscountPrice
            : product.sellingPrice;
        const sub = qty * unitPrice;
        const newItem: CartItem = {
          product,
          quantity: qty,
          unitPrice,
          discountType: 'percentage',
          discountValue: 0,
          total: sub,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateCartItemQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = Math.max(1, item.quantity + delta);
            const sub = newQty * item.unitPrice;
            const disc =
              item.discountType === 'percentage'
                ? sub * (item.discountValue / 100)
                : item.discountValue;
            return { ...item, quantity: newQty, total: Math.max(0, sub - disc) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const updateCartItemDiscount = (
    productId: string,
    type: 'percentage' | 'fixed',
    val: number
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const sub = item.quantity * item.unitPrice;
          const disc = type === 'percentage' ? sub * (val / 100) : val;
          return {
            ...item,
            discountType: type,
            discountValue: val,
            total: Math.max(0, sub - disc),
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setExtraCharges([]);
    setOverallDiscountValue(0);
    setPayments([{ method: 'Cash', amount: 0 }]);
  };

  // Add extra charge
  const handleAddExtraCharge = () => {
    if (extraAmountInput <= 0) return;
    const newCharge: ExtraCharge = {
      id: `ch-${Date.now()}`,
      reason: extraReasonInput,
      amount: extraAmountInput,
      description: extraCustomNote,
    };
    setExtraCharges((prev) => [...prev, newCharge]);
    setExtraAmountInput(0);
    setExtraCustomNote('');
  };

  const removeExtraCharge = (id: string) => {
    setExtraCharges((prev) => prev.filter((ch) => ch.id !== id));
  };

  // Multi-Payment handlers
  const addPaymentMethod = () => {
    const currentPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const remainder = Math.max(0, totals.netTotal - currentPaid);
    setPayments((prev) => [...prev, { method: availableMethods.find(m=>m!=='Cash') || availableMethods[0] || 'Cash', amount: remainder }]);
  };

  const updatePaymentRow = (index: number, field: keyof PaymentSplit, val: any) => {
    setPayments((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, [field]: val } : p))
    );
  };

  const removePaymentRow = (index: number) => {
    setPayments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const autoFillFullPayment = () => {
    setPayments([{ method: availableMethods.includes('Cash')?'Cash':availableMethods[0] || 'Cash', amount: totals.netTotal }]);
  };

  // Complete Checkout
  const handleCompleteSale = () => {
    if (cart.length === 0) return;
    if (!hasFeature('debts') && paymentAnalysis.remainingDebt > 0) { setCheckoutError('The Free plan requires full payment. Debt creation and handling need a paid demo plan.'); return; }

    if(debtDueDate && !/^\d{4}-\d{2}-\d{2}$/.test(debtDueDate)){setCheckoutError('Choose a valid optional debt due date.');return;}
    setCheckoutError('');
    const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
    const customerName = currentCustomer
      ? `${currentCustomer.firstName} ${currentCustomer.secondName}`
      : 'Walk-in Retail Buyer';

    const completed = addSale({
      customerId: selectedCustomerId || 'walk-in',
      customerName,
      customerContact: receiptRecipient.trim() || currentCustomer?.tel1 || currentCustomer?.email1 || '',
      cashierId: currentUser?.id || 'cashier',
      cashierName: currentUser?.name || 'Cashier',
      items: cart,
      subtotal: totals.subtotal,
      overallDiscountType,
      overallDiscountValue,
      extraCharges,
      taxAmount: totals.taxAmount,
      netTotal: totals.netTotal,
      payments,
      amountPaid: paymentAnalysis.totalPaid,
      debtAmount: paymentAnalysis.remainingDebt,
      debtDueDate:paymentAnalysis.remainingDebt>0?debtDueDate||undefined:undefined,
      referredBy: selectedReferrer ? selectedReferrer : undefined,
      status: paymentAnalysis.remainingDebt > 0 ? paymentAnalysis.totalPaid>0?'debt_partial':'debt_pending' : 'completed',
      hasReview: false,
    });

    // Receipt hand-off. The cashier decides; nothing is sent automatically.
    const wantSend = receiptDelivery;
    if (wantSend) {
      setReceiptModalIntent('send');
      setReceiptModalSale(completed);
    } else if (settings.receipts.promptAfterSale !== false) {
      setTimeout(async () => {
        const choice = await appDialogs.choice({
          title: 'Sale complete — share the receipt?',
          message: `${completed.receiptNo} · ${currency} ${completed.netTotal.toFixed(2)}`,
          detail: 'Choose how to hand the receipt to the customer. Nothing is emailed or messaged automatically, and no browser popup is used.',
          tone: 'success',
          actions: [
            { id: 'send', label: 'Send the receipt', description: 'Email, WhatsApp or SMS draft, or copy the text.', tone: 'primary' },
            { id: 'download', label: 'Download a copy', description: 'PDF, TXT, CSV, JSON or HTML generated in this browser.', tone: 'neutral' },
            { id: 'view', label: 'View / print the receipt', description: 'Open the receipt preview.', tone: 'neutral' },
          ],
          cancelLabel: 'Not now',
        });
        if (!choice) return;
        setReceiptModalIntent(choice === 'download' ? 'download' : choice === 'send' ? 'send' : 'preview');
        setReceiptModalSale(completed);
      }, 250);
    } else if (settings.receipts.autoOpenAfterSale !== false) {
      setReceiptModalIntent('preview');
      setReceiptModalSale(completed);
    }

    // Prompt for review capture if customer exists
    if (hasFeature('business_landing')) setTimeout(() => { setReviewModalSale(completed); }, 1400);

    // Reset cart
    clearCart();setDebtDueDate('');setReceiptDelivery(false);
  };

  const isCartOnLeft = settings.appearance.cartPosition === 'left';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {checkoutError && <p role="alert" className="mb-4 rounded-xl border border-amber-700 p-3 text-sm text-amber-300">{checkoutError}</p>}
      {/* Platform Header with Help Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Sales POS Terminal</h1>
            <button
              onClick={() => setHoverHelpPlatform('selling')}
              title="Click for platform guidance & settings"
              className="p-1 rounded-lg text-teal-400 hover:text-teal-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Multi-payment splits, live autocomplete, line & cart discounts, extra charges, and social referral tagging.
          </p>
        </div>

        {/* Quick Customer & Referrer Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Customer */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200">
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900">
                  {c.firstName} {c.secondName} ({c.location})
                </option>
              ))}
            </select>
          </div>

          {hasFeature('referrals') && (<>
          {/* Sales Referred By combo-box */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedReferrer ? selectedReferrer.role : ''}
              onChange={(e) => {
                const item = referrersList.find((r) => r.role === e.target.value);
                setSelectedReferrer(item || null);
              }}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[200px]"
            >
              <option value="" className="bg-slate-900">Referred By: None</option>
              {referrersList.map((ref, idx) => (
                <option key={idx} value={ref.role} className="bg-slate-900">
                  {ref.role}
                </option>
              ))}
            </select>
          </div>          </>)}

        </div>
      </div>

      {/* Main Grid: Left/Right Cart configuration */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${
          isCartOnLeft ? 'flex flex-col-reverse lg:grid' : ''
        }`}
      >
        {/* Product Catalog / Search Section (Takes 7 cols) */}
        <div className={`${isCartOnLeft ? 'lg:col-span-7 lg:order-2' : 'lg:col-span-7 lg:order-1'}`}>
          {/* Autocomplete Search Bar */}
          <div className="relative mb-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Type product name, SKU, or scan barcode to search & add..."
                value={searchQuery}
                onFocus={() => setAutoCompleteOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setAutoCompleteOpen(true);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 shadow-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Rich Autocomplete Dropdown with photo, stock, and quick add quantity */}
            {autoCompleteOpen && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                <div className="p-2 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex justify-between items-center">
                  <span>Autocomplete Suggestions ({filteredProducts.length} items)</span>
                  <button
                    onClick={() => setAutoCompleteOpen(false)}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    Close [x]
                  </button>
                </div>
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No matching products or services found.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 hover:bg-slate-800/60 flex items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-100 truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-400">
                              SKU: {p.sku} | Barcode: {p.barcode}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            {p.isOnPromo ? (
                              <div>
                                <span className="line-through text-slate-500 text-[10px] block">
                                  {currency} {p.sellingPrice.toFixed(2)}
                                </span>
                                <span className="text-xs font-black text-amber-400 font-mono">
                                  {currency} {(p.promoDiscountPrice || p.sellingPrice).toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <div className="text-xs font-extrabold text-emerald-400">
                                {currency} {p.sellingPrice.toFixed(2)}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400">
                              {p.type === 'service' ? serviceUnitLabel(p) : `${p.stock} in stock`}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              addToCart(p, 1);
                              setSearchQuery('');
                              setAutoCompleteOpen(false);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add 1
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Pills Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Optional Product Grid below search (accepted or not in Appearance Settings) */}
          {settings.appearance.showProductGridBelowSearch && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Product Showcase Catalog ({filteredProducts.length})
                </span>
                <span className="text-[10px] text-slate-500">
                  (Toggle grid in Settings &gt; Color & Appearance)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p, 1)}
                    className="group bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-3 flex flex-col justify-between transition cursor-pointer shadow-xs hover:shadow-lg hover:shadow-teal-500/10"
                  >
                    <div>
                      {p.imageUrl && (
                        <div className="w-full h-24 mb-2 overflow-hidden rounded-xl bg-slate-950">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                      )}
                      <div className="text-xs font-bold text-slate-100 line-clamp-1 group-hover:text-teal-300 transition">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {p.category} | {p.type === 'service' ? serviceUnitLabel(p) : `Stock: ${p.stock}`}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                      <div>
                        {p.isOnPromo ? (
                          <div>
                            <span className="line-through text-slate-500 text-[10px] block">
                              {currency} {p.sellingPrice.toFixed(2)}
                            </span>
                            <span className="text-sm font-black text-amber-400 font-mono">
                              {currency} {(p.promoDiscountPrice || p.sellingPrice).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-black text-emerald-400 font-mono">
                            {currency} {p.sellingPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p, 1);
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-teal-600 text-slate-300 group-hover:text-white flex items-center justify-center transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart Platform (Takes 5 cols, position configured Left or Right) */}
        <div className={`${isCartOnLeft ? 'lg:col-span-5 lg:order-1' : 'lg:col-span-5 lg:order-2'}`}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base text-slate-100">
                  Active Cart ({cart.reduce((acc, i) => acc + i.quantity, 0)} items)
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Cart
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Cart is currently empty</p>
                <p className="text-xs mt-1">Search products or click catalog items above to add.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto my-3 pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-100">{item.product.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {currency} {item.unitPrice.toFixed(2)} each
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-400">
                          {currency} {item.total.toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {item.product.type === 'service' && <p className="mt-1 text-[10px] text-purple-300">Rate: {serviceUnitLabel(item.product).toLowerCase()} · quantity counts billable units</p>}
                    {/* Qty & Item Discount Controls */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      {/* Qty controls */}
                      <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
                        <button
                          onClick={() => updateCartItemQty(item.product.id, -1)}
                          aria-label={`Decrease quantity for ${item.product.name}`}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartItemQty(item.product.id, 1)}
                          aria-label={`Increase quantity for ${item.product.name}`}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line discount input */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Disc:</span>
                        <input
                          type="number"
                          min="0"
                          max={item.discountType === 'percentage' ? 100 : item.unitPrice * item.quantity}
                          value={item.discountValue || ''}
                          placeholder="0"
                          onChange={(e) =>
                            updateCartItemDiscount(
                              item.product.id,
                              item.discountType,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-right text-slate-200"
                        />
                        <button
                          onClick={() =>
                            updateCartItemDiscount(
                              item.product.id,
                              item.discountType === 'percentage' ? 'fixed' : 'percentage',
                              item.discountValue
                            )
                          }
                          className="text-[10px] text-teal-400 hover:underline font-bold"
                        >
                          {item.discountType === 'percentage' ? '%' : '$'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cart-wide Discount & Extra Charges */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              {/* Cart-wide discount */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Cart-wide Discount:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    value={overallDiscountValue || ''}
                    placeholder="0"
                    onChange={(e) => setOverallDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-right text-slate-100"
                  />
                  <button
                    onClick={() =>
                      setOverallDiscountType(
                        overallDiscountType === 'percentage' ? 'fixed' : 'percentage'
                      )
                    }
                    className="px-2 py-1 rounded bg-slate-800 text-[10px] text-teal-300 font-bold border border-slate-700 cursor-pointer"
                  >
                    {overallDiscountType === 'percentage' ? '%' : '$'}
                  </button>
                </div>
              </div>

              {/* Add Extra Charge (Tax, Transportation, Packaging, etc.) */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-300 text-[11px]">
                  <span>Add Extra Charge:</span>
                  {extraCharges.length > 0 && (
                    <span className="text-teal-400 font-normal">
                      ({extraCharges.length} applied)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={extraReasonInput}
                    onChange={(e) => setExtraReasonInput(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="Transportation">Transportation</option>
                    <option value="Tax">Tax</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Service Fee">Service Fee</option>
                    <option value="Installation">Installation</option>
                    <option value="Custom">Custom</option>
                  </select>

                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      value={extraAmountInput || ''}
                      placeholder="Amount $"
                      onChange={(e) => setExtraAmountInput(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-5 pr-2 py-1 text-xs text-slate-100"
                    />
                    <span className="absolute left-1.5 top-1 text-slate-500 font-bold">$</span>
                  </div>

                  <button
                    onClick={handleAddExtraCharge}
                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold text-xs cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                {extraCharges.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {extraCharges.map((ch) => (
                      <div
                        key={ch.id}
                        className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                      >
                        <span>
                          {ch.reason}: +${ch.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeExtraCharge(ch.id)}
                          className="text-rose-400 hover:text-rose-300 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="border-t border-slate-800 pt-3 my-2 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>{currency} {totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Total Discounts:</span>
                  <span>-${totals.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              {totals.extraChargesTotal > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Extra Charges:</span>
                  <span>+${totals.extraChargesTotal.toFixed(2)}</span>
                </div>
              )}
              {totals.taxAmount > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Tax ({settings.payments.taxRatePercentage}%):</span>
                  <span>+${totals.taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-100 border-t border-slate-800 pt-2">
                <span>Net Total:</span>
                <span className="text-emerald-400">{currency} {totals.netTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Multi-Payment Methods Section */}
            <div className="border-t border-slate-800 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-teal-400" />
                  Split Payment Breakdown
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={autoFillFullPayment}
                    className="px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition cursor-pointer shadow-xs"
                    title="Replace split payments with one Cash payment for the full total"
                  >
                    One payment
                  </button>
                  <button
                    onClick={addPaymentMethod}
                    className="payment-add-button px-3 py-1 rounded-full bg-teal-500/25 hover:bg-teal-500/40 text-teal-200 border-2 border-teal-400/80 shadow-[0_0_15px_rgba(20,184,166,0.4)] hover:shadow-[0_0_20px_rgba(20,184,166,0.6)] text-[11px] font-black flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 animate-pulse hover:animate-none"
                    title="Add another split payment method (Cash, M-Pesa, Card, Wire, Credit)"
                  >
                    <Plus className="w-3.5 h-3.5 text-teal-300" />
                    <span>+ Add Payment Option</span>
                  </button>
                </div>
              </div>

              {payments.map((p, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs">
                  <select
                    aria-label={`Payment ${idx + 1} method`}
                    value={p.method}
                    onChange={(e) => updatePaymentRow(idx, 'method', e.target.value)}
                    className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                  >
                    {availableMethods.map(method=><option key={method}>{method}</option>)}
                  </select>

                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      aria-label={`Payment ${idx + 1} amount`}
                      value={p.amount || ''}
                      placeholder="0.00"
                      onChange={(e) =>
                        updatePaymentRow(idx, 'amount', parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-5 pr-2 py-1 text-xs text-emerald-400 font-bold"
                    />
                    <span className="absolute left-1.5 top-1 text-slate-500 font-bold">$</span>
                  </div>

                  {payments.length > 1 && (
                    <button
                      onClick={() => removePaymentRow(idx)}
                      aria-label={`Delete payment ${idx + 1} (${p.method})`}
                      title={`Delete this ${p.method} payment`}
                      className="text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}

              {/* Debt or Change Display */}
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-400">Total Tendered:</span>
                <span className="font-bold text-slate-200">
                  {currency} {paymentAnalysis.totalPaid.toFixed(2)}
                </span>
              </div>

              {paymentAnalysis.remainingDebt > 0 && (
                <div className="flex justify-between items-center text-xs text-rose-400 font-bold bg-rose-950/40 p-1.5 rounded border border-rose-900/40">
                  <span>Pending Debt (Customer Balance):</span>
                  <span>{currency} {paymentAnalysis.remainingDebt.toFixed(2)}</span>
                </div>
              )}

              {paymentAnalysis.changeDue > 0 && (
                <div className="flex justify-between items-center text-xs text-sky-400 font-bold bg-sky-950/40 p-1.5 rounded border border-sky-900/40">
                  <span>Change Due to Customer:</span>
                  <span>{currency} {paymentAnalysis.changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Receipt delivery chosen during checkout */}
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <label className="flex items-start gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={receiptDelivery} onChange={(event) => setReceiptDelivery(event.target.checked)} className="mt-0.5 rounded text-teal-500" />
                <span>
                  <strong className="block text-slate-100">Send the receipt when this sale completes</strong>
                  <span className="text-[10px] text-slate-500">Opens a pre-filled draft after payment. Nothing is sent automatically by CODE76.</span>
                </span>
              </label>
              {receiptDelivery && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <select
                    aria-label="Receipt delivery channel"
                    value={receiptChannel}
                    onChange={(event) => setReceiptChannel(event.target.value as ReceiptChannel)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-100"
                  >
                    {RECEIPT_CHANNELS.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
                  </select>
                  <input
                    aria-label="Receipt recipient"
                    value={receiptRecipient}
                    onChange={(event) => setReceiptRecipient(event.target.value)}
                    placeholder={receiptChannel === 'email' ? 'Customer email' : 'Customer phone'}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-100"
                  />
                  <p className="text-[10px] text-slate-500 sm:col-span-2">The customer record’s phone is used when this field is left empty.</p>
                </div>
              )}
            </div>

            {/* Complete Checkout Buttons */}
            <div className="space-y-2 mt-4">
              {hasFeature('debts')&&paymentAnalysis.remainingDebt>0&&<label className="mb-3 block text-xs text-slate-400">Optional credit due date<input aria-label="Credit sale due date" type="date" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" value={debtDueDate} onChange={event=>setDebtDueDate(event.target.value)}/><span className="mt-1 block text-[10px]">No date is assumed. This records terms only; it sends no reminder.</span></label>}
              <button
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                  cart.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Complete Sale ({currency} {totals.netTotal.toFixed(2)})
              </button>

              {hasFeature('invoices') && (<button
                onClick={() => setInvoiceModalOpen(true)}
                disabled={cart.length === 0}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border ${
                  cart.length === 0
                    ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                    : 'bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 border-indigo-500/50 shadow-md shadow-indigo-950/50'
                }`}
                title="Convert current cart into an official commercial sales invoice recorded in Invoices & Sales History"
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Convert to Sales Invoice (B2B Quick Invoice)</span>
              </button>)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Sales Invoicing Modal */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border-2 border-indigo-500/40 shadow-2xl p-5 sm:p-6 text-white max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInvoiceModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                  Commercial Accounts Receivable
                </span>
                <h3 className="text-lg font-bold text-slate-100">Convert Sale to Sales Invoice</h3>
              </div>
            </div>

            {invoiceSuccessMsg ? (
              <div className="bg-emerald-950/70 border border-emerald-600 rounded-xl p-5 text-center my-4 animate-in zoom-in-95">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 animate-bounce" />
                <h4 className="font-bold text-emerald-200 text-sm">{invoiceSuccessMsg}</h4>
                <p className="text-xs text-emerald-300/80 mt-1">
                  Cart converted and synced to both Invoices & Sales History ledgers!
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (cart.length === 0) return;
                  const customerObj = customers.find((c) => c.id === selectedCustomerId);
                  const customerName = customerObj
                    ? `${customerObj.firstName} ${customerObj.secondName}`
                    : 'Walk-in Enterprise Client';

                  const inv = createSalesInvoiceFromCart(
                    customerName,
                    cart.map((c) => ({
                      product: c.product,
                      quantity: c.quantity,
                      unitPrice: c.unitPrice,
                      total: c.total,
                    })),
                    totals.subtotal,
                    totals.taxAmount,
                    totals.netTotal,
                    invoiceIsPaid,
                    invoiceDueDate,
                    invoiceNotes
                  );

                  setInvoiceSuccessMsg(`Sales Invoice #${inv.invoiceNo} Created & Synced!`);
                  setCart([]);
                  setPayments([{ method: 'Cash', amount: 0 }]);
                  setTimeout(() => {
                    setInvoiceSuccessMsg('');
                    setInvoiceModalOpen(false);
                  }, 1600);
                }}
                className="space-y-3.5 text-xs"
              >
                {/* Summary Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Invoice Total Net</span>
                    <span className="text-lg font-black text-indigo-300 font-mono">
                      {currency} {totals.netTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Items in Cart</span>
                    <span className="text-xs font-bold text-slate-200">
                      {cart.reduce((s, i) => s + i.quantity, 0)} units
                    </span>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Invoice Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={invoiceDueDate}
                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Payment Status: Paid vs Debt */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Settlement Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInvoiceIsPaid(true)}
                      className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer text-center ${
                        invoiceIsPaid
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ✓ Paid in Full ($0 Debt)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceIsPaid(false)}
                      className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer text-center ${
                        !invoiceIsPaid
                          ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ⏳ Unpaid / Debt Pending
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {invoiceIsPaid
                      ? 'Marked as completed sale and paid invoice in records.'
                      : 'Marked as active customer debt in Sales History with overdue tracking.'}
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Invoice Terms & Notes</label>
                  <input
                    type="text"
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Net 14 Days, commercial warranty included"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInvoiceModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Issue Sales Invoice</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
