export interface CatalogChatContext {
  company?: { name?: string; currency?: string; tel1?: string; whatsapp?: string; email?: string; address?: string; location?: string; country?: string; operatingHours?: string; slogan?: string; vision?: string };
  products?: { name: string; category?: string; type?: string; sellingPrice: number; stock?: number; isOnPromo?: boolean; promoDiscountPrice?: number; description?: string }[];
}

/** Business fallback ONLY: no CODE76 hardware, fictitious stock, bookings, credits or warranties. */
export function businessCatalogReply(message: string, context?: CatalogChatContext): string {
  const company = context?.company || {};
  const name = company.name?.trim() || 'this business';
  const contact = [company.tel1 && `Phone: ${company.tel1}`, company.whatsapp && `WhatsApp: ${company.whatsapp}`, company.email && `Email: ${company.email}`].filter(Boolean).join(' · ');
  const nextStep = contact || 'Please use the business’s contact details to confirm availability.';
  const query = message.toLowerCase();
  if (/\b(where|location|address|visit|contact|phone|email|hours)\b/.test(query)) {
    const address = [company.address, company.location, company.country].filter(Boolean).join(', ');
    return `${name}\n${address ? `Location: ${address}\n` : 'A location has not been provided.\n'}${company.operatingHours ? `Hours: ${company.operatingHours}\n` : ''}${nextStep}`;
  }
  if (/\b(book|appointment|reserve|reservation)\b/.test(query)) {
    return `Please contact ${name} to arrange a visit, service or order. This chat does not reserve stock or confirm appointments.\n\n${nextStep}`;
  }
  if (/\b(refer|referral|friend|warranty|refund|return|delivery)\b/.test(query)) {
    return `Please check directly with ${name} for its current policies and offers. No booking, reward or warranty has been assigned by this chat.\n\n${nextStep}`;
  }
  const products = (Array.isArray(context?.products) ? context.products : [])
    .filter(product => product && typeof product.name === 'string' && Number.isFinite(product.sellingPrice) && product.sellingPrice >= 0);
  if (!products.length) return `${name} has not added any catalog items yet. Please check back or contact the business for more information.\n\n${nextStep}`;
  const matched = products.filter(product => query.includes(product.name.toLowerCase()) || (product.category && query.includes(product.category.toLowerCase())));
  const choices = [...(matched.length ? matched : products)];
  if (/budget|cheap|alternative|afford/.test(query)) choices.sort((a, b) => a.sellingPrice - b.sellingPrice);
  const catalog = choices.slice(0, 3).map(product => {
    const price = product.isOnPromo && Number.isFinite(product.promoDiscountPrice) ? product.promoDiscountPrice! : product.sellingPrice;
    const availability = product.type === 'service' ? 'service; contact to arrange' : (product.stock || 0) > 0 ? `${product.stock} in stock` : 'out of stock';
    return `• ${product.name} — ${company.currency || ''} ${price.toFixed(2)} (${availability})`;
  }).join('\n');
  return `Here is the current catalog from ${name}:\n\n${catalog}\n\nWhich item interests you? Please confirm availability and terms directly with the business.\n${nextStep}`;
}
