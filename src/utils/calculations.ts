import type { CartItem, ExpenseItem, ExtraCharge, PaymentSplit, ProductItem, SaleTransaction } from '../types/index.ts';

/**
 * Calculates line item total with unit discount.
 */
export function calculateLineItemTotal(
  unitPrice: number,
  quantity: number,
  discountType: 'percentage' | 'fixed' = 'percentage',
  discountValue: number = 0
): { subtotal: number; discount: number; total: number } {
  const safeQty = Math.max(0, quantity);
  const safePrice = Math.max(0, unitPrice);
  const subtotal = safeQty * safePrice;

  let discount = 0;
  if (discountType === 'percentage') {
    const rate = Math.min(100, Math.max(0, discountValue)) / 100;
    discount = subtotal * rate;
  } else {
    discount = Math.min(subtotal, Math.max(0, discountValue));
  }

  const total = Math.max(0, subtotal - discount);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Calculates cart totals including line discounts, cart-wide discount, extra charges, and taxes.
 */
export function calculateCartTotals(
  items: CartItem[],
  overallDiscountType: 'percentage' | 'fixed' = 'percentage',
  overallDiscountValue: number = 0,
  extraCharges: ExtraCharge[] = [],
  taxRatePercent: number = 0
): {
  subtotal: number;
  lineDiscountsTotal: number;
  subtotalAfterLineDiscounts: number;
  overallDiscountTotal: number;
  totalDiscount: number;
  extraChargesTotal: number;
  taxAmount: number;
  netTotal: number;
} {
  let subtotal = 0;
  let lineDiscountsTotal = 0;

  for (const item of items) {
    const itemSub = item.quantity * item.unitPrice;
    subtotal += itemSub;
    const lineDiscount = itemSub - item.total;
    lineDiscountsTotal += Math.max(0, lineDiscount);
  }

  const subtotalAfterLineDiscounts = Math.max(0, subtotal - lineDiscountsTotal);

  let overallDiscountTotal = 0;
  if (overallDiscountType === 'percentage') {
    const rate = Math.min(100, Math.max(0, overallDiscountValue)) / 100;
    overallDiscountTotal = subtotalAfterLineDiscounts * rate;
  } else {
    overallDiscountTotal = Math.min(subtotalAfterLineDiscounts, Math.max(0, overallDiscountValue));
  }

  const afterAllDiscounts = Math.max(0, subtotalAfterLineDiscounts - overallDiscountTotal);

  const extraChargesTotal = extraCharges.reduce((acc, curr) => acc + Math.max(0, curr.amount || 0), 0);

  const taxAmount = (afterAllDiscounts * Math.max(0, taxRatePercent)) / 100;

  const netTotal = Math.round((afterAllDiscounts + extraChargesTotal + taxAmount) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    lineDiscountsTotal: Math.round(lineDiscountsTotal * 100) / 100,
    subtotalAfterLineDiscounts: Math.round(subtotalAfterLineDiscounts * 100) / 100,
    overallDiscountTotal: Math.round(overallDiscountTotal * 100) / 100,
    totalDiscount: Math.round((lineDiscountsTotal + overallDiscountTotal) * 100) / 100,
    extraChargesTotal: Math.round(extraChargesTotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    netTotal,
  };
}

/**
 * Reconciles multiple split payments against cart net total.
 */
export function calculatePaymentsAndDebt(
  netTotal: number,
  payments: PaymentSplit[]
): {
  totalPaid: number;
  remainingDebt: number;
  changeDue: number;
  isFullyPaid: boolean;
} {
  const totalPaid = payments.reduce((acc,curr)=>acc+(curr.method==='Credit / Debt'?0:Math.max(0,curr.amount||0)),0);
  const diff = netTotal - totalPaid;

  const remainingDebt = diff > 0.001 ? Math.round(diff * 100) / 100 : 0;
  const changeDue = diff < -0.001 ? Math.round(Math.abs(diff) * 100) / 100 : 0;
  const isFullyPaid = remainingDebt <= 0;

  return {
    totalPaid: Math.round(totalPaid * 100) / 100,
    remainingDebt,
    changeDue,
    isFullyPaid,
  };
}

/**
 * Computes business financial health: Gross Revenue, Expenses, Cost of Goods Sold (COGS),
 * Net Profit / Loss, and Profit Margin.
 */
export function calculateFinancialHealth(
  sales: SaleTransaction[],
  expenses: ExpenseItem[],
  inventory: ProductItem[]
): {
  grossRevenue: number;
  totalExpenses: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
  netProfitMarginPercent: number;
  isProfitable: boolean;
  inventoryValuation: number;
} {
  // Map product cost
  const costMap = new Map<string, number>();
  let inventoryValuation = 0;
  for (const p of inventory) {
    costMap.set(p.id, p.costPrice || 0);
    inventoryValuation += (p.costPrice || 0) * (p.stock || 0);
  }

  let grossRevenue = 0;
  let cogs = 0;

  for (const s of sales) {
    grossRevenue += s.netTotal;
    for (const item of s.items) {
      const unitCost = costMap.get(item.product.id) ?? item.product.costPrice ?? 0;
      cogs += unitCost * item.quantity;
    }
  }

  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const grossProfit = grossRevenue - cogs;
  const netProfit = grossProfit - totalExpenses;
  const netProfitMarginPercent =
    grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 1000) / 10 : 0;

  return {
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    cogs: Math.round(cogs * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    netProfitMarginPercent,
    isProfitable: netProfit >= 0,
    inventoryValuation: Math.round(inventoryValuation * 100) / 100,
  };
}

/**
 * Calculates profit or loss margin between buying/cost price and selling price.
 */
export function calculateProductProfitMargin(
  costPrice: number,
  sellingPrice: number
): {
  diffAmount: number;
  marginPercent: number;
  isLoss: boolean;
  isBreakEven: boolean;
  statusText: string;
} {
  const safeCost = Math.max(0, Number(costPrice) || 0);
  const safeSelling = Math.max(0, Number(sellingPrice) || 0);
  const diffAmount = Math.round((safeSelling - safeCost) * 100) / 100;

  let marginPercent = 0;
  if (safeSelling > 0) {
    marginPercent = Math.round((diffAmount / safeSelling) * 1000) / 10;
  } else if (safeCost > 0) {
    marginPercent = -100;
  }

  const isLoss = diffAmount < 0;
  const isBreakEven = diffAmount === 0;

  let statusText = '';
  if (isLoss) {
    statusText = `Selling at a Loss (-$${Math.abs(diffAmount).toFixed(2)}, ${marginPercent}%)`;
  } else if (isBreakEven) {
    statusText = 'Break-Even ($0.00 / 0.0%)';
  } else {
    statusText = `Profitable (+$${diffAmount.toFixed(2)}, +${marginPercent}%)`;
  }

  return {
    diffAmount,
    marginPercent,
    isLoss,
    isBreakEven,
    statusText,
  };
}

/**
 * Generates an auto-assigned unique inventory item ID that does not collide with existing IDs.
 */
export function generateUniqueInventoryId(
  existingIds: string[] = [],
  prefix: string = 'ITEM-2026'
): string {
  const existingSet = new Set(existingIds.map((id) => id.trim().toUpperCase()));
  for (let attempt = 0; attempt < 100; attempt++) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${prefix}-${randomDigits}`;
    if (!existingSet.has(candidate.toUpperCase())) {
      return candidate;
    }
  }
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

